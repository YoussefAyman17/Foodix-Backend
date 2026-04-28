const express = require("express");
const {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
} = require("../controllers/orderControllers");
const { auth } = require("../middleWares/auth");
const router = express.Router();

router.get("/all", auth, getAllOrders);

router.get("/myorders", auth, getUserOrders);

router.get("/:id", auth, trackOrder);

router.post("/", auth, checkout);

router.patch("/:id/status", auth, updateOrderStatus);

router.patch("/:id/assign", auth, assignOrderToDeliveryPerson);

module.exports = router;
