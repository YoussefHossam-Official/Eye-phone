import express from "express";
import { returnSaleItem } from "../controllers/returnController.js";
import auth from "../middlewares/auth.js";
import isSales from "../middlewares/isSales.js";
 
const router = express.Router();
router.use(auth, isSales); 
 
router.post("/", returnSaleItem);
 
export default router;
 