const express = require("express");
const router = express.Router();
let { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/category')
const itemRoutes = require("./item");




router.get('/', getAllCategories)

router.get('/:id', getCategoryById)


router.post('/', createCategory)

router.patch("/:id", updateCategory)

router.delete('/:id', deleteCategory)



router.use("/:slug/items", itemRoutes);



module.exports = router