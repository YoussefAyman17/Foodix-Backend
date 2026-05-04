let express = require("express");
let router = express.Router();

//
let {
  deleteUserById,
  editUserById,
  getUserById,
  getAllUsers,
  login,
  signUP,
  updatePassword,
  forgetPassword,
  verifyResetCode,
  resetPassword,
  getMe,
  updateMe,
} = require("../controllers/userControllers");
let { auth, restrictTo } = require("../middleWares/auth");

router.post("/signUp", signUP);
router.post("/login", login);

router.post("/forgetPassword", forgetPassword);
router.post("/verifyResetCode", verifyResetCode);
router.put("/resetPassword", resetPassword);

router.patch("/updatePassword", auth, updatePassword);

router.get("/me", auth, getMe);
router.patch("/updateMe", auth, updateMe);

// restrictTo('Admin')
router.get("/", auth, restrictTo("Admin"), getAllUsers);

router.get("/:id", auth, restrictTo("Admin"), getUserById);

router.patch("/:id", auth, restrictTo("Admin"), editUserById);

//  restrictTo('Admin')
router.delete("/:id", auth, restrictTo("Admin"), deleteUserById);

module.exports = router;
