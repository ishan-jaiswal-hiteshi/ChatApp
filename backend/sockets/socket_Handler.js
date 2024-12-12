import { Server } from "socket.io";
import createServer from "./create_Server";

export default (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle user socket disconnect
    socket.on("disconnect", async () => {
      try {
        const user = await User.findOne({ where: { socketId: socket.id } });
        if (user) {
          user.socketId = null;
          await user.save();
          console.log(`User disconnected: ${user.email}`);
        }
      } catch (error) {
        console.error("Disconnect error:", error.message);
      }
    });
  });
};
