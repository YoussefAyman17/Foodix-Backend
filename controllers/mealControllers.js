const Meal = require("../models/mealModel");
const Category = require("../models/categoryModel");
const slugify = require("slugify");
const mongoose = require("mongoose");

const createItem = async (req, res) => {
  try {
    if (req.body.itemId) delete req.body.itemId;
    const slug = req.params.slug;
    const category = await Category.findOne({ slug: slug });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    const meal = await Meal.create({ ...req.body, category: category._id });
    res
      .status(201)
      .json({ success: true, message: "Create Meal success", data: meal });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];

      return res.status(400).json({
        success: false,
        message: `Duplicate Error in field: ${duplicatedField}. Value: ${duplicatedValue}`,
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllItems = async (req, res) => {
  try {
    const slug = req.params.slug;
    const category = await Category.findOne({ slug: slug });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const meals = await Meal.find({ category: category._id }).populate(
      "category",
    );
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

const updateItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Meal ID format, must be a number",
      });
    }
    if (req.body.itemId) delete req.body.itemId;

    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
    }
    const meal = await Meal.findOneAndUpdate({ itemId: id }, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).populate("category", "name slug");

    if (!meal) {
      return res
        .status(404)
        .json({ success: false, message: "Meal not found" });
    }
    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: meal,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Meal name already exists in this category",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

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
