const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { query } = require('express');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: [3, ' A user name must have above then 3 character'],
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please provide a valid email'],
    required: [true, 'A user must have a email'],
    unique: true,
    lowercase: true, // transform email to lowercase
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This validate only works on CREATE and SAVE!
      validator: function (value) {
        return this.password === value;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // if the password has not been modified, exit this function
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; // remove this field from the database

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // it's slower then creating token, so we need to subtract 1sec
  next();
});

// ? we create and add our own method to userSchema (all the user documents will have this method)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  console.log(userPassword);
  // we can't compare it manually, because candidatePassword doesn't hashed
  return await bcrypt.compare(candidatePassword, userPassword); // return true if this passwords are the same
};

userSchema.pre('find', function (next) {
  // wen user get all users, we wel return only users with TRUE active value
  // this.find({ active: { $eq: true } });
  this.find({ active: true });
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000; // number of milliseconds for this date since 1970

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256') // algorithm
    .update(resetToken) // string we want to hash
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // set 10 min (in milliseconds) as time for pass reset expires

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
