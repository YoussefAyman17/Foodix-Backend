const express = require("express");
const router = express.Router();
const {
  getAllWorkers,
  getOnlineDelivery,
  addNewWorker,
  updateWorkerData,
  deleteWorker,
} = require("../controllers/workerControllers");

const { auth, restrictTo } = require("../middleWares/auth");
router.use(auth);

router.get("/", restrictTo("Admin"), getAllWorkers);

router.get("/delivery", restrictTo("Admin", "Cashier"), getOnlineDelivery);

router.post("/", restrictTo("Admin"), addNewWorker);

router.patch("/:id", updateWorkerData);
router.delete("/:id", restrictTo("Admin"), deleteWorker);
module.exports = router;
