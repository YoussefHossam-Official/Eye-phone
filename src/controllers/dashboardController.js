import { Op } from "sequelize";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Repair from "../models/Repair.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import InstallmentContract from "../models/InstallmentContract.js";
import Product from "../models/Product.js";
import Expense from "../models/Expense.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache } from "../utils/cacheHelper.js";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const shopId = req.shop.id;
  const cacheKey = CACHE_KEYS.dashboard(shopId);

  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayRange = { [Op.between]: [today, todayEnd] };
  const todayOnly = today.toISOString().split("T")[0];

  const [
    sales,
    paidSchedules,
    repairs_new,
    repairs_in_progress,
    repairs_done,
    repairs_revenue,
    expenses,
    low_stock,
  ] = await Promise.all([
    Sale.findAll({
      where: { shop_id: shopId, created_at: todayRange },
      include: [SaleItem],
    }),
    InstallmentSchedule.findAll({
      where: { status: "paid", created_at: todayRange },
      include: [{ model: InstallmentContract, where: { shop_id: shopId } }],
    }),
    Repair.count({
      where: { shop_id: shopId, status: "received", created_at: todayRange },
    }),
    Repair.count({
      where: { shop_id: shopId, status: "in_progress" },
    }),
    Repair.count({
      where: {
        shop_id: shopId,
        status: { [Op.in]: ["done", "delivered"] },
        created_at: todayRange,
      },
    }),
    Repair.findAll({
      where: {
        shop_id: shopId,
        status: { [Op.in]: ["done", "delivered"] },
        created_at: todayRange,
      },
    }),
    Expense.findAll({
      where: { shop_id: shopId, date: { [Op.eq]: todayOnly } },
    }),
    Product.findAll({
      where: { shop_id: shopId, deleted_at: null },
    }),
  ]);

  const sales_count = sales.length;
  const sales_total = sales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount || 0), 0
  );
  const sales_profit = sales.reduce((sum, s) => {
    const profit =
      s.SaleItems?.reduce((sp, item) => sp + parseFloat(item.profit || 0), 0) || 0;
    return sum + profit;
  }, 0);

  const installments_total = paidSchedules.reduce(
    (sum, s) => sum + parseFloat(s.paid_amount || 0), 0
  );

  const repairs_total = repairs_revenue.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0), 0
  );

  const expenses_total = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount || 0), 0
  );

  const low_stock_products = low_stock
    .filter((p) => p.quantity <= p.min_quantity)
    .map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      type: p.type,
      quantity: p.quantity,
      min_quantity: p.min_quantity,
    }));

  const total_revenue = sales_total + installments_total + repairs_total;
  const net_profit = sales_profit + repairs_total - expenses_total;

  const shop = req.shop;
  let subscription_info = {};

  if (shop.is_trial) {
    const trialEnd = new Date(shop.trial_end);
    const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
    subscription_info = { type: "trial", days_left: daysLeft };
  } else {
    const subEnd = new Date(shop.subscription_end);
    const daysLeft = Math.ceil((subEnd - today) / (1000 * 60 * 60 * 24));
    subscription_info = {
      type: shop.subscription_status,
      days_left: daysLeft > 0 ? daysLeft : 0,
    };
  }

  const result = {
    subscription_info,
    today: {
      sales_count,
      sales_total: sales_total.toFixed(2),
      sales_profit: sales_profit.toFixed(2),
      installments_total: installments_total.toFixed(2),
      repairs_new,
      repairs_in_progress,
      repairs_done,
      repairs_total: repairs_total.toFixed(2),
      expenses_total: expenses_total.toFixed(2),
      total_revenue: total_revenue.toFixed(2),
      net_profit: net_profit.toFixed(2),
    },
    low_stock_products,
    low_stock_count: low_stock_products.length,
  };

  await setCache(cacheKey, result, CACHE_TTL.dashboard);
  res.json(result);
});