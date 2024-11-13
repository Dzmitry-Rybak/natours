const express = require('express');
const tourControllers = require('./../controllers/tourController');
const router = express.Router();

// create new middleware for routes with /:id param
router.param('id', tourControllers.checkId);

router
  .route('/') // '/' saying what we reference to out main route /api/v1/tours
  .get(tourControllers.getAllTours)
  .post(tourControllers.checkBody, tourControllers.createTour); // middleware chain, step by step from first to second middleware
router
  .route('/:id') // '/:id' saying what we reference to out main route /api/v1/tours/:id
  .get(tourControllers.getTour)
  .patch(tourControllers.updateTour)
  .delete(tourControllers.deleteTour);

module.exports = router;
