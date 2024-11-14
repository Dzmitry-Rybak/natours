const express = require('express');
const tourControllers = require('../controllers/tourController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router
  .route('/') // '/' saying what we reference to out main route /api/v1/tours
  .get(tourControllers.getAllTours)
  .post(tourControllers.createTour); // middleware chain, step by step from first to second middleware
router
  .route('/:id') // '/:id' saying what we reference to out main route /api/v1/tours/:id
  .get(tourControllers.getTour)
  .patch(tourControllers.updateTour)
  .delete(tourControllers.deleteTour);

module.exports = router;
