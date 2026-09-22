const Order = require("../models/orderModel");
const Worker = require("../models/workerModel");
const Meal = require("../models/mealModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ApiFeatures = require('../Utils/apiFeatures');
const CustomError = require("../Utils/customError");
const mongoose = require("mongoose");
const Stripe = require("stripe");

const getAllOrders = asyncErrorHandler(async (req, res, next) => {
  let filter = {};
   if (req.params.userId) filter = { userId: req.params.userId };

   const documentsCount = await Order.countDocuments(filter);

   const features = new ApiFeatures(Order.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(documentsCount);

   const orders = await features.mongooseQuery.populate([
    { path: "userId", select: "userName email" },
    { path: "orderItems.foodItem", select: "name img price" },
    {
      path: "deliveryPerson",
      populate: { path: "userId", select: "userName email phone" },
    },
  ]);

  return res.status(200).json({
    status: "success",
    results: orders.length,
    paginationResult: features.paginationResult,
    data: orders,
  });

});

const getUserOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find({ userId: req.user.id }).populate({
    path: "orderItems.foodItem",
    select: "name img price",
  });

  return res.status(200).json({
    status: "success",
    count: orders.length,
    data: orders,
  });
});

const trackOrder = asyncErrorHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findOne({ orderId }).populate(
    "deliveryPerson",
    "deliveryDetails name phone",
  );

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  if (
    req.user.role !== "Admin" &&
    order.userId.toString() !== req.user.id.toString()
  ) {
    return next(
      new CustomError("You are not authorized to track this order", 403),
    );
  }

  if (!order.deliveryPerson) {
    return next(
      new CustomError("Order is not assigned to a delivery person yet", 400),
    );
  }

  const location = order.deliveryPerson.deliveryDetails?.currentLocation;
  return res.status(200).json({
    status: "success",
    data: location,
  });
});

const checkout = asyncErrorHandler(async (req, res, next) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const userId = req.user.id;
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    deliveryPrice = 20,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new CustomError("No order items provided", 400));
  }

  const itemIds = orderItems.map((item) => item.foodItem);
  const meals = await Meal.find({ _id: { $in: itemIds } });
  const mealMap = new Map(meals.map((m) => [m._id.toString(), m]));

  let calculatedItemsPrice = 0;
  const orderItemsWithPrices = [];

  for (const item of orderItems) {
    const meal = mealMap.get(item.foodItem.toString());
    if (!meal) {
      return next(new CustomError(`Meal not found: ${item.foodItem}`, 404));
    }

    let sizePrice = 0;
    if (meal.sizes && item.size) {
      const sizeObj = meal.sizes.find((s) => s.size === item.size);
      if (sizeObj) sizePrice = sizeObj.extraPrice || 0;
    }

    const unitPrice = meal.price + sizePrice;
    calculatedItemsPrice += unitPrice * item.quantity;

    orderItemsWithPrices.push({
      foodItem: item.foodItem,
      name: meal.name,
      quantity: item.quantity,
      size: item.size,
      priceAtPurchase: unitPrice,
    });
  }

  const session = await mongoose.startSession();
  let newOrder;

  try {
    session.startTransaction();

    [newOrder] = await Order.create(
      [
        {
          userId,
          orderItems: orderItemsWithPrices,
          shippingAddress,
          itemsPrice: calculatedItemsPrice,
          deliveryPrice,
          paymentMethod,
          isPaid: false,
        },
      ],
      { session },
    );

    const updatePromises = orderItems.map((item) =>
      Meal.findByIdAndUpdate(
        item.foodItem,
        { $inc: { orders_count: item.quantity } },
        { session },
      ),
    );
    await Promise.all(updatePromises);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }

  if (paymentMethod === "Stripe") {
    const line_items = orderItemsWithPrices.map((item) => ({
      price_data: {
        currency: "egp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.priceAtPurchase * 100),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "egp",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round(deliveryPrice * 100),
      },
      quantity: 1,
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?orderId=${newOrder.orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      client_reference_id: newOrder._id.toString(),
    });

    return res.status(201).json({
      status: "success",
      message: "Redirecting to payment...",
      data: {
        url: checkoutSession.url,
        order: newOrder,
      },
    });
  }

  return res.status(201).json({
    status: "success",
    message: "Order created successfully (Cash on Delivery)",
    data: newOrder,
  });
});

const updateOrderStatus = asyncErrorHandler(async (req, res, next) => {
  const { newStatus } = req.body;
  const orderId = req.params.id;

  if (!newStatus) {
    return next(new CustomError("Please provide a new status", 400));
  }

  const updateFields = { status: newStatus };
  if (newStatus === "Delivered") {
    updateFields.deliveredAt = Date.now();
  }

  const updatedOrder = await Order.findOneAndUpdate({ orderId }, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updatedOrder) {
    return next(new CustomError("Order not found", 404));
  }

  const io = req.app.get("socketio");
  if (io) {
    const room = orderId.toString();
    io.to(room).emit("orderStatusChanged", {
      orderId: updatedOrder.orderId,
      status: updatedOrder.status,
    });

    if (newStatus === "On the way") {
      io.to(room).emit("orderStartedMoving", {
        message: "Your order is on the way!",
        deliveryPersonId: updatedOrder.deliveryPerson,
      });
    }

    if (newStatus === "Delivered") {
      io.to(room).emit("orderFinished", {
        message: "Your order has been delivered successfully!",
      });
    }
  }

  return res.status(200).json({
    status: "success",
    message: "Order status updated successfully",
    data: updatedOrder,
  });
});

const assignOrderToDeliveryPerson = asyncErrorHandler(
  async (req, res, next) => {
    const orderId = req.params.id;
    const { deliveryPersonId } = req.body;

    if (!deliveryPersonId) {
      return next(new CustomError("Please provide a delivery person ID", 400));
    }

    const deliveryWorker = await Worker.findOne({
      _id: deliveryPersonId,
      role: "Delivery",
      status: "Active",
    });

    if (!deliveryWorker) {
      return next(new CustomError("Active delivery worker not found", 404));
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { deliveryPerson: deliveryPersonId, status: "On the way" },
      { new: true, runValidators: true },
    ).populate({
      path: "deliveryPerson",
      populate: { path: "userId", select: "userName email phone" },
    });

    if (!updatedOrder) {
      return next(new CustomError("Order not found", 404));
    }

    const io = req.app.get("socketio");
    if (io) {
      io.to(`worker_${deliveryPersonId}`).emit("newOrderAssigned", {
        order: updatedOrder,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Order assigned successfully",
      data: updatedOrder,
    });
  },
);

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.client_reference_id;

    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: Date.now(),
      status: "Preparing",
      "paymentInfo.sessionId": session.id,
      "paymentInfo.paymentStatus": "paid",
    });
  }

  return res.status(200).json({ status: "success", received: true });
};

const getDeliveryOrders = asyncErrorHandler(async (req, res, next) => {
  const deliveryId = req.user.workerId;
  if (!deliveryId) {
    return next(
      new CustomError("You are not authorized as a delivery person", 403),
    );
  }

  const orders = await Order.find({ deliveryPerson: deliveryId })
    .populate("userId", "userName phone")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    status: "success",
    count: orders.length,
    data: orders,
  });
});

module.exports = {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
  stripeWebhook,
  getDeliveryOrders,
};
