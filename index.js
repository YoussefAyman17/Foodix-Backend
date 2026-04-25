const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = new express();

app.use(cors());

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

let orderRoutes = require("./routes/ordersRoutes");
let workerRoutes = require("./routes/workersRoutes");

app.use("/api/orders", orderRoutes);
app.use("/api/worker", workerRoutes);
app.use((req, res) => {
  res.status(404).json({ message: req.url + "not found" });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
