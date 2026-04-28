const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { handleDeliverySockets } = require("./sockets/SocketController");

const app = new express();
const dotenv = require("dotenv");

const errorHandler = require("./controllers/errorControllers");

dotenv.config();
const server = http.createServer(app);

mongoose
  .connect(
    "mongodb+srv://youssefayman8585_db_user:Ej62hK87nvNsyatE@cluster0.j2kq5ls.mongodb.net/",
  )
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log("error:", err.message);
  });
app.use(cors());
app.use(express.json());

let OrderRouter = require("./routes/orderRoutes");
let WorkerRouter = require("./routes/workerRoutes");

let UserRouter = require("./routes/userRoutes");
let ComplaintRouter = require("./routes/complaintRoutes");

app.use("/api/orders", OrderRouter);
app.use("/api/workers", WorkerRouter);
app.use("/api/users", UserRouter);
app.use("/api/complaints", ComplaintRouter);

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

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
