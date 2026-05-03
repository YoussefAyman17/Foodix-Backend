const userModel = require("../models/userModel");
const WorkerModel = require("../models/workerModel");
const asyncHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// create user
let signUP = asyncHandler(async (req, res, next) => {
  let {userName,email,password,repeatPassword} = req.body;
  if(password!==repeatPassword){
     return next(customError("Passwords do not match",400))
  }
  let user = await userModel.create({userName,email,password});
  res.status(200).json({ message: "User Created", Data: user });
});

// login
let login = asyncHandler(async (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return next(new customError("You Must Provide Email or Password", 400));
  }

  let user = await userModel.findOne({ email });
  if (!user) {
    return next(new customError("User Not Found"), 404);
  }

  let valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return next(new customError("Invalid Email Or Password", 401));
  }

  const workerDetails = await WorkerModel.findOne({ userId: user._id });

  const userRole = workerDetails ? workerDetails.role : "customer";

  let token = jwt.sign(
    { id: user._id, email: user.email, role: userRole },
    process.env.SECRET,
  );
  return res.status(200).json({
    message: "Login successful",
    token,
  });
});

// forget Password
let forgetPassword = asyncHandler(async (req, res, next) => {
  let { email } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    return next(new customError("User Not Found", 404));
  }

  let resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  let hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  await userModel.updateOne(
    { email },
    {
      passwordResetCode: hashedResetCode,
      passwordResetExpires: Date.now() + 10 * 60 * 1000,
      passwordResetVerified: false,
    },
  );

  const message = `
    Hi ${user.userName} , 
    We received a request to reset the password on your FoodIX Account.
    ${resetCode} Enter this code to complete the reset.
    Thanks for helping us keep your account secure.
    The FoodIX Team `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min )",
      message: message,
    });
  } catch (error) {
    await userModel.updateOne(
      { email },
      {
        passwordResetCode: undefined,
        passwordResetExpires: undefined,
        passwordResetVerified: undefined,
      },
    );
    return next(new customError("There is an error in sending email", 500));
  }

  res.status(200).json({ message: "Reset Code Send To Email" });
});

//verify Reset Code
let verifyResetCode = asyncHandler(async (req, res, next) => {
  let { resetCode } = req.body;

  let hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  let user = await userModel.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new customError("Reset Code Invalid Or Expired", 400));
  }

  await userModel.updateOne(
    { _id: user._id },
    {
      passwordResetVerified: true,
    },
  );

  res.status(200).json({
    status: "Success",
  });
});

// reset Password
let resetPassword = asyncHandler(async (req, res, next) => {
  let { email, newPassword } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) {
    return next(new customError("User Not Found", 404));
  }

  if (user.passwordResetVerified !== true) {
    return next(new customError("Reset Code Not Verified", 400));
  }

  user.password = newPassword;

  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();
  const workerDetails = await WorkerModel.findOne({ user: user._id });
  const userRole = workerDetails ? workerDetails.role : "customer";
  let token = jwt.sign(
    { id: user._id, email: user.email, role: userRole },
    process.env.SECRET,
  );

  return res.status(200).json({
    status: "Success",
    message: "Password updated successfully",
    token,
  });
});

// update password
let updatePassword = asyncHandler(async (req, res, next) => {
  let { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(
      new customError("You Must Provide Current And New Password", 400),
    );
  }
  user = await userModel.findById(req.user.id);

  let valid = await bcrypt.compare(currentPassword, user.password);

  if (!valid) {
    return next(new customError("Invalid Current Password", 401));
  }
  let IssamePassword = await bcrypt.compare(newPassword, user.password);
  if (IssamePassword) {
    return next(new customError("New Password Must Be Different", 400));
  }
  user.password = newPassword;
  await user.save();

  const workerDetails = await WorkerModel.findOne({ user: user._id });
  const userRole = workerDetails ? workerDetails.role : "customer";

  let token = jwt.sign(
    { id: user._id, email: user.email, role: userRole },
    process.env.SECRET,
  );
  return res.status(200).json({
    message: "password updated successfully",
    token,
  });
});

// get all users
let getAllUsers = asyncHandler(async (req, res, next) => {
  let users = await userModel.find();
  res.json(users);
});

// get user by id
let getUserById = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let user = await userModel.findById(id);

  if (user) {
    res.status(200).json({ Data: user });
  } else {
    next(new customError("User Not Found", 404));
  }
});

// edit user
let editUserById = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let user = await userModel.findByIdAndUpdate(id);
  if (user) {
    res.status(200).json({ message: "User Updated Succesfully", Data: user });
  } else {
    next(new customError("User Not Found", 404));
  }
});

// delete user
let deleteUserById = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let user = await userModel.findByIdAndDelete(id);
  if (user) {
    res
      .status(200)
      .json({ message: "User deleted Succesfully", DeletedId: id });
  } else {
    next(new customError("User Not Found", 404));
  }
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const currentUser = await userModel.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: currentUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    if (req.body.password) {
      return res.status(400).json({
        message:
          "This route is not for password updates. Please use /updateMyPassword.",
      });
    }

    const filteredBody = filterObj(
      req.body,
      "userName",
      "email",
      "phone",
      "address",
    );

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Your profile has been updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "This email is already in use" });
    }
    res.status(500).json({ error: error.message });
  }
};

//
module.exports = {
  deleteUserById,
  editUserById,
  getUserById,
  getAllUsers,
  login,
  signUP,
  updatePassword,
  forgetPassword,
  verifyResetCode,
  resetPassword,
  getMe,
  updateMe,
};
