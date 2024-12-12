import { DataTypes } from "sequelize";
import sequelize from "../config/db_connect.js";

const Message = sequelize.define("Message", {
  senderId: { type: DataTypes.STRING, allowNull: false },
  receiverId: { type: DataTypes.STRING, allowNull: true },
  roomId: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

export default Message;
