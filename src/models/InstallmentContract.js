import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const InstallmentContract = sequelize.define(
  "InstallmentContract",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cash_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    down_payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    first_installment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_interest: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    monthly_installment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    late_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    late_fee_type: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: true,
      defaultValue: "percentage",
    },
    grace_period_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    rounding_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "completed"),
      defaultValue: "active",
    },
  },
  {
    tableName: "installment_contracts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["shop_id", "status"] },
      { fields: ["shop_id", "created_at"] },
      { fields: ["customer_id"] },
    ],
  }
);

export default InstallmentContract;
