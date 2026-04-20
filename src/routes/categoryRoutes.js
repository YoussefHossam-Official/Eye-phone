import express from "express";
import { getCategories, getArchivedCategories, createCategory, updateCategory, deleteCategory, restoreCategory, forceDeleteCategory } from "../controllers/categoryController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import { categorySchema } from "../validations/categoryValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getCategories);
router.get("/archive", isOwner, getArchivedCategories);
router.post("/", isOwnerOrSales, validate(categorySchema), createCategory);
router.put("/:id", isOwnerOrSales, validate(categorySchema), updateCategory);
router.delete("/:id", isOwner, deleteCategory);
router.post("/:id/restore", isOwnerOrSales, restoreCategory);
router.delete("/:id/force", isOwner, forceDeleteCategory);
 
export default router;