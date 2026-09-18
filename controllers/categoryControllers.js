const Category = require("../models/categoryModel");
const asyncHandler = require('../utils/asyncErrorHandler');
const ApiFeatures = require('../Utils/apiFeatures');
const CustomError = require("../Utils/customError");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("../utils/cloudinary");

// console.log(cloudinary);
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  console.log("Uploaded file MIME type is:", file.mimetype);
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

exports.uploadCategoryPhoto = upload.single("image");

exports.resizeCategoryPhoto = asyncHandler(async (req, res, next) => {
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
        folder: "foodix/categories",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(imageBuffer);
  });

  req.body.image = uploadResult.secure_url;
  req.body.imgCloudinaryId = uploadResult.public_id;
  next();
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: category,
  });
});

exports.getAllCategories = asyncErrorHandler(async (req, res, next) => {
   const documentsCount = await Category.countDocuments();

   const features = new ApiFeatures(Category.find(), req.query)
    .filter()
    .search("Category")
    .sort()
    .limitFields()
    .paginate(documentsCount);

    const categories = await features.mongooseQuery;

  res.status(200).json({
    status: "success",
    results: categories.length,
    paginationResult: features.paginationResult,   
    data: categories,
  });
});

exports.getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new CustomError("Category not found", 404));
  }

  res.status(200).json({ status: "success", data: category });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  // if (req.body.name) {
  //   req.body.slug = slugify(req.body.name, { lower: true, strict: true });
  // }
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new CustomError("Category not found", 404));
  }
  if (req.body.image && category.imgCloudinaryId) {
    try {
      await cloudinary.uploader.destroy(category.imgCloudinaryId);
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  }
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: updatedCategory,
  });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new CustomError("Category not found", 404));
  }

  if (category.imgCloudinaryId) {
    try {
      await cloudinary.uploader.destroy(category.imgCloudinaryId);
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  }

  res.status(204).json({ status: "success", data: null });
});
