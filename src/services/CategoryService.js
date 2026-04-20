import BaseService from "./BaseService.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import SaleItem from "../models/SaleItem.js";
import AppError from "../utils/AppError.js";
 
class CategoryService extends BaseService {
  constructor() {
    super(Category);
  }
 
  async getAll(shopId) {
    return Category.findAll({
      where: { shop_id: shopId },
      include: [{ model: Product }],
    });
  }
 
  async getArchived(shopId) {
    const all = await Category.findAll({
      where: { shop_id: shopId },
      paranoid: false,
      include: [{ model: Product, paranoid: false }],
    });
    return all.filter((c) => c.deleted_at !== null);
  }
 
  async create(shopId, name) {
    return Category.create({ shop_id: shopId, name });
  }
 
  async update(id, shopId, name) {
    const category = await this.findByIdOrFail(id, shopId);
    await category.update({ name });
    return category;
  }
 
  async archive(id, shopId) {
    const category = await this.findByIdOrFail(id, shopId);
    await Product.destroy({ where: { category_id: id, shop_id: shopId } });
    await category.destroy();
  }
 
  async restore(id, shopId) {
    const category = await Category.findOne({
      where: { id, shop_id: shopId },
      paranoid: false,
    });
    if (!category) throw new AppError("Category not found", 404);
    if (!category.deleted_at) throw new AppError("Category is not archived", 400);
    await category.restore();
    await Product.restore({ where: { category_id: id, shop_id: shopId } });
  }
 
  async forceDelete(id, shopId) {
    const category = await Category.findOne({
      where: { id, shop_id: shopId },
      paranoid: false,
    });
    if (!category) throw new AppError("Category not found", 404);
    if (!category.deleted_at) throw new AppError("Category is not archived", 400);
 
    const productsWithSales = await Product.findAll({
      paranoid: false,
      where: { category_id: id, shop_id: shopId },
      include: [{ model: SaleItem, required: true }],
    });
    if (productsWithSales.length > 0)
      throw new AppError("Cannot delete category: it has products with sales", 400);
 
    await Product.destroy({ where: { category_id: id, shop_id: shopId }, force: true });
    await category.destroy({ force: true });
  }
}
 
export default new CategoryService();