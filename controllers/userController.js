const User = require('../models/userModel');
const multer = require('multer');
const sharp = require('sharp'); // allows to do something with images
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// will save the file in the disk!
// const multerStorage = multer.diskStorage({
//   // cb - something like next in express
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-123123fas33-312312.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// at this point the image will be stored as a Buffer
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

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  // so when using memoryStorage, we don't have filename, so we need to put it because then in 'updateMe' we'r using it
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.uploadUserPhoto = upload.single('photo'); // alow to upload one single file
