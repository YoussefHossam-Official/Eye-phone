import asyncHandler from "../utils/asyncHandler.js";
import ExpenseService from "../services/ExpenseService.js";
 
export const getExpenses = asyncHandler(async (req, res) => {
  const data = await ExpenseService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const createExpense = asyncHandler(async (req, res) => {
  const data = await ExpenseService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Expense created successfully", data });
});
 
export const updateExpense = asyncHandler(async (req, res) => {
  const data = await ExpenseService.update(req.params.id, req.shop.id, req.body);
  res.json({ message: "Expense updated successfully", data });
});
 
export const deleteExpense = asyncHandler(async (req, res) => {
  await ExpenseService.delete(req.params.id, req.shop.id);
  res.json({ message: "Expense deleted" });
});
 