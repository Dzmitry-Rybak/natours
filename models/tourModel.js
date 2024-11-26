const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, ' A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have more then 40 characters'],
      minlength: [3, 'A tour name mast have not less then 3 character'],
      // validate: [validator.isAlpha, ' Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, ' A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, ' A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, ' A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // set - function will invoke every time a new value
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this - point to the current document, when creating NEW document, so for that we'r using function(), not arrow function
          return this.price >= val;
        },
        message: 'Discount price ({VALUE}) must me below regular price', // where VALUE - input value, like val
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // array of type string
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // will exclude this field from the client
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON. Now there is not the same as secretTour, there type and coordinates are fields in object
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // array of numbers
      address: String,
      description: String,
    },
    // this is how to create embedded document
    locations: [
      // will create new document inside parent document
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // One to many
    // when creating a new Tour, we send userId, and then by this ID Mongo will reference to Ids in User Model
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // create relationship between Tour and User
      },
    ],
  },
  {
    toJSON: { virtuals: true }, // Ensures virtual properties are included when converting a document to JSON.
    toObject: { virtuals: true }, // Ensures virtual properties are included when converting a document to a plain JavaScript object.
  },
);

tourSchema.index({ startLocation: '2dsphere' });

// we will don't save this document (table) durationWeeks, we will only convert the data and send it with response data
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// We connect Tour Model by 'tour' and local '_id' fields
tourSchema.virtual('reviews', {
  ref: 'review',
  foreignField: 'tour', // reference to 'tour' field
  localField: '_id', // what we reference in this local Model
});

// pre - middleware before an actual event
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // this function will be called before actual document
  // console.log(this); // in this case we reference to the Document that is being saved (body that we try to save in our database)

  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING USERS with tours
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); // as we don't do .then() we don't await the result of this FindById query

//   this.guides = await Promise.all(guidesPromises); // so here we'r waiting all this promises

//   next();
// });

tourSchema.pre('save', function (next) {
  // console.log('Will save document...');
  next();
});

// doc - act to saved document
tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
});

////////////////////////////////
// QUERY MIDDLEWARE
// /^find/ - means all strings with find name (find, findOne ...)
tourSchema.pre(/^find/, function (next) {
  // this - query object with all query methods
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  // console.log(this);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // from which place we get reference
    select: '-__v -passwordChangedAt', // witch field we filter out
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took: ${Date.now() - this.start} milliseconds`);

  // console.log(docs); // result of documentations
  next();
});

//////////////////////////////
// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
