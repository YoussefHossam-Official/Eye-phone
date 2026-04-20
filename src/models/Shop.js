import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Shop = sequelize.define(
  "Shop",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shop_type: {
      type: DataTypes.ENUM("individual", "main", "branch"),
      defaultValue: "individual",
    },
    parent_shop_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trial_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    trial_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_trial: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    subscription_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    subscription_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    subscription_status: {
      type: DataTypes.ENUM("active", "grace_period", "expired"),
      defaultValue: "active",
    },
    grace_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    total_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_due: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "shops",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Shop;
