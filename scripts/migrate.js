require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../data/postgres/pool');

async function migrate() {
  const dataSource = process.env.DATA_SOURCE || 'postgres';
  if (dataSource !== 'postgres') {
    console.log(`Skipping migration: DATA_SOURCE is ${dataSource}`);
    return;
  }

  const pool = getPool();
  try {
    const schemaPath = path.join(__dirname, '../data/sql/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(schemaSql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
