require('dotenv').config();
const { getPool, closePool } = require('../data/postgres/pool');

async function reset() {
  const dataSource = process.env.DATA_SOURCE || 'postgres';
  if (dataSource !== 'postgres') {
    console.log('Cannot reset non-postgres database');
    return;
  }

  const pool = getPool();
  try {
    console.log('Dropping tables...');
    await pool.query('DROP TABLE IF EXISTS books CASCADE');
    console.log('Done.');
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

reset().then(() => {
  require('./migrate.js');
  // wait for migrate to finish then seed
  setTimeout(() => require('./seed.js'), 1000);
});
