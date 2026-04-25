const OrderModel = require("../models/orderModel");
const WorkerModel = require("../models/workerModel");

const getAllOrders = async (req, res) => {
  try {
    let orders = await OrderModel.find();
    if (!orders) {
      return res.status(400).json({ message: "No Orders Exist" });
    }
    return res.status(200).json({ Orders: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    let userId = req.id;
    let orders = await OrderModel.find({ userId: userId });
    if (!orders) {
      return res.status(400).json({ message: "No Orders Exist" });
    }
    return res.status(200).json({ "User's Orders": orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const trackOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId).populate(
      "deliveryPerson",
      "deliveryDetails",
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!order.deliveryPerson) {
      return res
        .status(400)
        .json({ message: "Order is not assigned to a Delivery Person yet" });
    }

    const location = order.deliveryPerson.deliveryDetails.currentLocation;

    return res.status(200).json({ "Delivery location": location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkout = async (req, res) => {
  try {
    const userId = req.id;
    const {
      orderItems,
      shippingAddress,
      itemsPrice,
      deliveryPrice,
      paymentMethod,
    } = req.body;

    const newOrder = await OrderModel.create({
      userId,
      orderItems,
      shippingAddress,
      itemsPrice,
      deliveryPrice,
      paymentMethod,
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { newStatus } = req.body;
    if (!newStatus) {
      return res.status(400).json({
        message: "Please provide a new status",
      });
    }
    const newOrder = await OrderModel.findOneAndUpdate(
      {
        orderId: orderId,
      },
      { status: newStatus },
      { new: true, runValidators: true },
    );
    if (!newOrder) {
      return res.status(404).json({ message: "Order is not found" });
    }
    return res.status(200).json({
      message: "Order status updated successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignOrderToDeliveryPerson = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { deliveryPersonId } = req.body;

    if (!deliveryPersonId) {
      return res.status(400).json({
        message: "Please provide a delivery person ID",
      });
    }

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { orderId: orderId },
      {
        deliveryPerson: deliveryPersonId,
        status: "Preparing",
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("deliveryPerson", "name phone");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order is not found" });
    }

    return res.status(200).json({
      message: "Order assigned to delivery person successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getUserOrders,
  trackOrder,
  checkout,
  updateOrderStatus,
  assignOrderToDeliveryPerson,
};
