const { Pool } = require('pg');

let pool = null;

function createPool(connectionString) {
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
    max: 5,                              // Neon free tier: keep the pool small
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing. Please add it to your .env file or refer to .env.example.');
    }
    pool = createPool(connectionString);
  }
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  createPool,
  getPool,
  closePool
};
