const Meal = require("../models/mealModel");
const Category = require("../models/categoryModel");
const CustomError = require("../utils/customError");
const ApiFeatures = require("../utils/apiFeatures");
const asyncHandler = require("../utils/asyncErrorHandler");
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

exports.createItem = asyncHandler(async (req, res, next) => {
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

exports.getAllItems = asyncHandler(async (req, res, next) => {
  let filterObj = {};
  if (req.query.categorySlug) {
    const category = await Category.findOne({ slug: req.query.categorySlug });
    if (!category) {
      return next(new CustomError("No category found with that slug.", 404));
    }
    filterObj.category = category._id;
  }

  const documentsCount = await Meal.countDocuments(filterObj);

  const features = new ApiFeatures(Meal.find(filterObj), req.query)
    .filter()
    .search("Meals")
    .sort()
    .limitFields()
    .paginate(documentsCount);

  const meals = await features.mongooseQuery.populate({
    path: "category",
    select: "name slug",
  });

  res.status(200).json({
    status: "success",
    results: meals.length,
    pagination: features.paginationResult,
    data: meals,
  });
});

exports.getItemById = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate(
    "category",
    "name slug",
  );
  if (!meal) {
    return next(new CustomError("Meal not found", 404));
  }
  res.status(200).json({ status: "success", data: meal });
});

exports.updateItem = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) {
    return next(new CustomError("Meal not found", 404));
  }

  if (req.body.img && meal.imgCloudinaryId) {
    try {
      await cloudinary.uploader.destroy(meal.imgCloudinaryId);
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  }

  const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  }).populate("category", "name slug");

  res.status(200).json({ status: "success", data: updatedMeal });
});

exports.deleteItem = asyncHandler(async (req, res) => {
  const meal = await Meal.findOneAndDelete(req.params.id);
  if (!meal) {
    return next(new CustomError("Meal not found", 404));
  }

  if (meal.imgCloudinaryId) {
    try {
      await cloudinary.uploader.destroy(meal.imgCloudinaryId);
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  }

  res.status(204).json({ status: "success", data: null });
});
