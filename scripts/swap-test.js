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

function normalizeEntity(entity) {
  if (!entity || typeof entity !== 'object') return entity;
  const normalized = { ...entity };
  delete normalized.id;
  delete normalized.createdAt;
  delete normalized.updatedAt;
  return normalized;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => canonicalize(item))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  if (value && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = canonicalize(value[key]);
    }
    return result;
  }

  return value;
}

function deepEqual(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

async function cleanupTestRows(pool) {
  if (!pool) return;
  await pool.query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
}

async function runScenario(service) {
  const log = [];
  const ids = [];

  for (const book of fixtures) {
    const created = await service.createBook(book);
    ids.push(created.id);
  }

  const createdTitles = fixtures.map(book => book.title).sort();
  log.push({ step: '1. Create 3 books', value: { count: ids.length, titles: createdTitles }, display: `Created 3 books with IDs: ${ids.join(',')}` });

  const all = await service.getAllBooks({ sortBy: 'title', order: 'asc' });
  const allTitles = all.map(book => book.title);
  log.push({ step: '2. getAllBooks(title asc)', value: allTitles, display: allTitles.join(', ') });

  const search = await service.searchBooks('mar');
  const searchTitles = search.map(book => book.title);
  log.push({ step: '3. searchBooks("mar")', value: searchTitles, display: searchTitles.join(', ') });

  const firstId = ids[0];
  const book = await service.getBookById(firstId);
  log.push({ step: '4. getBookById(first)', value: normalizeEntity(book), display: book.title });

  const updated = await service.updateBook(firstId, { quantity: 1 });
  log.push({ step: '5. updateBook(qty=1)', value: { quantity: updated.quantity }, display: `Quantity is now ${updated.quantity}` });

  const checkedOut = await service.checkoutBook(firstId);
  log.push({ step: '6. checkoutBook(id)', value: { quantity: checkedOut.quantity }, display: `Quantity is now ${checkedOut.quantity}` });

  try {
    await service.checkoutBook(firstId);
    log.push({ step: '7. checkoutBook again', value: 'FAIL: did not throw', display: 'FAIL: did not throw' });
  } catch (err) {
    log.push({ step: '7. checkoutBook again', value: { code: err.code, message: err.message }, display: `[${err.code}] ${err.message}` });
  }

  try {
    await service.createBook({ ...fixtures[0], isbn: '123456789' });
    log.push({ step: '8. invalid ISBN', value: 'FAIL: did not throw', display: 'FAIL: did not throw' });
  } catch (err) {
    log.push({ step: '8. invalid ISBN', value: { code: err.code, details: err.details || [] }, display: `[${err.code}] ${err.details ? err.details.map(d => d.message).join(';') : ''}` });
  }

  try {
    await service.createBook(fixtures[1]);
    log.push({ step: '9. duplicate ISBN', value: 'FAIL: did not throw', display: 'FAIL: did not throw' });
  } catch (err) {
    log.push({ step: '9. duplicate ISBN', value: { code: err.code, message: err.message }, display: `[${err.code}] ${err.message}` });
  }

  const stats = await service.getStats();
  log.push({ step: '10. getStats()', value: stats, display: `T:${stats.totalTitles} C:${stats.totalCopies} O:${stats.outOfStock}` });

  await service.deleteBook(firstId);
  log.push({ step: '11. deleteBook', value: { deleted: true }, display: 'Deleted' });

  try {
    await service.getBookById(firstId);
    log.push({ step: '12. getBookById deleted', value: 'FAIL: did not throw', display: 'FAIL: did not throw' });
  } catch (err) {
    log.push({ step: '12. getBookById deleted', value: { code: err.code }, display: `[${err.code}]` });
  }

  return { log, ids };
}

async function main() {
  console.log('--- SWAP TEST ---');

  const memRepo = new InMemoryBookRepository();
  const memSvc = new BookService(memRepo);
  console.log('Running In-Memory scenario...');
  const memResult = await runScenario(memSvc);

  const dbUrl = process.env.DATABASE_URL;
  let pgResult = null;
  let pool;

  if (!dbUrl) {
    console.error('\nERROR: DATABASE_URL is missing. The Postgres half needs a real database to run the swap test.');
    process.exit(1);
  }

  pool = getPool();
  try {
    console.log('Preparing clean Postgres database for identical comparison...');
    await cleanupTestRows(pool);

    const pgRepo = new PostgresBookRepository(pool);
    const pgSvc = new BookService(pgRepo);
    console.log('Running Postgres scenario...');
    pgResult = await runScenario(pgSvc);
  } finally {
    if (pool) {
      console.log('Cleaning up Postgres test data...');
      await cleanupTestRows(pool);
      await closePool();
    }
  }

  console.log('\nSTEP | IN-MEMORY | POSTGRES | MATCH');
  console.log('--------------------------------------------------');

  let matchCount = 0;
  for (let i = 0; i < memResult.log.length; i++) {
    const mem = memResult.log[i];
    const pg = pgResult.log[i];
    const match = deepEqual(mem.value, pg.value);

    if (match) matchCount++;

    console.log(`${mem.step.padEnd(20)} | ${match ? 'MATCH' : 'FAIL'}`);
    if (!match) {
      console.log(`  MEM: ${JSON.stringify(mem.value)}`);
      console.log(`  PG:  ${JSON.stringify(pg.value)}`);
    }
  }

  console.log('\n');
  if (matchCount === memResult.log.length) {
    console.log('\x1b[1mSWAP TEST PASSED — 12/12 steps identical\x1b[0m');
    process.exit(0);
  }

  console.log(`\x1b[31mSWAP TEST FAILED — ${matchCount}/${memResult.log.length} steps matched\x1b[0m`);
  process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
