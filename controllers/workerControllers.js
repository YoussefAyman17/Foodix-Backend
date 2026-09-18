const OrderModel = require("../models/orderModel");
const user = require("../models/userModel");
const Worker = require("../models/workerModel");
const asyncHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");

const getAllWorkers = asyncHandler(async (req, res) => {
  const workers = await Worker.find().populate(
    "userId",
    "userName email phone",
  );

  return res.status(200).json({ status: "success", data: workers });
});

const getOnlineDelivery = asyncHandler(async (req, res) => {
  const deliveryWorkers = await Worker.find({
    role: "Delivery",
    "deliveryDetails.isOnline": true,
  }).populate("userId", "userName email phone");

  return res.status(200).json({ status: "success", data: deliveryWorkers });
});

const addNewWorker = asyncHandler(async (req, res, next) => {
  const { userId, userData, role, salary, shift, status, deliveryDetails } =
    req.body;

  let targetUserId = userId;

  if (!targetUserId && userData) {
    const { userName, name, email, phone } = userData;
    const finalUserName = userName || name;

    if (!finalUserName || !email) {
      return next(
        new CustomError(
          "Worker name and email are required when creating a new user",
          400,
        ),
      );
    }

    let user = await user.findOne({ email });

    if (!user) {
      user = await user.create({
        userName: finalUserName,
        email,
        phone: phone || undefined,
        password: "Worker123",
      });
    }

    targetUserId = user._id;
  }

  if (!targetUserId) {
    return next(
      new CustomError("A valid userId or new user details are required", 400),
    );
  }

  // 2. Validate Duplicate Worker
  const existingWorker = await Worker.findOne({ userId: targetUserId });
  if (existingWorker) {
    return next(
      new CustomError("This user is already registered as a worker", 400),
    );
  }

  // 3. Validate Role-Specific Requirements
  if (role === "Delivery" && !deliveryDetails) {
    return next(
      new CustomError(
        "Delivery details are required for delivery workers",
        400,
      ),
    );
  }

  // 4. Create and Populate Worker Record
  const newWorker = await Worker.create({
    userId: targetUserId,
    role,
    salary,
    shift,
    status,
    deliveryDetails: role === "Delivery" ? deliveryDetails : undefined,
  });

  const populatedWorker = await newWorker.populate(
    "userId",
    "userName email phone",
  );

  return res.status(201).json({
    message: "Worker created successfully",
    worker: populatedWorker,
  });
});

const updateWorkerData = asyncHandler(async (req, res, next) => {
  const workerId = req.params.id;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  const workerToUpdate = await Worker.findById(workerId);

  if (!workerToUpdate) {
    return next(new CustomError("Worker not found", 404));
  }

  const isOwner = workerToUpdate.userId.toString() === currentUserId.toString();
  const isAdmin = currentUserRole === "Admin";

  if (!isOwner && !isAdmin) {
    return next(
      new CustomError("You don't have permission to edit this data", 403),
    );
  }

  const updates = { ...req.body };
  const userUpdates =
    updates.userId && typeof updates.userId === "object"
      ? updates.userId
      : null;

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
    if (userUpdates.phone !== undefined)
      filteredUserUpdates.phone = userUpdates.phone || undefined;

    if (Object.keys(filteredUserUpdates).length > 0) {
      await user.findByIdAndUpdate(workerToUpdate.userId, filteredUserUpdates, {
        runValidators: true,
      });
    }
  }

  const updatedWorker = await Worker.findByIdAndUpdate(workerId, updates, {
    new: true,
    runValidators: true,
  }).populate("userId", "userName email phone");

  return res.status(200).json({
    status: "success",
    data: updatedWorker,
  });
});
const deleteWorker = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findByIdAndDelete(req.params.id);

  if (!worker) {
    return next(new CustomError("Worker not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Worker deleted successfully",
    data: worker,
  });
});
module.exports = {
  getAllWorkers,
  getOnlineDelivery,
  addNewWorker,
  updateWorkerData,
  deleteWorker,
};
