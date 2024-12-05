import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
//Combine Http and Express with Socket
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "*"],
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // { roomId : { users: [], messages: [] } }
const users = {}; // Map of userId : socketId

//test api
app.get("/test-api", (req, res) => {
  res.send("Hello World!");
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register Singlr user
  socket.on("createSingleUser", (userId) => {
    const newUserId = `${userId}.${socket.id.slice(-5)}`;
    users[newUserId] = socket.id;

    //Send user ID to front
    io.to(socket.id).emit("getUserID", newUserId);
    console.log(`User registered: ${newUserId} to ${socket.id}`);
  });

  // Direct messaging through
  socket.on("sendSingleMessage", ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      const msgObj = {
        senderId,
        message,
        timestamp: new Date().toISOString(),
      };

      // Send message to the receiver
      io.to(receiverSocketId).emit("receiveMessage", msgObj);

      // send back the message to the sender (confirmation)
      socket.emit("receiveMessage", msgObj);
    } else {
      // Notify sender that the recipient is not available
      socket.emit("user is unavailable", receiverId);
    }
  });

  /*
  // Handle disconnection
  socket.on("disconnectSingle", () => {
    const disconnectedUser = Object.keys(users).find(
      (newUserId) => users[newUserId] === socket.id
    );
    if (disconnectedUser) {
      delete users[disconnectedUser];
      console.log(`User disconnected: ${disconnectedUser}`);
    }
  });
 */

  // Listen for "joinRoom" event from client
  socket.on("joinRoom", ({ roomId, userId }) => {
    // Create room if doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { users: [], messages: [] };
    }

    // Add the user to the room's user(s) list
    if (!rooms[roomId].users.includes(userId)) {
      //Creating userId
      const newUserId = `${userId}.${socket.id.slice(-5)}`;
      // Create or join a room
      socket.join(roomId);
      /**/ io.to(roomId).emit("newJoinedUser", newUserId);

      //push new user to rooms obj
      rooms[roomId].users.push(newUserId);

      //emit current user id
      /**/ io.to(roomId).emit("currentUserID", newUserId);

      console.log(`${newUserId} joined room: ${roomId}`);
    } else {
      // Create or join a room
      socket.join(roomId);
      /**/ io.to(roomId).emit("newJoinedUser", userId);
    }

    // Emit all rooms details
    //io.to(socket.id).emit("allRoom", rooms);

    // Emit the room's complete data to the client
    io.to(socket.id).emit("roomData", rooms[roomId]);

    // update users to everyone in the room
    io.to(roomId).emit("roomUsers", rooms[roomId].users);

    //emit all messages
    io.to(roomId).emit("roomMessages", rooms[roomId].messages);
    //console.log(rooms[roomId].messages);

    //socket.data.userId = newUserId;
  });

  //Leave Room
  socket.on("leaveRoom", ({ roomId, userId }) => {
    //remove user from user data (same as disconnect)
    if (rooms[roomId]) {
      const userIndex = rooms[roomId].users.indexOf(userId);
      if (userIndex !== -1) {
        rooms[roomId].users.splice(userIndex, 1);
        //update user list
        io.to(roomId).emit("roomUsers", rooms[roomId].users);
      }
    }
    socket.leave(roomId[userId]);
    console.log("User left the room", userId);
  });

  // Store Messages
  socket.on("sendMessage", ({ roomId, userId, message }) => {
    console.log("message from", userId);
    const msgObj = {
      userId,
      message,
      timestamp: new Date().toISOString(),
    };

    // Store the message in the room's messages list
    if (rooms[roomId]) {
      rooms[roomId].messages.push(msgObj);
      // Broadcast the new message to all the users
      console.log("sending to", roomId);
      io.to(roomId).emit("newMessage", msgObj);
    }
  });

  // Handle disconnect for both the type of connection
  socket.on("disconnect", () => {
    //disconnect
    console.log("user disconnected", socket.id);

    const disconnectedUser = Object.keys(users).find(
      (key) => users[key] === socket.id
    );
    if (disconnectedUser) {
      delete users[disconnectedUser];
      console.log(`User disconnected: ${disconnectedUser}`);
    }

    // Remove user from any rooms
    for (const roomId in rooms) {
      const userIndex = rooms[roomId].users.indexOf(disconnectedUser);
      if (userIndex !== -1) {
        rooms[roomId].users.splice(userIndex, 1);
        io.to(roomId).emit("roomUsers", rooms[roomId].users);
        console.log(`Removed ${disconnectedUser} from room ${roomId}`);

        //Update user list front
      }
    }
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
