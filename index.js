const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = new express();
const dotenv=require('dotenv')

const errorHandler=require('./Controller/errorController');

dotenv.config();


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

let orderRoutes = require("./routes/ordersRoutes");
let workerRoutes = require("./routes/workersRoutes");

let UserRouter=require('./Routes/User');
let ComplaintRouter=require('./Routes/Complaint')

app.use("/api/orders", orderRoutes);
app.use("/api/worker", workerRoutes);
app.use('/api/user',UserRouter)
app.use('/api/complaint',ComplaintRouter)

app.use((req, res) => {
  res.status(404).json({ message: req.url + "not found" });
});

app.use(errorHandler)


app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
