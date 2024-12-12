import { DataTypes } from "sequelize";
import sequelize from "../config/db_connect.js";

const RoomParticipant = sequelize.define("RoomParticipant", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: "userId",
    },
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Room,
      key: "roomId",
    },
  },
});

export default RoomParticipant;
