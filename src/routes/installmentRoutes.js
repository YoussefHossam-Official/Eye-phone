import express from "express";
import { getInstallments, payInstallment } from "../controllers/installmentController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth, isOwnerOrSales);
 
router.get("/", getInstallments);
router.post("/schedule/:scheduleId/pay", payInstallment);
 
export default router;