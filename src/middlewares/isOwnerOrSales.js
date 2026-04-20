import AppError from "../utils/AppError.js";
 
const isOwnerOrSales = (req, res, next) => {
  if (!["owner", "sales"].includes(req.user.role)) {
    return next(new AppError("Access denied.", 403));
  }
  next();
};
 
export default isOwnerOrSales;