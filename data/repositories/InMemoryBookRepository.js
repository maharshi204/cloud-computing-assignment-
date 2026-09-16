const BookRepository = require('../../business/ports/BookRepository');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class InMemoryBookRepository extends BookRepository {
  constructor(seedBooks = []) {
    super();
    this.store = new Map();
    this.nextId = 1;

    for (const book of seedBooks) {
      const now = new Date().toISOString();
      const entity = {
        id: this.nextId++,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publicationYear: book.publicationYear,
        quantity: book.quantity !== undefined ? book.quantity : 0,
        createdAt: now,
        updatedAt: now
      };
      this.store.set(entity.id, entity);
    }
  }

  clear() {
    this.store.clear();
    this.nextId = 1;
  }

  async create(book) {
    const now = new Date().toISOString();
    const entity = {
      id: this.nextId++,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      quantity: book.quantity !== undefined ? book.quantity : 0,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(entity.id, entity);
    return deepClone(entity);
  }

  _sort(items, sortBy, order) {
    const sortField = sortBy || 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === undefined) aVal = a['createdAt'];
      if (bVal === undefined) bVal = b['createdAt'];

      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal);
      } else {
        if (aVal < bVal) cmp = -1;
        if (aVal > bVal) cmp = 1;
      }
      
      if (cmp === 0) {
        return (a.id - b.id); // stable sort by ID ascending as tie-breaker
      }
      
      return cmp * sortDir;
    });
  }

  async findAll(options = {}) {
    const items = Array.from(this.store.values());
    const sorted = this._sort(items, options.sortBy, options.order);
    return deepClone(sorted);
  }

  async findById(id) {
    const book = this.store.get(id);
    return book ? deepClone(book) : null;
  }

  async findByIsbn(isbn) {
    for (const book of this.store.values()) {
      if (book.isbn === isbn) {
        return deepClone(book);
      }
    }
    return null;
  }

  async search(term, options = {}) {
    const lowerTerm = term.toLowerCase();
    const matches = Array.from(this.store.values()).filter(book => 
      book.title.toLowerCase().includes(lowerTerm) || 
      book.author.toLowerCase().includes(lowerTerm)
    );
    const sorted = this._sort(matches, options.sortBy, options.order);
    return deepClone(sorted);
  }

  async update(id, changes) {
    const book = this.store.get(id);
    if (!book) return null;

    let hasChanges = false;
    const allowedFields = ['title', 'author', 'isbn', 'publicationYear', 'quantity'];
    
    for (const key of Object.keys(changes)) {
      if (allowedFields.includes(key)) {
        book[key] = changes[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      book.updatedAt = new Date().toISOString();
    }

    return deepClone(book);
  }

  async delete(id) {
    return this.store.delete(id);
  }

  async count() {
    return this.store.size;
  }
}

module.exports = InMemoryBookRepository;
