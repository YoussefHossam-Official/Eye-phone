import express from "express";
import { getPurchases, createPurchase, deletePurchase } from "../controllers/purchaseController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getPurchases);
router.post("/", isOwnerOrSales, createPurchase);
router.delete("/:id", isOwner, deletePurchase);  
 
export default router;