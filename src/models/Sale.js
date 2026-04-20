import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
 
const Sale = sequelize.define(
  "Sale",
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_type: {
      type: DataTypes.ENUM("cash"),
      defaultValue: "cash",
    },
  },
  {
    tableName: "sales",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["shop_id"] },
      { fields: ["shop_id", "created_at"] },
      { fields: ["customer_id"] },
    ],
  }
);
 
export default Sale;
 