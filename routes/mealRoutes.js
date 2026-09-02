const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  uploadMealPhoto,
  resizeMealPhoto,
} = require("../controllers/mealControllers");
const { auth, restrictTo } = require("../middleWares/auth");

router.get("/", getAllItems);

router.get("/:id", getItemById);

router.use(auth, restrictTo("Admin"));

router.post("/", uploadMealPhoto, resizeMealPhoto, createItem);
router
  .route("/:id")
  .patch(uploadMealPhoto, resizeMealPhoto, updateItem)
  .delete(deleteItem);

module.exports = router;
