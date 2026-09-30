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

router.use(auth);

router.get("/my-complaints", getMyComplaints);
router.route("/:id").get(getComplaintById).patch(editComplaint);

router.use(restrictTo("Admin"));

router.get("/", getAllComplaint);
router.delete("/:id", deleteComplaint);
router.patch("/:id/status", changeStatus);

module.exports = router;
