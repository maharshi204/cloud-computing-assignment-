const { ValidationError, NotFoundError, ConflictError, BusinessRuleError } = require('../errors');
const { validateNewBook, validateBookUpdate } = require('../validation/bookValidator');
const { toInt, normalizeString } = require('../validation/normalize');

class BookService {
  constructor(bookRepository) {
    if (!bookRepository) throw new Error('BookService requires a BookRepository');
    this.repository = bookRepository;
  }

  async createBook(input) {
    const { value, errors } = validateNewBook(input);
    if (errors) {
      throw new ValidationError('Invalid book data', errors);
    }

    const existing = await this.repository.findByIsbn(value.isbn);
    if (existing) {
      throw new ConflictError(`A book with ISBN ${value.isbn} already exists.`);
    }

    return await this.repository.create(value);
  }

  async getAllBooks(options = {}) {
    const safeOptions = this._sanitizeOptions(options);
    return await this.repository.findAll(safeOptions);
  }

  async getBookById(id) {
    this._validateId(id);
    const book = await this.repository.findById(id);
    if (!book) {
      throw new NotFoundError(`Book with id ${id} was not found.`);
    }
    return book;
  }

  async searchBooks(term, options = {}) {
    const trimmed = normalizeString(term);
    if (!trimmed) {
      return this.getAllBooks(options);
    }
    const safeOptions = this._sanitizeOptions(options);
    return await this.repository.search(trimmed, safeOptions);
  }

  async updateBook(id, changes) {
    this._validateId(id);
    
    const { value, errors } = validateBookUpdate(changes);
    if (errors) {
      throw new ValidationError('Invalid book data', errors);
    }

    const existing = await this.getBookById(id);

    if (value.isbn && value.isbn !== existing.isbn) {
      const conflict = await this.repository.findByIsbn(value.isbn);
      if (conflict) {
        throw new ConflictError(`A book with ISBN ${value.isbn} already exists.`);
      }
    }

    const updated = await this.repository.update(id, value);
    if (!updated) {
      throw new NotFoundError(`Book with id ${id} was not found.`);
    }
    return updated;
  }

  async deleteBook(id) {
    this._validateId(id);
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Book with id ${id} was not found.`);
    }
    return { id };
  }

  async checkoutBook(id) {
    this._validateId(id);
    const book = await this.getBookById(id);
    
    if (book.quantity <= 0) {
      throw new BusinessRuleError(`"${book.title}" is not available for checkout — 0 copies remaining.`);
    }

    const updated = await this.repository.update(id, { quantity: book.quantity - 1 });
    return updated;
  }

  async getStats() {
    const books = await this.repository.findAll({});
    let totalTitles = books.length;
    let totalCopies = 0;
    let outOfStock = 0;

    for (const book of books) {
      totalCopies += book.quantity;
      if (book.quantity === 0) {
        outOfStock++;
      }
    }

    return {
      totalTitles,
      totalCopies,
      outOfStock
    };
  }

  _validateId(id) {
    const parsedId = toInt(id);
    if (Number.isNaN(parsedId) || parsedId < 1) {
      throw new ValidationError('Invalid id', [{ field: 'id', message: 'ID must be a positive integer.' }]);
    }
  }

  _sanitizeOptions(options) {
    const whitelistSort = ['title', 'author', 'publicationYear', 'quantity', 'createdAt'];
    const safeOptions = {
      sortBy: 'createdAt',
      order: 'desc'
    };
    if (options.sortBy && whitelistSort.includes(options.sortBy)) {
      safeOptions.sortBy = options.sortBy;
    }
    if (options.order === 'asc' || options.order === 'desc') {
      safeOptions.order = options.order;
    }
    return safeOptions;
  }
}

module.exports = BookService;
