import RepairPart from "../models/RepairPart.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";
import paginate, { calcPages } from "../utils/paginate.js";


export const createRepairPart = asyncHandler(async (req, res) => {
  const { name, quantity, buy_price, sell_price } = req.body;

  if (!name || quantity === undefined || !buy_price || !sell_price) {
    throw new AppError("all fields are required", 400);
  }

  const part = await RepairPart.create({
    shop_id: req.shop.id,
    name,
    quantity: parseInt(quantity),
    buy_price: parseFloat(buy_price),
    sell_price: parseFloat(sell_price),
    status: "available",
  });

  res.status(201).json({
    message: "Repair part created successfully",
    data: part,
  });
});


export const getRepairParts = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const where = { shop_id: req.shop.id };

  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }

  if (status) {
    where.status = status;
  }

  const { pageNum, limitNum, offset } = paginate(req.query);

  const { rows, count } = await RepairPart.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  res.json({
    data: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: calcPages(count, limitNum),
  });
});
export const getRepairPart = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError("repair part not found", 404);

  res.json({ data: part });
});
export const updateRepairPart = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError("repair part not found", 404);

  const { name, quantity, buy_price, sell_price } = req.body;

  await part.update({
    ...(name && { name }),
    ...(quantity !== undefined && { quantity: parseInt(quantity) }),
    ...(buy_price && { buy_price: parseFloat(buy_price) }),
    ...(sell_price && { sell_price: parseFloat(sell_price) }),
  });

  res.json({
    message: "repair part updated successfully",
    data: part,
  });
});

export const useRepairPart = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError("repair part not found", 404);

  const { quantity_used, repair_id } = req.body;

  if (!quantity_used || quantity_used <= 0) {
    throw new AppError("use quantity must be a positive number ", 400);
  }

  if (part.quantity < quantity_used) {
    throw new AppError(
      ` all quantity is : ${part.quantity}،  used quantity: ${quantity_used}`,
      400
    );
  }

  await part.update({
    quantity: part.quantity - quantity_used,
    quantity_used: (part.quantity_used || 0) + quantity_used,
    status: "used",
    repair_id: repair_id || null,
  });

  res.json({
    message: "part used successfully",
    data: part,
  });
});

export const deleteRepairPart = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError("repair part not found", 404);

  await part.destroy();

  res.json({
    message: "repair part deleted successfully",
  });
});
export const getUsedRepairParts = asyncHandler(async (req, res) => {
  const { search, start, end } = req.query;
  const where = { shop_id: req.shop.id, status: "used" };

  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }

  if (start && end) {
    where.created_at = {
      [Op.between]: [
        new Date(start),
        new Date(new Date(end).setHours(23, 59, 59, 999)),
      ],
    };
  }

  const { pageNum, limitNum, offset } = paginate(req.query);

  const { rows, count } = await RepairPart.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  res.json({
    data: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: calcPages(count, limitNum),
  });
});

export const addRepairPartQuantity = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError(" part not found ", 404);

  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    throw new AppError("quantity must be grater than 0", 400);
  }

  await part.update({
    quantity: part.quantity + parseInt(quantity),
  });

  res.json({
    message: "part quantity updated successfully",
    data: part,
  });
});
export const updateRepairPartStatus = asyncHandler(async (req, res) => {
  const part = await RepairPart.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!part) throw new AppError("part not found", 404);

  const { status } = req.body;

  if (!["available", "used", "damaged"].includes(status)) {
    throw new AppError("part status is invalid", 400);
  }

  await part.update({ status });

  res.json({
    message: "part status updated successfully",
    data: part,
  });
});



/*
 GET    /api/v1/repair-parts              → عرض جميع القطع
GET    /api/v1/repair-parts?search=شاشة  → بحث عن قطع
GET    /api/v1/repair-parts/used         → القطع المستخدمة
GET    /api/v1/repair-parts/:id          → عرض قطعة واحدة

POST   /api/v1/repair-parts              → إضافة قطعة جديدة
PUT    /api/v1/repair-parts/:id          → تعديل القطعة

PATCH  /api/v1/repair-parts/:id/use      → استخدام قطعة
PATCH  /api/v1/repair-parts/:id/add-quantity → إضافة كمية
PATCH  /api/v1/repair-parts/:id/status   → تغيير الحالة

DELETE /api/v1/repair-parts/:id          → حذف القطعة
*/