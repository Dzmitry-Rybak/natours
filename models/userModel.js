const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  // active: {
  //   type: Boolean,
  // },
  photo: {
    type: String,
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
});

userSchema.pre('save', async function (next) {
  // if the password has not been modified, exit this function
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; // remove this field from the database

  next();
});

// ? we create and add our own method to userSchema (all the user documents will have this method)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // we can't compare it manually, because candidatePassword doesn't hashed
  return await bcrypt.compare(candidatePassword, userPassword); // return true if this passwords are the same
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000; // number of milliseconds for this date since 1970

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
