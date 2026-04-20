import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const InstallmentSchedule = sequelize.define(
  "InstallmentSchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    late_fee_applied: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "partial", "late"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "installment_schedule",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default InstallmentSchedule;