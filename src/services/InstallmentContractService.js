import BaseService from "./BaseService.js";
import InstallmentContract from "../models/InstallmentContract.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import InstallmentCustomer from "../models/InstallmentCustomer.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
import paginate, { calcPages, validateDateRange } from "../utils/paginate.js";
 
class InstallmentContractService extends BaseService {
  constructor() {
    super(InstallmentContract);
  }
 
  // ============================================================
  // helpers خاصة بالـ installment
  // ============================================================
  #roundUpTo5(amount) {
    return amount % 5 === 0 ? amount : Math.ceil(amount / 5) * 5;
  }
 
  #calcLateFee(contract, scheduleAmount) {
    if (!contract.late_fee || contract.late_fee == 0) return 0;
    return contract.late_fee_type === "percentage"
      ? (parseFloat(scheduleAmount) * parseFloat(contract.late_fee)) / 100
      : parseFloat(contract.late_fee);
  }
 
  #addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) d.setDate(0);
    return d;
  }
 
  // ============================================================
  // getAll
  // ============================================================
  async getAll(shopId, query) {
    const { search, start, end, customer_id } = query;
    const where = { shop_id: shopId };
    if (customer_id) where.customer_id = customer_id;
 
    const dateRange = validateDateRange(start, end);
    if (dateRange) where.created_at = { [Op.between]: [dateRange.start, dateRange.end] };
 
    const { pageNum, limitNum, offset } = paginate(query);
    const { rows, count } = await InstallmentContract.findAndCountAll({
      where,
      include: [
        {
          model: InstallmentCustomer,
          where: search ? { [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { national_id: { [Op.like]: `%${search}%` } },
          ]} : undefined,
          required: !!search,
        },
        InstallmentSchedule,
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      distinct: true,
    });
 
    return { data: rows, total: count, page: pageNum, limit: limitNum, pages: calcPages(count, limitNum) };
  }
 
  async getById(id, shopId) {
    const contract = await InstallmentContract.findOne({
      where: { id, shop_id: shopId },
      include: [
        InstallmentCustomer,
        { model: InstallmentSchedule, order: [["installment_number", "ASC"]] },
      ],
    });
    if (!contract) throw new AppError("Contract not found", 404);
    return contract;
  }
 
  // ============================================================
  // create contract
  // ============================================================
  async create(shopId, data) {
    const {
      customer_id, name, phone, backup_phone, national_id, address,
      product_id, product_name, cash_price, interest_rate, down_payment,
      duration_months, first_installment_date, late_fee, late_fee_type,
      grace_period_days, rounding_enabled,
    } = data;
 
    return BaseService.withTransaction(async (t) => {
      // المنتج
      let finalProductName;
      if (product_id) {
        const product = await Product.findOne({ where: { id: product_id, shop_id: shopId, deleted_at: null }, transaction: t });
        if (!product) throw new AppError("Product not found", 404);
        if (product.quantity < 1) throw new AppError("Product out of stock", 400);
        await product.update({ quantity: product.quantity - 1 }, { transaction: t });
        finalProductName = product.name;
      } else {
        finalProductName = product_name;
      }
 
      // العميل
      let customer;
      if (customer_id) {
        customer = await InstallmentCustomer.findOne({ where: { id: customer_id, shop_id: shopId }, transaction: t });
        if (!customer) throw new AppError("Customer not found", 404);
      } else {
        const byPhone = phone ? await InstallmentCustomer.findOne({ where: { phone, shop_id: shopId }, transaction: t }) : null;
        const byId = national_id ? await InstallmentCustomer.findOne({ where: { national_id, shop_id: shopId }, transaction: t }) : null;
        customer = byPhone || byId || await InstallmentCustomer.create({ shop_id: shopId, name, phone, backup_phone: backup_phone || null, national_id, address }, { transaction: t });
      }
 
      // الحسابات
      const useRounding = rounding_enabled === true || rounding_enabled === "true";
      const amount_after_down = parseFloat(cash_price) - parseFloat(down_payment);
      const total_interest = (amount_after_down * parseFloat(interest_rate)) / 100;
      const total_amount = amount_after_down + total_interest;
      let monthly_installment = total_amount / duration_months;
      if (useRounding) monthly_installment = this.#roundUpTo5(monthly_installment);
 
      const contract = await InstallmentContract.create({
        shop_id: shopId, customer_id: customer.id, product_name: finalProductName,
        cash_price, interest_rate, down_payment, duration_months, first_installment_date,
        total_interest, total_amount, monthly_installment, remaining_amount: total_amount,
        late_fee: late_fee || 0, late_fee_type: late_fee_type || "fixed",
        grace_period_days: grace_period_days || 0, rounding_enabled: useRounding, status: "active",
      }, { transaction: t });
 
      // الجداول الزمنية
      const schedules = Array.from({ length: duration_months }, (_, i) => {
        const due_date = this.#addMonths(first_installment_date, i);
        let amount = monthly_installment;
        if (useRounding && i === duration_months - 1) {
          const prev = monthly_installment * (duration_months - 1);
          amount = total_amount - prev;
          if (amount <= 0) amount = monthly_installment;
        }
        return { contract_id: contract.id, installment_number: i + 1, due_date: due_date.toISOString().split("T")[0], amount, paid_amount: 0, late_fee_applied: 0, status: "pending" };
      });
 
      await InstallmentSchedule.bulkCreate(schedules, { transaction: t });
      return contract;
    });
  }
 
  // ============================================================
  // pay schedule
  // ============================================================
  async payInstallment(shopId, scheduleId, amount_paid) {
    return BaseService.withTransaction(async (t) => {
      const schedule = await InstallmentSchedule.findOne({
        where: { id: scheduleId },
        include: [{ model: InstallmentContract, where: { shop_id: shopId } }],
        transaction: t,
      });
      if (!schedule) throw new AppError("Installment not found", 404);
      if (schedule.status === "paid") throw new AppError("Installment already paid", 400);
 
      const contract = schedule.InstallmentContract;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(schedule.due_date);
      const deadline = new Date(dueDate);
      deadline.setDate(deadline.getDate() + (contract.grace_period_days || 0));
 
      let late_fee_applied = parseFloat(schedule.late_fee_applied || 0);
      if (today > deadline && late_fee_applied === 0)
        late_fee_applied = this.#calcLateFee(contract, schedule.amount);
 
      const total_due = parseFloat(schedule.amount) + late_fee_applied;
      const already_paid = parseFloat(schedule.paid_amount);
      const still_due = total_due - already_paid;
      const paid = parseFloat(amount_paid);
 
      if (paid < still_due) throw new AppError(`Minimum payment is ${still_due.toFixed(2)}`, 400);
 
      await schedule.update({ paid_amount: total_due, late_fee_applied, status: "paid" }, { transaction: t });
 
      // توزيع الزيادة على الأقساط التالية
      let extra = paid - still_due;
      if (extra > 0) {
        const nextSchedules = await InstallmentSchedule.findAll({
          where: { contract_id: contract.id, status: { [Op.in]: ["pending", "partial", "late"] }, id: { [Op.ne]: scheduleId } },
          order: [["installment_number", "ASC"]],
          transaction: t,
        });
        for (const next of nextSchedules) {
          if (extra <= 0) break;
          const next_due = parseFloat(next.amount) - parseFloat(next.paid_amount);
          if (extra >= next_due) {
            await next.update({ paid_amount: parseFloat(next.amount), status: "paid" }, { transaction: t });
            extra -= next_due;
          } else {
            await next.update({ paid_amount: parseFloat(next.paid_amount) + extra, status: "partial" }, { transaction: t });
            extra = 0;
          }
        }
      }
 
      const new_remaining = parseFloat(contract.remaining_amount) - paid;
      const unpaid = await InstallmentSchedule.count({ where: { contract_id: contract.id, status: { [Op.in]: ["pending", "partial", "late"] } }, transaction: t });
      await contract.update({ remaining_amount: new_remaining < 0 ? 0 : new_remaining, status: unpaid === 0 ? "completed" : "active" }, { transaction: t });
 
      return { amount_paid: paid, distributed_to_next: paid - still_due > 0, remaining_amount: new_remaining < 0 ? 0 : new_remaining };
    });
  }
 
  async payScheduleAmount(shopId, scheduleId) {
    return BaseService.withTransaction(async (t) => {
      const schedule = await InstallmentSchedule.findOne({
        where: { id: scheduleId },
        include: [{ model: InstallmentContract, where: { shop_id: shopId } }],
        transaction: t,
      });
      if (!schedule) throw new AppError("Installment not found", 404);
      if (schedule.status === "paid") throw new AppError("Installment already paid", 400);
 
      const contract = schedule.InstallmentContract;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const deadline = new Date(schedule.due_date);
      deadline.setDate(deadline.getDate() + (contract.grace_period_days || 0));
 
      let late_fee_applied = parseFloat(schedule.late_fee_applied || 0);
      if (today > deadline && late_fee_applied === 0)
        late_fee_applied = this.#calcLateFee(contract, schedule.amount);
 
      const total_due = parseFloat(schedule.amount) + late_fee_applied;
      await schedule.update({ paid_amount: total_due, late_fee_applied, status: "paid" }, { transaction: t });
 
      const new_remaining = parseFloat(contract.remaining_amount) - total_due;
      const unpaid = await InstallmentSchedule.count({ where: { contract_id: contract.id, status: { [Op.in]: ["pending", "partial", "late"] }, id: { [Op.ne]: scheduleId } }, transaction: t });
      await contract.update({ remaining_amount: new_remaining < 0 ? 0 : new_remaining, status: unpaid === 0 ? "completed" : "active" }, { transaction: t });
 
      return { amount_paid: total_due, remaining_amount: new_remaining < 0 ? 0 : new_remaining };
    });
  }
 
  async payFull(id, shopId, discount_percentage) {
    return BaseService.withTransaction(async (t) => {
      const contract = await InstallmentContract.findOne({
        where: { id, shop_id: shopId },
        include: [{ model: InstallmentSchedule, where: { status: { [Op.in]: ["pending", "partial", "late"] } }, required: false }],
        transaction: t,
      });
      if (!contract) throw new AppError("Contract not found", 404);
      if (contract.status === "completed") throw new AppError("Contract already completed", 400);
 
      const original = parseFloat(contract.remaining_amount);
      const discount_amount = discount_percentage ? (original * parseFloat(discount_percentage)) / 100 : 0;
      const amount_after_discount = original - discount_amount;
 
      for (const s of contract.InstallmentSchedules) {
        await s.update({ paid_amount: parseFloat(s.amount), status: "paid" }, { transaction: t });
      }
      await contract.update({ remaining_amount: 0, status: "completed", total_paid: parseFloat(contract.total_paid || 0) + amount_after_discount, discount_amount }, { transaction: t });
 
      return { original_amount: original.toFixed(2), discount_amount: discount_amount.toFixed(2), amount_paid: amount_after_discount.toFixed(2) };
    });
  }
 
  async prepay(id, shopId, amount) {
    return BaseService.withTransaction(async (t) => {
      const contract = await InstallmentContract.findOne({
        where: { id, shop_id: shopId },
        include: [{ model: InstallmentSchedule, where: { status: { [Op.in]: ["pending", "partial", "late"] } }, required: false }],
        transaction: t,
      });
      if (!contract) throw new AppError("Contract not found", 404);
      if (contract.status === "completed") throw new AppError("Contract already completed", 400);
 
      let remaining = parseFloat(amount);
      const sorted = contract.InstallmentSchedules.sort((a, b) => a.installment_number - b.installment_number);
 
      for (const s of sorted) {
        if (remaining <= 0) break;
        const due = parseFloat(s.amount) - parseFloat(s.paid_amount);
        if (remaining >= due) {
          await s.update({ paid_amount: parseFloat(s.amount), status: "paid" }, { transaction: t });
          remaining -= due;
        } else {
          await s.update({ paid_amount: parseFloat(s.paid_amount) + remaining, status: "partial" }, { transaction: t });
          remaining = 0;
        }
      }
 
      const new_remaining = parseFloat(contract.remaining_amount) - parseFloat(amount);
      const unpaid = await InstallmentSchedule.count({ where: { contract_id: id, status: { [Op.in]: ["pending", "partial", "late"] } }, transaction: t });
      await contract.update({ remaining_amount: new_remaining < 0 ? 0 : new_remaining, status: unpaid === 0 ? "completed" : "active" }, { transaction: t });
 
      return { amount_paid: parseFloat(amount), remaining_amount: new_remaining < 0 ? 0 : new_remaining };
    });
  }
}
 
export default new InstallmentContractService();