import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import validate from "../middlewares/validate.js";
import { adminLoginSchema, createShopSchema } from "../validations/adminValidation.js"; 
import { adminLogin } from "../controllers/adminAuthController.js";
import {
  createShop,
  getShops,
  updateShop,
  toggleShop,
  deleteShop,
} from "../controllers/adminShopController.js";
import {
  setSubscription,
  paySubscriptionDue,
  getShopPayments,
  getSubscriptions,
} from "../controllers/adminSubscriptionController.js";
import {
  getDashboard,
  getActiveShops,
  getInactiveShops,
  getTrialShops,
  getGracePeriodShops,
  getExpiredShops,
  getRevenueReport,
} from "../controllers/adminDashboardController.js";
 
const router = express.Router();
 
router.post("/login", validate(adminLoginSchema), adminLogin);
router.get("/dashboard", adminAuth, getDashboard);
router.post("/shops", adminAuth, validate(createShopSchema), createShop); 
router.get("/shops", adminAuth, getShops);
router.get("/shops/active", adminAuth, getActiveShops);
router.get("/shops/inactive", adminAuth, getInactiveShops);
router.get("/shops/trial", adminAuth, getTrialShops);
router.get("/shops/grace-period", adminAuth, getGracePeriodShops);
router.get("/shops/expired", adminAuth, getExpiredShops);
router.get("/shops/subscriptions", adminAuth, getSubscriptions);
router.get("/revenue", adminAuth, getRevenueReport);
router.get("/shops/:id/payments", adminAuth, getShopPayments);
router.post("/shops/:id/pay-due", adminAuth, paySubscriptionDue);
router.patch("/shops/:id/toggle", adminAuth, toggleShop);
router.patch("/shops/:id/subscription", adminAuth, setSubscription);
router.patch("/shops/:id", adminAuth, updateShop);
router.delete("/shops/:id", adminAuth, deleteShop);

export default router;