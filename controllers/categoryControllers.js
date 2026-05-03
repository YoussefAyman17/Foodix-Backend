const Category = require("../models/categoryModel");
const mongoose = require("mongoose");
const slugify = require("slugify");

const createCategory = async (req, res) => {
  try {
    if (req.body.categoryId) delete req.body.categoryId;
    let category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Category name already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (!categories) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    res
      .status(200)
      .json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getCategoryById = async (req, res) => {
  try {
    const catId = Number(req.params.id);
    if (isNaN(catId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format, must be a number",
      });
    }

    const category = await Category.findOne({ categoryId: catId });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateCategory = async (req, res) => {
  try {
    const catId = Number(req.params.id);
    if (isNaN(catId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format, must be a number",
      });
    }

    if (req.body.categoryId) delete req.body.categoryId;
    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }
    const category = await Category.findOneAndUpdate(
      { categoryId: catId },
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({
      message: "Category updated successfully",
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Category name already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const catId = Number(req.params.id);
    if (isNaN(catId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format, must be a number",
      });
    }

    const category = await Category.findOneAndDelete({ categoryId: catId });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
