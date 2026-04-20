import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Shop from "./Shop.js";

const InstallmentCustomer = sequelize.define(
  "InstallmentCustomer",
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    backup_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    national_id: {
      type: DataTypes.STRING(14),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "installment_customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default InstallmentCustomer;
