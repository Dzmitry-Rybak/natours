const fs = require('fs');

const usersFileName = `${__dirname}/../dev-data/data/users.json`;
const users = JSON.parse(fs.readFileSync(usersFileName, 'utf-8'));

exports.getAllUsers = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: {
      users,
    },
  });
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
