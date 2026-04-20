import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Username is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, numbers and be in English',
      'any.required': 'Password is required'
    })
});

export const createShopSchema = Joi.object({
  shop_name: Joi.string().min(3).required().messages({
    'string.min': 'Shop name must be at least 3 characters',
    'any.required': 'Shop name is required',
  }),
  shop_phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must start with 010/011/012/015 and be 11 digits',
      'any.required': 'Phone is required',
    }),
  shop_address: Joi.string().optional(),
  user_name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  username: Joi.string().min(3).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'any.required': 'Username is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, numbers and be in English',
      'any.required': 'Password is required',
    }),
  shop_type: Joi.string()
    .valid('individual', 'main', 'branch')
    .default('individual'),
  main_username: Joi.when('shop_type', {
    is: 'branch',
    then: Joi.string().required().messages({
      'any.required': 'Main shop username is required for branch',
    }),
    otherwise: Joi.string().optional(),
  }),
});