import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("product", "spare_part"),
      defaultValue: "product",
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    min_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    buy_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    sell_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    paranoid: true,
    deletedAt: "deleted_at",
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["shop_id", "deleted_at"] },
      { fields: ["category_id"] },
    ],
  }
);

export default Product;
