const express = require('express');
const tourControllers = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route('/tour-stats').get(tourControllers.getTourStats);
router.route('/monthly-plan/:year').get(tourControllers.getMonthlyPlan);

router
  .route('/') // '/' saying what we reference to out main route /api/v1/tours
  .get(authController.protect, tourControllers.getAllTours)
  .post(tourControllers.createTour); // middleware chain, step by step from first to second middleware
router
  .route('/:id') // '/:id' saying what we reference to out main route /api/v1/tours/:id
  .get(tourControllers.getTour)
  .patch(tourControllers.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour,
  );

router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview,
  );

module.exports = router;
