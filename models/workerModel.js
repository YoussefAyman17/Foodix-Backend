const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Worker must be linked to a user account"],
    },
    role: {
      type: String,
      required: true,
      enum: ["Chef", "Waiter", "Delivery", "Manager"],
      default: "Waiter",
    },
    salary: { type: Number, required: true },
    shift: {
      type: String,
      enum: ["Morning", "Evening"],
      default: "Morning",
    },
    deliveryDetails: {
      vehicleType: { type: String, enum: ["Motorcycle", "Bicycle"] },
      plateNumber: { type: String },
      isOnline: { type: Boolean, default: false },
      socketId: { type: String, default: null },
      currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Terminated"],
      default: "Active",
    },
  },
  { timestamps: true },
);

const Worker = mongoose.model("Worker", workerSchema);
module.exports = Worker;
