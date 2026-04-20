import BaseService from "./BaseService.js";
import Transfer from "../models/Transfer.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
 
class TransferService extends BaseService {
  constructor() {
    super(Transfer);
  }
 
  async getAll(shopId) {
    return Transfer.findAll({
      where: { [Op.or]: [{ from_shop_id: shopId }, { to_shop_id: shopId }] },
      include: [
        { model: Shop, as: "fromShop", attributes: ["id", "name"] },
        { model: Shop, as: "toShop", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
    });
  }
 
  async create(shopId, data) {
    const { to_shop_id, product_id, quantity, notes } = data;
 
    const toShop = await Shop.findByPk(to_shop_id);
    if (!toShop) throw new AppError("Destination shop not found", 404);
    if (toShop.id === shopId) throw new AppError("Cannot transfer to the same shop", 400);
 
    const product = await Product.findOne({ where: { id: product_id, shop_id: shopId } });
    if (!product) throw new AppError("Product not found", 404);
    if (product.quantity < quantity) throw new AppError("Quantity exceeds available stock", 400);
 
    return BaseService.withTransaction(async (t) => {
      await product.update({ quantity: product.quantity - quantity }, { transaction: t });
 
      const targetProduct = await Product.findOne({
        where: { shop_id: to_shop_id, name: product.name },
        transaction: t,
      });
      if (targetProduct) {
        await targetProduct.update({ quantity: targetProduct.quantity + quantity }, { transaction: t });
      }
 
      return Transfer.create({
        from_shop_id: shopId,
        to_shop_id,
        product_id,
        product_name: product.name,
        quantity,
        notes: notes || null,
      }, { transaction: t });
    });
  }
}
 
export default new TransferService();