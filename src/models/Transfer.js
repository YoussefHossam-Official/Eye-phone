import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Transfer = sequelize.define(
  "Transfer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    from_shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    to_shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "transfers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Transfer;