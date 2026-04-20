import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
 
const Purchase = sequelize.define(
  "Purchase",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    product_name: { type: DataTypes.STRING, allowNull: false },
    supplier_name: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    buy_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "purchases",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["product_id"] },
    ],
  }
);
 
export default Purchase;