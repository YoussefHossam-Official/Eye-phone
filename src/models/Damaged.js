import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Damaged = sequelize.define(
  "Damaged",
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM("manual", "return"),
      defaultValue: "manual",
    },
  },
  {
    tableName: "damaged",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Damaged;
