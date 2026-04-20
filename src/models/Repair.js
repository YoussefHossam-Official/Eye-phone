import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
 
const Repair = sequelize.define(
  "Repair",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
 
  
    customer_id: { type: DataTypes.INTEGER, allowNull: true },
 
  
    technician_id: { type: DataTypes.INTEGER, allowNull: true },
 
    customer_name_snapshot: { type: DataTypes.STRING, allowNull: false },
    customer_phone_snapshot: { type: DataTypes.STRING, allowNull: false },
 
    device_name: { type: DataTypes.STRING, allowNull: false },
    problem: { type: DataTypes.TEXT, allowNull: false, defaultValue: "كشف" },
    notes: { type: DataTypes.TEXT, allowNull: true },
 
    status: {
      type: DataTypes.ENUM("received", "in_progress", "done", "delivered", "rejected"),
      defaultValue: "received",
    },
 
    repair_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
 

    technician_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
 
 
    technician_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  },
  {
    tableName: "repairs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["shop_id", "status"] },
      { fields: ["shop_id", "created_at"] },
      { fields: ["technician_id"] },
    ],
  }
);
 
export default Repair;