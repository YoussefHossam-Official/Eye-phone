import asyncHandler from "../utils/asyncHandler.js";
import InstallmentCustomerService from "../services/InstallmentCustomerService.js";
 
export const getCustomers = asyncHandler(async (req, res) => {
  const data = await InstallmentCustomerService.getAll(req.shop.id);
  res.json(data);
});
 
export const createCustomer = asyncHandler(async (req, res) => {
  const data = await InstallmentCustomerService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Customer created successfully", data });
});
 
export const updateCustomer = asyncHandler(async (req, res) => {
  const data = await InstallmentCustomerService.update(req.params.id, req.shop.id, req.body);
  res.json({ message: "Customer updated successfully", data });
});
 
export const deleteCustomer = asyncHandler(async (req, res) => {
  await InstallmentCustomerService.delete(req.params.id, req.shop.id);
  res.json({ message: "Customer deleted" });
});