import BaseService from "./BaseService.js";
import Customer from "../models/Customer.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
 
class CustomerService extends BaseService {
  constructor() {
    super(Customer);
  }
 
  async getAll(shopId, query) {
    const { search } = query;
    const extraWhere = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ],
    } : {};
    return this.findPaginated(shopId, query, { where: extraWhere });
  }
 
  async create(shopId, data) {
    const existing = await Customer.findOne({ where: { phone: data.phone, shop_id: shopId } });
    if (existing) throw new AppError("Phone number already exists", 400);
    return Customer.create({ shop_id: shopId, ...data });
  }
 
  async update(id, shopId, data) {
    const customer = await this.findByIdOrFail(id, shopId);
    await customer.update(data);
    return customer;
  }
 
  async delete(id, shopId) {
    const customer = await this.findByIdOrFail(id, shopId);
    await customer.destroy();
  }
}
 
export default new CustomerService();