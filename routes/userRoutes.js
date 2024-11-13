const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser); // '/' saying what we reference to out main route /api/v1/users
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser); // '/:id' saying what we reference to out main route /api/v1/users/:id

module.exports = router;
