const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setAvailableBody = (req, res, next) => {
  if (!req.user.id || !req.params.tourId) {
    next(new AppError(400, 'Invalid tour or user id'));
  }
  req.body.tour = req.params.tourId;
  req.body.user = req.user.id; // Bind user's ID. Then Review model will get this ID and parse it into User Data from DB

  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
