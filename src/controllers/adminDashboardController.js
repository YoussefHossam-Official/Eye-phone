import Shop from "../models/Shop.js";
import User from "../models/User.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Op } from "sequelize";

export const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

  const total = await Shop.count({
    where: { shop_type: { [Op.in]: ["individual", "main"] } },
  });
  const active = await Shop.count({
    where: { is_active: true, is_trial: false, subscription_status: "active" },
  });
  const inactive = await Shop.count({ where: { is_active: false, shop_type: { [Op.in]: ["individual", "main"] } } });
  const trial = await Shop.count({ where: { is_trial: true, shop_type: { [Op.in]: ["individual", "main"] } } });
  const grace_period = await Shop.count({
    where: { subscription_status: "grace_period" },
  });
  const expired = await Shop.count({
    where: { subscription_status: "expired" },
  });

  const revenueResult = await SubscriptionPayment.findAll({
    attributes: ["amount_paid"],
  });
  const total_revenue = revenueResult.reduce(
    (sum, p) => sum + parseFloat(p.amount_paid),
    0
  );

  const dueResult = await Shop.findAll({ attributes: ["total_due"] });
  const total_due = dueResult.reduce(
    (sum, s) => sum + parseFloat(s.total_due),
    0
  );

  const expiring_soon = await Shop.findAll({
    where: {
      subscription_status: "active",
      subscription_end: { [Op.between]: [today, fiveDaysLater] },
    },
    attributes: ["id", "name", "phone", "subscription_end"],
  });

  const trial_expiring_soon = await Shop.findAll({
    where: {
      is_trial: true,
      trial_end: { [Op.between]: [today, fiveDaysLater] },
    },
    attributes: ["id", "name", "phone", "trial_end"],
  });

  res.json({
    shops: { total, active, inactive, trial, grace_period, expired },
    revenue: { total_revenue, total_due },
    expiring_soon,
    trial_expiring_soon,
  });
});

export const getActiveShops = asyncHandler(async (req, res) => {
  const shops = await Shop.findAll({
    where: { is_active: true, is_trial: false, subscription_status: "active" },
    include: [{ model: User, attributes: ["name", "username"] }],
    attributes: [
      "id",
      "name",
      "phone",
      "subscription_end",
      "total_paid",
      "total_due",
      "due_date",
    ],
  });
  res.json(shops);
});

export const getInactiveShops = asyncHandler(async (req, res) => {
  const shops = await Shop.findAll({
    where: { is_active: false },
    include: [{ model: User, attributes: ["name", "username"] }],
    attributes: [
      "id",
      "name",
      "phone",
      "subscription_status",
      "total_paid",
      "total_due",
      "due_date",
    ],
  });
  res.json(shops);
});

export const getTrialShops = asyncHandler(async (req, res) => {
  const today = new Date();
  const shops = await Shop.findAll({
    where: { is_trial: true },
    include: [{ model: User, attributes: ["name", "username"] }],
    attributes: ["id", "name", "phone", "trial_start", "trial_end"],
  });

  const shopsWithDaysLeft = shops.map((shop) => ({
    ...shop.toJSON(),
    days_left: Math.ceil(
      (new Date(shop.trial_end) - today) / (1000 * 60 * 60 * 24)
    ),
  }));

  res.json(shopsWithDaysLeft);
});

export const getGracePeriodShops = asyncHandler(async (req, res) => {
  const today = new Date();
  const shops = await Shop.findAll({
    where: { subscription_status: "grace_period" },
    include: [{ model: User, attributes: ["name", "username"] }],
    attributes: [
      "id",
      "name",
      "phone",
      "subscription_end",
      "grace_period_end",
      "total_paid",
      "total_due",
      "due_date",
    ],
  });

  const shopsWithDaysLeft = shops.map((shop) => ({
    ...shop.toJSON(),
    days_left: Math.ceil(
      (new Date(shop.grace_period_end) - today) / (1000 * 60 * 60 * 24)
    ),
  }));

  res.json(shopsWithDaysLeft);
});

export const getExpiredShops = asyncHandler(async (req, res) => {
  const shops = await Shop.findAll({
    where: { subscription_status: "expired" },
    include: [{ model: User, attributes: ["name", "username"] }],
    attributes: [
      "id",
      "name",
      "phone",
      "subscription_end",
      "total_paid",
      "total_due",
      "due_date",
    ],
  });
  res.json(shops);
});
 
export const getRevenueReport = asyncHandler(async (req, res) => {

  const allPayments = await SubscriptionPayment.findAll({
    attributes: ["amount_paid", "amount_due", "created_at"],
    include: [{ model: Shop, attributes: ["id", "name", "shop_type"] }],
  });
 
  const total_collected = allPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount_paid || 0),
    0
  );
  const total_due = allPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount_due || 0),
    0
  );

  const monthlyMap = {};
 
  for (const payment of allPayments) {
    const date = new Date(payment.created_at);

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
 
    if (!monthlyMap[key]) {
      monthlyMap[key] = { month: key, collected: 0, due: 0 };
    }
 
    monthlyMap[key].collected += parseFloat(payment.amount_paid || 0);
    monthlyMap[key].due += parseFloat(payment.amount_due || 0);
  }
 

  const monthly_revenue = Object.values(monthlyMap).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
 
  const shopsWithDue = await Shop.findAll({
    where: {
      total_due: { [Op.gt]: 0 },
      shop_type: { [Op.in]: ["individual", "main"] },
    },
    attributes: ["id", "name", "phone", "total_due", "due_date"],
    order: [["total_due", "DESC"]], 
  });
  const shops_summary = await Shop.findAll({
    where: {
      shop_type: { [Op.in]: ["individual", "main"] },
    },
    attributes: [
      "id",
      "name",
      "phone",
      "shop_type",
      "is_active",
      "is_trial",
      "subscription_status",
      "total_paid",
      "total_due",
      "due_date",
    ],
    include: [
      {
        model: User,
        attributes: ["username"],
      },
    ],
    order: [["total_due", "DESC"]],
  });
 
  res.json({

    overview: {
      total_collected: total_collected.toFixed(2),
      total_due: total_due.toFixed(2),
      total_invoiced: (total_collected + total_due).toFixed(2),
    },
    monthly_revenue,
    overdue_shops: shopsWithDue,
    shops_summary,
  });
});