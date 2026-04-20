import express from "express";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import { customerSchema } from "../validations/customerValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getCustomers);
router.post("/", isOwnerOrSales, validate(customerSchema), createCustomer);
router.put("/:id", isOwnerOrSales, validate(customerSchema), updateCustomer);
router.delete("/:id", isOwner, deleteCustomer);
 
export default router;