import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
 
const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: "sessions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["token"], type: "FULLTEXT" },
  ],
});
 
export default Session;