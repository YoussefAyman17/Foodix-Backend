const jwt = require("jsonwebtoken");
const util = require("util");

const asyncHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");
const User = require("../models/userModel");

exports.auth = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new CustomError("You Must Login First", 401));
  }
  let decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new CustomError(
        "The user belonging to this token is no longer exist.",
        401,
      ),
    );
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new CustomError(
        "User recently changed password! please login again",
        401,
      ),
    );
  }

  user.role = decoded.role;

  req.user = user;
  next();
});

exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  try {
    let decoded = await util.promisify(jwt.verify)(
      authorization,
      process.env.SECRET,
    );

    req.user = {
      id: decoded.id,
      role: decoded.role,
      workerId: decoded.workerId,
    };
  } catch (error) {
    console.log("Invalid token in optional auth");
  }

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError("You don't have permission to do this!!!", 403),
      );
    }

    next();
  };
};
