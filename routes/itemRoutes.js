const express = require("express");
// const router = express.Router();
const router = express.Router({ mergeParams: true });

const {getAllItems,getItemById,createItem,updateItem,deleteItem} = require("../controllers/item");

router.get("/", getAllItems);

router.get("/:id", getItemById);

router.post("/", createItem);

router.patch("/:id", updateItem);

router.delete("/:id", deleteItem);

module.exports = router;