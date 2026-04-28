const jwt = require("jsonwebtoken");
const util = require("util");

const asyncHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");

const auth = asyncHandler(async (req, res, next) => {
  let { authorization } = req.headers;

  if (!authorization) {
    return next(new customError("You Must Login First", 401));
  }
  let decoded = await util.promisify(jwt.verify)(
    authorization,
    process.env.SECRET,
  );
  req.user = { id: decoded.id, role: decoded.role };
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({
        status: "error",
        message: "you do not have permission to do this action ",
      });
    }
    next();
  };
};
// const restrictTo=(...roles)=>{};

module.exports = { auth, restrictTo };
