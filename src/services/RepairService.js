import BaseService from "./BaseService.js";
import Repair from "../models/Repair.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
import paginate, { validateDateRange, calcPages } from "../utils/paginate.js";
 
const TECH_ATTRS = ["id", "name", "phone", "commission_percentage"];
 
class RepairService extends BaseService {
  constructor() {
    super(Repair);
  }
 
  async getAll(shopId, query) {
    const { search, start, end } = query;
    const where = { shop_id: shopId };
 
    if (search) {
      where[Op.or] = [
        { device_name: { [Op.like]: `%${search}%` } },
        { customer_name_snapshot: { [Op.like]: `%${search}%` } },
        { customer_phone_snapshot: { [Op.like]: `%${search}%` } },
      ];
    }
 
    const dateRange = validateDateRange(start, end);
    if (dateRange) where.created_at = { [Op.between]: [dateRange.start, dateRange.end] };
 
    const { pageNum, limitNum, offset } = paginate(query);
    const { rows, count } = await Repair.findAndCountAll({
      where,
      include: [
        { model: Customer, required: false },
        { model: User, as: "Technician", required: false, attributes: TECH_ATTRS },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
    });
 
    return { data: rows, total: count, page: pageNum, limit: limitNum, pages: calcPages(count, limitNum) };
  }
 
  async getById(id, shopId) {
    const repair = await Repair.findOne({
      where: { id, shop_id: shopId },
      include: [
        { model: Customer, required: false },
        { model: User, as: "Technician", required: false, attributes: TECH_ATTRS },
      ],
    });
    if (!repair) throw new AppError("Repair not found", 404);
    return repair;
  }
 
  async create(shopId, data) {
    const { customer_name, customer_phone, device_name, problem, repair_cost, technician_id, technician_percentage, notes } = data;
 
    return BaseService.withTransaction(async (t) => {
      if (technician_id) {
        const tech = await User.findOne({ where: { id: technician_id, shop_id: shopId, role: "tech" }, transaction: t });
        if (!tech) throw new AppError("Technician not found", 404);
      }
 
      const [customer] = await Customer.findOrCreate({
        where: { phone: customer_phone, shop_id: shopId },
        defaults: { shop_id: shopId, name: customer_name, phone: customer_phone },
        transaction: t,
      });
 
      const technician_cost = technician_percentage && repair_cost
        ? (repair_cost * technician_percentage) / 100 : 0;
 
      const repair = await Repair.create({
        shop_id: shopId,
        customer_id: customer.id,
        technician_id: technician_id || null,
        customer_name_snapshot: customer.name,
        customer_phone_snapshot: customer.phone,
        device_name,
        problem: problem || "كشف",
        repair_cost: repair_cost || null,
        technician_percentage: technician_percentage || 0,
        technician_cost,
        notes: notes || null,
        status: "received",
      }, { transaction: t });
 
      return repair;
    });
  }
 
  async update(id, shopId, data) {
    const repair = await this.findByIdOrFail(id, shopId);
    const { problem, repair_cost } = data;
 
    const technician_cost = repair_cost && repair.technician_percentage
      ? (repair_cost * repair.technician_percentage) / 100
      : repair.technician_cost;
 
    await repair.update({
      ...(problem && { problem }),
      ...(repair_cost !== undefined && { repair_cost }),
      technician_cost,
    });
    return repair;
  }
 
  async updateStatus(id, shopId, status) {
    const validStatuses = ["received", "in_progress", "done", "delivered", "rejected"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);
    const repair = await this.findByIdOrFail(id, shopId);
    await repair.update({ status });
    return repair;
  }
}
 
export default new RepairService();