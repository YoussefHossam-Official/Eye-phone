import express from "express";
import { getReport, getDetailedReport } from "../controllers/reportController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
 
const router = express.Router();
router.use(auth, isOwner); 
 
router.get("/", getReport);
router.get("/detailed", getDetailedReport);
 
export default router;