const CustomError = require("./../utils/customError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  const error = new CustomError(message, 400);
  return error;
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
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
    let err = {
      ...error,
      name: error.name,
      code: error.code,
      errmsg: error.errmsg,
      errors: error.errors,
    };
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
