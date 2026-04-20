import asyncHandler from "../utils/asyncHandler.js";
import PurchaseService from "../services/PurchaseService.js";
 
export const getPurchases = asyncHandler(async (req, res) => {
  const data = await PurchaseService.getAll(req.shop.id, req.query);
  res.json(data);
});
 
export const createPurchase = asyncHandler(async (req, res) => {
  const { purchase, inventoryUpdated, product } = await PurchaseService.create(req.shop.id, req.body);
  if (inventoryUpdated) {
    return res.status(201).json({
      message: "Purchase created and inventory updated",
      data: purchase,
      inventory_updated: true,
      product: { id: product.id, name: product.name, new_quantity: product.quantity },
    });
  }
  res.status(201).json({
    message: "Purchase created but product not found in inventory",
    data: purchase,
    inventory_updated: false,
    warning: `Product "${req.body.product_name}" was not found in your inventory.`,
  });
});
 
export const deletePurchase = asyncHandler(async (req, res) => {
  await PurchaseService.delete(req.params.id, req.shop.id);
  res.json({ message: "Purchase deleted and inventory adjusted" });
});