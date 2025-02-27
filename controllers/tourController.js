const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const multer = require('multer');
const sharp = require('sharp'); // allows to do something with images
const AppError = require('../utils/appError');

const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Not an image!'), false);
  }
};

// const upload = multer({ dest: 'public/img/users' }); // place, where save this file | if we not add any options, uploaded img will not saved in memory

const upload = multer({
  storage: multerStorage, // it will put the file data into req.file
  fileFilter: multerFilter, // filter setting the we used when uploading
});

// If we have a lot of field in input, where user will upload many fils - we use .fields
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// If we'a waiting for only 1 single file from one field - we use .single
// upload.single('image') - req.file

// If we want many files from one field - we use .array
// upload.array('images', 5) - req.files

exports.resizeTourImages = async (req, res, next) => {
  // if there no imageCover OR images -> next()
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  // as we want to be available to update images in UpdateOne, we need to add this name in req.body:
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  // 1 - as our sharp - async function, we need to await it
  // 2 - as it's await - it's return promise
  // 3 - as it's return promise, we should wait until it's resolve, so we get all of this promises and awaiting all off them
  const promises = req.files.images.map(async (file, index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images.push(filename);
  });

  //
  await Promise.all(promises);

  next();
};

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = async (req, res) => {
//   try {
//     // BUILD QUERY
//     // // 1) Filtering
//     // const queryObj = { ...req.query };
//     // const excludeFields = ['page', 'sort', 'limit', 'fields']; // fields that we dona exclude
//     // excludeFields.forEach((el) => delete queryObj[el]); // in this case delete all fields from 'queryObj' witch is matches with 'excludeFields'

//     // 2) Advanced filtering
//     // let queryString = JSON.stringify(queryObj);
//     // queryString = queryString.replace(
//     //   /\b(gte|gt|lte|lt)\b/g,
//     //   (match) => `$${match}`,
//     // );

//     // let query = Tour.find(JSON.parse(queryString)); // As we don't use await - it's return query, so by the documentation, we can chain next mongo requests

//     // 3) Sorting
//     // if (req.query.sort) {
//     //   const sortBy = req.query.sort.split(',').join(' ');
//     //   query = query.sort(sortBy);
//     // } else {
//     //   query = query.sort('-createdAt');
//     // }

//     // 4) Field limiting
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' ');
//     //   query = query.select(fields);
//     // } else {
//     //   query = query.select('-__v'); // exclude this __v field
//     // }

//     // 5) Pagination
//     // const page = +req.query.page || 1;
//     // const limit = +req.query.limit || 100;
//     // const skip = (page - 1) * limit;

//     // query.skip(skip).limit(limit);

//     // if (req.query.page) {
//     //   const numTours = await Tour.countDocuments(); // return the number of documents
//     //   if (skip >= numTours) throw new Error('This page does not exist');
//     // }

//     // const query = await Tour.find()
//     //   .where('duration')
//     //   .equals(5)
//     //   .where('difficulty')
//     //   .equal('easy');

//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour, req.query)
//       .filter()
//       .sort()
//       .fields()
//       .pagination();

//     // WE CAN DO THIS CHAINS FOR query, UNTIL WE AWAIT THE LAST query RESULT
//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = async (req, res, next) => {
//   try {
//     // in DB we have ids in this guides, and here we populate (add) users (real data by it's id) in this query
//     const tour = await Tour.findById(req.params.id).populate('reviews'); // we will populate with 'reviews' only in this query getTour

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     return next(new AppError(404, err.message));
//   }
// };

exports.createTour = factory.createOne(Tour);

// exports.createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true, // the new updated document is the one that will  be returned
//       runValidators: true, // will again validate with our Schema
//     });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };

exports.getTourStats = async (req, res) => {
  try {
    // the document will pass throw this stages one by one
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' }, // will group by difficulty and toUpperCase the name of difficulty
          numRatings: { $sum: '$ratingsQuantity' },
          numTours: { $sum: 1 }, // trick to count each tour, 1+1+1...
          averageRating: { $avg: '$ratingsAverage' },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: {
          averagePrice: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = +req.params.year;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTour: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 }, // don't show this field
      },
      {
        $sort: { _id: 1 },
      },
      {
        $limit: 6,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // convert distance in radius using Earth radius in mills or km
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      throw new Error('There no latitude and longitude');
    }

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      throw new Error('There no latitude and longitude');
    }

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [+lng, +lat],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};
