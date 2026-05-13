let express = require("express");
let router = express.Router();

let { auth, optionalAuth, restrictTo } = require("../middleWares/auth");
let {
  createComplaint,
  getAllComplaint,
  getComplaintById,
  editComplaint,
  deleteComplaint,
  changeStatus,
  getMyComplaints,
} = require("../controllers/complaintControllers");

router.post("/", optionalAuth, createComplaint);
router.get("/my-complaints", auth, getMyComplaints);

router.get("/:id", auth, getComplaintById);
router.patch("/:id", auth, editComplaint);

router.get("/", auth, restrictTo("Admin"), getAllComplaint);
router.delete("/:id", auth, restrictTo("Admin"), deleteComplaint);
router.patch("/:id/status", auth, restrictTo("Admin"), changeStatus);

module.exports = router;
