import { io } from "socket.io-client";
import { useEffect, useState } from "react";
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [roomId, setRoomId] = useState("");
  const [userId, setUserId] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [smessages, setsMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [singleMessage, setsingleMessage] = useState("");
  const [newUserID, setnewUserID] = useState("");
  const [roomName, setroomName] = useState("");

  useEffect(() => {
    //Listen for new User ID
    socket.on("getUserID", (newUserID) => {
      setUserId(newUserID);
      setnewUserID(newUserID);
      console.log(newUserID);
    });

    // Listen for updated room users and messages
    socket.on("roomUsers", (users) => {
      console.log(users);
      setRoomUsers(users);
    });

    //Broadcast new message to everyone
    socket.on("newMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    //Get compleate room data
    /**/ socket.on("roomData", (roomData) => {
      // Receive room data when the user joins the room
      console.log(roomData);
      setRoomUsers(roomData.users);
      setMessages(roomData.messages);
    });

    //Broadcast/Send new bessage to single user
    socket.on("receiveMessage", (msg) =>
      setsMessages((prev) => [...prev, msg])
    );

    return () => {
      socket.off("getUserID");
      socket.off("roomUsers");
      socket.off("newMessage");
      socket.off("roomData");
      socket.off("userDisconnected");
      socket.off("receiveMessage");
    };
  }, []);

  //Create user ID
  const registerUser = (name) => {
    socket.emit("createSingleUser", name);
  };

  //Join room
  const joinRoom = () => {
    if (roomId && userId) {
      setroomName(roomId);
      // Emit joinRoom event to the server
      socket.emit("joinRoom", { roomId, userId });
    }
  };

  //Single message
  const sendSingleMessage = () => {
    if (singleMessage && receiverId) {
      socket.emit("sendSingleMessage", {
        senderId: userId,
        receiverId,
        message: singleMessage,
      });
      setMessage("");
    }
  };

  //To Send Message
  const sendRoomMessage = () => {
    if (message) {
      // Emit sendMessage event to the server
      socket.emit("sendMessage", { roomId, userId, message });
      //To clear input field
      setMessage("");
    }
  };

  //Leave room
  const leaveRoom = () => {
    if (roomId) {
      socket.emit("leaveRoom", { roomId, userId });
      setroomName("");
      setRoomId("");
    }
  };

  return (
    <div>
      <h1>Chat App</h1>
      {newUserID ? <p>{userId}</p> : <></>}
      {/* Set User ID */}
      <div>
        {!newUserID ? (
          <div>
            <input
              type="text"
              placeholder="Enter Your User ID"
              onBlur={(e) => setUserId(e.target.value)}
            />
            <button onClick={() => registerUser(userId)}>Register</button>
          </div>
        ) : (
          <></>
        )}
      </div>
      {/* Receiver ID */}
      <h3>Direct Message</h3>
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
        value={singleMessage}
        onChange={(e) => setsingleMessage(e.target.value)}
      />
      <button onClick={sendSingleMessage}>Send</button>
      {/* Display Single messages */}
      <h2>Messages:</h2>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {smessages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderId}:</strong> {msg.message}
            <span style={{ fontSize: "0.8em", color: "gray" }}>
              ({msg.timestamp})
            </span>
          </div>
        ))}
      </div>
      {/* Room ID Input setroom iid in join room*/}
      <h3>Group Message</h3>
      {!roomName ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <button onClick={leaveRoom}>Leave Room</button>
        </div>
      )}

      {/* User ID Input 
      {!userId ? (
        <input
          type="text"
          placeholder="Enter Your User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      ) : (
        <p>Your ID: {userId}</p>
      )}
      */}

      {/* Display Room Users */}
      <h2>Users in Room:</h2>
      <ul>
        {roomUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      {/* Display ROOM Messages */}
      <h2>Group Chat:</h2>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.userId}:</strong> {msg.message}
            <span style={{ fontSize: "0.8em", color: "gray" }}>
              ({msg.timestamp})
            </span>
          </div>
        ))}
      </div>
      {/* Message Input */}
      <input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendRoomMessage}>Send</button>
    </div>
  );
}
export default App;
