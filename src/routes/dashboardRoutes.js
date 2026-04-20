import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
 
const router = express.Router();
router.use(auth, isOwner);
 
router.get("/", getDashboard);
 
export default router;