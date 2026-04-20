import express from "express";
import { getTransfers, createTransfer } from "../controllers/transferController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth, isOwnerOrSales);
 
router.get("/", getTransfers);
router.post("/", createTransfer);
 
export default router