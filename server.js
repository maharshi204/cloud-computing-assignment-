require('dotenv').config();
const config = require('./config');
const { buildApp } = require('./app');

let pool = null;
if (config.dataSource === 'postgres') {
  const { getPool } = require('./data/postgres/pool');
  pool = getPool();
}

const app = buildApp(pool);

const server = app.listen(config.port, () => {
  console.log(`🚀 Library Manager started on port ${config.port}`);
  console.log(`📦 Active data source: ${config.dataSource}`);
});

function shutdown() {
  console.log('\nShutting down gracefully...');
  server.close(async () => {
    if (pool && config.dataSource === 'postgres') {
      const { closePool } = require('./data/postgres/pool');
      await closePool();
    }
    console.log('Closed out remaining connections.');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
