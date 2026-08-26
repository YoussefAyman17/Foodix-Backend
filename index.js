const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const path = require("path");

const orderRouter = require("./routes/orderRoutes");
const workerRouter = require("./routes/workerRoutes");
const userRouter = require("./routes/userRoutes");
const complaintRouter = require("./routes/complaintRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const mealRouter = require("./routes/mealRoutes");
const { handleDeliverySockets } = require("./sockets/SocketController");
const { stripeWebhook } = require("./controllers/orderControllers");
const errorHandler = require("./controllers/errorControllers");

const app = express();
const server = http.createServer(app);

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: "./config.env" });  
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log("error:", err.message);
  });



app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/workers", workerRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/meals", mealRouter);

app.use((req, res) => {
  res.status(404).json({ message: req.url + "not found" });
});

app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("socketio", io);

handleDeliverySockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server is running on port 3000");
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
