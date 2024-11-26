const mongoose = require('mongoose');
const Tour = require('./tourModel');

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
      required: [true, 'Review must belong to a tour.'],
    },
    // Mongo get users's ID from request and save in DB and then in query will parse it with User Data By it's ID
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
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

// Now each combination of Tour + User - must to be unique
// reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // means what one user (user_id) can review one tour (tour_id)

// virtualPopulate - we can actual populate the tour with reviews. We can get access to all the reviews for the tour, without keeping an arrays of ID of this tour
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

// STATIC METHOD ON SCHEMA | it's will be available like: Review.calcAverageRatings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this - current model (Review)

  // We create this method as STATIC, because we want to call aggregate on the Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', // group by tours
        numberRating: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  // After we create group of data, we can put this data into DataBase:
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: Math.round(stats[0].averageRating * 10) / 10,
      ratingsQuantity: stats[0].numberRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }
};

reviewSchema.post('save', function (document) {
  // Review.calcAverageRatings(this.tour); - we cant ref to Review, because we only create it below

  // this.constructor - points To The MODEL
  // this - document, contractor - Model who created this document
  document.constructor.calcAverageRatings(this.tour);
});

// Concept of how we can update tour`s review when updating or deleting reviews
reviewSchema.post(/^findOneAnd/, async function (document) {
  // document - awaited query
  await document.constructor.calcAverageRatings(document.tour._id); // type of this Id is -  mongoose.Schema.ObjectId
});

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;
