import Joi from "joi";

export const expenseSchema = Joi.object({
  name: Joi.string().min(2),
  amount: Joi.number().min(1),
  category: Joi.string().min(2),
  date: Joi.date(),
  notes: Joi.string().optional().allow(""),
});

export const createExpenseSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "any.required": "Name is required",
  }),
  amount: Joi.number().min(1).required().messages({
    "any.required": "Amount is required",
  }),
  category: Joi.string().min(2).required().messages({
    "any.required": "Category is required",
  }),
  date: Joi.date().required().messages({
    "any.required": "Date is required",
  }),
  notes: Joi.string().optional().allow(""),
});