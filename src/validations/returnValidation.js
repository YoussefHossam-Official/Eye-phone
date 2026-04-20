import Joi from "joi";

export const returnSaleItemSchema = Joi.object({
  sale_item_id: Joi.number().integer().required().messages({
    "any.required": "Sale item ID is required",
  }),
  is_damaged: Joi.boolean().required().messages({
    "any.required": "is_damaged is required",
  }),
  reason: Joi.string().optional().allow("", null),
});
