const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/mealControllers");
const { auth, restrictTo } = require("../middleWares/auth");

router.get("/", getAllItems);

router.get("/:id", getItemById);

router.post("/", auth, restrictTo("Admin"), createItem);

router.patch("/:id", auth, restrictTo("Admin"), updateItem);

router.delete("/:id", auth, restrictTo("Admin"), deleteItem);

module.exports = router;
