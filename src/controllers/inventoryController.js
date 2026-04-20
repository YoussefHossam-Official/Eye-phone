import Category from "../models/Category.js";
import Product from "../models/Product.js";
import SaleItem from "../models/SaleItem.js";
import Damaged from "../models/Damaged.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Op } from "sequelize";
import { getCache, setCache } from "../utils/cacheHelper.js";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys.js";

export const getInventory = asyncHandler(async (req, res) => {
  const shopId = req.shop.id;
  const { type } = req.query;
  const cacheKey = CACHE_KEYS.inventory(shopId, type || "all");

  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const productWhere = { deleted_at: null };
  if (type) productWhere.type = type;

  const categories = await Category.findAll({
    where: { shop_id: shopId },
    include: [
      {
        model: Product,
        where: productWhere,
        required: false,
        include: [SaleItem],
      },
    ],
  });

  let total_inventory_value = 0;
  let total_sold_value = 0;
  let total_damaged_value = 0;

  const result = [];

  for (const category of categories) {
    const products = [];

    for (const product of category.Products) {
      const sold_quantity = product.SaleItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const damagedRows = await Damaged.findAll({
        where: { product_id: product.id },
      });
      const damaged_quantity = damagedRows.reduce(
        (sum, d) => sum + d.quantity,
        0
      );

      const initial_quantity =
        product.quantity + sold_quantity + damaged_quantity;
      const current_value = product.quantity * parseFloat(product.sell_price);
      const sold_value = sold_quantity * parseFloat(product.sell_price);
      const damaged_value =
        damaged_quantity * parseFloat(product.buy_price || 0);

      total_inventory_value += current_value;
      total_sold_value += sold_value;
      total_damaged_value += damaged_value;

      products.push({
        id: product.id,
        name: product.name,
        model: product.model,
        type: product.type,
        sell_price: product.sell_price,
        buy_price: product.buy_price,
        initial_quantity,
        sold_quantity,
        damaged_quantity,
        current_quantity: product.quantity,
        current_value,
        sold_value,
        damaged_value,
        low_stock: product.quantity <= product.min_quantity,
      });
    }

    result.push({
      id: category.id,
      name: category.name,
      products,
    });
  }

  const finalResult = {
    total_inventory_value,
    total_sold_value,
    total_damaged_value,
    categories: result,
  };

  await setCache(cacheKey, finalResult, CACHE_TTL.inventory);
  res.json(finalResult);
});
