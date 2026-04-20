import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import AppError from "../utils/AppError.js";
 
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new AppError("No token provided", 401);
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    const session = await Session.findOne({ where: { token } });
    if (!session) throw new AppError("Session expired", 401);
 
    const user = await User.findByPk(decoded.id);
    if (!user) throw new AppError("User not found", 401);
 
    if (user.status === "inactive") {
      throw new AppError("Account is inactive, please contact your manager", 403);
    }
 
    const shop = await Shop.findByPk(user.shop_id);
    if (!shop || !shop.is_active)
      throw new AppError("Shop is inactive, please contact support", 403);
 
    const today = new Date();
 
    if (shop.is_trial) {
      if (!shop.trial_end) {
        throw new AppError("Trial period is not configured, please contact support", 403);
      }
      const trialEnd = new Date(shop.trial_end);
      if (today > trialEnd) {
        await shop.update({ is_trial: false, is_active: false });
        throw new AppError("Trial period has ended, please contact support", 403);
      }
      const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
      req.trial_days_left = daysLeft;
    } else {
      if (shop.subscription_status === "expired") {
        throw new AppError("Subscription expired, please contact support", 403);
      }
    }
 
    req.user = user;   
    req.shop = shop;
    next();
  } catch (error) {
    next(error);
  }
};
 
export default auth;