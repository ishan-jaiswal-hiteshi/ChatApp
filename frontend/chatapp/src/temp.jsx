import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [userId, setUserId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Register user when `userId` is set
    if (userId) {
      socket.emit("registerUser", userId);
    }

    // Listen for incoming messages
    socket.on("receiveMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Listen for unavailable user notification
    socket.on("userUnavailable", (unavailableUserId) => {
      alert(`User ${unavailableUserId} is not online.`);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userUnavailable");
    };
  }, [userId]);

  const sendMessage = () => {
    if (message && receiverId) {
      socket.emit("sendMessage", { senderId: userId, receiverId, message });
      setMessage("");
    } else {
      alert("Please provide a valid receiver ID and message.");
    }
  };

  return (
    <div>
      <h1>Direct Chat App</h1>

      {/* Set User ID */}
      {!userId ? (
        <div>
          <input
            type="text"
            placeholder="Enter Your User ID (e.g., User1)"
            onChange={(e) => setUserId(e.target.value)}
          />
          <button onClick={() => socket.emit("registerUser", userId)}>
            Register
          </button>
        </div>
      ) : (
        <h2>Your ID: {userId}</h2>
      )}

      {/* Receiver ID */}
      <input
        type="text"
        placeholder="Enter Receiver's User ID"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
      />

      {/* Message Input */}
      <input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>

      {/* Display Messages */}
      <h2>Messages:</h2>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderId}:</strong> {msg.message}
            <span style={{ fontSize: "0.8em", color: "gray" }}>
              {" "}
              ({msg.timestamp})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
