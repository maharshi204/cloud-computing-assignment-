const express = require('express');
const config = require('./config');
const createRepository = require('./data');
const BookService = require('./business/services/BookService');
const { createBookRouter } = require('./presentation/api/routes');
const errorMiddleware = require('./presentation/api/errorMiddleware');
const path = require('path');

function buildApp(pool) {
  const repository = createRepository(config.dataSource, { pool });
  const bookService = new BookService(repository);
  const bookRouter = createBookRouter(bookService);

  const app = express();

  // Minimal request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Body parser with 100kb limit and JSON-parse error handler
  app.use(express.json({ limit: '100kb' }));
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Invalid JSON payload' }
      });
    }
    next();
  });

  // API Routes
  app.use('/api', bookRouter);

  // Static files
  app.use(express.static(path.join(__dirname, 'presentation/web'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // 404 handler for unmatched /api/* routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });

  // SPA fallback that serves index.html for non-/api GETs
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'presentation/web/index.html'));
    } else {
      next();
    }
  });

  // Error middleware
  app.use(errorMiddleware);

  return app;
}

module.exports = { buildApp };
