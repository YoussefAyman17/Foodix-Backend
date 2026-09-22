const express = require("express");

const router = express.Router({ mergeParams: true });

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  uploadCategoryPhoto,
  resizeCategoryPhoto,
} = require("../controllers/categoryControllers");

const mealRoutes = require("./mealRoutes");
const { auth, restrictTo } = require("../middleWares/auth");

router.use("/:categorySlug/meals", mealRoutes);

router.route("/").get(getAllCategories);
router.route("/:id").get(getCategoryById);

router.use(auth, restrictTo("Admin"));

router.post("/", uploadCategoryPhoto, resizeCategoryPhoto, createCategory);

router
  .route("/:id")
  .patch(uploadCategoryPhoto, resizeCategoryPhoto, updateCategory)
  .delete(deleteCategory);

module.exports = router;
