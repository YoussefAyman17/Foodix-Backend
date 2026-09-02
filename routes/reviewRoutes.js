const express = require('express');
 const reviewController = require('../controllers/reviewController')
const { auth,restrictTo } = require("../middleWares/auth"); 

const router = express.Router({ mergeParams: true });

router.use(auth);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    restrictTo('Customer'),
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
     restrictTo('Customer', 'admin'),
    reviewController.updateReview
  )
  .delete(
     restrictTo('Customer', 'admin'),
    reviewController.deleteReview
  );


module.exports = router;