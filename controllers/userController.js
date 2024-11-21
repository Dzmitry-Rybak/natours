const fs = require('fs');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const usersFileName = `${__dirname}/../dev-data/data/users.json`;
const users = JSON.parse(fs.readFileSync(usersFileName, 'utf-8'));

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      newObject[item] = obj[item];
    }
  });
  return newObject;
};

exports.getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find();

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: allUsers.length,
      data: {
        allUsers,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      throw new Error(
        'You can`t change your password here. Please use /updatePassword',
      );
    }

    // 2) Filtered out unwanted fields
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: 'success',
      data: updatedUser,
    });
  } catch (error) {
    next(new AppError(400, error.message)); // 400 - Bad Request
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false }); // we can just change this property, not delete user

    res.status(204).json({
      message: 'success',
      data: null,
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};

exports.getUser = (req, res) => {
  // in this case x - optional parameter

  const id = +req.params.id;

  const tour = users.find((tour) => tour.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createUser = (req, res) => {
  const newId = users[users.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body); // just in a new object { id: newId } we have adding info from req.body.
  users.push(newTour);
  fs.writeFile(fileName, JSON.stringify(users), (err) => {
    if (err) {
      throw new Error(err);
    }
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
};

exports.updateUser = (req, res) => {
  const id = +req.params.id;
  const tour = users.find((tour) => tour.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour>',
    },
  });
};

exports.deleteUser = (req, res) => {
  const id = +req.params.id;
  const tour = users.find((tour) => tour.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
