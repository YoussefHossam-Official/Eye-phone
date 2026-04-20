import express from "express";
import { getInventory } from "../controllers/inventoryController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth, isOwnerOrSales); 
 
router.get("/", getInventory);
 
export default router;