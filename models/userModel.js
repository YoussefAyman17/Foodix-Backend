const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "User name is required"],
    minlength: [3, "User name must be at least 3 characters"],
    maxlength: [20, "User name must be at most 20 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: "Invalid email format",
    },
  },

  passwordResetCode: String,
  passwordResetExpires: Date,
  passwordResetVerified: Boolean,

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [9, "password must be at least 9 characters"],
    maxlength: [20, "password must be at most 20 characters"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (val) {
        return /^(?:\+20|0)?1[0125]\d{8}$/.test(val);
      },
      message: "Please enter a valid Egyptian phone number",
    },
  },
  address: [
    {
      governorate: {
        type: String,
        required: [true, "governorate is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      street: {
        type: String,
        required: [true, "Street is required"],
      },
    },
  ],
});

UserSchema.pre("save", async function () {
  let salt = await bcrypt.genSalt(15);
  let hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
});

const userModel = mongoose.model("User", UserSchema);
module.exports = userModel;
