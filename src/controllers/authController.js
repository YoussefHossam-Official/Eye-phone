import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Technician from "../models/Technician.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
 
export const register = asyncHandler(async (req, res) => {
  const { shop_name, shop_phone, shop_address, user_name, username, password } = req.body;
 
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) throw new AppError("Username already exists", 400);
 
  const trial_start = new Date();
  const trial_end = new Date();
  trial_end.setDate(trial_end.getDate() + 14);
 
  const shop = await Shop.create({
    name: shop_name,
    phone: shop_phone,
    address: shop_address,
    shop_type: "individual",
    is_trial: true,
    trial_start,
    trial_end,
  });
 
  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    shop_id: shop.id,
    name: user_name,
    username,
    password: hashed,
    role: "owner",
  });
 
  res.status(201).json({ message: "Account created successfully" });
});
 
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
 
  const user = await User.findOne({ where: { username } });
  if (!user) throw new AppError("Invalid credentials", 401);
 
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError("Invalid credentials", 401);
 
  if (user.status === "inactive")
    throw new AppError("Account is inactive, please contact your manager", 403);
 
  const shop = await Shop.findByPk(user.shop_id);
  if (!shop || !shop.is_active)
    throw new AppError("Shop is inactive, please contact support", 403);
 
  const sessions = await Session.findAll({ where: { user_id: user.id } });
  if (sessions.length >= 2)
    throw new AppError("Maximum devices reached, please logout from another device", 403);
 
  const token = jwt.sign(
    { id: user.id, shop_id: user.shop_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
 
  await Session.create({ user_id: user.id, token });
 
  res.json({
    token,
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
  });
});
 
export const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  await Session.destroy({ where: { token } });
  res.json({ message: "Logged out successfully" });
});
 
export const createStaff = asyncHandler(async (req, res) => {
  const { name, username, password, role, phone, commission_percentage } = req.body;
 
  if (role === "owner") throw new AppError("Cannot create another owner account", 403);
 
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) throw new AppError("Username already exists", 400);
 
  const hashed = await bcrypt.hash(password, 10);
  const staff = await User.create({
    shop_id: req.shop.id,
    name,
    username,
    password: hashed,
    role,
    phone: phone || null,
    commission_percentage: role === "tech" ? (commission_percentage || 0) : 0,
    status: "active",
  });
 
  res.status(201).json({
    message: "Staff account created successfully",
    data: { id: staff.id, name: staff.name, username: staff.username, role: staff.role, phone: staff.phone },
  });
});
 
export const getStaff = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const where = { shop_id: req.shop.id };
  if (role) where.role = role;
 
  const staff = await User.findAll({
    where,
    attributes: { exclude: ["password"] },
    order: [["created_at", "DESC"]],
  });
 
  res.json({ data: staff });
});
 
export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
  if (!staff) throw new AppError("Staff member not found", 404);
 
  if (staff.role === "owner" && staff.id !== req.user.id)
    throw new AppError("Cannot modify another owner account", 403);
 
  const { name, phone, commission_percentage, status, password } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (commission_percentage !== undefined && staff.role === "tech")
    updateData.commission_percentage = commission_percentage;
  if (status) updateData.status = status;
  if (password) updateData.password = await bcrypt.hash(password, 10);
 
  await staff.update(updateData);
  res.json({
    message: "Staff updated successfully",
    data: { id: staff.id, name: staff.name, username: staff.username, role: staff.role, status: staff.status },
  });
});
 
export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
  if (!staff) throw new AppError("Staff member not found", 404);
  if (staff.id === req.user.id) throw new AppError("Cannot delete your own account", 403);
  if (staff.role === "owner") throw new AppError("Cannot delete owner account", 403);
 
  await Session.destroy({ where: { user_id: staff.id } });
  await staff.destroy();
  res.json({ message: "Staff member deleted successfully" });
});
 
export const migrateTechnicians = async () => {
  try {
    const technicians = await Technician.findAll();
    if (technicians.length === 0) return;
 
    let migrated = 0;
    for (const tech of technicians) {
      const existing = await User.findOne({ where: { username: tech.username } });
      if (existing) continue;
 
      await User.create({
        shop_id: tech.shop_id,
        name: tech.name,
        username: tech.username,
        password: tech.password,
        role: "tech",
        phone: tech.phone || null,
        commission_percentage: tech.commission_percentage || 0,
        status: tech.status === "active" ? "active" : "inactive",
      });
      migrated++;
    }
 
    if (migrated > 0) console.log(`Migrated ${migrated} technicians to users table`);
  } catch (err) {
    console.error("Technician migration error:", err.message);
  }
};