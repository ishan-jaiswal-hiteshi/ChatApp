import express from "express";
import Room from "../models/rooms_Model.js";
import Message from "../models/messages_Model.js";

const router = express.Router();

//Get all registered users list
router.get("/getAllRegUsers", async (req, res) => {
  try {
    const usersList = await User.findAll({
      attributes: ["userId", "name", "email"],
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
router.post("/getAllJoinedRooms", async (req, res) => {
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
router.post("/getPreviousMessages", async (req, res) => {
  const { roomId, senderId, receiverId } = req.body;
  console.log("sent previous message", roomId, senderId, receiverId);

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

export default router;
