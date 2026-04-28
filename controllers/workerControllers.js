const OrderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const WorkerModel = require("../models/workerModel");

const getAllWorkers = async (req, res) => {
  try {
    let workers = await WorkerModel.find();

    if (workers.length === 0) {
      return res.status(200).json({ message: "[]" });
    }

    return res.status(200).json({ Workers: workers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOnlineDelivery = async (req, res) => {
  try {
    let OnlineDeliveryWorkers = await WorkerModel.find({
      role: "Delivery",
      "deliveryDetails.isOnline": true,
    });

    if (OnlineDeliveryWorkers.length === 0) {
      return res.status(200).json({ message: "[]" });
    }

    return res
      .status(200)
      .json({ OnlineDeliveryWorkers: OnlineDeliveryWorkers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addNewWorker = async (req, res) => {
  try {
    const { userId, role, salary, shift, deliveryDetails } = req.body;

    const existingWorker = await WorkerModel.findOne({ userId: userId });
    if (existingWorker) {
      return res
        .status(400)
        .json({ message: "This user is already registered as a worker" });
    }

    let finalDeliveryDetails = deliveryDetails;

    if (role === "delivery" && !deliveryDetails) {
      return res.status(400).json({
        message: "Delivery details are required for delivery workers",
      });
    } else if (role !== "delivery") {
      finalDeliveryDetails = undefined;
    }

    const newWorker = await WorkerModel.create({
      userId,
      role,
      salary,
      shift,
      deliveryDetails: finalDeliveryDetails,
    });

    return res.status(201).json({
      message: "Worker created successfully",
      worker: newWorker,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const updateWorkerData = async (req, res) => {
  try {
    const workerId = req.params.id;

    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const workerToUpdate = await WorkerModel.findById(workerId);

    if (!workerToUpdate) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const isOwner =
      workerToUpdate.userId.toString() === currentUserId.toString();
    const isAdmin = currentUserRole === "Admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You don't have permission to edit this data" });
    }

    const updates = { ...req.body };

    if (updates.userId) delete updates.userId;
    if (updates.user) delete updates.user;

    if (!isAdmin) {
      if (updates.role) delete updates.role;
      if (updates.salary) delete updates.salary;
      if (updates.hireDate) delete updates.hireDate;
      if (updates.rating) delete updates.rating;
    }

    const updatedWorker = await WorkerModel.findByIdAndUpdate(
      workerId,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      message: "Worker data updated successfully",
      worker: updatedWorker,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getAllWorkers,
  getOnlineDelivery,
  addNewWorker,
  updateWorkerData,
};
