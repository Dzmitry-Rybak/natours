const express = require('express');
const bookController = require('../controllers/bookController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session:tourId',
  authController.protect,
  bookController.getCheckoutSession,
);

module.exports = router;
