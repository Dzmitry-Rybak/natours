const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      newObject[item] = obj[item];
    }
  });
  return newObject;
};

const signToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ), // 90 d * 24h * 60min * 60sec * 1000 mil - convert to milliseconds
    // secure: true, // cookie will only be send on encrypted connection (https)
    httpOnly: true, // cookie can not be access/modified by the Browser
  });

  return token;
};

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
    const token = signToken(newUser._id, res);

    // remove password from response
    newUser.password = undefined;

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

    const correct = await user?.correctPassword(password, user.password);

    if (!user || !correct) {
      return next(new AppError(401, 'Incorrect email or password'));
    }

    // 3) if everything ok, send token to client
    const token = signToken(user._id, res);

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

exports.logout = (req, res, next) => {
  try {
    res.clearCookie('jwt');
    res.status(201).json({
      status: 'success',
      message: 'Log out successfully',
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from request
    // let token;
    // if (
    //   req.headers.authorization &&
    //   req.headers.authorization.startsWith('Bearer')
    // ) {
    //   token = req.headers.authorization.split(' ')[1];
    // }

    // 1) Get token from request COOKIES
    const token = req.cookies.jwt;

    if (!token) {
      throw new Error('Invalid headers');
    }
    // 2) compare tokens

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // payload with {id, iat, exp}

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new Error('There no exist user with given ID');
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

// send POST request with email -> reset password -> create reset token (not JWT token) -> send that
exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new Error('No such user');
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();

    // we also  off this validation, because we don't want to exmp confirm the password
    await user.save({ validateBeforeSave: false }); // as we refresh data this.passwordResetExpires in createPasswordResetToken we must to save this document in DB

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password 
    and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

    // res.status(200).json({
    //   status: 'success',
    //   message: 'Token sent to email',
    //   resetTokenIsThereForTest: resetToken,
    // });

    // skip this sendEmail case!
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token valid for 10 min',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
      });
    } catch (error) {
      // console.log(error);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          500,
          'There was an error sending the email. Try again later!',
        ),
      );
    }
  } catch (error) {
    next(new AppError(500, error.message));
  }
};

// send token from email with password along to update the password
exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // we return user only in case if resetToken from email is equal to resetToken in DataBase and if Token doesn't expired a
    const user = await User.findOne({
      passwordResetToken: hashedToken, // find user by this given resetToken witch user get via email
      passwordResetExpires: { $gt: Date.now() }, // and that token date in DataBase must be greater then todays date
    });

    if (!user) {
      throw new Error('Token is invalid or has expired');
    }

    // 2) IF token has not expired, and there is user, set the new password. Clear ResetToken data from DataBase
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
      message: 'success',
      token,
    });
  } catch (error) {
    next(new AppError(400, error.message));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection

    const user = await User.findOne({ email: req.user.email }).select(
      '+password',
    );
    // 2) Check if POSTed current password is correct

    const { passwordCurrent, password, passwordConfirm } = req.body;
    const current = await user.correctPassword(passwordCurrent, user.password);

    if (!user && !current) {
      throw new Error('Incorrect password');
    }

    // 3) Update the password if correct
    user.password = password;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    // 4) Log user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
      message: 'success',
      token,
    });
  } catch (error) {
    next(new AppError(401, error.message));
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    console.log(req.file);
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      throw new Error(
        'You can`t change your password here. Please use /updatePassword',
      );
    }

    // 2) Filtered out unwanted fields
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename; // allow updating 'photo' field in DataBase

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
