const BookRepository = require('../../business/ports/BookRepository');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class FakeBookRepository extends BookRepository {
  constructor() {
    super();
    this.store = [];
    this.nextId = 1;
    this.calls = [];
    this.nextError = null;
  }

  _record(method, args) {
    this.calls.push({ method, args });
    if (this.nextError) {
      const err = this.nextError;
      this.nextError = null;
      throw err;
    }
  }

  failNextWith(error) {
    this.nextError = error;
  }

  seed(books) {
    this.store = books.map(b => ({
      id: this.nextId++,
      quantity: 0,
      ...b,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  reset() {
    this.store = [];
    this.nextId = 1;
    this.calls = [];
    this.nextError = null;
  }

  async create(book) {
    this._record('create', [book]);
    const entity = {
      id: this.nextId++,
      ...book,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.push(entity);
    return deepClone(entity);
  }

  async findAll(options) {
    this._record('findAll', [options]);
    return deepClone(this.store);
  }

  async findById(id) {
    this._record('findById', [id]);
    const book = this.store.find(b => b.id === id);
    return book ? deepClone(book) : null;
  }

  async findByIsbn(isbn) {
    this._record('findByIsbn', [isbn]);
    const book = this.store.find(b => b.isbn === isbn);
    return book ? deepClone(book) : null;
  }

  async search(term, options) {
    this._record('search', [term, options]);
    const lower = term.toLowerCase();
    const matches = this.store.filter(b => b.title.toLowerCase().includes(lower) || b.author.toLowerCase().includes(lower));
    return deepClone(matches);
  }

  async update(id, changes) {
    this._record('update', [id, changes]);
    const idx = this.store.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.store[idx] = { ...this.store[idx], ...changes, updatedAt: new Date().toISOString() };
    return deepClone(this.store[idx]);
  }

  async delete(id) {
    this._record('delete', [id]);
    const idx = this.store.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.store.splice(idx, 1);
    return true;
  }

  async count() {
    this._record('count', []);
    return this.store.length;
  }
}

module.exports = FakeBookRepository;
