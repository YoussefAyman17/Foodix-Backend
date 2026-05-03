const mongoose = require("mongoose");
const validator = require("validator");

const ComplaintSchema = new mongoose.Schema(
  {
    id:{
      type:String,
      trim:true,
      require:[true, "Id is required"],
      unique:[true,"Id must be unique"],
      maxlength:[15,"User name must be at most 15 characters"]
    },
    name: {
      type: String,
      trim:true,
      required: [true, "User name is required"],
      minlength: [3, "User name must be at least 3 characters"],
      maxlength: [20, "User name must be at most 20 characters"],
    },
    email: {
      type: String,
      trim:true,
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
      trim:true,
      required: [true, "Subject is required"],
       maxlength: [20, "subject must be at most 20 characters"]
    },
    service: {
      type: String,
      trim:true,
      required: [true, "Service is required"],
      maxlength: [20, "Service must be at most 20 characters"],
      enum:['Delivery','Food Quality','Payment','Issue','App Bug','Other']
    },
    message: {
      type: String,
      trim:true,
      required: [true, "Message content is required"],
      maxlength: [500, "Message must be at most 500 characters"],
    },
    status: {
      type: String,
      trim:true,
      enum: ["pending", "in process", "resolved"],
      default: "pending",
    },
    adminResponse:{
      type:String,
      trim:true,
      maxlength: [20, "Response message must be at most 500 characters"],
      default:""
      
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  {
    timestamps: true,
  },{ _id: false });

const ComplaintModel = mongoose.model("Complaint", ComplaintSchema);
module.exports = ComplaintModel;
