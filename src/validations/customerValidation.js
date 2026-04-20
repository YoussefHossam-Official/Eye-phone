import Joi from "joi";

export const customerSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "string.min": "Name must be at least 2 characters",
    "any.required": "Name is required",
  }),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone must start with 010/011/012/015 and be 11 digits",
      "any.required": "Phone is required",
    }),
  address: Joi.string().optional(),
});
