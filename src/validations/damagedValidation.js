import Joi from "joi";

export const addDamagedSchema = Joi.object({
  product_id: Joi.number().integer().required().messages({
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.min": "Quantity must be at least 1",
  }),
  reason: Joi.string().optional().allow("", null),
});
