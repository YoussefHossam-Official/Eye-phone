import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "any.required": "Name is required",
  }),
  phone: Joi.string().pattern(/^(010|011|012|015)\d{8}$/).required().messages({
    "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
    "any.required": "Phone is required",
  }),
  backup_phone: Joi.string().pattern(/^(010|011|012|015)\d{8}$/).optional(),
  national_id: Joi.string().length(14).pattern(/^\d+$/).required().messages({
    "string.length": "National ID must be exactly 14 digits",
    "any.required": "National ID is required",
  }),
  address: Joi.string().required().messages({
    "any.required": "Address is required",
  }),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2),
  phone: Joi.string().pattern(/^(010|011|012|015)\d{8}$/).messages({
    "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
  }),
  backup_phone: Joi.string().pattern(/^(010|011|012|015)\d{8}$/).optional(),
  national_id: Joi.string().length(14).pattern(/^\d+$/),
  address: Joi.string(),
});