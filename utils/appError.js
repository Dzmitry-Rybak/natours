class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // later in code we will check if it's operational error, if not, return other Error class

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
