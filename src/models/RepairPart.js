import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RepairPart = sequelize.define(
  "RepairPart",
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
    repair_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    technician_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity_used: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    buy_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sell_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("available", "used", "damaged"),
      defaultValue: "available",
    },
  },
  {
    tableName: "repair_parts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["shop_id", "status"] },
      { fields: ["technician_id"] },
    ],
  }
);

export default RepairPart;