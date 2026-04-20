import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SaleItem = sequelize.define(
  "SaleItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    profit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    product_name_snapshot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_model_snapshot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_buy_price_snapshot: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    category_id_snapshot: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "sale_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default SaleItem;
