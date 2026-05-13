const express = require("express");
const {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
} = require("../controllers/orderControllers");
const { auth, restrictTo } = require("../middleWares/auth");
const router = express.Router();

router.get("/", auth, restrictTo("Admin"), getAllOrders);

router.get("/myorders", auth, restrictTo("User"), getUserOrders);

router.get("/:id", auth, trackOrder);

router.post("/", auth, checkout);

router.patch(
  "/:id/status",
  auth,
  restrictTo("Admin", "Delivery"),
  updateOrderStatus,
);

router.patch(
  "/:id/assign",
  auth,
  restrictTo("Admin"),
  assignOrderToDeliveryPerson,
);

module.exports = router;
