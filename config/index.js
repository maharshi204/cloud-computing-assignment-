require('dotenv').config();

const dataSource = process.env.DATA_SOURCE || 'postgres';
const port = parseInt(process.env.PORT || '3000', 10);
const databaseUrl = process.env.DATABASE_URL;

if (dataSource !== 'postgres' && dataSource !== 'memory') {
  throw new Error(`Invalid DATA_SOURCE: '${dataSource}'. Must be 'postgres' or 'memory'.`);
}

if (dataSource === 'postgres' && !databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required when DATA_SOURCE is postgres. Please check your .env file or refer to .env.example.');
}

const config = {
  dataSource,
  port,
  databaseUrl,
  env: process.env.NODE_ENV || 'development'
};

module.exports = Object.freeze(config);
