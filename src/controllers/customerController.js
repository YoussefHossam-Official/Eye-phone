import asyncHandler from "../utils/asyncHandler.js";
import CustomerService from "../services/CustomerService.js";
 
export const getCustomers = asyncHandler(async (req, res) => {
  const data = await CustomerService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const createCustomer = asyncHandler(async (req, res) => {
  const data = await CustomerService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Customer created successfully", data });
});
 
export const updateCustomer = asyncHandler(async (req, res) => {
  const data = await CustomerService.update(req.params.id, req.shop.id, req.body);
  res.json({ message: "Customer updated successfully", data });
});
 
export const deleteCustomer = asyncHandler(async (req, res) => {
  await CustomerService.delete(req.params.id, req.shop.id);
  res.json({ message: "Customer deleted" });
});