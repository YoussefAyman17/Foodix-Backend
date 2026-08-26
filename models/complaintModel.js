const mongoose = require("mongoose");
const validator = require("validator");
const autoIncrement = require("../utils/autoIncrement");

const ComplaintSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
      required: [true, "User name is required"],
      minlength: [3, "User name must be at least 3 characters"],
      maxlength: [20, "User name must be at most 20 characters"],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required"],

      validate: {
        validator: function (value) {
          return validator.isEmail(value);
        },
        message: "Invalid email format",
      },
    },
    subject: {
      type: String,
      trim: true,
      required: [true, "Subject is required"],
      maxlength: [100, "subject must be at most 100 characters"],
    },
    service: {
      type: String,
      trim: true,
      required: [true, "Service is required"],
      maxlength: [20, "Service must be at most 20 characters"],
      enum: ["Delivery", "Food Quality", "Payment Issue", "App Bug", "Other"],
    },
    message: {
      type: String,
      trim: true,
      required: [true, "Message content is required"],
      maxlength: [500, "Message must be at most 500 characters"],
    },
    status: {
      type: String,
      trim: true,
      enum: ["pending", "in process", "resolved","rejected"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [500, "Response message must be at most 500 characters"],
      default: "",
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  {
    timestamps: true,
  },
);
autoIncrement(ComplaintSchema, {
  id: "complaint_counter",
  inc_field: "id",
  start_seq: 1,
});

const ComplaintModel = mongoose.model("Complaint", ComplaintSchema);
module.exports = ComplaintModel;
