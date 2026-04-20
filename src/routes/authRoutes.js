import express from "express";
import {
  login,
  register,
  logout,
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/authController.js";
import superAdmin from "../middlewares/superAdmin.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  createStaffSchema,
  updateStaffSchema,
} from "../validations/authValidation.js";
 
const router = express.Router();
 

router.post("/login", validate(loginSchema), login);
router.post("/register", superAdmin, validate(registerSchema), register);
router.post("/logout", auth, logout);
 
router.get("/staff", auth, isOwner, getStaff);
router.post("/staff", auth, isOwner, validate(createStaffSchema), createStaff);
router.put("/staff/:id", auth, isOwner, validate(updateStaffSchema), updateStaff);
router.delete("/staff/:id", auth, isOwner, deleteStaff);
 
export default router;