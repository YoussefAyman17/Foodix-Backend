const express = require("express");
const router = express.Router();
const {
  getAllWorkers,
  getOnlineDelivery,
  addNewWorker,
  updateWorkerData,
} = require("../controllers/workersControllers");
router.get("/", getAllWorkers);

router.get("/delivery", getOnlineDelivery);

router.post("/", addNewWorker);

router.patch("/:id", updateWorkerData);

module.exports = router;
