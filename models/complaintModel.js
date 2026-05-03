const mongoose = require("mongoose");
const validator = require("validator");

const ComplaintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      minlength: [3, "User name must be at least 3 characters"],
      maxlength: [20, "User name must be at most 20 characters"],
    },
    email: {
      type: String,
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
      required: [true, "Subject is required"],
    },
    service: {
      type: String,
      required: [true, "Service is required"],
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [500, "Message must be at most 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in process", "resolved"],
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ComplaintModel = mongoose.model("Complaint", ComplaintSchema);
module.exports = ComplaintModel;
