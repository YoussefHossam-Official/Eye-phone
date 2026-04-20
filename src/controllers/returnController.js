import asyncHandler from "../utils/asyncHandler.js";
import ReturnService from "../services/ReturnService.js";
 
export const returnSaleItem = asyncHandler(async (req, res) => {
  const { itemValue } = await ReturnService.processReturn(req.shop.id, req.body);
  res.json({
    message: req.body.is_damaged ? "Item returned and marked as damaged" : "Item returned to stock",
    refund_amount: itemValue.toFixed(2),
  });
});