const { ok, created } = require('./httpResponse');
const { parseId, readQuery, requireJsonObject } = require('./httpRequest');

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function createBookController(bookService) {
  return {
    health: asyncHandler(async (req, res) => {
      const dataSource = require('../../config').dataSource;
      ok(res, { status: 'ok', uptime: process.uptime(), dataSource });
    }),
    
    meta: asyncHandler(async (req, res) => {
      const dataSource = require('../../config').dataSource;
      ok(res, { dataSource, version: '1.0.0' });
    }),

    getAllBooks: asyncHandler(async (req, res) => {
      const { search, sortBy, order } = readQuery(req);
      const books = await bookService.searchBooks(search, { sortBy, order });
      res.status(200).json({ data: books, meta: { count: books.length } });
    }),

    getStats: asyncHandler(async (req, res) => {
      const stats = await bookService.getStats();
      ok(res, stats);
    }),

    getBookById: asyncHandler(async (req, res) => {
      const id = parseId(req);
      const book = await bookService.getBookById(id);
      ok(res, book);
    }),

    createBook: asyncHandler(async (req, res) => {
      const body = requireJsonObject(req);
      const book = await bookService.createBook(body);
      res.location(`/api/books/${book.id}`);
      created(res, book);
    }),

    updateBookPut: asyncHandler(async (req, res) => {
      const id = parseId(req);
      const body = requireJsonObject(req);
      const requiredFields = ['title', 'author', 'isbn', 'publicationYear', 'quantity'];
      const missing = requiredFields.filter(f => body[f] === undefined);
      if (missing.length > 0) {
        const { ValidationError } = require('../../business/errors');
        throw new ValidationError('Invalid book data', missing.map(f => ({ field: f, message: `Field ${f} is required for PUT` })));
      }
      const book = await bookService.updateBook(id, body);
      ok(res, book);
    }),

    updateBookPatch: asyncHandler(async (req, res) => {
      const id = parseId(req);
      const body = requireJsonObject(req);
      const book = await bookService.updateBook(id, body);
      ok(res, book);
    }),

    deleteBook: asyncHandler(async (req, res) => {
      const id = parseId(req);
      const result = await bookService.deleteBook(id);
      ok(res, result);
    }),

    checkoutBook: asyncHandler(async (req, res) => {
      const id = parseId(req);
      const book = await bookService.checkoutBook(id);
      ok(res, book);
    })
  };
}

module.exports = { createBookController };
