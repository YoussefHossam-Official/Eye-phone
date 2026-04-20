import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ where: { username } });

  if (!admin) throw new AppError("Invalid credentials", 401);

  const valid = await bcrypt.compare(password, admin.password);

  if (!valid) throw new AppError("Invalid credentials", 401);

  const token = jwt.sign(
    { id: admin.id, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});