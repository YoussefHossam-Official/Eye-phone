import cron from "node-cron";
import { Op } from "sequelize";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import SaleItem from "../models/SaleItem.js";
import InstallmentSchedule from "../models/InstallmentSchedule.js";
import Shop from "../models/Shop.js";
import logger from "./logger.js";
 
const startCronJobs = () => {
 

  cron.schedule("0 0 * * *", async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
 
      const archivedProducts = await Product.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.lte]: sevenDaysAgo, [Op.ne]: null } },
      });
 
      let deleted = 0, skipped = 0;
      for (const product of archivedProducts) {
        const hasSales = await SaleItem.count({ where: { product_id: product.id } });
        if (hasSales > 0) { skipped++; continue; }
        await product.destroy({ force: true });
        deleted++;
      }
      logger.info(`Cron cleanup: ${deleted} products deleted, ${skipped} skipped`);
 
      const archivedCategories = await Category.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.lte]: sevenDaysAgo, [Op.ne]: null } },
      });
 
      let deletedCats = 0, skippedCats = 0;
      for (const category of archivedCategories) {
        const productsWithSales = await Product.count({
          paranoid: false,
          where: { category_id: category.id },
          include: [{ model: SaleItem, required: true }],
        });
        if (productsWithSales > 0) { skippedCats++; continue; }
        await Product.destroy({ paranoid: false, where: { category_id: category.id }, force: true });
        await category.destroy({ force: true });
        deletedCats++;
      }
      logger.info(`Cron cleanup: ${deletedCats} categories deleted, ${skippedCats} skipped`);
    } catch (error) {
      logger.error("Cron products/categories cleanup error", { error: error.message });
    }
  });
 

  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const updated = await InstallmentSchedule.update(
        { status: "late" },
        { where: { due_date: { [Op.lt]: today }, status: ["pending", "partial"] } }
      );
      logger.info(`Cron installments: ${updated[0]} marked as late`);
    } catch (error) {
      logger.error("Cron installments error", { error: error.message });
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
 
      const expiringSoon = await Shop.count({
        where: { subscription_end: { [Op.between]: [today, fiveDaysLater] }, subscription_status: "active" },
      });
      if (expiringSoon > 0) logger.info(`Cron subscriptions: ${expiringSoon} shops expiring soon`);
 
      const expired = await Shop.findAll({
        where: { subscription_end: { [Op.lt]: today }, subscription_status: "active" },
      });
      for (const shop of expired) {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + 7);
        await shop.update({ subscription_status: "grace_period", grace_period_end: graceEnd });
      }
      if (expired.length > 0) logger.info(`Cron subscriptions: ${expired.length} moved to grace period`);
 
      const graceExpired = await Shop.findAll({
        where: { grace_period_end: { [Op.lt]: today }, subscription_status: "grace_period" },
      });
      for (const shop of graceExpired) {
        await shop.update({ subscription_status: "expired", is_active: false });
      }
      if (graceExpired.length > 0) logger.info(`Cron subscriptions: ${graceExpired.length} deactivated`);
    } catch (error) {
      logger.error("Cron subscriptions error", { error: error.message });
    }
  });
 

  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
 
      const trialExpiringSoon = await Shop.count({
        where: { is_trial: true, trial_end: { [Op.between]: [today, fiveDaysLater] } },
      });
      if (trialExpiringSoon > 0) logger.info(`Cron trials: ${trialExpiringSoon} expiring soon`);
 
      const trialExpired = await Shop.findAll({
        where: { is_trial: true, trial_end: { [Op.lt]: today } },
      });
      for (const shop of trialExpired) {
        await shop.update({ is_trial: false, is_active: false });
      }
      if (trialExpired.length > 0) logger.info(`Cron trials: ${trialExpired.length} expired and deactivated`);
    } catch (error) {
      logger.error("Cron trials error", { error: error.message });
    }
  });
};
 
export default startCronJobs;