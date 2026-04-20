import BaseService from "./BaseService.js";
import Installment from "../models/Installment.js";
import InstallmentPayment from "../models/InstallmentPayment.js";
import InstallmentContract from "../models/InstallmentContract.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
 
class InstallmentService extends BaseService {
  constructor() {
    super(Installment);
  }
 
  async getAll(shopId) {
    const installments = await Installment.findAll({
      where: { shop_id: shopId },
      include: [InstallmentPayment],
    });
 
    return installments.map((inst) => {
      const totalPaid = inst.InstallmentPayments.reduce((s, p) => s + parseFloat(p.amount_paid), 0);
      const remainingAmount = parseFloat(inst.remaining_amount) - totalPaid;
      return {
        ...inst.toJSON(),
        total_paid: totalPaid,
        remaining_amount_actual: remainingAmount,
        paid_installments: inst.InstallmentPayments.length,
        remaining_installments: inst.num_installments - inst.InstallmentPayments.length,
        is_fully_paid: remainingAmount <= 0,
      };
    });
  }
 
  async pay(shopId, scheduleId) {
    return BaseService.withTransaction(async (t) => {
      const schedule = await InstallmentSchedule.findOne({
        where: { id: scheduleId },
        include: [{ model: InstallmentContract, where: { shop_id: shopId } }],
        transaction: t,
      });
      if (!schedule) throw new AppError("Installment not found", 404);
      if (schedule.status === "paid") throw new AppError("Installment already paid", 400);
 
      const amount = parseFloat(schedule.amount);
      await schedule.update({ paid_amount: amount, status: "paid" }, { transaction: t });
 
      const contract = await InstallmentContract.findByPk(schedule.contract_id, { transaction: t });
      const new_remaining = parseFloat(contract.remaining_amount) - amount;
 
      const unpaid = await InstallmentSchedule.findAll({
        where: { contract_id: contract.id, status: { [Op.in]: ["pending", "partial", "late"] }, id: { [Op.ne]: scheduleId } },
        transaction: t,
      });
 
      await contract.update({
        remaining_amount: new_remaining < 0 ? 0 : new_remaining,
        status: unpaid.length === 0 ? "completed" : "active",
      }, { transaction: t });
 
      return { remaining_installments: unpaid.length, remaining_amount: new_remaining < 0 ? 0 : new_remaining };
    });
  }
}
 
export default new InstallmentService();