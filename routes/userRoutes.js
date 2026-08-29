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
  googleLogin,
} = require("../controllers/userControllers");
let { auth, restrictTo } = require("../middleWares/auth");

router.post("/signUp", signUP);
router.post("/login", login);

router.post("/google", googleLogin);
router.post("/forgetPassword", forgetPassword);
router.post("/verifyResetCode", verifyResetCode);
router.put("/resetPassword", resetPassword);

router.use(auth);

router.patch("/updatePassword", updatePassword);
router.get("/me", getMe, getUserById);
router.patch("/updateMe", updateMe);

router.use(restrictTo("Admin"));

router.get("/", getAllUsers);
router
  .route("/:id")
  .get(getUserById)
  .patch(editUserById)
  .delete(deleteUserById);

module.exports = router;
