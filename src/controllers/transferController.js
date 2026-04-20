import asyncHandler from "../utils/asyncHandler.js";
import TransferService from "../services/TransferService.js";
 
export const getTransfers = asyncHandler(async (req, res) => {
  const data = await TransferService.getAll(req.shop.id);
  res.json(data);
});
 
export const createTransfer = asyncHandler(async (req, res) => {
  const transfer = await TransferService.create(req.shop.id, req.body);
  res.status(201).json({ message: "Transfer created successfully", transfer });
});