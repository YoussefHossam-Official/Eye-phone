import Joi from "joi";
 
export const saleSchema = Joi.object({
  customer_name: Joi.string().optional(),
  customer_phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Phone must start with 010/011/012/015 and be 11 digits",
    }),
  // discount: رقم اختياري — خصم بالجنيه (مش نسبة)، لازم أكبر من أو يساوي صفر
  discount: Joi.number().min(0).default(0).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required().messages({
          "any.required": "Product ID is required",
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          "number.min": "Quantity must be at least 1",
          "any.required": "Quantity is required",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one item is required",
      "any.required": "Items are required",
    }),
});