let express = require("express");
let router = express.Router();

let { auth, restrictTo } = require("../middleWares/auth");
let {
  createComplaint,
  getAllComplaint,
  getComplaintById,
  editComplaint,
  deleteComplaint,
  changeStatus,
  getMyComplaints,
} = require("../controllers/complaintControllers");

router.use(auth);

router.post("/", createComplaint);
router.get("/my-complaints", getMyComplaints);

router.get("/:id", getComplaintById);
router.patch("/:id", editComplaint);

router.get("/", restrictTo("Admin"), getAllComplaint);
router.delete("/:id", restrictTo("Admin"), deleteComplaint);
router.patch("/:id/status", restrictTo("Admin"), changeStatus);

module.exports = router;
