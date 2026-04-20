import Joi from "joi";
 
export const registerSchema = Joi.object({
  shop_name: Joi.string().min(3).required().messages({
    "string.min": "Shop name must be at least 3 characters",
    "any.required": "Shop name is required",
  }),
  shop_phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
      "any.required": "Phone is required",
    }),
  shop_address: Joi.string().optional(),
  user_name: Joi.string().min(2).required().messages({
    "string.min": "Name must be at least 2 characters",
    "any.required": "Name is required",
  }),
  username: Joi.string().min(3).required().messages({
    "string.min": "Username must be at least 3 characters",
    "any.required": "Username is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain uppercase, lowercase and numbers",
      "any.required": "Password is required",
    }),
});
 
export const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});
 

export const createStaffSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "any.required": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  username: Joi.string().min(3).required().messages({
    "any.required": "Username is required",
    "string.min": "Username must be at least 3 characters",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
  role: Joi.string().valid("sales", "tech").required().messages({
    "any.only": "Role must be: sales or tech",
    "any.required": "Role is required",
  }),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
    }),

  commission_percentage: Joi.number().min(0).max(100).optional(),
});

export const updateStaffSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
    }),
  password: Joi.string().min(6).optional(),
  commission_percentage: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});