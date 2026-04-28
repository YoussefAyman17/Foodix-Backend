const complaintModel = require("../models/complaintModel");
const asyncHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");

let createComplaint = asyncHandler(async (req, res, next) => {
  let newComplaint = req.body;
  newComplaint.userId = req.user.id;
  let complaint = await complaintModel.create(newComplaint);
  res.status(200).json({ message: "Complaint Created", Data: complaint });
});

let getAllComplaint = asyncHandler(async (req, res, next) => {
  let complaints = await complaintModel.find();

  res.status(200).json({ complaints });
});

let getComplaintById = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let Complaint = await complaintModel.findById(id);

  if (
    Complaint.userId.toString() !== req.user.id.toString() &&
    req.user.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ message: "You are not allowed to perform this action" });
  }

  if (Complaint) {
    res.status(200).json({ Data: Complaint });
  } else {
    next(new customError("Complaint Not Found", 404));
  }
});

let editComplaint = asyncHandler(async (req, res, next) => {
  let { id } = req.params;

  let complaint = await complaintModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (complaint) {
    res.status(200).json({
      message: "Complaint Updated Successfully",
      Data: complaint,
    });
  } else {
    next(new customError("Complaint Not Found", 404));
  }
});

let deleteComplaint = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  let Complaint = await complaintModel.findByIdAndDelete(id);
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
  let { status } = req.body;

  let complaint = await complaintModel.findByIdAndUpdate(
    id,
    { status },
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

const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const complaints = await complaintModel
      .find({ userId: userId })
      .sort({ createdAt: -1 });

    if (complaints.length === 0) {
      return res.status(200).json({
        message: "You haven't submitted any complaints yet",
        complaints: [],
      });
    }

    return res.status(200).json({
      message: "Complaints retrieved successfully",
      results: complaints.length,
      complaints: complaints,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createComplaint,
  getAllComplaint,
  getComplaintById,
  editComplaint,
  deleteComplaint,
  changeStatus,
  getMyComplaints,
};
