import express from "express";
import {
  createRepairPart,
  getRepairParts,
  getRepairPart,
  updateRepairPart,
  useRepairPart,
  deleteRepairPart,
  getUsedRepairParts,
  addRepairPartQuantity,
  updateRepairPartStatus,
} from "../controllers/repairPartController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import isTech from "../middlewares/isTech.js";
import isOwnerOrTech from "../middlewares/isOwnerOrTech.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrTech, getRepairParts);
router.get("/used", isOwnerOrTech, getUsedRepairParts);     
router.post("/", isOwner, createRepairPart);
router.get("/:id", isOwnerOrTech, getRepairPart);            
router.put("/:id", isOwner, updateRepairPart);
router.delete("/:id", isOwner, deleteRepairPart);
router.patch("/:id/use", isTech, useRepairPart);
router.patch("/:id/add-quantity", isOwner, addRepairPartQuantity);
router.patch("/:id/status", isOwner, updateRepairPartStatus);
 
export default router;