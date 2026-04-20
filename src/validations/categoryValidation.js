import Joi from "joi";

export const categorySchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "string.min": "Category name must be at least 2 characters",
    "any.required": "Category name is required",
  }),
});
