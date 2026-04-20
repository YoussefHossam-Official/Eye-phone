import asyncHandler from "../utils/asyncHandler.js";
import InstallmentContractService from "../services/InstallmentContractService.js";
 
export const getContracts = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const getContract = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.getById(req.params.id, req.shop.id);
  res.json(data);
});
 
export const createContract = asyncHandler(async (req, res) => {
  const contract = await InstallmentContractService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Contract created", contract_id: contract.id });
});
 
export const payInstallment = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.payInstallment(req.shop.id, req.params.scheduleId, req.body.amount_paid);
  res.json({ message: "Payment registered successfully", ...data });
});
 
export const payScheduleAmount = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.payScheduleAmount(req.shop.id, req.params.scheduleId);
  res.json({ message: "Payment registered successfully", ...data });
});
 
export const payFullAmount = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.payFull(req.params.id, req.shop.id, req.body.discount_percentage);
  res.json({ message: "Contract fully paid and completed", ...data });
});
 
export const prepayment = asyncHandler(async (req, res) => {
  const data = await InstallmentContractService.prepay(req.params.id, req.shop.id, req.body.amount);
  res.json({ message: "Prepayment registered successfully", ...data });
});