import BaseService from "./BaseService.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import SaleItem from "../models/SaleItem.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
 
class ProductService extends BaseService {
  constructor() {
    super(Product);
  }
 
  async getAll(shopId, query) {
    const { search } = query;
    const extraWhere = search ? { name: { [Op.like]: `%${search}%` } } : {};
    return this.findPaginated(shopId, query, { where: extraWhere });
  }
 
  async getArchived(shopId) {
    return Product.findAll({
      paranoid: false,
      where: { shop_id: shopId, deleted_at: { [Op.ne]: null } },
    });
  }
 
  async create(shopId, data) {
    const category = await Category.findOne({ where: { id: data.category_id, shop_id: shopId } });
    if (!category) throw new AppError("Category not found", 404);
    return Product.create({ shop_id: shopId, ...data });
  }
 
  async update(id, shopId, data) {
    const product = await this.findByIdOrFail(id, shopId);
    if (data.category_id) {
      const category = await Category.findOne({ where: { id: data.category_id, shop_id: shopId } });
      if (!category) throw new AppError("Category not found", 404);
    }
    await product.update(data);
    return product;
  }
 
  async addQuantity(id, shopId, quantity) {
    if (!quantity || quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);
    const product = await this.findByIdOrFail(id, shopId);
    await product.update({ quantity: product.quantity + quantity });
    await product.reload();
    return product;
  }
 
  async archive(id, shopId) {
    const product = await this.findByIdOrFail(id, shopId);
    await product.destroy();
  }
 
  async restore(id, shopId) {
    const product = await Product.findOne({ where: { id, shop_id: shopId }, paranoid: false });
    if (!product || !product.deleted_at) throw new AppError("Product not found in archive", 404);
 
    const category = await Category.findOne({ where: { id: product.category_id, shop_id: shopId }, paranoid: false });
    if (!category || category.deleted_at)
      throw new AppError("Cannot restore product, its category is archived", 400);
 
    await product.restore();
  }
 
  async forceDelete(id, shopId) {
    const product = await Product.findOne({
      paranoid: false,
      where: { id, shop_id: shopId, deleted_at: { [Op.ne]: null } },
    });
    if (!product) throw new AppError("Product not found in archive", 404);
 
    const saleItems = await SaleItem.findAll({ where: { product_id: id } });
    if (saleItems.length > 0) {
      await Promise.all(saleItems.map((si) => si.update({
        product_name_snapshot: product.name,
        product_model_snapshot: product.model,
        product_buy_price_snapshot: product.buy_price,
        category_id_snapshot: product.category_id,
      })));
    }
    await product.destroy({ force: true });
    return saleItems.length;
  }
}
 
export default new ProductService();