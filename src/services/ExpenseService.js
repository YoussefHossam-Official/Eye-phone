import BaseService from "./BaseService.js";
import Expense from "../models/Expense.js";
 
class ExpenseService extends BaseService {
  constructor() {
    super(Expense);
  }
 
  async getAll(shopId, query) {
    return this.findPaginated(shopId, query, { order: [["date", "DESC"]] });
  }
 
  async create(shopId, data) {
    return Expense.create({ shop_id: shopId, ...data });
  }
 
  async update(id, shopId, data) {
    return super.update(id, shopId, data);
  }
 
  async delete(id, shopId) {
    return super.delete(id, shopId);
  }
}
 
export default new ExpenseService();