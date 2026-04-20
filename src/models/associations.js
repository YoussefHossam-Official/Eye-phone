import Shop from "./Shop.js";
import User from "./User.js";
import Customer from "./Customer.js";
import Product from "./Product.js";
import Sale from "./Sale.js";
import SaleItem from "./SaleItem.js";
import Repair from "./Repair.js";
import Session from "./Session.js";
import Category from "./Category.js";
import InstallmentCustomer from "./InstallmentCustomer.js";
import InstallmentContract from "./InstallmentContract.js";
import InstallmentSchedule from "./InstallmentSchedule.js";
import Purchase from "./Purchase.js";
import Expense from "./Expense.js";
import Installment from "./Installment.js";
import InstallmentPayment from "./InstallmentPayment.js";
import SubscriptionPayment from "./SubscriptionPayment.js";
import Damaged from "./Damaged.js";
import Transfer from "./Transfer.js";
import RepairPart from "./RepairPart.js";
import Technician from "./Technician.js";

// Shop

Shop.hasMany(User, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Customer, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Category, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Product, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Sale, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Repair, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Purchase, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Expense, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(InstallmentCustomer, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(InstallmentContract, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Installment, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(SubscriptionPayment, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Damaged, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Transfer, {
  foreignKey: "from_shop_id",
  as: "sentTransfers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(Transfer, {
  foreignKey: "to_shop_id",
  as: "receivedTransfers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Shop.hasMany(RepairPart, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
// Branches
Shop.hasMany(Shop, {
  foreignKey: "parent_shop_id",
  as: "branches",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Shop.belongsTo(Shop, { foreignKey: "parent_shop_id", as: "mainShop" });

// User

User.belongsTo(Shop, { foreignKey: "shop_id" });
User.hasMany(Session, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Session.belongsTo(User, { foreignKey: "user_id" });

Repair.belongsTo(User, { foreignKey: "technician_id", as: "Technician" });
User.hasMany(Repair, {
  foreignKey: "technician_id",
  as: "TechnicianRepairs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

RepairPart.belongsTo(User, {
  foreignKey: "technician_id",
  as: "PartTechnician",
});
User.hasMany(RepairPart, {
  foreignKey: "technician_id",
  as: "TechnicianParts",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Category
Category.belongsTo(Shop, { foreignKey: "shop_id" });
Category.hasMany(Product, {
  foreignKey: "category_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Product

Product.belongsTo(Shop, { foreignKey: "shop_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });
Product.hasMany(SaleItem, { foreignKey: "product_id", onDelete: "SET NULL" });
Product.hasMany(Damaged, {
  foreignKey: "product_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Product.hasMany(Transfer, {
  foreignKey: "product_id",
  as: "transfers",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Customer

Customer.belongsTo(Shop, { foreignKey: "shop_id" });
Customer.hasMany(Sale, {
  foreignKey: "customer_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Customer.hasMany(Repair, {
  foreignKey: "customer_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Customer.hasMany(Installment, {
  foreignKey: "customer_id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Sale

Sale.belongsTo(Shop, { foreignKey: "shop_id" });
Sale.belongsTo(Customer, { foreignKey: "customer_id" });
Sale.hasMany(SaleItem, {
  foreignKey: "sale_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Sale.hasOne(Installment, {
  foreignKey: "sale_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
SaleItem.belongsTo(Sale, { foreignKey: "sale_id" });
SaleItem.belongsTo(Product, { foreignKey: "product_id" });

// Repair

Repair.belongsTo(Shop, { foreignKey: "shop_id" });
Repair.belongsTo(Customer, { foreignKey: "customer_id" });

// Installment

Installment.belongsTo(Shop, { foreignKey: "shop_id" });
Installment.belongsTo(Sale, { foreignKey: "sale_id" });
Installment.belongsTo(Customer, { foreignKey: "customer_id" });
Installment.hasMany(InstallmentPayment, {
  foreignKey: "installment_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
InstallmentPayment.belongsTo(Installment, { foreignKey: "installment_id" });

// Purchase

Purchase.belongsTo(Shop, { foreignKey: "shop_id" });

// Expense

Expense.belongsTo(Shop, { foreignKey: "shop_id" });

// InstallmentCustomer + InstallmentContract

InstallmentCustomer.belongsTo(Shop, { foreignKey: "shop_id" });
InstallmentCustomer.hasMany(InstallmentContract, {
  foreignKey: "customer_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
InstallmentContract.belongsTo(Shop, { foreignKey: "shop_id" });
InstallmentContract.belongsTo(InstallmentCustomer, {
  foreignKey: "customer_id",
});
InstallmentContract.hasMany(InstallmentSchedule, {
  foreignKey: "contract_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
InstallmentSchedule.belongsTo(InstallmentContract, {
  foreignKey: "contract_id",
});

// SubscriptionPayment

SubscriptionPayment.belongsTo(Shop, { foreignKey: "shop_id" });

// Damaged

Damaged.belongsTo(Shop, { foreignKey: "shop_id" });
Damaged.belongsTo(Product, { foreignKey: "product_id" });

// Transfer

Transfer.belongsTo(Shop, { foreignKey: "from_shop_id", as: "fromShop" });
Transfer.belongsTo(Shop, { foreignKey: "to_shop_id", as: "toShop" });
Transfer.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// RepairPart

RepairPart.belongsTo(Shop, { foreignKey: "shop_id" });

// Technician + Shop
Shop.hasMany(Technician, {
  foreignKey: "shop_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Technician.belongsTo(Shop, { foreignKey: "shop_id" });
