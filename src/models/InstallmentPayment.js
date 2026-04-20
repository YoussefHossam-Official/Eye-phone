import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Installment from "./Installment.js";

const InstallmentPayment = sequelize.define(
  "InstallmentPayment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    installment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "installment_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// InstallmentPayment.belongsTo(Installment, { foreignKey: "installment_id" });
// Installment.hasMany(InstallmentPayment, { foreignKey: "installment_id" });

export default InstallmentPayment;
