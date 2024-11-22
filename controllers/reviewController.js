const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({
      review: req.body.review,
      rating: req.body.rating,
      user: req.user.id, // Bind user's ID. Then Review model will get this ID and parse it into User Data from DB
      tour: req.params.tourId,
    });

    // 201 - status code for created
    res.status(201).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const review = await Review.find();

    res.status(200).json({
      status: 'success',
      results: review.length,
      data: {
        review,
      },
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};
