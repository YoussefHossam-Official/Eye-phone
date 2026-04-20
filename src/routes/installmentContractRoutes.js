import express from "express";
import { createContract, getContracts, getContract, payInstallment, payFullAmount, payScheduleAmount, prepayment } from "../controllers/installmentContractController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import validate from "../middlewares/validate.js";
import { contractSchema, payInstallmentSchema } from "../validations/installmentContractValidation.js";
 
const router = express.Router();
router.use(auth, isOwnerOrSales);
 
router.get("/", getContracts);
router.post("/", validate(contractSchema), createContract);
router.post("/schedules/:scheduleId/pay", validate(payInstallmentSchema), payInstallment);
router.post("/schedules/:scheduleId/pay-now", payScheduleAmount);
router.get("/:id", getContract);
router.post("/:id/pay-full", payFullAmount);
router.post("/:id/prepay", prepayment);
 
export default router;