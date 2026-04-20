import express from "express";
import auth from "../middlewares/auth.js";
import mainAuth from "../middlewares/mainAuth.js";
import isOwner from "../middlewares/isOwner.js";
import { getBranches, getBranchAlerts, getBranchesInventory, getBranchesReport } from "../controllers/branchController.js";
 
const router = express.Router();
 
router.use(auth, mainAuth, isOwner);
 
router.get("/", getBranches);
router.get("/alerts", getBranchAlerts);
router.get("/inventory", getBranchesInventory);
router.get("/reports", getBranchesReport);
router.get("/report", getBranchesReport);
 
export default router;