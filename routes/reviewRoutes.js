const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // if some routes that reference to this rout have any params, this router will also have them, because of this mergeParams: true option

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setAvailableBody,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user'), reviewController.updateReview)
  .delete(authController.restrictTo('user'), reviewController.deleteReview);

module.exports = router;
