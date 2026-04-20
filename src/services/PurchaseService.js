import BaseService from "./BaseService.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
 
class PurchaseService extends BaseService {
  constructor() {
    super(Purchase);
  }
 
  async getAll(shopId, query) {
    return this.findPaginated(shopId, query, { order: [["date", "DESC"]] });
  }
 
  async create(shopId, data) {
    const { product_name, product_id, supplier_name, quantity, buy_price, date, notes } = data;
 
    return BaseService.withTransaction(async (t) => {
      let linkedProduct = null;
 
      if (product_id) {
        linkedProduct = await Product.findOne({
          where: { id: product_id, shop_id: shopId, deleted_at: null },
          transaction: t,
        });
        if (!linkedProduct) throw new AppError("Product not found in your inventory", 404);
      } else {
        linkedProduct = await Product.findOne({
          where: { name: { [Op.like]: product_name.trim() }, shop_id: shopId, deleted_at: null },
          transaction: t,
        });
      }
 
      const purchase = await Purchase.create({
        shop_id: shopId,
        product_name,
        supplier_name: supplier_name || null,
        quantity,
        buy_price,
        date,
        notes: notes || null,
        product_id: linkedProduct?.id || null,
      }, { transaction: t });
 
      if (linkedProduct) {
        await linkedProduct.update(
          { quantity: linkedProduct.quantity + quantity },
          { transaction: t }
        );
        return { purchase, inventoryUpdated: true, product: linkedProduct };
      }
 
      return { purchase, inventoryUpdated: false };
    });
  }
 
  async delete(id, shopId) {
    return BaseService.withTransaction(async (t) => {
      const purchase = await this.findByIdOrFail(id, shopId);
 
      if (purchase.product_id) {
        const product = await Product.findOne({
          where: { id: purchase.product_id, shop_id: shopId },
          paranoid: false,
          transaction: t,
        });
        if (product) {
          const newQty = product.quantity - purchase.quantity;
          await product.update({ quantity: newQty < 0 ? 0 : newQty }, { transaction: t });
        }
      }
 
      await purchase.destroy({ transaction: t });
    });
  }
}
 
export default new PurchaseService();