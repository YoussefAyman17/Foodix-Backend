const express = require("express");
const {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
} = require("../controllers/ordersControllers");
const router = express.Router();

router.get("/all", getAllOrders);

router.get("/myorders", getUserOrders);

router.get("/:id", trackOrder);

router.post("/", checkout);

router.patch("/:id/status", updateOrderStatus);

router.patch("/:id/assign", assignOrderToDeliveryPerson);

module.exports = router;
