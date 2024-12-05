import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "*"],
    methods: ["GET", "POST"],
  },
});

const users = {}; // Map of userId -> socketId
const rooms = {}; // { roomId: { users: [], messages: [] } }

// API for testing
app.get("/test-api", (req, res) => {
  res.send("Hello World!");
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register single user
  socket.on("createSingleUser", (userId) => {
    const newUserId = `${userId}.${socket.id.slice(-5)}`;
    users[newUserId] = socket.id;

    // Send new user ID back
    io.to(socket.id).emit("getUserID", newUserId);
    console.log(`User registered: ${newUserId}`);
  });

  // Direct messaging
  socket.on("sendSingleMessage", ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      const msgObj = { senderId, message, timestamp: new Date().toISOString() };
      io.to(receiverSocketId).emit("receiveMessage", msgObj);
    } else {
      socket.emit("userUnavailable", receiverId);
    }
  });

  // Joining a room
  socket.on("joinRoom", ({ roomId, userId }) => {
    const newUserId = `${userId}.${socket.id.slice(-5)}`;
    socket.join(roomId);

    // Initialize room if not exists
    if (!rooms[roomId]) {
      rooms[roomId] = { users: [], messages: [] };
    }

    // Add user to the room
    if (!rooms[roomId].users.includes(newUserId)) {
      rooms[roomId].users.push(newUserId);
    }

    // Emit room data and users
    io.to(socket.id).emit("roomData", rooms[roomId]);
    io.to(roomId).emit("roomUsers", rooms[roomId].users);

    console.log(`${newUserId} joined room: ${roomId}`);
  });

  // Sending a room message
  socket.on("sendMessage", ({ roomId, userId, message }) => {
    const msgObj = { userId, message, timestamp: new Date().toISOString() };
    if (rooms[roomId]) {
      rooms[roomId].messages.push(msgObj);
      io.to(roomId).emit("newMessage", msgObj);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
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
      }
    }
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
/////////////////////////
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io("http://localhost:5000");

function App() {
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [directMessage, setDirectMessage] = useState("");

  useEffect(() => {
    socket.on("getUserID", (newUserId) => setUserId(newUserId));
    socket.on("roomUsers", (users) => setRoomUsers(users));
    socket.on("newMessage", (newMessage) =>
      setMessages((prev) => [...prev, newMessage])
    );
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("getUserID");
      socket.off("roomUsers");
      socket.off("newMessage");
      socket.off("receiveMessage");
    };
  }, []);

  const registerUser = (name) => {
    socket.emit("createSingleUser", name);
  };

  const joinRoom = () => {
    if (roomId) {
      socket.emit("joinRoom", { roomId, userId });
    }
  };

  const sendRoomMessage = () => {
    if (message) {
      socket.emit("sendMessage", { roomId, userId, message });
      setMessage("");
    }
  };

  const sendDirectMessage = () => {
    if (directMessage && receiverId) {
      socket.emit("sendSingleMessage", {
        senderId: userId,
        receiverId,
        message: directMessage,
      });
      setDirectMessage("");
    }
  };

  return (
    <div>
      {!userId ? (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            onBlur={(e) => registerUser(e.target.value)}
          />
        </div>
      ) : (
        <h2>Logged in as: {userId}</h2>
      )}

      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>

      <div>
        <h3>Room Messages</h3>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.userId}: {msg.message}
          </div>
        ))}
      </div>

      <input
        placeholder="Type room message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendRoomMessage}>Send</button>

      <input
        placeholder="Receiver ID"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
      />
      <input
        placeholder="Direct Message"
        value={directMessage}
        onChange={(e) => setDirectMessage(e.target.value)}
      />
      <button onClick={sendDirectMessage}>Send Direct</button>
    </div>
  );
}

export default App;
