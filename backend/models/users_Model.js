import { DataTypes } from "sequelize";
import sequelize from "../config/db_connect.js";

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  socketId: { type: DataTypes.STRING, allowNull: true },
});

export default User;
