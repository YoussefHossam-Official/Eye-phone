import { Op } from "sequelize";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Expense from "../models/Expense.js";
import Purchase from "../models/Purchase.js";
import Repair from "../models/Repair.js";
import InstallmentContract from "../models/InstallmentContract.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import InstallmentCustomer from "../models/InstallmentCustomer.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const getShopIds = async (mainShopId, branch_id) => {
  if (branch_id) return [parseInt(branch_id)];
  const branches = await Shop.findAll({
    where: { parent_shop_id: mainShopId },
    attributes: ["id"],
  });
  return [mainShopId, ...branches.map((b) => b.id)];
};

const resolveDateRange = (period, date_from, date_to) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "today") {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { [Op.between]: [today, end] };
  }
  if (period === "month") {
    return {
      [Op.between]: [
        new Date(today.getFullYear(), today.getMonth(), 1),
        new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59),
      ],
    };
  }
  if (date_from && date_to) {
    return {
      [Op.between]: [new Date(date_from), new Date(`${date_to}T23:59:59`)],
    };
  }
  return null;
};

const dateOnlyFilter = (period, date_from, date_to) => {
  const today = new Date().toISOString().split("T")[0];
  if (period === "today") return { [Op.eq]: today };
  if (period === "month") {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    return { [Op.between]: [start, end] };
  }
  if (date_from && date_to) return { [Op.between]: [date_from, date_to] };
  return null;
};

export const getBranches = asyncHandler(async (req, res) => {
  const branches = await Shop.findAll({
    where: { parent_shop_id: req.shop.id },
    attributes: [
      "id",
      "name",
      "phone",
      "address",
      "is_active",
      "is_trial",
      "trial_end",
      "subscription_status",
      "subscription_end",
      "grace_period_end",
    ],
  });
  res.json(branches);
});

export const getBranchAlerts = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in5Days = new Date(today);
  in5Days.setDate(in5Days.getDate() + 5);

  const branches = await Shop.findAll({
    where: { parent_shop_id: req.shop.id },
    attributes: [
      "id",
      "name",
      "is_active",
      "is_trial",
      "trial_end",
      "subscription_status",
      "subscription_end",
      "grace_period_end",
    ],
  });

  const alerts = [];

  for (const branch of branches) {
    const b = branch.toJSON();

    if (!b.is_active) {
      alerts.push({ ...b, alert: "inactive" });
      continue;
    }

    if (b.is_trial && b.trial_end) {
      const trialEnd = new Date(b.trial_end);
      const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 5) {
        alerts.push({ ...b, alert: "trial_expiring", days_left: daysLeft });
      }
      continue;
    }

    if (b.subscription_status === "grace_period" && b.grace_period_end) {
      const graceEnd = new Date(b.grace_period_end);
      const daysLeft = Math.ceil((graceEnd - today) / (1000 * 60 * 60 * 24));
      alerts.push({ ...b, alert: "grace_period", days_left: daysLeft });
      continue;
    }

    if (b.subscription_status === "expired") {
      alerts.push({ ...b, alert: "expired" });
      continue;
    }

    if (b.subscription_end) {
      const subEnd = new Date(b.subscription_end);
      const daysLeft = Math.ceil((subEnd - today) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 5) {
        alerts.push({
          ...b,
          alert: "subscription_expiring",
          days_left: daysLeft,
        });
      }
    }
  }

  res.json(alerts);
});

export const getBranchesInventory = asyncHandler(async (req, res) => {
  const { branch_id } = req.query;
  const shopIds = await getShopIds(req.shop.id, branch_id);

  const products = await Product.findAll({
    where: { shop_id: { [Op.in]: shopIds } },
    attributes: [
      "id",
      "name",
      "quantity",
      "sell_price",
      "buy_price",
      "shop_id",
    ],
    include: [{ model: Shop, as: undefined, attributes: ["id", "name"] }],
  });

  res.json(products);
});

export const getBranchesReport = asyncHandler(async (req, res) => {
  const { period, date_from, date_to, branch_id } = req.query;
  const shopIds = await getShopIds(req.shop.id, branch_id);

  const createdAtFilter = resolveDateRange(period, date_from, date_to);
  const dateFilter = dateOnlyFilter(period, date_from, date_to);

  const shopWhere = { shop_id: { [Op.in]: shopIds } };

  const salesWhere = {
    ...shopWhere,
    ...(createdAtFilter && { created_at: createdAtFilter }),
  };
  const sales = await Sale.findAll({ where: salesWhere, include: [SaleItem] });
  const totalSales = sales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount || 0),
    0
  );
  const totalSaleProfit = sales.reduce((sum, s) => {
    const profit =
      s.SaleItems?.reduce((sp, item) => sp + parseFloat(item.profit || 0), 0) ||
      0;
    return sum + profit;
  }, 0);

  const paidSchedules = await InstallmentSchedule.findAll({
    where: {
      status: "paid",
      ...(createdAtFilter && { updated_at: createdAtFilter }),
    },
    include: [{ model: InstallmentContract, where: shopWhere }],
  });
  const totalInstallments = paidSchedules.reduce(
    (sum, s) => sum + parseFloat(s.paid_amount || 0),
    0
  );

  const repairs = await Repair.findAll({
    where: {
      ...shopWhere,
      status: { [Op.in]: ["done", "delivered"] },
      ...(createdAtFilter && { created_at: createdAtFilter }),
    },
  });
  const totalRepairs = repairs.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );

  const expenses = await Expense.findAll({
    where: { ...shopWhere, ...(dateFilter && { date: dateFilter }) },
  });
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount || 0),
    0
  );


  const purchases = await Purchase.findAll({
    where: { ...shopWhere, ...(dateFilter && { date: dateFilter }) },
  });
  const totalPurchases = purchases.reduce(
    (sum, p) =>
      sum + parseFloat(p.buy_price || 0) * parseFloat(p.quantity || 1),
    0
  );

  const totalRevenue = totalSales + totalInstallments + totalRepairs;
  const netProfit =
    totalSaleProfit + totalRepairs - totalExpenses - totalPurchases;

  res.json({
    branch_id: branch_id || "all",
    total_sales: totalSales.toFixed(2),
    total_sale_profit: totalSaleProfit.toFixed(2),
    total_installments: totalInstallments.toFixed(2),
    total_repairs: totalRepairs.toFixed(2),
    total_expenses: totalExpenses.toFixed(2),
    total_purchases: totalPurchases.toFixed(2),
    total_revenue: totalRevenue.toFixed(2),
    net_profit: netProfit.toFixed(2),
  });
});