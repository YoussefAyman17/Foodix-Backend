const express = require("express");
const router = express.Router();
let {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryControllers");
const mealRoutes = require("./mealRoutes");

const { auth, restrictTo } = require("../middleWares/auth");

router.use("/:slug/meals", mealRoutes);

router.get("/", getAllCategories);

router.get("/:id", getCategoryById);

router.post("/", auth, restrictTo("Admin"), createCategory);

router.patch("/:id", auth, restrictTo("Admin"), updateCategory);

router.delete("/:id", auth, restrictTo("Admin"), deleteCategory);

module.exports = router;
