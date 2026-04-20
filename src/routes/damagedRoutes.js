import express from "express";
import { getDamaged, addDamaged } from "../controllers/damagedController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth, isOwnerOrSales);
 
router.get("/", getDamaged);
router.post("/", addDamaged);
 
export default router;