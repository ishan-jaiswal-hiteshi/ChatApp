import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Sequelize, DataTypes } from "sequelize";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://192.168.100.249:5173"], // Frontend URL
    methods: ["GET", "POST"],
  })
);

// Initialize HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://192.168.100.249:5173"],
    methods: ["GET", "POST"],
  },
});

// Connect to PostgreSQL
const sequelize = new Sequelize(
  process.env.PG_NAME,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: process.env.PG_DIALECT,
  }
);

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
})();

// Define models
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  socketId: { type: DataTypes.STRING, allowNull: true },
});

const Room = sequelize.define("Room", {
  roomId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: true },
});

const RoomParticipant = sequelize.define("RoomParticipant", {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  roomId: { type: DataTypes.INTEGER, allowNull: false },
});

const Message = sequelize.define("Message", {
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: true },
  roomId: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

// Sync models with the database
sequelize.sync({ alter: true }).then(() => console.log("Tables synced"));

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// Register API
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (error) {
    res.status(400).json({ error: "Email already in use" });
  }
});

// Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token, userId: user.id, name: user.name });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Fetch previous conversations for dashboard
app.get("/dashboard", authenticateJWT, async (req, res) => {
  const { userId } = req.user;

  try {
    const messages = await Message.findAll({
      where: { senderId: userId },
      include: [Room, { model: User, as: "receiver" }],
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Socket.IO functionality
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Authenticate socket connection using JWT

  socket.on("authenticate", async ({ token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) throw new Error("Invalid user");

      user.socketId = socket.id;
      await user.save();

      socket.userId = user.id; // Associate userId with the socket
      socket.emit("authenticated", { userId: user.id, name: user.name });
      console.log(`Socket authenticated for user: ${user.email}`);
    } catch (error) {
      console.error("Authentication error:", error.message);
      socket.emit("authError", "Authentication failed. Please log in again.");
    }
  });

  // Create a room
  socket.on("createRoom", async ({ roomId, name }) => {
    try {
      const existingRoom = await Room.findOne({ where: { roomId } });
      if (existingRoom) {
        socket.emit("error", "Room ID already exists. Choose a different ID.");
        return;
      }

      const room = await Room.create({ roomId, name });
      socket.emit("roomCreated", { roomId, name });
      console.log(`Room created: ${roomId}`);
    } catch (error) {
      console.error("Room creation error:", error.message);
      socket.emit("error", "Failed to create room");
    }
  });

  // Join a room
  socket.on("joinRoom", async ({ roomId }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");

      const room = await Room.findOne({ where: { roomId } });
      if (!room) throw new Error("Room not found");

      const participant = await RoomParticipant.findOne({
        where: { userId: socket.userId, roomId: room.id },
      });

      if (!participant) {
        await RoomParticipant.create({
          roomId: room.id,
          userId: socket.userId,
        });
      }

      socket.join(roomId);
      const user = await User.findByPk(socket.userId);

      io.to(roomId).emit("userJoined", {
        userId: socket.userId,
        name: user.name,
      });
      console.log(`User ${socket.userId} joined room: ${roomId}`);
    } catch (error) {
      console.error("Join room error:", error.message);
      socket.emit("error", error.message || "Failed to join room");
    }
  });

  /**
   * Leave a room
   */
  socket.on("leaveRoom", async ({ roomId }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");

      const room = await Room.findOne({ where: { roomId } });
      if (!room) throw new Error("Room not found");

      await RoomParticipant.destroy({
        where: { userId: socket.userId, roomId: room.id },
      });

      socket.leave(roomId);

      const user = await User.findByPk(socket.userId);
      io.to(roomId).emit("userLeft", {
        userId: socket.userId,
        name: user.name,
      });

      console.log(`User ${socket.userId} left room: ${roomId}`);
    } catch (error) {
      console.error("Leave room error:", error.message);
      socket.emit("error", error.message || "Failed to leave room");
    }
  });

  /**
   * Add a participant to a room by email
   */
  socket.on("addParticipant", async ({ email, roomId }) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error("User not found");

      const room = await Room.findOne({ where: { roomId } });
      if (!room) throw new Error("Room not found");

      const existingParticipant = await RoomParticipant.findOne({
        where: { userId: user.id, roomId: room.id },
      });

      if (existingParticipant) {
        socket.emit("error", "User is already in the room");
        return;
      }

      await RoomParticipant.create({ userId: user.id, roomId: room.id });

      io.to(roomId).emit("userJoined", {
        userId: user.id,
        name: user.name,
      });

      console.log(`${user.email} added to room ${roomId}`);
    } catch (error) {
      console.error("Add participant error:", error.message);
      socket.emit("error", error.message || "Failed to add participant");
    }
  });

  /**
   * Send a message in a room
   */
  socket.on("sendMessage", async ({ roomId, content }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");

      const room = await Room.findOne({ where: { roomId } });
      if (!room) throw new Error("Room not found");

      const message = await Message.create({
        senderId: socket.userId,
        roomId: room.id,
        content,
      });

      const user = await User.findByPk(socket.userId);
      io.to(roomId).emit("newMessage", {
        userId: socket.userId,
        name: user.name,
        content: message.content,
        timestamp: message.timestamp,
      });

      console.log(`Message sent in room ${roomId}: ${content}`);
    } catch (error) {
      console.error("Send message error:", error.message);
      socket.emit("error", error.message || "Failed to send message");
    }
  });

  /**
   * Fetch message history of a room
   */
  socket.on("getRoomMessages", async ({ roomId }) => {
    try {
      const room = await Room.findOne({ where: { roomId } });
      if (!room) throw new Error("Room not found");

      const messages = await Message.findAll({
        where: { roomId: room.id },
        order: [["timestamp", "ASC"]],
      });

      socket.emit("roomMessages", messages);
      console.log(`Fetched messages for room: ${roomId}`);
    } catch (error) {
      console.error("Get messages error:", error.message);
      socket.emit("error", error.message || "Failed to fetch messages");
    }
  });

  /**
   * Direct message to a user by email
   */
  socket.on("sendDirectMessage", async ({ receiverEmail, content }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");

      const receiver = await User.findOne({ where: { email: receiverEmail } });
      if (!receiver) throw new Error("Recipient not found");

      const message = await Message.create({
        senderId: socket.userId,
        receiverId: receiver.id,
        content,
      });

      if (receiver.socketId) {
        io.to(receiver.socketId).emit("newDirectMessage", {
          senderId: socket.userId,
          content: message.content,
          timestamp: message.timestamp,
        });
      }

      console.log(`Direct message sent to ${receiverEmail}: ${content}`);
    } catch (error) {
      console.error("Send direct message error:", error.message);
      socket.emit("error", error.message || "Failed to send direct message");
    }
  });

  /**
   * Handle disconnection
   */
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

// Start the server
const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
===============================
if (userSocket) {
  userSocket.join(roomId);
}