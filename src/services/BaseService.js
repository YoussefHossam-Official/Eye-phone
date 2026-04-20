import { Op } from "sequelize";
import sequelize from "../config/database.js";
import AppError from "../utils/AppError.js";
import paginate, { calcPages } from "../utils/paginate.js";
 
export default class BaseService {
  constructor(Model) {
    this.Model = Model;
  }

  async findByIdOrFail(id, shopId, options = {}) {
    const record = await this.Model.findOne({
      where: { id, shop_id: shopId },
      ...options,
    });
    if (!record) {
      const name = this.Model.name || "Record";
      throw new AppError(`${name} not found`, 404);
    }
    return record;
  }
 
  async findPaginated(shopId, query = {}, options = {}) {
    const { pageNum, limitNum, offset } = paginate(query);
    const where = { shop_id: shopId, ...( options.where || {}) };
 
    const { rows, count } = await this.Model.findAndCountAll({
      where,
      order: options.order || [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      include: options.include || [],
      distinct: options.distinct || false,
    });
 
    return {
      data: rows,
      total: count,
      page: pageNum,
      limit: limitNum,
      pages: calcPages(count, limitNum),
    };
  }
 
  static buildDateFilter(start, end, field = "created_at") {
    if (!start || !end) return {};
    return {
      [field]: {
        [Op.between]: [
          new Date(start),
          new Date(new Date(end).setHours(23, 59, 59, 999)),
        ],
      },
    };
  }
 

  static async withTransaction(callback) {
    const t = await sequelize.transaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (err) {
      if (!t.finished) await t.rollback();
      throw err;
    }
  }
 

  async create(data) {
    return this.Model.create(data);
  }
 
  async update(id, shopId, data) {
    const record = await this.findByIdOrFail(id, shopId);
    await record.update(data);
    return record;
  }
 
  async delete(id, shopId) {
    const record = await this.findByIdOrFail(id, shopId);
    await record.destroy();
    return record;
  }
}