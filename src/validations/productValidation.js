import Joi from "joi";

export const productSchema = Joi.object({
  name: Joi.string().min(2),
  model: Joi.string().optional(),
  quantity: Joi.number().integer().min(0),
  category_id: Joi.number().integer(),
  min_quantity: Joi.number().integer().min(0),
  buy_price: Joi.number().min(0).optional().default(0),
  sell_price: Joi.number().min(0),
});

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "any.required": "Product name is required",
  }),
  model: Joi.string().optional(),
  quantity: Joi.number().integer().min(0).required().messages({
    "any.required": "Quantity is required",
  }),
  category_id: Joi.number().integer().required().messages({
    "any.required": "Category is required",
  }),
  min_quantity: Joi.number().integer().min(0).required().messages({
    "any.required": "Min quantity is required",
  }),
  buy_price: Joi.number().min(0).optional().default(0),
  sell_price: Joi.number().min(0).required().messages({
    "any.required": "Sell price is required",
  }),
});
