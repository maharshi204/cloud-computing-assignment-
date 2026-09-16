class AppError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'AppError';
    this.code = 'INTERNAL_ERROR';
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, details);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.code = 'CONFLICT';
  }
}

class BusinessRuleError extends AppError {
  constructor(message) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = 'BUSINESS_RULE_VIOLATION';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError
};
