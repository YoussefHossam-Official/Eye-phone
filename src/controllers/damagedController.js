import asyncHandler from "../utils/asyncHandler.js";
import DamagedService from "../services/DamagedService.js";
 
export const getDamaged = asyncHandler(async (req, res) => {
  const data = await DamagedService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const addDamaged = asyncHandler(async (req, res) => {
  const data = await DamagedService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Damaged recorded successfully", data });
});