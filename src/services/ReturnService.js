import BaseService from "./BaseService.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Product from "../models/Product.js";
import Damaged from "../models/Damaged.js";
import AppError from "../utils/AppError.js";
 
class ReturnService extends BaseService {
  constructor() {
    super(SaleItem);
  }
 
  async processReturn(shopId, data) {
    const { sale_item_id, is_damaged, reason } = data;
 
    return BaseService.withTransaction(async (t) => {
      const saleItem = await SaleItem.findByPk(sale_item_id, {
        include: [{ model: Sale, where: { shop_id: shopId } }],
        transaction: t,
      });
      if (!saleItem) throw new AppError("Sale item not found", 404);
 
      const product = await Product.findByPk(saleItem.product_id, { paranoid: false, transaction: t });
      if (!product) throw new AppError("Product not found", 404);
 
      const itemValue = parseFloat(saleItem.price) * saleItem.quantity;
      const sale = await Sale.findByPk(saleItem.sale_id, { transaction: t });
      const newTotal = parseFloat(sale.total_amount) - itemValue;
      await sale.update({ total_amount: newTotal < 0 ? 0 : newTotal }, { transaction: t });
 
      if (is_damaged) {
        await Damaged.create({
          shop_id: shopId,
          product_id: product.id,
          product_name: product.name,
          quantity: saleItem.quantity,
          reason: reason || null,
          source: "return",
        }, { transaction: t });
      } else {
        await product.update({ quantity: product.quantity + saleItem.quantity }, { transaction: t });
      }
 
      await saleItem.destroy({ transaction: t });
 
      const remaining = await SaleItem.count({ where: { sale_id: sale.id }, transaction: t });
      if (remaining === 0) await sale.destroy({ transaction: t });
 
      return { itemValue };
    });
  }
}
 
export default new ReturnService();