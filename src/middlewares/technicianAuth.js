import jwt from "jsonwebtoken";
import Technician from "../models/Technician.js";
import AppError from "../utils/AppError.js";

const technicianAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError("Authorization token is required", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "technician") {
      throw new AppError("Invalid token type", 401);
    }

    const technician = await Technician.findByPk(decoded.id);

    if (!technician) {
      throw new AppError("Technician not found", 404);
    }

    if (technician.status !== "active") {
      throw new AppError("Technician account is inactive", 403);
    }

    req.technician = technician;
    next();
  } catch (error) {
    next(error);
  }
};

export default technicianAuth;