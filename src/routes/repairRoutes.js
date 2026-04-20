import express from "express";
import {
  getRepairs,
  createRepair,
  updateRepairStatus,
  updateRepair,
  getRepairDetails,
} from "../controllers/repairController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import isTech from "../middlewares/isTech.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import {
  createRepairSchema,
  updateRepairSchema,
  updateRepairStatusSchema,
} from "../validations/repairValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getRepairs);                                   
router.get("/:id", isOwnerOrSales, getRepairDetails);                             
router.post("/", isOwnerOrSales, validate(createRepairSchema), createRepair);     
router.put("/:id", isOwner, validate(updateRepairSchema), updateRepair);          
router.patch("/:id/status", isTech, validate(updateRepairStatusSchema), updateRepairStatus); 
 
export default router;