import asyncHandler from "../utils/asyncHandler.js";
import ProductService from "../services/ProductService.js";
 
export const getProducts = asyncHandler(async (req, res) => {
  const data = await ProductService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const getArchivedProducts = asyncHandler(async (req, res) => {
  const data = await ProductService.getArchived(req.shop.id);
  res.json(data);
});
 
export const createProduct = asyncHandler(async (req, res) => {
  const data = await ProductService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Product created successfully", data });
});
 
export const updateProduct = asyncHandler(async (req, res) => {
  const data = await ProductService.update(req.params.id, req.shop.id, req.body);
  res.json({ message: "Product updated successfully", data });
});
 
export const addQuantity = asyncHandler(async (req, res) => {
  const product = await ProductService.addQuantity(req.params.id, req.shop.id, req.body.quantity);
  res.json({ message: "Quantity added successfully", new_quantity: product.quantity });
});
 
export const deleteProduct = asyncHandler(async (req, res) => {
  await ProductService.archive(req.params.id, req.shop.id);
  res.json({ message: "Product moved to archive" });
});
 
export const restoreProduct = asyncHandler(async (req, res) => {
  await ProductService.restore(req.params.id, req.shop.id);
  res.json({ message: "Product restored successfully" });
});
 
export const forceDeleteProduct = asyncHandler(async (req, res) => {
  const count = await ProductService.forceDelete(req.params.id, req.shop.id);
  res.json({ message: "Product permanently deleted successfully", deleted_sales_records_updated: count });
});