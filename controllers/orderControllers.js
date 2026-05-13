const OrderModel = require("../models/orderModel");
const WorkerModel = require("../models/workerModel");
const MealModel = require("../models/mealModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const autoIncrement = require("../utils/autoIncrement");
const Stripe = require("stripe");

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("🚨 STRIPE_SECRET_KEY is missing in .env file!");
  }
  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const getAllOrders = asyncErrorHandler(async (req, res, next) => {
  let orders = await OrderModel.find().populate([
    {
      path: "userId",
      select: "userName email",
    },
    {
      path: "orderItems.foodItem",
      select: "name img price",
    },
  ]);
  if (orders.length === 0) {
    return res.status(404).json({ message: "No Orders Exist" });
  }
  return res.status(200).json({ success: true, count: orders.length, orders });
});

const getUserOrders = asyncErrorHandler(async (req, res, next) => {
  let userId = req.user.id;
  let orders = await OrderModel.find({ userId: userId }).populate({
    path: "orderItems.foodItem",
    select: "name img price",
  });

  if (orders.length === 0) {
    return res.status(200).json({ message: "No Orders Exist for this user" });
  }
  return res.status(200).json({ success: true, count: orders.length, orders });
});

const trackOrder = asyncErrorHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await OrderModel.findOne({ orderId: orderId }).populate(
    "deliveryPerson",
    "deliveryDetails name phone",
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (
    req.user.role !== "Admin" &&
    order.userId.toString() !== req.user.id.toString()
  ) {
    return res
      .status(403)
      .json({ message: "You are not authorized to track this order" });
  }
  if (!order.deliveryPerson) {
    return res
      .status(400)
      .json({ message: "Order is not assigned to a Delivery Person yet" });
  }

  const location = order.deliveryPerson.deliveryDetails.currentLocation;
  return res.status(200).json({ success: true, deliveryLocation: location });
});

const checkout = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { orderItems, shippingAddress, paymentMethod, deliveryPrice } =
    req.body;

  let calculatedItemsPrice = 0;

  const orderItemsWithPrices = await Promise.all(
    orderItems.map(async (item) => {
      const meal = await MealModel.findById(item.foodItem);
      if (!meal) throw new Error(`Meal not found`);
      let sizePrice = 0;
      if (meal.sizes && item.size && meal.sizes.length > 0) {
        let size = meal.sizes.find((s) => s.size === item.size);
        if (size) {
          sizePrice = size.extraPrice;
        }
      }
      calculatedItemsPrice += (meal.price + sizePrice) * item.quantity;

      return {
        foodItem: item.foodItem,
        name: meal.name,
        quantity: item.quantity,
        size: item.size,
        priceAtPurchase: meal.price + sizePrice,
      };
    }),
  );

  const finalDeliveryPrice = deliveryPrice || 20;

  const newOrder = await OrderModel.create({
    userId,
    orderItems: orderItemsWithPrices,
    shippingAddress,
    itemsPrice: calculatedItemsPrice,
    deliveryPrice: finalDeliveryPrice,
    paymentMethod,
    isPaid: false,
  });

  const updateMealsPromises = orderItems.map((item) => {
    return MealModel.findByIdAndUpdate(
      item.foodItem,
      {
        $inc: { orders_count: item.quantity },
      },
      { new: true },
    );
  });

  await Promise.all(updateMealsPromises);

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
        unit_amount: Math.round(finalDeliveryPrice * 100),
      },
      quantity: 1,
    });

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?orderId=${newOrder.orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      client_reference_id: newOrder._id.toString(),
    });

    return res.status(201).json({
      success: true,
      message: "Redirecting to payment...",
      url: session.url,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Order created successfully (Cash on Delivery)",
    order: newOrder,
  });
});

const updateOrderStatus = asyncErrorHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const { newStatus } = req.body;
  const io = req.app.get("socketio");

  if (!newStatus) {
    return res.status(400).json({ message: "Please provide a new status" });
  }

  const updatedOrder = await OrderModel.findOneAndUpdate(
    { orderId: orderId },
    { status: newStatus },
    { new: true, runValidators: true },
  );

  if (!updatedOrder) {
    return res.status(404).json({ message: "Order is not found" });
  }

  if (newStatus === "On the way" && io) {
    io.to(orderId.toString()).emit("orderStartedMoving", {
      message: "The delivery has received the order and is on his way to you!",
      deliveryPersonId: updatedOrder.deliveryPerson,
    });
  }

  if (newStatus === "Delivered" && io) {
    updatedOrder.deliveredAt = Date.now();
    await updatedOrder.save();

    io.to(orderId.toString()).emit("orderFinished", {
      message:
        "Your order has been delivered successfully, thank you for using Foodix!",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order: updatedOrder,
  });
});

const assignOrderToDeliveryPerson = asyncErrorHandler(
  async (req, res, next) => {
    const orderId = req.params.id;
    const { deliveryPersonId } = req.body;

    if (!deliveryPersonId) {
      return res
        .status(400)
        .json({ message: "Please provide a delivery person ID" });
    }

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { orderId: orderId },
      {
        deliveryPerson: deliveryPersonId,
        status: "Preparing",
      },
      { new: true, runValidators: true },
    ).populate("deliveryPerson", "name phone");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order is not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order assigned to delivery person successfully",
      order: updatedOrder,
    });
  },
);

const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const orderId = session.client_reference_id;

    await OrderModel.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: Date.now(),
      status: "Preparing",
      "paymentInfo.sessionId": session.id,
      "paymentInfo.paymentStatus": "paid",
    });

    console.log(`✅ Order ${orderId} has been successfully paid!`);
  }

  res.status(200).json({ received: true });
};

module.exports = {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
  stripeWebhook,
};
