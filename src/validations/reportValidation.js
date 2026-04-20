import Joi from "joi";

export const reportSchema = Joi.object({
  type: Joi.string()
    .valid("daily", "weekly", "monthly", "yearly", "custom")
    .required()
    .messages({
      "any.only":
        "Type must be: daily, weekly, monthly, yearly, or custom",
      "any.required": "Report type is required",
    }),
  date: Joi.when("type", {
    is: Joi.string().valid("daily", "weekly"),
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
  year: Joi.when("type", {
    is: Joi.string().valid("monthly", "yearly"),
    then: Joi.number().min(2000).max(2100).required(),
    otherwise: Joi.number().optional(),
  }),
  month: Joi.when("type", {
    is: "monthly",
    then: Joi.number().min(1).max(12).required(),
    otherwise: Joi.number().optional(),
  }),
  start: Joi.when("type", {
    is: "custom",
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
  end: Joi.when("type", {
    is: "custom",
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
});

export const detailedReportSchema = Joi.object({
  type: Joi.string()
    .valid("daily", "weekly", "monthly", "yearly", "custom")
    .required()
    .messages({
      "any.only":
        "Type must be: daily, weekly, monthly, yearly, or custom",
      "any.required": "Report type is required",
    }),
  date: Joi.when("type", {
    is: Joi.string().valid("daily", "weekly"),
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
  year: Joi.when("type", {
    is: Joi.string().valid("monthly", "yearly"),
    then: Joi.number().min(2000).max(2100).required(),
    otherwise: Joi.number().optional(),
  }),
  month: Joi.when("type", {
    is: "monthly",
    then: Joi.number().min(1).max(12).required(),
    otherwise: Joi.number().optional(),
  }),
  start: Joi.when("type", {
    is: "custom",
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
  end: Joi.when("type", {
    is: "custom",
    then: Joi.date().required(),
    otherwise: Joi.date().optional(),
  }),
});

export const repairPartsReportSchema = Joi.object({
  start: Joi.date().optional(),
  end: Joi.date().optional(),
  status: Joi.string()
    .valid("available", "used", "damaged")
    .optional(),
});

export const repairPartsInventorySchema = Joi.object({
  search: Joi.string().optional(),
});