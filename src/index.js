import express from "express";
import sequelize from "./config/database.js";
import helmet from "helmet";
import cors from "cors";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import Admin from "./models/Admin.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import repairRoutes from "./routes/repairRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import installmentContractRoutes from "./routes/installmentContractRoutes.js";
import installmentCustomerRoutes from "./routes/installmentCustomerRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import damagedRoutes from "./routes/damagedRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import "./models/associations.js";
import errorHandler from "./middlewares/errorHandler.js";
import startCronJobs from "./utils/cronJobs.js";
import logger from "./utils/logger.js";
import repairPartRoutes from "./routes/repairPartRoutes.js";
import technicianRoutes from "./routes/technicianRoutes.js";
import { migrateTechnicians } from "./controllers/authController.js";
import clearCache from "./middlewares/clearCache.js";
 
const requiredEnvVars = [
  "DB_NAME",
  "DB_USER",
  "DB_HOST",
  "ALLOWED_ORIGINS",
  "JWT_SECRET",
  "ADMIN_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "PORT",
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length) {
  logger.error(
    "Missing required environment variables: " + missingEnvVars.join(", ")
  );
  process.exit(1);
}
 
const app = express();
app.use(express.json());
app.use(helmet());
 
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];
 
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
 
 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 10000 : 100,
  message: { message: "Too many requests, please try again later" },
});
app.use(limiter);
 
const v1 = "/api/v1";
 
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later" },
});
app.use(`${v1}/auth/login`, loginLimiter);
 
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/products`, clearCache, productRoutes);
app.use(`${v1}/sales`, clearCache, saleRoutes);
app.use(`${v1}/repairs`, clearCache, repairRoutes);
app.use(`${v1}/admin`, adminRoutes);
app.use(`${v1}/categories`, clearCache, categoryRoutes);
app.use(`${v1}/customers`, customerRoutes);
app.use(`${v1}/inventory`, inventoryRoutes);
app.use(`${v1}/installment-contracts`, installmentContractRoutes);
app.use(`${v1}/installment-customers`, installmentCustomerRoutes);
app.use(`${v1}/expenses`, clearCache, expenseRoutes);
app.use(`${v1}/purchases`, clearCache, purchaseRoutes);
app.use(`${v1}/reports`, reportRoutes);
app.use(`${v1}/branches`, branchRoutes);
app.use(`${v1}/damaged`, clearCache, damagedRoutes);
app.use(`${v1}/transfers`, clearCache, transferRoutes);
app.use(`${v1}/returns`, clearCache, returnRoutes);
app.use(`${v1}/dashboard`, dashboardRoutes);
app.use(`${v1}/repair-parts`, clearCache, repairPartRoutes);
app.use(`${v1}/technicians`, technicianRoutes);
app.use(errorHandler);
 
try {
  await sequelize.authenticate();
  logger.info("Database connected");
 
  await sequelize.sync({ force: false });
 
  const adminExists = await Admin.findOne({
    where: { username: process.env.ADMIN_USERNAME },
  });
  if (!adminExists) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({
      name: "Super Admin",
      username: process.env.ADMIN_USERNAME,
      password: hashed,
    });
  }
 
  logger.info("Tables synced");
  await migrateTechnicians();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  startCronJobs();
} catch (error) {
  logger.error("Startup error", { error });
  process.exit(1);
}