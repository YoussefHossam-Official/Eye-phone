import Joi from "joi";

export const purchaseSchema = Joi.object({
  product_name: Joi.string().min(2).required().messages({
    "string.min": "Product name must be at least 2 characters",
    "any.required": "Product name is required",
  }),
  supplier_name: Joi.string().optional().allow("", null),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
  buy_price: Joi.number().min(1).required().messages({
    "number.min": "Buy price must be greater than 0",
    "any.required": "Buy price is required",
  }),
  date: Joi.date().required().messages({
    "any.required": "Date is required",
  }),
  notes: Joi.string().optional().allow("", null),
});
