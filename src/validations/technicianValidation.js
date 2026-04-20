import Joi from "joi";

export const createTechnicianSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      "any.required": "اسم الفني مطلوب",
    }),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "رقم الهاتف يجب أن يبدأ بـ 010/011/012/015 ويكون 11 رقم",
      "any.required": "رقم الهاتف مطلوب",
    }),
  username: Joi.string()
    .min(3)
    .required()
    .messages({
      "any.required": "اسم المستخدم مطلوب",
      "string.min": "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "any.required": "كلمة السر مطلوبة",
      "string.min": "كلمة السر يجب أن تكون 6 أحرف على الأقل",
    }),
  commission_percentage: Joi.number()
    .min(0)
    .max(100)
    .optional(),
});

export const updateTechnicianSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "رقم الهاتف يجب أن يبدأ بـ 010/011/012/015 ويكون 11 رقم",
    }),
  username: Joi.string()
    .min(3)
    .optional()
    .messages({
      "string.min": "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
    }),
  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.min": "كلمة السر يجب أن تكون 6 أحرف على الأقل",
    }),
  commission_percentage: Joi.number()
    .min(0)
    .max(100)
    .optional(),
  status: Joi.string()
    .valid("active", "inactive")
    .optional(),
});

export const changeTechnicianPasswordSchema = Joi.object({
  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      "any.required": "كلمة السر الجديدة مطلوبة",
      "string.min": "كلمة السر يجب أن تكون 6 أحرف على الأقل",
    }),
});