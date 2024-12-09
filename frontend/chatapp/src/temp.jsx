import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import "./App.css";

const socket = socketIOClient("http://localhost:5000");

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomMessages, setRoomMessages] = useState([]);
  const [directMessage, setDirectMessage] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    socket.on("userRegistered", (user) => {
      setUserId(user.userId);
      setIsLoggedIn(true);
      console.log("User registered:", user);
    });

    socket.on("userLoggedIn", (user) => {
      setUserId(user.userId);
      setIsLoggedIn(true);
      console.log("User logged in:", user);
    });

    socket.on("roomUsers", (users) => {
      setRoomUsers(users);
    });

    socket.on("newMessage", (msg) => {
      setRoomMessages((prevMessages) => [
        ...prevMessages,
        { senderId: msg.userId, content: msg.content },
      ]);
    });

    socket.on("newDirectMessage", (msg) => {
      alert(`New direct message from ${msg.senderId}: ${msg.content}`);
    });

    socket.on("error", (msg) => {
      alert(msg);
    });
  }, []);

  const handleRegister = () => {
    socket.emit("registerUser", { name, email });
  };

  const handleLogin = () => {
    socket.emit("loginUser", { email });
  };

  const handleJoinRoom = () => {
    if (userId) {
      socket.emit("joinRoom", { roomId, userId });
    }
  };

  const handleSendMessage = () => {
    if (message && roomId) {
      socket.emit("sendMessage", { userId, roomId, content: message });
      setMessage("");
    }
  };

  const handleSendDirectMessage = () => {
    if (directMessage && receiverEmail) {
      socket.emit("sendDirectMessage", {
        senderId: userId,
        receiverEmail,
        content: directMessage,
      });
      setDirectMessage("");
    }
  };

  const handleLeaveRoom = () => {
    if (userId && roomId) {
      socket.emit("leaveRoom", { roomId, userId });
    }
  };

  return (
    <div className="App">
      <h1>Socket Chat</h1>
      {!isLoggedIn ? (
        <div>
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleRegister}>Register</button>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <h2>Welcome {name}</h2>
          <h3>Join Room</h3>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
          <button onClick={handleLeaveRoom}>Leave Room</button>

          <h3>Room Messages</h3>
          <div>
            {roomMessages.map((msg, idx) => (
              <div key={idx}>
                <strong>{msg.senderId}: </strong>
                {msg.content}
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send Message</button>

          <h3>Send Direct Message</h3>
          <input
            type="email"
            placeholder="Receiver's Email"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Message"
            value={directMessage}
            onChange={(e) => setDirectMessage(e.target.value)}
          />
          <button onClick={handleSendDirectMessage}>Send Direct Message</button>

          <h3>Room Users</h3>
          <ul>
            {roomUsers.map((userId, idx) => (
              <li key={idx}>{userId}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
