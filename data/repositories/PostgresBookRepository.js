const BookRepository = require('../../business/ports/BookRepository');
const DataAccessError = require('../errors/DataAccessError');
const { toEntity } = require('../postgres/bookMapper');

const ALLOWED_SORT_COLUMNS = {
  title: 'title',
  author: 'author',
  publicationYear: 'publication_year',
  quantity: 'quantity',
  createdAt: 'created_at'
};

const ALLOWED_UPDATE_COLUMNS = {
  title: 'title',
  author: 'author',
  isbn: 'isbn',
  publicationYear: 'publication_year',
  quantity: 'quantity'
};

class PostgresBookRepository extends BookRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async _query(text, params) {
    try {
      return await this.pool.query(text, params);
    } catch (err) {
      throw new DataAccessError('Database query failed', { cause: err });
    }
  }

  async create(book) {
    const sql = `
      INSERT INTO books (title, author, isbn, publication_year, quantity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [book.title, book.author, book.isbn, book.publicationYear, book.quantity];
    const { rows } = await this._query(sql, params);
    return toEntity(rows[0]);
  }

  async findAll(options = {}) {
    let { sortBy = 'createdAt', order = 'desc' } = options;
    
    let sortCol = ALLOWED_SORT_COLUMNS[sortBy] || 'created_at';
    let sortDir = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sql = `SELECT * FROM books ORDER BY ${sortCol} ${sortDir}, id ASC`;
    const { rows } = await this._query(sql);
    return rows.map(toEntity);
  }

  async findById(id) {
    const sql = `SELECT * FROM books WHERE id = $1`;
    const { rows } = await this._query(sql, [id]);
    return rows.length ? toEntity(rows[0]) : null;
  }

  async findByIsbn(isbn) {
    const sql = `SELECT * FROM books WHERE isbn = $1`;
    const { rows } = await this._query(sql, [isbn]);
    return rows.length ? toEntity(rows[0]) : null;
  }

  async search(term, options = {}) {
    let { sortBy = 'createdAt', order = 'desc' } = options;
    
    let sortCol = ALLOWED_SORT_COLUMNS[sortBy] || 'created_at';
    let sortDir = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Escape % and _ in term for LIKE
    const escapedTerm = term.replace(/[%_]/g, '\\$&');
    const likeTerm = `%${escapedTerm}%`;

    const sql = `
      SELECT * FROM books 
      WHERE title ILIKE $1 OR author ILIKE $1 
      ORDER BY ${sortCol} ${sortDir}, id ASC
    `;
    const { rows } = await this._query(sql, [likeTerm]);
    return rows.map(toEntity);
  }

  async update(id, changes) {
    const updates = [];
    const params = [id];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(changes)) {
      if (ALLOWED_UPDATE_COLUMNS[key] !== undefined) {
        updates.push(`${ALLOWED_UPDATE_COLUMNS[key]} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id); // Return unchanged if no changes
    }

    updates.push(`updated_at = NOW()`);

    const sql = `
      UPDATE books 
      SET ${updates.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;
    const { rows } = await this._query(sql, params);
    return rows.length ? toEntity(rows[0]) : null;
  }

  async delete(id) {
    const sql = `DELETE FROM books WHERE id = $1`;
    const { rowCount } = await this._query(sql, [id]);
    return rowCount > 0;
  }

  async count() {
    const sql = `SELECT COUNT(*) as count FROM books`;
    const { rows } = await this._query(sql);
    return parseInt(rows[0].count, 10);
  }
}

module.exports = PostgresBookRepository;
