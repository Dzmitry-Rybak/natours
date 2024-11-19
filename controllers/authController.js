const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = async (req, res) => {
  try {
    // we avoid storing all data that comes from body, because user can manually send role: admin.
    // so we add only data that we'r interested in
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    // {payload, secret, options - when expire}
    const token = signToken(newUser._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError(400, 'Please provide email and password!'));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); // add passport to out response from db (we exclude this field in userModel)

    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
      return next(new AppError(401, 'Incorrect email or password'));
    }

    // 3) if everything ok, send token to client
    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from request
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new Error('Invalid token');
    }
    // 2) compare tokens

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // payload with {id, iat, exp}

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new Error();
    }
    // 4) Check if user changed password after the token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new Error('User recently changed password! Please log in again');
    }

    // Grant Access To Protected Route
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError(401, error.message));
  }
};

// so, as we can't put arguments into middleware, we create function and then from this
// return middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles - array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, `You don't have the access to perform thi action`),
      );
    }
    next();
  };
};
