import BaseService from "./BaseService.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
import paginate, { calcPages } from "../utils/paginate.js";
 
class SaleService extends BaseService {
  constructor() {
    super(Sale);
  }
 
  async getAll(shopId, query) {
    const { start, end } = query;
    const where = { shop_id: shopId, ...BaseService.buildDateFilter(start, end) };
    const { pageNum, limitNum, offset } = paginate(query);
 
    const { rows, count } = await Sale.findAndCountAll({
      where,
      include: [
        { model: SaleItem, include: [{ model: Product, attributes: ["id", "name", "sell_price"] }] },
        { model: Customer, required: false },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      distinct: true,
    });
 
    return { data: rows, total: count, page: pageNum, limit: limitNum, pages: calcPages(count, limitNum) };
  }
 
  async create(shopId, data) {
    const { customer_name, customer_phone, items, discount = 0 } = data;
 
    return BaseService.withTransaction(async (t) => {
      let customer_id = null;
      if (customer_phone) {
        const [customer] = await Customer.findOrCreate({
          where: { phone: customer_phone, shop_id: shopId },
          defaults: { shop_id: shopId, name: customer_name || "عميل", phone: customer_phone },
          transaction: t,
        });
        customer_id = customer.id;
      }

      const productIds = items.map((i) => i.product_id);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds }, shop_id: shopId, deleted_at: null },
        transaction: t,
      });
      const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

      let total_amount = 0;
      for (const item of items) {
        const product = productMap[item.product_id];
        if (!product) throw new AppError(`Product ${item.product_id} not found or archived`, 404);
        if (product.quantity < item.quantity)
          throw new AppError(`Not enough quantity for ${product.name}`, 400);
        total_amount += parseFloat(product.sell_price) * item.quantity;
      }
 
      if (discount > total_amount)
        throw new AppError("Discount cannot be greater than total amount", 400);

      const sale = await Sale.create({
        shop_id: shopId,
        customer_id: customer_id || null,
        total_amount: total_amount - discount,
        discount,
        payment_type: "cash",
      }, { transaction: t });
 
      for (const item of items) {
        const product = productMap[item.product_id];
        const profit = (parseFloat(product.sell_price) - parseFloat(product.buy_price || 0)) * item.quantity;
 
        await SaleItem.create({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.sell_price,
          profit,
        }, { transaction: t });

        await Product.update(
          { quantity: product.quantity - item.quantity },
          { where: { id: product.id, quantity: { [Op.gte]: item.quantity } }, transaction: t }
        );
      }
 
      return sale;
    });
  }
}
 
export default new SaleService();