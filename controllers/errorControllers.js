const CustomError = require("./../utils/customError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  const error = new CustomError(message, 400);
  return error;
};
const handleDuplicateFieldsDB = (err) => {
  let field = "field";
  let value = "";

  if (err.keyValue) {
    field = Object.keys(err.keyValue)[0];
    value = Object.values(err.keyValue)[0];
  } else if (err.errmsg) {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);
    value = match ? match[0].replace(/"/g, "") : "";
  }

  if (field === "email") {
    return new CustomError(
      "An account with this email address already exists. Please use another email or log in.",
      400,
    );
  }

  const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
  const message = `${formattedField} "${value}" is already taken. Please use another value!`;

  return new CustomError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new CustomError(message, 400);
};

const handleJWTError = () => {
  return new CustomError("Invalid Token. Please login again!", 401);
};
const handleJWTExpiredError = () => {
  return new CustomError("Your token has expired! Please log in again.", 401);
};

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.statusCode,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.error("ERROR 💥", err);
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  if (process.env.NODE_ENV == "development") {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV == "production") {
    let err = Object.create(error);
    err.message = error.message;
    err.name = error.name;
    err.code = error.code;
    err.path = error.path;
    err.value = error.value;
    err.errmsg = error.errmsg;
    err.keyValue = error.keyValue;
    err.errors = error.errors;
    if (err.name === "CastError") {
      err = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    }
    if (err.name === "ValidationError") {
      err = handleValidationErrorDB(err);
    }
    if (err.name === "JsonWebTokenError") {
      err = handleJWTError();
    }
    if (err.name === "TokenExpiredError") {
      err = handleJWTExpiredError();
    }

    sendErrorProd(err, req, res);
  }
};
