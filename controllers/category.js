const Category = require("../models/category");
const mongoose = require("mongoose");
const slugify = require("slugify");
const createCategory = async (req, res) => {
    try {
        let category = await Category.create(req.body)
        res.status(201).json({ success: true, message: "Category created successfully", data: category });
    } catch (error) {
        if (error.code === 11000) { return res.status(400).json({ success: false, message: "Category name already exists" }); }
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: Object.values(error.errors).map((err) => err.message).join(", ") });
        }
        res.status(400).json({ success: false, message: error.message })
    }
}
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        if (!categories) { return res.status(404).json({ success: false, message: "Not Found" }) }
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getCategoryById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const updateCategory = async (req, res) => {
    try {
        if (req.body.name) { req.body.slug = slugify(req.body.name, { lower: true, strict: true }); }
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.status(200).json({ message: "updated successfully", success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) { return res.status(404).json({ success: false, message: "Category not found" }); }
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory }

