import asyncHandler from "../utils/asyncHandler.js";
import CategoryService from "../services/CategoryService.js";
 
export const getCategories = asyncHandler(async (req, res) => {
  const data = await CategoryService.getAll(req.shop.id);
  res.json(data);
});
 
export const getArchivedCategories = asyncHandler(async (req, res) => {
  const data = await CategoryService.getArchived(req.shop.id);
  res.json(data);
});
 
export const createCategory = asyncHandler(async (req, res) => {
  const data = await CategoryService.create(req.shop.id, req.body.name);
  res.status(201).json({ message: "Category created successfully", data });
});
 
export const updateCategory = asyncHandler(async (req, res) => {
  const data = await CategoryService.update(req.params.id, req.shop.id, req.body.name);
  res.json({ message: "Category updated successfully", data });
});
 
export const deleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.archive(req.params.id, req.shop.id);
  res.json({ message: "Category archived with its products" });
});
 
export const restoreCategory = asyncHandler(async (req, res) => {
  await CategoryService.restore(req.params.id, req.shop.id);
  res.json({ message: "Category and its products restored" });
});
 
export const forceDeleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.forceDelete(req.params.id, req.shop.id);
  res.json({ message: "Category and its products permanently deleted" });
});