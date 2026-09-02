const Meal = require("../models/mealModel");
const Category = require("../models/categoryModel");
const CustomError = require("../utils/customError");
const asyncHandler = require("../utils/asyncErrorHandler");
const slugify = require("slugify");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new CustomError("Not an image! Please upload only images.", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadMealPhoto = upload.single("photo");

exports.resizeMealPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const imageBuffer = await sharp(req.file.buffer)
    .resize(800, 800, {
      fit: "cover",
      position: "center",
      withoutEnlargement: true,
    })
    .toFormat("webp", { quality: 82 })
    .toBuffer();

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "foodix/meals",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(imageBuffer);
  });

  req.body.img = uploadResult.secure_url;
  req.body.imgCloudinaryId = uploadResult.public_id;
  next();
});

const createItem = asyncHandler(async (req, res, next) => {
  const categoryExists = await Category.findById(req.body.category);
  if (!categoryExists) {
    return next(
      new CustomError(
        "No category found with that ID. Meal creation failed.",
        404,
      ),
    );
  }
  const meal = await Meal.create(req.body);
  await meal.populate({
    path: "category",
    select: "name slug",
  });
  res.status(201).json({ status: "success", data: meal });
});

const getAllItems = async (req, res) => {
  try {
    let filter = {};

    if (req.params.slug) {
      const category = await Category.findOne({ slug: req.params.slug });

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      filter = { category: category._id };
    }

    const meals = await Meal.find(filter).populate("category");

    res.status(200).json({
      success: true,
      message: "Get All Meals success",
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Meal ID format, must be a number",
      });
    }
    const meal = await Meal.findOne({ itemId: id }).populate(
      "category",
      "name slug categoryId",
    );
    if (!meal) {
      return res
        .status(404)
        .json({ success: false, message: "Meal not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Get Meal By Id success", data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateItem = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) {
    return next(new CustomError("Meal not found", 404));
  }

  if (req.body.img && meal.imgCloudinaryId) {
    await cloudinary.uploader.destroy(meal.imgCloudinaryId);
  }

  const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  }).populate("category", "name slug");

  res.status(200).json({ status: "success", data: updatedMeal });
});

const deleteItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Meal ID format, must be a number",
      });
    }

    const meal = await Meal.findOneAndDelete({ itemId: id });
    if (!meal) {
      return res
        .status(404)
        .json({ success: false, message: "Meal not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Meal deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
