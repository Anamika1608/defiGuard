const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const web3Routes = require("./routes/web3"); // New Web3 routes
const app = express();
const fs = require('fs');
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

// MongoDB connection (uncomment when ready to use)
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/web3", web3Routes); // New Web3 API endpoints

const server = app.listen(process.env.PORT || 3003, () => {
  console.log(`Server started on ${process.env.PORT || 3003}`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
  
  // Web3 events
  socket.on("transaction-sent", (data) => {
    // Broadcast transaction to all connected users or specific users
    socket.broadcast.emit("new-transaction", {
      hash: data.transactionHash,
      from: data.from,
      to: data.to,
      amount: data.amount,
      timestamp: new Date().toISOString()
    });
  });
});