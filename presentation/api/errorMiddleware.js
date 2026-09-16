const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
  DATA_ACCESS_ERROR: 503,
};

function errorMiddleware(err, req, res, next) {
  const status = STATUS_BY_CODE[err.code] || 500;
  
  if (status === 500) {
    console.error('Unhandled Error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }

  const responseBody = {
    error: {
      code: err.code,
      message: err.message
    }
  };

  if (err.details && err.details.length > 0) {
    responseBody.error.details = err.details;
  }

  res.status(status).json(responseBody);
}

module.exports = errorMiddleware;
