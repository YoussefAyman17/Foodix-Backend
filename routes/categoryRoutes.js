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

router.use(auth, restrictTo("Admin"));

router.post("/", createCategory);
router.route("/:id").patch(updateCategory).delete(deleteCategory);

module.exports = router;
