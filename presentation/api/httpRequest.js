function parseId(req) {
  const num = Number(req.params.id);
  return isNaN(num) ? req.params.id : num;
}

function readQuery(req) {
  return {
    search: req.query.search || '',
    sortBy: req.query.sortBy,
    order: req.query.order
  };
}

function requireJsonObject(req) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const { ValidationError } = require('../../business/errors');
    throw new ValidationError('Request body must be a JSON object', [{ field: 'body', message: 'Expected JSON object' }]);
  }
  return body;
}

module.exports = {
  parseId,
  readQuery,
  requireJsonObject
};
