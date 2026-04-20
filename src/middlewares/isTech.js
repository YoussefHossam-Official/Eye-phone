import AppError from "../utils/AppError.js";
 
const isTech = (req, res, next) => {
  if (req.user.role !== "tech") {
    return next(new AppError("Access denied. Technician only.", 403));
  }
  next();
};
 
export default isTech;
 