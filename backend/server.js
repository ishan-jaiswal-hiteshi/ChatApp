import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { Sequelize, DataTypes, Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Randomstring from "randomstring";

//dotenv
dotenv.config();

//Express app and cors
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["*", "http://192.168.100.249:5173"],
    methods: ["GET", "POST", "*"],
  })
);

const server = createServer(app);
//Combine Http and Express with Socket
const io = new Server(server, {
  cors: {
    origin: ["*", "http://192.168.100.249:5173"],
    methods: ["GET", "POST", "*"],
  },
});

//Setup PG Connection
const sequelize = new Sequelize({
  database: process.env.PG_NAME,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  dialect: process.env.PG_DIALECT, // Explicitly specify 'postgres'
  logging: false, // Disable logging for production, enable for debugging if needed
  pool: {
    max: 10, // Maximum number of connections
    min: 0, // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to wait for a connection
    idle: 10000, // Time (ms) before a connection is released
  },
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to the PostgreSQL");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

/**/ //const rooms = {}; // { roomId : { users: [], messages: [] } }
/**/ //const users = {}; // Map of userId : socketId

//test api
app.get("/test-api", (req, res) => {
  res.send("Hello World!");
});

//Defining Models
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  socketId: { type: DataTypes.STRING, allowNull: true },
});

const Room = sequelize.define("Room", {
  roomId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: true },
});

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

const Message = sequelize.define("Message", {
  senderId: { type: DataTypes.STRING, allowNull: false },
  receiverId: { type: DataTypes.STRING, allowNull: true },
  roomId: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

//Defining Association/Relations between tables
User.hasMany(RoomParticipant, { foreignKey: "userId" });
RoomParticipant.belongsTo(User, { foreignKey: "userId" });

Room.hasMany(RoomParticipant, { foreignKey: "roomId" });
RoomParticipant.belongsTo(Room, { foreignKey: "roomId" });

// Sync models with database
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Tables created successfully!");
  })
  .catch((error) => {
    console.error("Error creating tables: ", error);
  });

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

// Register user
app.post("/registerUser", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const generatedId = `${name}-${Randomstring.generate(7)}`;
      let check_userId = await User.findOne({ where: { userId: generatedId } });
      if (check_userId) {
        generatedId = `${name}.${Math.random(0, 999999)}`;
      }
      user = await User.create({
        name,
        userId: generatedId,
        email,
        password: hashedPassword,
      });
    }

    // Fetch the updated user list
    const usersList = await User.findAll({
      attributes: ["userId", "name", "email"],
    });
    io.emit("allRegUsers", { usersList });

    res.status(200).json({
      userId: user.userId,
      name: user.name,
      email: user.email,
    });
    console.log(`User registered: ${user.userId} ${name} (${email})`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
app.post("/loginUser", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ error: "User not found. Please register." });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      userId: user.userId,
      name: user.name,
      email: user.email,
    });
    console.log(`User logged in: ${user.userId} ${user.name}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

//Get all registered users list
app.get("/getAllRegUsers", async (req, res) => {
  try {
    const usersList = await User.findAll({
      attributes: ["userId", "name", "email"], // Only select necessary fields
    });

    return res.status(200).json({
      success: true,
      users: usersList,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registered users",
    });
  }
});

//Get all joinned rooms
app.post("/getAllJoinedRooms", async (req, res) => {
  // Get all rooms the current user is part of
  const { userId } = req.body;
  console.log("sent all joined rooms for", userId);
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Find all room IDs the user is part of
    const participantRecords = await RoomParticipant.findAll({
      where: { userId },
      attributes: ["roomId"],
    });

    // Extract room IDs from the participant records
    const roomIds = participantRecords.map((record) => record.roomId);

    if (roomIds.length === 0) {
      //Not part of any rooom
      return res.status(200).json({ rooms: [] });
    }

    // Fetch details of all rooms
    const rooms = await Room.findAll({
      where: { roomId: roomIds },
      attributes: ["roomId", "name"],
    });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error fetching user rooms:", error.message);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// POST API: Get previous messages
app.post("/getPreviousMessages", async (req, res) => {
  const { roomId, senderId, receiverId } = req.body;
  console.log("sent previous message ----", roomId, senderId, receiverId);

  try {
    let messages = [];

    // Fetch messages for a room
    if (roomId) {
      const room = await Room.findOne({ where: { roomId } });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Fetch all messages in the room in ASCENDING order (oldest to newest)
      messages = await Message.findAll({
        where: { roomId },
        order: [["timestamp", "ASC"]], // ASC to get the first message (oldest first)
      });
      console.log(`Fetched messages for room: ${roomId}`);
    } else if (senderId && receiverId) {
      // Fetch messages for a personal chat
      console.log(
        "sent previous message to direct chat ================",
        roomId,
        senderId,
        receiverId
      );

      messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
        order: [["timestamp", "ASC"]], // ASC to get the first message (oldest first)
      });
      console.log(
        `Fetched personal messages between sender: ${senderId} and receiver: ${receiverId}`
      );
    } else {
      return res
        .status(400)
        .json({ error: "Room id or Sender and receiver id is invalid" });
    }

    // Return messages in the response
    return res.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch messages" });
  }
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

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

  /*
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
 */

  // Add participant by email
  socket.on("inviteToRoom", async ({ userId, email, roomId }) => {
    let user = null;

    //Add participant either by email or userId
    try {
      if (!Array.isArray(users) || users.length === 0) {
        socket.emit("error", "No users provided to add to the room");
        return;
      }

      // To keep track of results
      const addedUsers = [];
      const failedUsers = [];

      for (const { userId, email } of users) {
        try {
          // Find user by email if userId is not provided
          if (!userId) {
            user = await User.findOne({ where: { email } });
            if (!user) {
              failedUsers.push({ userId, email, reason: "User not found" });
              continue;
            }
          }

          const resolvedUserId = userId || user.userId;

          // Check if the user is already a participant
          const existingParticipant = await RoomParticipant.findOne({
            where: { userId: resolvedUserId, roomId },
          });
          if (existingParticipant) {
            failedUsers.push({
              userId: resolvedUserId,
              email,
              reason: "Already in the room",
            });
            continue;
          }

          // Add the user to the room
          await RoomParticipant.create({
            userId: resolvedUserId,
            roomId,
          });
          addedUsers.push({ userId: resolvedUserId, email });
        } catch (err) {
          failedUsers.push({ userId, email, reason: "Error adding user" });
          console.error(`Failed to add user (${userId || email}) to room`, err);
        }
      }

      // Fetch the updated list of rooms for the user
      const userRooms = await RoomParticipant.findAll({ where: { userId } });
      const rooms = await Room.findAll({
        where: { id: userRooms.map((ur) => ur.roomId) },
        attributes: ["roomId", "name"],
      });
      //Update List
      socket.emit("joinedRooms", { rooms });

      // Notify all participants in the room
      const participants = await RoomParticipant.findAll({
        where: { roomId },
      });
      io.to(roomId).emit(
        "roomUsers",
        participants.map((p) => p.userId)
      );

      // Notify the user that they have been added to the room
      socket.emit("inviteResults", { addedUsers, failedUsers });
      console.log(`${(userId, email)} added to room ${roomId}`);
    } catch (error) {
      console.error(error);
      socket.emit("error", "Failed to add participant");
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

  //Get previous messages
  socket.on("getPreviousMessages", async ({ roomId, senderId, receiverId }) => {
    console.log("sent previous message", roomId, senderId, receiverId);
    try {
      let messages = [];

      // Fetch messages for a room
      if (roomId) {
        const room = await Room.findOne({ where: { roomId } });
        if (!room) {
          socket.emit("error", "Room not found");
        }
        messages = await Message.findAll({
          where: { roomId },
          order: [["timestamp", "ASC"]],
        });
        console.log(`Fetched messages for room: ${roomId}`);
      } else if (senderId && receiverId) {
        // Fetch messages for a personal chat
        console.log(
          "sent previous message to direct chat",
          roomId,
          senderId,
          receiverId
        );

        messages = await Message.findAll({
          where: {
            [Op.or]: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          },
          order: [["timestamp", "ASC"]],
        });
        console.log(
          `Fetched personal messages between sender: ${senderId} and receiver: ${receiverId}`
        );
      } else {
        socket.emit("error", "Room id or Sender and reciver id is invalid");
      }

      socket.emit("messages", messages);
    } catch (error) {
      console.error("Get messages error:", error.message);
      socket.emit("error", error.message || "Failed to fetch messages");
    }
  });

  // Send message in room
  socket.on("sendRoomMessage", async ({ senderId, roomId, content }) => {
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

  // Handle user disconnect
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
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
