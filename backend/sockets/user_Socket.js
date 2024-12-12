export default (socket, io) => {
  // Register user on WebSocket connection (with userId received after login)
  socket.on("registerSocket", async ({ userId }) => {
    //console.log("registered socket id ------------", socket.id);
    try {
      const user = await User.findOne({ where: { userId } });
      if (user) {
        user.socketId = socket.id;
        await user.save();
        console.log(`Socket ID registered for user: ${user.userId}`);
      } else {
        socket.emit("error", "User not found");
      }
    } catch (error) {
      console.error(error);
      socket.emit("error", "Failed to register socket ID");
    }
  });

  // Get all registered users
  socket.on("getAllRegUsers", async () => {
    console.log("emitted all  reg users ------------");
    try {
      const usersList = await User.findAll({
        attributes: ["userId", "name", "email"],
      });

      socket.emit("allRegUsers", { usersList });
    } catch (error) {
      console.error("Error fetching users:", error);
      socket.emit("error", "Failed to fetch users");
    }
  });

  // Get all joined rooms for a user
  socket.on("getAllJoinedRooms", async ({ userId }) => {
    //console.log("emitted all joined room ------------");

    if (!userId) {
      socket.emit("error", { error: "User ID is required" });
      return;
    }

    try {
      // Find all room IDs the user is part of
      const partOfRooms = await RoomParticipant.findAll({
        where: { userId },
        attributes: ["roomId"],
      });

      // Extract room IDs from the participant records
      const roomIds = partOfRooms.map((record) => record.roomId);

      // Not part of any room
      if (roomIds.length === 0) {
        socket.emit("joinedRooms", { rooms: [] });
        return;
      }

      // Fetch details of all rooms
      const rooms = await Room.findAll({
        where: { roomId: roomIds },
        attributes: ["roomId", "name"],
      });

      socket.emit("joinedRooms", { rooms });
      console.log("emitted all joined room");
    } catch (error) {
      console.error("Error fetching user rooms:", error.message);
      socket.emit("error", "Failed to fetch rooms");
    }
  });
  // Send direct message
  socket.on("sendDirectMessage", async ({ senderId, receiverId, content }) => {
    const receiver = await User.findOne({ where: { userId: receiverId } });
    if (!receiver) {
      socket.emit("error", "User not found");
      return;
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content,
    });

    if (receiver) {
      console.log(
        `Direct message from ${senderId} to ${receiverId}: ${content}`
      );

      //To sender
      socket.emit("newDirectMessage", {
        senderId,
        receiverId,
        content: message.content,
        timestamp: message.timestamp,
      });

      //To reciver
      io.to(receiver.socketId).emit("newDirectMessage", {
        senderId,
        content: message.content,
        timestamp: message.timestamp,
      });
    } else {
      socket.emit("error", "User is offline");
    }
  });
};
