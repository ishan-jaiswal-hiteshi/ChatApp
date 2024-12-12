import { DataTypes } from "sequelize";
import sequelize from "../config/db_connect.js";

const Room = sequelize.define("Room", {
  roomId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: true },
});

export default Room;
