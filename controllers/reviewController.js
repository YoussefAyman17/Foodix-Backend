const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ApiFeatures = require('../Utils/apiFeatures');
const CustomError = require("../Utils/customError");
const Review = require("../models/reviewModel");

const Order = require("../models/orderModel");

exports.createReview = asyncErrorHandler(async (req, res, next) => {
  if (!req.body.meal) req.body.meal = req.params.mealId;
  if (!req.body.user) req.body.user = req.user.id;

  const order = await Order.findOne({
    userId: req.user.id,
    "orderItems.foodItem": req.params.mealId,
    status: "Delivered",
  });
  if (!order)
    return next(
      new CustomError("You can only review a meal that you have ordered", 403),
    );

  const review = await Review.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      data: review,
    },
  });
});

exports.getAllReviews = asyncErrorHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.mealId) filter = { meal: req.params.mealId };
  const documentsCount = await Review.countDocuments(filter);
  const features = new ApiFeatures(Review.find(filter), req.query)
    .filter()
    .search("Review")  
    .sort()
    .limitFields()
    .paginate(documentsCount);

    const reviews = await features.mongooseQuery;

  res.status(200).json({
    status: "success",
    results: reviews.length,
    paginationResult: features.paginationResult,      
    data:  reviews,
  });
});

exports.getReview = asyncErrorHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new CustomError("No review found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: review,
    },
  });
});

exports.updateReview = asyncErrorHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!review) {
    return next(new CustomError("No review found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: review,
    },
  });
});

exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new CustomError("No review found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
