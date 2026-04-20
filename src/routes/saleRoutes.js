import express from "express";
import { createSale, getSales } from "../controllers/saleController.js";
import auth from "../middlewares/auth.js";
import isSales from "../middlewares/isSales.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import { saleSchema } from "../validations/saleValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwner, getSales);      
router.post("/", isSales, validate(saleSchema), createSale); 
 
export default router;