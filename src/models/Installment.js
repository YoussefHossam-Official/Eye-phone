import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Shop from "./Shop.js";
import Sale from "./Sale.js";
import Customer from "./Customer.js";

const Installment = sequelize.define(
  "Installment",
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
    sale_id: {
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
    down_payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    num_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    installment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "installments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// Installment.belongsTo(Shop, { foreignKey: "shop_id" });
// Installment.belongsTo(Sale, { foreignKey: "sale_id" });
// Installment.belongsTo(Customer, { foreignKey: "customer_id" });
// Sale.hasOne(Installment, { foreignKey: "sale_id" });

export default Installment;
