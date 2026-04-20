import BaseService from "./BaseService.js";
import Damaged from "../models/Damaged.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
 
class DamagedService extends BaseService {
  constructor() {
    super(Damaged);
  }
 
  async getAll(shopId, query) {
    return this.findPaginated(shopId, query, {
      include: [{ model: Product, attributes: ["id", "name", "model", "type"], paranoid: false }],
    });
  }
 
  async create(shopId, { product_id, quantity, reason }) {
    const product = await Product.findOne({ where: { id: product_id, shop_id: shopId } });
    if (!product) throw new AppError("Product not found", 404);
    if (product.quantity < quantity) throw new AppError("Quantity exceeds available stock", 400);
 
    await product.update({ quantity: product.quantity - quantity });
 
    return Damaged.create({
      shop_id: shopId,
      product_id,
      product_name: product.name,
      quantity,
      reason: reason || null,
      source: "manual",
    });
  }
}
 
export default new DamagedService();
 