/* Note: not a single line of /business was modified or re-imported differently between these two runs — only the constructor argument changed. */
require('dotenv').config();
const InMemoryBookRepository = require('../data/repositories/InMemoryBookRepository');
const PostgresBookRepository = require('../data/repositories/PostgresBookRepository');
const BookService = require('../business/services/BookService');
const { getPool, closePool } = require('../data/postgres/pool');

const fixtures = [
  { title: "Mars Colonization", author: "Elon Musk", isbn: "9999999990", publicationYear: 2025, quantity: 2 },
  { title: "Martian Chronicles", author: "Ray Bradbury", isbn: "9999999991", publicationYear: 1950, quantity: 5 },
  { title: "Dune", author: "Frank Herbert", isbn: "9999999992", publicationYear: 1965, quantity: 0 }
];

async function runScenario(service, label) {
  const log = [];
  const record = (step, result) => log.push({ step, result });
  
  // 1. createBook x 3
  const ids = [];
  for (const book of fixtures) {
    const created = await service.createBook(book);
    ids.push(created.id);
  }
  record('1. Create 3 books', `Created 3 books with IDs: ${ids.join(',')}`);

  // 2. getAllBooks
  const all = await service.getAllBooks({ sortBy: 'title', order: 'asc' });
  record('2. getAllBooks(title asc)', all.map(b => b.title).join(', '));

  // 3. searchBooks
  const search = await service.searchBooks('mar');
  record('3. searchBooks("mar")', search.map(b => b.title).join(', '));

  const firstId = ids[0];

  // 4. getBookById
  const book = await service.getBookById(firstId);
  record('4. getBookById(first)', book.title);

  // 5. updateBook
  const updated = await service.updateBook(firstId, { quantity: 1 });
  record('5. updateBook(qty=1)', `Quantity is now ${updated.quantity}`);

  // 6. checkoutBook (1 -> 0)
  const checkedOut = await service.checkoutBook(firstId);
  record('6. checkoutBook(id)', `Quantity is now ${checkedOut.quantity}`);

  // 7. checkoutBook again (expect error)
  try {
    await service.checkoutBook(firstId);
    record('7. checkoutBook again', 'FAIL: did not throw');
  } catch (err) {
    record('7. checkoutBook again', `[${err.code}] ${err.message}`);
  }

  // 8. createBook with 9-digit ISBN
  try {
    await service.createBook({ ...fixtures[0], isbn: '123456789' });
    record('8. invalid ISBN', 'FAIL: did not throw');
  } catch (err) {
    record('8. invalid ISBN', `[${err.code}] ${err.details.map(d=>d.message).join(';')}`);
  }

  // 9. duplicate ISBN
  try {
    await service.createBook(fixtures[1]);
    record('9. duplicate ISBN', 'FAIL: did not throw');
  } catch (err) {
    record('9. duplicate ISBN', `[${err.code}] ${err.message}`);
  }

  // 10. getStats
  const stats = await service.getStats();
  record('10. getStats()', `T:${stats.totalTitles} C:${stats.totalCopies} O:${stats.outOfStock}`);

  // 11. deleteBook
  await service.deleteBook(firstId);
  record('11. deleteBook', 'Deleted');

  // 12. getBookById (expect NOT_FOUND)
  try {
    await service.getBookById(firstId);
    record('12. getBookById deleted', 'FAIL: did not throw');
  } catch (err) {
    record('12. getBookById deleted', `[${err.code}]`);
  }

  return { log, ids };
}

async function main() {
  console.log('--- SWAP TEST ---');
  
  // Memory Run
  const memRepo = new InMemoryBookRepository();
  const memSvc = new BookService(memRepo);
  console.log('Running In-Memory scenario...');
  const memResult = await runScenario(memSvc, 'Memory');

  // Postgres Run
  const dbUrl = process.env.DATABASE_URL;
  let pgResult = null;
  let pgIds = [];

  if (!dbUrl) {
    console.error('\nERROR: DATABASE_URL is missing. The Postgres half needs a real database to run the swap test.');
    process.exit(1);
  }

  const pool = getPool();
  try {
    console.log('Preparing clean Postgres database for identical comparison...');
    await pool.query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
    
    const pgRepo = new PostgresBookRepository(pool);
    const pgSvc = new BookService(pgRepo);
    console.log('Running Postgres scenario...');
    pgResult = await runScenario(pgSvc, 'Postgres');
    pgIds = pgResult.ids;
  } finally {
    console.log('Cleaning up Postgres test data...');
    await pool.query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
    await closePool();
  }

  // Compare
  console.log('\nSTEP | IN-MEMORY | POSTGRES | MATCH');
  console.log('--------------------------------------------------');
  
  let matches = 0;
  for (let i = 0; i < memResult.log.length; i++) {
    const mem = memResult.log[i];
    const pg = pgResult.log[i];
    
    // Normalize IDs for comparison (since Postgres auto-increments unpredictably relative to Memory)
    let pgResStr = pg.result;
    if (i === 0) {
      pgResStr = 'Created 3 books with IDs: [omitted]';
      mem.result = 'Created 3 books with IDs: [omitted]';
    }

    const match = mem.result === pgResStr;
    if (match) matches++;

    console.log(`${mem.step.padEnd(20)} | ${match ? 'MATCH' : 'FAIL'}`);
    if (!match) {
      console.log(`  MEM: ${mem.result}`);
      console.log(`  PG:  ${pgResStr}`);
    }
  }

  console.log('\n');
  if (matches === memResult.log.length) {
    console.log('\x1b[1mSWAP TEST PASSED — 12/12 steps identical\x1b[0m');
    process.exit(0);
  } else {
    console.log(`\x1b[31mSWAP TEST FAILED — ${matches}/${memResult.log.length} steps matched\x1b[0m`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
