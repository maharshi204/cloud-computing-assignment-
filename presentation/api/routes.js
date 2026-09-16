const express = require('express');
const { createBookController } = require('./bookController');

function createBookRouter(bookService) {
  const router = express.Router();
  const controller = createBookController(bookService);

  router.get('/health', controller.health);
  router.get('/meta', controller.meta);
  router.get('/books/stats', controller.getStats);
  router.get('/books', controller.getAllBooks);
  router.get('/books/:id', controller.getBookById);
  router.post('/books', controller.createBook);
  router.put('/books/:id', controller.updateBookPut);
  router.patch('/books/:id', controller.updateBookPatch);
  router.delete('/books/:id', controller.deleteBook);
  router.post('/books/:id/checkout', controller.checkoutBook);

  return router;
}

module.exports = { createBookRouter };
