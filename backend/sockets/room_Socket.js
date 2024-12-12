export default (socket, io) => {
  // Create a room
  socket.on("createRoom", async ({ roomName, userId }) => {
    let roomId;
    console.log(roomName, userId);

    do roomId = `Room-${roomName}-${Randomstring.generate(7)}`;
    while (await Room.findOne({ where: { roomId } }));

    try {
      //Create room
      const room = await Room.create({ roomId, name: roomName });

      // Add the creator to the room participants
      await RoomParticipant.create({ roomId, userId });
      socket.join(roomId);

      //Notify front about created rom
      socket.emit("roomCreated", { roomId, roomName });
      console.log(`Room created: ${(roomId, roomName)}`);
    } catch (error) {
      console.error("Room creation error:", error.message);
      socket.emit("error", "Failed to create room");
    }
  });

  // Join room
  socket.on("joinRoom", async ({ roomId, userId }) => {
    try {
      // Find the room by roomId
      const room = await Room.findOne({ where: { roomId } });
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Check if user is already a participant in the room
      const participantExists = await RoomParticipant.findOne({
        where: { roomId: room.id, userId },
      });

      if (!participantExists) {
        // Add user to the room
        await RoomParticipant.create({ roomId: room.id, userId });
      }

      // Join the socket to the room
      socket.join(roomId);

      // Get the list of participants in the room
      const participants = await RoomParticipant.findAll({
        where: { roomId: room.id },
      });

      // Emit the updated list of room participants
      io.to(roomId).emit(
        "roomUsers",
        participants.map((p) => p.userId)
      );

      // Emit room joined event for the user
      socket.emit("roomJoined", { roomId, roomName: room.name });
      console.log(`User ${userId} joined room: ${roomId}`);
    } catch (error) {
      console.error(error);
      socket.emit("error", "Failed to join room");
    }
  });

  // Invite users to a room
  socket.on("inviteToRoom", async ({ roomId, users }) => {
    console.log("Inserting users: ", users, "into room with ID:", roomId);

    // Check for invalid input
    if (!roomId || !Array.isArray(users) || users.length === 0) {
      socket.emit("error", "Room ID or users array is invalid");
      return;
    }

    try {
      // Keep track of results
      const addedUsers = [];
      const failedUsers = [];

      // Loop through the provided users
      for (const userId of users) {
        console.log("inside for loop -------", userId);
        try {
          if (!userId) {
            failedUsers.push({ userId, reason: "Invalid userId" });
            continue;
          }

          // Fetch the user by userId
          const resolvedUser = await User.findOne({ where: { userId } });
          console.log(resolvedUser);

          // Log whether the user was found
          if (!resolvedUser) {
            console.log(`User with userId ${userId} not found----------`);
            failedUsers.push({ userId, reason: "User not found" });
            continue;
          }

          console.log(`User with userId ${userId} found:------`, resolvedUser);

          const resolvedUserId = resolvedUser.userId;

          // Check if the user is already a participant in the room
          const existingParticipant = await RoomParticipant.findOne({
            where: { userId: resolvedUserId, roomId },
          });

          if (existingParticipant) {
            console.log(
              `User with userId ${userId} is already in the room--------`
            );
            failedUsers.push({
              userId: resolvedUserId,
              reason: "Already in the room",
            });
            continue;
          }

          // Add user to the room
          await RoomParticipant.create({
            userId: resolvedUserId,
            roomId,
          });

          // Join the real-time room
          const userSocket = io.sockets.sockets.get(resolvedUser.socketId);
          if (userSocket) {
            userSocket.join(roomId);
            console.log(
              `User with userId ${userId} joined room ${roomId}----------`
            );
          }

          addedUsers.push({
            userId: resolvedUserId,
          });
        } catch (error) {
          console.error(
            `Error adding user with userId ${userId} to room`,
            error
          );
          failedUsers.push({ userId, reason: "Error adding user" });
        }
      }

      // Update room participant list for all clients
      const participants = await RoomParticipant.findAll({
        where: { roomId },
      });
      const participantIds = participants.map((p) => p.userId);

      // Emit new room user list
      io.to(roomId).emit("roomUsers", participantIds);

      // Notify initiator of the result
      socket.emit("inviteResults", { addedUsers, failedUsers });

      // Notify added users that they have been added to the room
      for (const addedUser of addedUsers) {
        const userSocket = io.sockets.sockets.get(
          await User.findOne({
            where: { userId: addedUser.userId },
          }).then((user) => user.socketId)
        );
        if (userSocket) {
          userSocket.emit("addedToRoom", {
            roomId,
            message: "You have been added to a new room",
          });
        }
      }

      console.log(
        `Invite to room ${roomId} complete: ${addedUsers.length} added, ${failedUsers.length} failed`
      );
    } catch (error) {
      console.error("Error inviting users to room:", error);
      socket.emit("error", "Failed to invite users to room");
    }
  });

  // Leave room
  socket.on("leaveRoom", async ({ roomId, userId }) => {
    const room = await Room.findOne({ where: { roomId } });
    if (!room) return socket.emit("error", "Failed to get room");

    await RoomParticipant.destroy({ where: { roomId, userId } });
    socket.leave(roomId);

    // Fetch the updated list of rooms for the user
    const userRooms = await RoomParticipant.findAll({ where: { userId } });
    const rooms = await Room.findAll({
      where: { id: userRooms.map((ur) => ur.roomId) },
      attributes: ["roomId", "name"],
    });
    //Update List
    socket.emit("joinedRooms", { rooms });

    const participants = await RoomParticipant.findAll({
      where: { roomId: room.id },
    });
    io.to(roomId).emit(
      "roomUsers",
      participants.map((p) => p.userId)
    );
    console.log(`User ${userId} left room: ${roomId}`);
  });
  // Send message in room
  socket.on("sendRoomMessage", async ({ senderId, roomId, content }) => {
    console.log(
      "sending room message to",
      roomId,
      "by the",
      senderId,
      "message is ",
      content,
      "------==-=-=-=-=-"
    );

    const room = await Room.findOne({ where: { roomId } });
    if (!room) return socket.emit("error", "Failed to send message to room");

    const message = await Message.create({
      senderId,
      roomId,
      content,
    });

    io.to(roomId).emit("newMessage", {
      senderId,
      content: message.content,
      timestamp: message.timestamp,
    });
    console.log(`Message sent in room ${senderId} ${roomId}: ${content}`);
  });
};
