const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// middleware is just a function that modify an incoming data. Middle request and response
app.use(express.json()); // JSON parsing middleware to your Express app.

app.use(express.static(`${__dirname}/public`));

//creating own middleware. it is for each, and every single request!
app.use((req, res, next) => {
  console.log('hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES (What is also middleware)

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);

// app.get('/api/v1/tours/:id/:x?', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/api/v1/tours', tourRouter); // in this case /api/v1/tours - this is the main route equal ('/')
app.use('/api/v1/users', userRouter); // in this case /api/v1/users - this is the main route equal ('/')

module.exports = app;
