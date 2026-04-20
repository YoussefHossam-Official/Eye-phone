import AppError from "../utils/AppError.js";
 
const isSales = (req, res, next) => {
  if (req.user.role !== "sales") {
    return next(new AppError("Access denied. Sales only.", 403));
  }
  next();
};
 
export default isSales;