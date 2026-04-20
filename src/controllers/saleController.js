import asyncHandler from "../utils/asyncHandler.js";
import SaleService from "../services/SaleService.js";
 
export const getSales = asyncHandler(async (req, res) => {
  const data = await SaleService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const createSale = asyncHandler(async (req, res) => {
  const sale = await SaleService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Sale created", sale_id: sale.id });
});