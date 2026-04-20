import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getArchivedProducts,
  restoreProduct,
  forceDeleteProduct,
  addQuantity,
} from "../controllers/productController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import validate from "../middlewares/validate.js";
import { productSchema, createProductSchema } from "../validations/productValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getProducts);                                  
router.get("/archive", isOwner, getArchivedProducts);                     
router.post("/", isOwnerOrSales, validate(createProductSchema), createProduct);
router.put("/:id", isOwner, validate(productSchema), updateProduct);      
router.delete("/:id", isOwner, deleteProduct);                            
router.post("/:id/restore", isOwner, restoreProduct);                     
router.delete("/:id/force", isOwner, forceDeleteProduct); 
router.patch("/:id/add-quantity", isOwnerOrSales, addQuantity);               
 
export default router;