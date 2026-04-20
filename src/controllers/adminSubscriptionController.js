import Shop from "../models/Shop.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const setSubscription = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const { duration_months, total_amount, amount_paid, due_date, notes } =
    req.body;

  const amount_due = parseFloat(total_amount) - parseFloat(amount_paid);
  if (amount_due < 0)
    throw new AppError("Amount paid cannot exceed total amount", 400);

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + duration_months);

  if (shop.subscription_status === "grace_period" && shop.grace_period_end) {
    const graceStart = new Date(shop.subscription_end);
    const graceUsed = Math.floor(
      (new Date() - graceStart) / (1000 * 60 * 60 * 24)
    );
    end.setDate(end.getDate() - graceUsed);
  }

  await SubscriptionPayment.create({
    shop_id: shop.id,
    duration_months,
    total_amount,
    amount_paid,
    amount_due,
    due_date: due_date || null,
    notes: notes || null,
  });

  await shop.update({
    subscription_start: start,
    subscription_end: end,
    subscription_status: "active",
    grace_period_end: null,
    is_active: true,
    is_trial: false,
    trial_end: null,
    total_paid: parseFloat(shop.total_paid) + parseFloat(amount_paid),
    total_due: parseFloat(shop.total_due) + amount_due,
    due_date: amount_due > 0 ? due_date || shop.due_date : null,
  });

  res.json({
    message: "Subscription set successfully",
    subscription_start: start,
    subscription_end: end,
    amount_paid,
    amount_due,
  });
});

export const paySubscriptionDue = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const { amount, notes } = req.body;

  if (parseFloat(amount) > parseFloat(shop.total_due))
    throw new AppError("Amount exceeds total due", 400);

  const new_total_due = parseFloat(shop.total_due) - parseFloat(amount);

  await SubscriptionPayment.create({
    shop_id: shop.id,
    duration_months: 0,
    total_amount: amount,
    amount_paid: amount,
    amount_due: 0,
    notes: notes || "دفعة جزئية",
  });

  await shop.update({
    total_paid: parseFloat(shop.total_paid) + parseFloat(amount),
    total_due: new_total_due,
    due_date: new_total_due === 0 ? null : shop.due_date,
  });

  res.json({
    message: "Payment recorded successfully",
    total_paid: parseFloat(shop.total_paid) + parseFloat(amount),
    total_due: new_total_due,
  });
});

export const getShopPayments = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const payments = await SubscriptionPayment.findAll({
    where: { shop_id: req.params.id },
    order: [["created_at", "DESC"]],
  });

  res.json({
    total_paid: shop.total_paid,
    total_due: shop.total_due,
    due_date: shop.due_date,
    payments,
  });
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const shops = await Shop.findAll({
    attributes: [
      "id",
      "name",
      "phone",
      "is_active",
      "subscription_start",
      "subscription_end",
      "subscription_status",
      "grace_period_end",
      "is_trial",
      "trial_start",
      "trial_end",
      "total_paid",
      "total_due",
      "due_date",
    ],
    order: [["created_at", "ASC"]],
  });
  res.json(shops);
});
