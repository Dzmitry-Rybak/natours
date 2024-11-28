const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// as middlewares runs in sequence, this middleware here will protect all middleware below with protect middleware
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
// photo - name of the field in the form, that uploading
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  authController.updateMe,
);
router.delete('/deleteMe', authController.deleteMe);
router.get('/logout', authController.logout);

// router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers); // '/' saying what we reference to out main route /api/v1/users

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser); // '/:id' saying what we reference to out main route /api/v1/users/:id

module.exports = router;
