class BookRepository {
  async create(book) {
    throw new Error('BookRepository.create is not implemented');
  }
  async findAll(options) {
    throw new Error('BookRepository.findAll is not implemented');
  }
  async findById(id) {
    throw new Error('BookRepository.findById is not implemented');
  }
  async findByIsbn(isbn) {
    throw new Error('BookRepository.findByIsbn is not implemented');
  }
  async search(term, options) {
    throw new Error('BookRepository.search is not implemented');
  }
  async update(id, changes) {
    throw new Error('BookRepository.update is not implemented');
  }
  async delete(id) {
    throw new Error('BookRepository.delete is not implemented');
  }
  async count() {
    throw new Error('BookRepository.count is not implemented');
  }
}

module.exports = BookRepository;
