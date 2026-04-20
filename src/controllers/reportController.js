import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Purchase from "../models/Purchase.js";
import Repair from "../models/Repair.js";
import RepairPart from "../models/RepairPart.js";
import Damaged from "../models/Damaged.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import InstallmentContract from "../models/InstallmentContract.js";
import InstallmentCustomer from "../models/InstallmentCustomer.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
import { getCache, setCache } from "../utils/cacheHelper.js";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys.js";

const parseValidDate = (value, fieldName) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new AppError(`Invalid ${fieldName}`, 400);
  return d;
};

const getDateRange = (type, date) => {
  const d = new Date(date);
  let start, end;

  if (type === "daily") {
    start = new Date(d.setHours(0, 0, 0, 0));
    end = new Date(d.setHours(23, 59, 59, 999));
  } else if (type === "weekly") {
    const day = d.getDay();
    start = new Date(d.setDate(d.getDate() - day));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (type === "monthly") {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (type === "yearly") {
    start = new Date(d.getFullYear(), 0, 1);
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (type === "custom") {
    start = parseValidDate(date.start, "start date");
    end = parseValidDate(date.end, "end date");
    if (start > end)
      throw new AppError("Start date must be before end date", 400);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

const resolveDateRange = (query) => {
  const { type, date, start, end, year, month } = query;

  const validTypes = ["daily", "weekly", "monthly", "yearly", "custom"];
  if (!type || !validTypes.includes(type)) {
    throw new AppError(
      "Invalid report type. Must be: daily, weekly, monthly, yearly, or custom",
      400
    );
  }

  if (type === "custom") {
    if (!start || !end)
      throw new AppError(
        "Start and end dates are required for custom reports",
        400
      );
    return getDateRange("custom", { start, end });
  }

  if (type === "monthly") {
    if (!year || !month)
      throw new AppError(
        "Year and month are required for monthly reports",
        400
      );
    return getDateRange("monthly", new Date(year, month - 1, 1));
  }

  if (type === "yearly") {
    if (!year) throw new AppError("Year is required for yearly reports", 400);
    return getDateRange("yearly", new Date(year, 0, 1));
  }

  return getDateRange(type, date ? parseValidDate(date, "date") : new Date());
};

export const getReport = asyncHandler(async (req, res) => {
  const shop_id = req.shop.id;
  const cacheKey = CACHE_KEYS.report(shop_id, req.query);

  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const { start: startDate, end: endDate } = resolveDateRange(req.query);
  const createdAtFilter = { [Op.between]: [startDate, endDate] };
  const dateOnlyFilter = {
    [Op.between]: [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ],
  };

  const [
    cashSales,
    installmentPayments,
    repairs,
    expenses,
    purchases,
    damaged,
    repairPartsUsed,
  ] = await Promise.all([
    Sale.findAll({
      where: { shop_id, created_at: createdAtFilter },
      include: [SaleItem],
    }),
    InstallmentSchedule.findAll({
      include: [
        { model: InstallmentContract, where: { shop_id }, attributes: [] },
      ],
      where: { status: "paid", created_at: createdAtFilter },
    }),
    Repair.findAll({
      where: {
        shop_id,
        status: { [Op.in]: ["done", "delivered"] },
        created_at: createdAtFilter,
      },
    }),
    Expense.findAll({ where: { shop_id, date: dateOnlyFilter } }),
    Purchase.findAll({ where: { shop_id, date: dateOnlyFilter } }),
    Damaged.findAll({
      where: { shop_id, created_at: createdAtFilter },
      include: [{ model: Product, attributes: ["buy_price"], paranoid: false }],
    }),
    RepairPart.findAll({
      where: { shop_id, status: "used", created_at: createdAtFilter },
    }),
  ]);

  const total_cash_sales = cashSales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount),
    0
  );
  const total_sale_profit = cashSales.reduce((sum, s) => {
    const profit =
      s.SaleItems?.reduce((sp, item) => sp + parseFloat(item.profit || 0), 0) ||
      0;
    return sum + profit;
  }, 0);
  const total_installment_payments = installmentPayments.reduce(
    (sum, p) => sum + parseFloat(p.paid_amount),
    0
  );
  const total_repair_revenue = repairs.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );
  const total_technician_cost = repairs.reduce(
    (sum, r) => sum + parseFloat(r.technician_cost || 0),
    0
  );
  const total_expenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );
  const total_purchases = purchases.reduce(
    (sum, p) => sum + parseFloat(p.buy_price) * parseFloat(p.quantity),
    0
  );
  const total_damaged_value = damaged.reduce((sum, d) => {
    const buyPrice = parseFloat(d.Product?.buy_price || 0);
    return sum + buyPrice * d.quantity;
  }, 0);
  const total_repair_parts_cost = repairPartsUsed.reduce((sum, part) => {
    return sum + parseFloat(part.buy_price || 0) * part.quantity_used;
  }, 0);

  const total_repair_parts_revenue = repairPartsUsed.reduce((sum, part) => {
    return sum + parseFloat(part.sell_price || 0) * part.quantity_used;
  }, 0);

  const total_revenue =
    total_cash_sales +
    total_installment_payments +
    total_repair_revenue +
    total_repair_parts_revenue;

  const total_costs =
    total_expenses +
    total_purchases +
    total_technician_cost +
    total_damaged_value +
    total_repair_parts_cost;

  const net_profit = total_revenue - total_costs;

  const result = {
    period: { start: startDate, end: endDate, type: req.query.type },
    revenue: {
      cash_sales: total_cash_sales.toFixed(2),
      sale_profit: total_sale_profit.toFixed(2),
      installment_payments: total_installment_payments.toFixed(2),
      repair_revenue: total_repair_revenue.toFixed(2),
      repair_parts_revenue: total_repair_parts_revenue.toFixed(2),
      total: total_revenue.toFixed(2),
    },
    costs: {
      expenses: total_expenses.toFixed(2),
      purchases: total_purchases.toFixed(2),
      technician_cost: total_technician_cost.toFixed(2),
      damaged_value: total_damaged_value.toFixed(2),
      repair_parts_cost: total_repair_parts_cost.toFixed(2),
      total: total_costs.toFixed(2),
    },
    net_profit: net_profit.toFixed(2),
    summary: {
      total_sales: cashSales.length,
      total_repairs: repairs.length,
      total_repair_parts_used: repairPartsUsed.length,
      total_expenses_count: expenses.length,
      total_purchases: purchases.length,
    },
  };

  await setCache(cacheKey, result, CACHE_TTL.report);
  res.json(result);
});

export const getDetailedReport = asyncHandler(async (req, res) => {
  const shop_id = req.shop.id;
  const cacheKey = CACHE_KEYS.detailedReport(shop_id, req.query);

  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const { start: startDate, end: endDate } = resolveDateRange(req.query);
  const createdAtFilter = { [Op.between]: [startDate, endDate] };
  const dateOnlyFilter = {
    [Op.between]: [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ],
  };

  const [
    sales,
    installmentPayments,
    repairs,
    expenses,
    purchases,
    damaged,
    repairPartsUsed,
  ] = await Promise.all([
    Sale.findAll({
      where: { shop_id, created_at: createdAtFilter },
      include: [
        { model: Customer, attributes: ["name", "phone"], required: false },
        {
          model: SaleItem,
          include: [
            {
              model: Product,
              attributes: ["name", "model"],
              paranoid: false,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    }),
    InstallmentSchedule.findAll({
      include: [
        {
          model: InstallmentContract,
          where: { shop_id },
          attributes: ["product_name", "monthly_installment"],
          include: [
            { model: InstallmentCustomer, attributes: ["name", "phone"] },
          ],
        },
      ],
      where: { status: "paid", created_at: createdAtFilter },
      order: [["created_at", "DESC"]],
    }),
    Repair.findAll({
      where: {
        shop_id,
        status: { [Op.in]: ["done", "delivered"] },
        created_at: createdAtFilter,
      },
      include: [{ model: Customer, attributes: ["name", "phone"], required: false }],
      order: [["created_at", "DESC"]],
    }),
    Expense.findAll({
      where: { shop_id, date: dateOnlyFilter },
      order: [["date", "DESC"]],
    }),
    Purchase.findAll({
      where: { shop_id, date: dateOnlyFilter },
      order: [["date", "DESC"]],
    }),
    Damaged.findAll({
      where: { shop_id, created_at: createdAtFilter },
      include: [
        {
          model: Product,
          attributes: ["name", "model", "buy_price"],
          paranoid: false,
        },
      ],
      order: [["created_at", "DESC"]],
    }),
    RepairPart.findAll({
      where: { shop_id, status: "used", created_at: createdAtFilter },
      order: [["created_at", "DESC"]],
    }),
  ]);

  const result = {
    period: { start: startDate, end: endDate, type: req.query.type },
    sales,
    installment_payments: installmentPayments,
    repairs,
    expenses,
    purchases,
    damaged,
    repair_parts_used: repairPartsUsed,
  };

  await setCache(cacheKey, result, CACHE_TTL.report);
  res.json(result);
});