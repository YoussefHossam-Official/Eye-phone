import Joi from "joi";
 
export const createRepairSchema = Joi.object({
  customer_name: Joi.string().required().messages({
    "any.required": "customer name is required",
    "string.empty": "customer name is required",
  }),
  customer_phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must start with 010/011/012/015 and be 11 digits",
      "any.required": "phone is required",
    }),
  device_name: Joi.string().required().messages({
    "any.required": "device name is required",
  }),
  problem: Joi.string().optional(),
  repair_cost: Joi.number().min(0).optional().allow("", null),
  technician_id: Joi.number().integer().optional().allow(null),
  technician_percentage: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().optional(),
});
 
export const updateRepairSchema = Joi.object({
  problem: Joi.string().optional(),
  repair_cost: Joi.number().min(0).optional().allow(null),
});
 
export const updateRepairStatusSchema = Joi.object({
  status: Joi.string()
    .valid("received", "in_progress", "done", "delivered", "rejected")
    .required()
    .messages({
      "any.only": "status must be : received, in_progress, done, delivered, or rejected",
      "any.required": "status is required",
    }),
});