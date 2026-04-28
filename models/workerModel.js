const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Worker must be linked to a user account"],
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Chef", "Waiter", "Delivery", "Manager"],
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
    hireDate: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: [0.0, "Rating cannot be less than 0"],
      max: [5.0, "Rating cannot be more than 5"],
      default: 0.0,
    },
  },
  { timestamps: true },
);

const Worker = mongoose.model("Worker", workerSchema);
module.exports = Worker;
