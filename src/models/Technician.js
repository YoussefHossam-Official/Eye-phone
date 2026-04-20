import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Technician = sequelize.define(
  "Technician",
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    total_repairs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_revenue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  },
  {
    tableName: "technicians",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["username"] },
      { fields: ["shop_id", "status"] },
    ],
  }
);

export default Technician;