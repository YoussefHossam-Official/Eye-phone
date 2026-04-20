import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SubscriptionPayment = sequelize.define(
  "SubscriptionPayment",
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
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount_due: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "subscription_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default SubscriptionPayment;
