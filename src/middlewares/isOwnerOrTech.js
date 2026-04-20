import AppError from "../utils/AppError.js";
 
const isOwnerOrTech = (req, res, next) => {
  if (!["owner", "tech"].includes(req.user.role)) {
    return next(new AppError("Access denied.", 403));
  }
  next();
};
 
export default isOwnerOrTech;