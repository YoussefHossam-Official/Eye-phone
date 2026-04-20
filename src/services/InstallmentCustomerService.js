import BaseService from "./BaseService.js";
import InstallmentCustomer from "../models/InstallmentCustomer.js";
import AppError from "../utils/AppError.js";
 
class InstallmentCustomerService extends BaseService {
  constructor() {
    super(InstallmentCustomer);
  }
 
  async getAll(shopId) {
    return InstallmentCustomer.findAll({ where: { shop_id: shopId } });
  }
 
  async create(shopId, data) {
    const { phone, national_id } = data;
 
    if (phone) {
      const existingPhone = await InstallmentCustomer.findOne({ where: { phone, shop_id: shopId } });
      if (existingPhone) throw new AppError("Phone number already exists", 400);
    }
    if (national_id) {
      const existingId = await InstallmentCustomer.findOne({ where: { national_id, shop_id: shopId } });
      if (existingId) throw new AppError("National ID already exists", 400);
    }
 
    return InstallmentCustomer.create({ shop_id: shopId, ...data });
  }
 
  async update(id, shopId, data) {
    return super.update(id, shopId, data);
  }
 
  async delete(id, shopId) {
    return super.delete(id, shopId);
  }
}
 
export default new InstallmentCustomerService();
 