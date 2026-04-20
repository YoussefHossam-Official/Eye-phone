import asyncHandler from "../utils/asyncHandler.js";
import RepairService from "../services/RepairService.js";
 
export const getRepairs = asyncHandler(async (req, res) => {
  const data = await RepairService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const getRepairDetails = asyncHandler(async (req, res) => {
  const data = await RepairService.getById(req.params.id, req.shop.id);
  res.json({ data });
});
 
export const createRepair = asyncHandler(async (req, res) => {
  const data = await RepairService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Repair created successfully", data });
});
 
export const updateRepair = asyncHandler(async (req, res) => {
  const data = await RepairService.update(req.params.id, req.shop.id, req.body);
  res.json({ message: "Repair updated successfully", data });
});
 
export const updateRepairStatus = asyncHandler(async (req, res) => {
  const data = await RepairService.updateStatus(req.params.id, req.shop.id, req.body.status);
  res.json({ message: "Repair status updated successfully", data });
});