const OrderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const WorkerModel = require("../models/workerModel");

const getAllWorkers = async (req, res) => {
  try {
    let workers = await WorkerModel.find().populate("userId", "userName email phone");

    if (workers.length === 0) {
      return res.status(200).json({ workers: [] });
    }

    return res.status(200).json({ workers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOnlineDelivery = async (req, res) => {
  try {
    let deliveryWorkers = await WorkerModel.find({
      role: "Delivery",
      status: "Active",
    }).populate("userId", "userName email phone");

    if (deliveryWorkers.length === 0) {
      return res.status(200).json({ deliveryWorkers: [] });
    }

    return res.status(200).json({ deliveryWorkers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addNewWorker = async (req, res) => {
  try {
    const { userId, role, salary, shift, status, deliveryDetails } = req.body;
    let linkedUserId = userId;

    if (userId && typeof userId === "object") {
      const { userName, name, email, phone } = userId;
      const finalUserName = userName || name;

      if (!finalUserName || !email) {
        return res.status(400).json({
          message: "Worker name and email are required",
        });
      }

      const normalizedPhone = phone || undefined;
      let user = await userModel.findOne({ email });

      if (!user) {
        user = await userModel.create({
          userName: finalUserName,
          email,
          phone: normalizedPhone,
          password: "Worker123",
        });
      } else {
        user = await userModel.findByIdAndUpdate(
          user._id,
          { userName: finalUserName, phone: normalizedPhone },
          { new: true, runValidators: true },
        );
      }

      linkedUserId = user._id;
    }

    const existingWorker = await WorkerModel.findOne({ userId: linkedUserId });
    if (existingWorker) {
      return res
        .status(400)
        .json({ message: "This user is already registered as a worker" });
    }

    let finalDeliveryDetails = deliveryDetails;

    if (role === "Delivery" && !deliveryDetails) {
      return res.status(400).json({
        message: "Delivery details are required for delivery workers",
      });
    } else if (role !== "Delivery") {
      finalDeliveryDetails = undefined;
    }

    let newWorker = await WorkerModel.create({
      userId: linkedUserId,
      role,
      salary,
      shift,
      status,
      deliveryDetails: finalDeliveryDetails,
    });

    newWorker = await newWorker.populate("userId", "userName email phone");

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
    const userUpdates = updates.userId && typeof updates.userId === "object" ? updates.userId : null;

    if (updates.userId) delete updates.userId;
    if (updates.user) delete updates.user;

    if (!isAdmin) {
      if (updates.role) delete updates.role;
      if (updates.salary) delete updates.salary;
      if (updates.hireDate) delete updates.hireDate;
      if (updates.rating) delete updates.rating;
    }

    if (isAdmin && userUpdates) {
      const filteredUserUpdates = {};
      if (userUpdates.userName || userUpdates.name) {
        filteredUserUpdates.userName = userUpdates.userName || userUpdates.name;
      }
      if (userUpdates.email) filteredUserUpdates.email = userUpdates.email;
      if (userUpdates.phone !== undefined) filteredUserUpdates.phone = userUpdates.phone || undefined;

      if (Object.keys(filteredUserUpdates).length > 0) {
        await userModel.findByIdAndUpdate(workerToUpdate.userId, filteredUserUpdates, {
          runValidators: true,
        });
      }
    }

    const updatedWorker = await WorkerModel.findByIdAndUpdate(
      workerId,
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).populate("userId", "userName email phone");

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
const deleteWorker = async (req, res) => {
  try {
    const worker = await WorkerModel.findByIdAndDelete(req.params.id);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json({
      success: true,
      message: "Worker deleted successfully",
      worker,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getAllWorkers,
  getOnlineDelivery,
  addNewWorker,
  updateWorkerData,
  deleteWorker
};
