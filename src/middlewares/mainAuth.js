import AppError from "../utils/AppError.js";

const mainAuth = (req, res, next) => {
  if (req.shop.shop_type !== "main") {
    throw new AppError("Access denied. Main shop only.", 403);
  }
  next();
};

export default mainAuth;
