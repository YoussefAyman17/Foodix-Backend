const Item = require("../models/Item");
const Category = require("../models/Category");
const slugify = require("slugify");
const mongoose = require("mongoose");

const createItem = async (req, res) => {
    try {
        const slug = req.params.slug;
        const category = await Category.findOne({slug: slug});
        if (!category) {return res.status(404).json({ success: false, message: "Category not found" });}
        const item = await Item.create({ ...req.body, category: category._id });
        res.status(201).json({  success: true,message:"Create Item success", data: item });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};


const getAllItems = async (req, res) => {
    try {
        const slug = req.params.slug;
        const category = await Category.findOne({slug: slug});

        if (!category) {return res.status(404).json({success: false,message: "Category not found"});}

        const items = await Item.find({ category: category._id }).populate("category");
        res.status(200).json({ success: true,message:"Get AllI tems success", count: items.length, data: items });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};


const getItemById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ success: false, message: "Invalid ID" }); }
        const item = await Item.findById(id).populate("category");
        if (!item) { return res.status(404).json({ success: false, message: "Item not found" }); }
        res.status(200).json({ success: true,message:"Get Item By Id success",  data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ success: false, message: "Invalid ID" }); }
        if (req.body.name) { req.body.slug = slugify(req.body.name, { lower: true, strict: true }); }
        if (req.body.category) {
            const category = await Category.findById(req.body.category);
            if (!category) { return res.status(404).json({ success: false, message: "Category not found" }); }
        }
        const item = await Item.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!item) { return res.status(404).json({ success: false, message: "Item not found" }); }
        res.status(200).json({ success: true, message: "Item updated successfully", data: item });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(itemId)) { return res.status(400).json({ success: false, message: "Invalid item ID" }); }
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) { return res.status(404).json({ success: false, message: "Item not found" }); }
        res.status(200).json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem };