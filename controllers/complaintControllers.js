const complaintModel = require("../models/complaintModel");
const asyncHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");

let createComplaint = asyncHandler(async (req, res, next) => {
  let newComplaint = req.body;
  if (req.user) {
    newComplaint.userId = req.user.id;
  }
  let complaint = await complaintModel.create(newComplaint);
  res.status(201).json({ message: "Complaint Created", Data: complaint });
});

let getAllComplaint = asyncHandler(async (req, res, next) => {
  let complaints = await complaintModel.find().sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: complaints.length, complaints });
});

let getComplaintById = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let complaint = await complaintModel.findOne({ id: id });
  if (!complaint) {
    return next(new customError("Complaint Not Found", 404));
  }
  if (req.user.role !== "Admin") {
    if (
      !complaint.userId ||
      complaint.userId.toString() !== req.user.id.toString()
    ) {
      return next(
        new customError("You are not allowed to view this complaint", 403),
      );
    }
  }

  res.status(200).json({ success: true, Data: complaint });
});

let editComplaint = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let complaint = await complaintModel.findOne({ id: id });

  if (!complaint) {
    return next(new customError("Complaint Not Found", 404));
  }
  if (
    req.user.role !== "Admin" &&
    (!complaint.userId ||
      complaint.userId.toString() !== req.user.id.toString())
  ) {
    return next(
      new customError("You are not allowed to edit this complaint", 403),
    );
  }

  const { name, email, subject, service, message } = req.body;

  let updatedComplaint = await complaintModel.findOneAndUpdate(
    { id: id },
    { name, email, subject, service, message },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    message: "Complaint Updated Successfully",
    Data: updatedComplaint,
  });
});

let deleteComplaint = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let Complaint = await complaintModel.findOneAndDelete({ id: id });
  if (Complaint) {
    res
      .status(200)
      .json({ message: "Complaint deleted Succesfully", DeletedId: id });
  } else {
    next(new customError("Complaint Not Found", 404));
  }
});

let changeStatus = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let { status, adminResponse } = req.body;

  let complaint = await complaintModel.findOneAndUpdate(
    { id: id },
    { status, adminResponse },
    {
      new: true,
      runValidators: true,
    },
  );

  if (complaint) {
    res.status(200).json({
      message: "Status Complaint Updated Successfully",
      Data: complaint,
    });
  } else {
    next(new customError("Complaint Not Found", 404));
  }
});

const getMyComplaints = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const complaints = await complaintModel
    .find({ userId: userId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message:
      complaints.length === 0
        ? "You haven't submitted any complaints yet"
        : "Complaints retrieved successfully",
    results: complaints.length,
    complaints: complaints,
  });
});

module.exports = {
  createComplaint,
  getAllComplaint,
  getComplaintById,
  editComplaint,
  deleteComplaint,
  changeStatus,
  getMyComplaints,
};
