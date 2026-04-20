import express from "express";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../controllers/installmentCustomerController.js";
import auth from "../middlewares/auth.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
import isOwner from "../middlewares/isOwner.js";
import validate from "../middlewares/validate.js";
import { createCustomerSchema, updateCustomerSchema } from "../validations/installmentCustomerValidation.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getCustomers);
router.post("/", isOwnerOrSales, validate(createCustomerSchema), createCustomer);
router.put("/:id", isOwnerOrSales, validate(updateCustomerSchema), updateCustomer);
router.delete("/:id", isOwner, deleteCustomer);
 
export default router;