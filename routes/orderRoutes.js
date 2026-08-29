const express = require("express");
const {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
  getDeliveryOrders,
} = require("../controllers/orderControllers");
const { auth, restrictTo } = require("../middleWares/auth");
const router = express.Router();

router.use(auth);
router.get("/", restrictTo("Admin"), getAllOrders);
router.post("/", checkout);

router.get("/myorders", getUserOrders);

router.get(
  "/delivery-orders",

  restrictTo("Delivery", "Admin"),
  getDeliveryOrders,
);

router.get("/:id", trackOrder);

router.patch(
  "/:id/status",

  restrictTo("Admin", "Delivery"),
  updateOrderStatus,
);

router.patch(
  "/:id/assign",

  restrictTo("Admin"),
  assignOrderToDeliveryPerson,
);

module.exports = router;
