import Joi from "joi";

export const contractSchema = Joi.object({
  product_id: Joi.number().integer().optional(),
  product_name: Joi.string()
    .min(2)
    .when("product_id", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required().messages({
        "any.required": "Product name or product ID is required",
      }),
    }),

  customer_id: Joi.number().integer().optional(),
  name: Joi.string().min(2).when("customer_id", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .when("customer_id", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  backup_phone: Joi.string()
    .pattern(/^(010|011|012|015)\d{8}$/)
    .optional(),
  national_id: Joi.string().length(14).pattern(/^\d+$/).when("customer_id", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  address: Joi.string().when("customer_id", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),

  cash_price: Joi.number().min(1).required(),
  interest_rate: Joi.number().min(0).max(100).required(),
  down_payment: Joi.number().min(0).required(),
  duration_months: Joi.number().integer().min(1).required(),
  first_installment_date: Joi.date().required(),
  late_fee: Joi.number().min(0).optional().default(0),
  late_fee_type: Joi.string()
    .valid("fixed", "percentage")
    .optional()
    .default("fixed"),
  grace_period_days: Joi.number().integer().min(0).optional().default(0),
  rounding_enabled: Joi.boolean().optional().default(false),
});

export const payInstallmentSchema = Joi.object({
  amount_paid: Joi.number().min(1).required().messages({
    "number.min": "Amount must be greater than 0",
    "any.required": "Amount is required",
  }),
});
