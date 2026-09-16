require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('../config');
const createRepository = require('../data');
const BookService = require('../business/services/BookService');

async function seed() {
  if (config.dataSource !== 'postgres') {
    console.log(`Skipping seed: DATA_SOURCE is ${config.dataSource} (Memory is seeded automatically)`);
    return;
  }

  let pool;
  try {
    const { getPool, closePool } = require('../data/postgres/pool');
    pool = getPool();
    const repository = createRepository('postgres', { pool });
    const bookService = new BookService(repository);

    const seedPath = path.join(__dirname, '../data/seed/books.json');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    console.log(`Seeding ${seedData.length} books...`);
    let seeded = 0;
    
    for (const book of seedData) {
      try {
        await bookService.createBook(book);
        seeded++;
        console.log(`+ ${book.title}`);
      } catch (err) {
        if (err.code === 'CONFLICT') {
          console.log(`- ${book.title} (already exists)`);
        } else {
          throw err;
        }
      }
    }
    
    console.log(`Seed complete. Added ${seeded} new books.`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    if (pool) {
      const { closePool } = require('../data/postgres/pool');
      await closePool();
    }
  }
}

seed();
