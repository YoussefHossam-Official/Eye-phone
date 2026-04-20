import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Expense = sequelize.define(
  "Expense",
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "other",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "expenses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
     
      { fields: ["shop_id"] },
      { fields: ["shop_id", "date"] },
    ],
  }
);

export default Expense;
