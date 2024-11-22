// review / rating / createdAt / ref to tour / ref to user

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review must have text body'],
      minlength: [4, 'Review text must contain at least 4 characters'],
      maxlength: [500, 'Too long text review'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating'],
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Review must belong to a tour.'],
    },
    // Mongo get from request and save in DB users's ID and then in query will parse it with User Data By it's ID
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a user.'],
    },
  },
  // Virtual properties - documents properties, that we can define in schema, but are not stored in the Mongo DB
  {
    toJSON: { virtuals: true }, // ensure, that virtual properties are included when converting a Mongoose document to JSON
    toObject: { virtuals: true }, // ensure, that virtual properties are included when converting a Mongoose document to plain JS object
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.select('-__v'); // filter out __v property in response
  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// virtualPopulate - we can actual populate the tour with reviews. We can get access to all the reviews for the tour, without keeping an arrays of ID of this tour

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;
