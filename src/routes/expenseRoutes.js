import express from "express";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";
import auth from "../middlewares/auth.js";
import isOwner from "../middlewares/isOwner.js";
import isOwnerOrSales from "../middlewares/isOwnerOrSales.js";
 
const router = express.Router();
router.use(auth);
 
router.get("/", isOwnerOrSales, getExpenses);
router.post("/", isOwnerOrSales, createExpense);
router.put("/:id", isOwner, updateExpense);      
router.delete("/:id", isOwner, deleteExpense);  
 
export default router;