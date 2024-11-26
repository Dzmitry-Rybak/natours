const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getOne = (model, populateOptions) => {
  return async (req, res, next) => {
    try {
      let query = model.findById(req.params.id);

      if (populateOptions) {
        query = query.populate(populateOptions);
      }

      const document = await query;

      if (!document) {
        throw new Error('No document found with that ID');
      }

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (err) {
      return next(new AppError(404, err.message));
    }
  };
};

exports.getAll = (model) => {
  return async (req, res, next) => {
    try {
      // To allow for nested GET reviews on tour
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };

      const features = new APIFeatures(model.find(filter), req.query)
        .filter()
        .sort()
        .fields()
        .pagination();

      // explain method - is used to get detailed inform about how MongoDB execute a query
      const document = await features.query;

      res.status(200).json({
        status: 'success',
        results: document.length,
        data: {
          document,
        },
      });
    } catch (error) {
      next(new AppError(400, error.message));
    }
  };
};

exports.createOne = (model) => {
  return async (req, res, next) => {
    try {
      const document = await model.create(req.body);
      if (!document) {
        throw new Error('You can`t create new document');
      }

      res.status(201).json({
        status: 'success',
        data: {
          data: document,
        },
      });
    } catch (err) {
      next(new AppError(400, err.message));
    }
  };
};

exports.deleteOne = (model) => {
  return async (req, res, next) => {
    try {
      const document = await model.findByIdAndDelete(req.params.id);

      if (!document) {
        throw new Error('No document found with that ID');
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(new AppError(400, error.message)); // 400 - status code - Bad Request
    }
  };
};

exports.updateOne = (model) => {
  return async (req, res, next) => {
    try {
      const document = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!document) {
        throw new Error('No document found with that ID');
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: document,
        },
      });
    } catch (err) {
      next(new AppError(400, err.message));
    }
  };
};
