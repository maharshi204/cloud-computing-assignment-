class DataAccessError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'DataAccessError';
    this.code = 'DATA_ACCESS_ERROR';
    this.cause = options.cause;
    
    // Capture stack trace, excluding constructor call from it.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = DataAccessError;
