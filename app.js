const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const cookieParser = require('cookie-parser');

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers:
// We call this helmet inside use() because this function return middleware function
app.use(helmet()); // protect app from vulnerabilities

// Use cookie-parser middleware
app.use(cookieParser());

// Development logging:
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // allow 100 requests from the same IP
  windowMs: 60 * 60 * 1000, // in 1 hour
  message: 'Too many requests from tis IP, please try again in an hour!', // the message client will get if try more then 100 requests
});
app.use('/api', limiter); // apply this limiter only for /api/* routes

// Body parser:
// middleware is just a function that modify an incoming data. Middle request and response
app.use(express.json()); // JSON parsing middleware to your Express app. Body parser - reading data from body into req.body

// Data sanitization against NoSQL query injection | Hackers can use NoSQL query, example: email: {"$gt": ""} - it will true, so we can use this query and valid password to log in
app.use(mongoSanitize()); // filter out all $ and . from request

// Data sanitization against Cross Side Scripting  (XSS)
app.use(xss()); // clean any user input from malicious html code | to avoid this - "name": "<div id=1>'some-hacker-text'</div>"

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration'], // properties witch we allows to duplicate /tours?duration=4&duration=6 - it's OK
  }),
); // example - /tours?sort=duration&sort=price = will sorting only by price (the last one), without this hpp - we will get error

// Serving static files
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
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// all the middleware are executed in the order they are in the code.
// so if we add a new middleware after all router middleware, it's mean that not any of them where matched
// all the HTTP methods (get, post.. etc) | * - all urls
app.all('*', (req, res, next) => {
  next(new AppError(404, `Rout ${req.originalUrl} is not found`));

  // const err = new Error(`${req.originalUrl} is not found`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); // whatever we pass in next(), node.js will  assume that it's an error, and skip all other middleware, and execute global error middleware
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
