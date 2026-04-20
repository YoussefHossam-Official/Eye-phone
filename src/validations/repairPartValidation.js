import Joi from "joi";

export const repairPartSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "part name is required",
  }),
  quantity: Joi.number().min(0).required().messages({
    "any.required": "quantity is required",
    "number.base": "quantity must be a number",
  }),
  buy_price: Joi.number().min(0).required().messages({
    "any.required": "buy price is required",
  }),
  sell_price: Joi.number().min(0).required().messages({
    "any.required": "sell price is required",
  }),
});

export const usePartSchema = Joi.object({
  quantity_used: Joi.number().min(1).required().messages({
    "any.required": "used quantity is required",
    "number.min": "quantity must be greater than 0",
  }),
  repair_id: Joi.number().optional(),
});