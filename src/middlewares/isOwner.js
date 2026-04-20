import AppError from "../utils/AppError.js";
 
const isOwner = (req, res, next) => {
  if (req.user.role !== "owner") {
    return next(new AppError("Access denied. Owner only.", 403));
  }
  next();
};
 
export default isOwner;