import asyncHandler from "../utils/asyncHandler.js";
import InstallmentService from "../services/InstallmentService.js";
 
export const getInstallments = asyncHandler(async (req, res) => {
  const data = await InstallmentService.getAll(req.shop.id);
  res.json(data);
});
 
export const payInstallment = asyncHandler(async (req, res) => {
  const data = await InstallmentService.pay(req.shop.id, req.params.scheduleId);
  res.json({ message: "Payment registered successfully", ...data });
});