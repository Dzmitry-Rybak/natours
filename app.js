const express = require('express');
const morgan = require('morgan');

const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');

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

// all the middleware are executed in the order they are in the code.
// so if we add a new middleware after all router middleware, it's mean that not any of them where matched
// all the HTTP methods (get, post.. etc) | * - all urls
app.all('*', (req, res, next) => {
  next(new AppError(404, `${req.originalUrl} is not found`));

  // const err = new Error(`${req.originalUrl} is not found`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); // whatever we pass in next(), node.js will  assume that it's an error, and skip all other middleware, and execute global error middleware
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
