import express from "express";
import {
  getTechnicians,
  getTechnician,
  updateTechnician,
  deleteTechnician,
  getTechnicianRepairs,
  getTechnicianParts,
  getTechnicianDashboard,
  getTechniciansReport,
  getTechnicianDetailedReport,
} from "../controllers/technicianController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import isTech from "../middlewares/isTech.js";
import validate from "../middlewares/validate.js";
import { updateTechnicianSchema } from "../validations/technicianValidation.js";
 
const router = express.Router();
router.use(auth);
 

router.get("/me/dashboard", isTech, getTechnicianDashboard);
router.get("/me/repairs", isTech, getTechnicianRepairs);
router.get("/me/parts", isTech, getTechnicianParts);
router.get("/report/all", isOwner, getTechniciansReport);
router.get("/report/:id", isOwner, getTechnicianDetailedReport);
router.get("/", isOwner, getTechnicians);
router.get("/:id", isOwner, getTechnician);
router.put("/:id", isOwner, validate(updateTechnicianSchema), updateTechnician);
router.delete("/:id", isOwner, deleteTechnician);
 
export default router;