const PostgresBookRepository = require('./repositories/PostgresBookRepository');
const InMemoryBookRepository = require('./repositories/InMemoryBookRepository');

function createRepository(kind, deps = {}) {
  if (kind === 'postgres') {
    const { getPool } = require('./postgres/pool');
    return new PostgresBookRepository(deps.pool || getPool());
  }
  if (kind === 'memory') {
    return new InMemoryBookRepository(deps.seedBooks || []);
  }
  throw new Error(`Invalid data source kind: ${kind}. Must be 'postgres' or 'memory'.`);
}

module.exports = createRepository;
