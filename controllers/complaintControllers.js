const complaintModel = require("../models/complaintModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");
const ApiFeatures = require("../utils/apiFeatures");

let createComplaint = asyncErrorHandler(async (req, res, next) => {
  let newComplaint = req.body;
  if (req.user) {
    newComplaint.userId = req.user.id;
  }
  let complaint = await complaintModel.create(newComplaint);
  res.status(201).json({ 
    message: req.user ? "Complaint Created Successfully" : "Guest Complaint Created Successfully", 
    Data: complaint });
});

const getAllComplaint = asyncErrorHandler(async (req, res, next) => {
  const totalDocuments = await complaintModel.countDocuments();

  const features = new ApiFeatures(
    complaintModel.find(),
    req.query
  )
    .filter()
    .sort()
    .search("Complaint")
    .paginate(totalDocuments);

  const complaints = await features.mongooseQuery;

  res.status(200).json({
    status: "success",
    count: complaints.length,
    pagination: features.paginationResult,
    data: complaints,
  });
});

let getComplaintById = asyncErrorHandler(async (req, res, next) => {
  let complaintId = req.params.id;
  let complaint = await complaintModel.findById(complaintId );
  if (!complaint) {
    return next(new CustomError("Complaint Not Found", 404));
  }
  if (req.user.role !== "Admin") {
    if (
      !complaint.userId ||
      complaint.userId.toString() !== req.user.id.toString()
    ) {
      return next(
        new CustomError("You are not allowed to view this complaint", 403),
      );
    }
  }

  res.status(200).json({ success: true, Data: complaint });
});

let editComplaint = asyncErrorHandler(async (req, res, next) => {
  let complaintId = req.params.id;
  let complaint = await complaintModel.findById(complaintId);

  if (!complaint) {
    return next(new CustomError("Complaint Not Found", 404));
  }
  if (
    req.user.role !== "Admin" &&
    (!complaint.userId ||
      complaint.userId.toString() !== req.user.id.toString())
  ) {
    return next(
      new CustomError("You are not allowed to edit this complaint", 403),
    );
  }

  const { name, email, subject, service, message } = req.body;

  let updatedComplaint = await complaintModel.findOneAndUpdate(
    complaintId,
    { name, email, subject, service, message },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: 'success',
    message: "Complaint Updated Successfully",
    Data: updatedComplaint,
  });
});

let deleteComplaint = asyncErrorHandler(async (req, res, next) => {
  let { id } = req.params;
  let Complaint = await complaintModel.findByIdAndDelete(id);
  if (Complaint) {
    res
      .status(200)
      .json({ message: "Complaint deleted Succesfully", DeletedId: id });
  } else {
    next(new CustomError("Complaint Not Found", 404));
  }
});

let changeStatus = asyncErrorHandler(async (req, res, next) => {
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
    next(new CustomError("Complaint Not Found", 404));
  }
});

const getMyComplaints = asyncErrorHandler(async (req, res, next) => {
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
