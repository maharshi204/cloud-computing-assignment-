const BookService = require('../../business/services/BookService');
const FakeBookRepository = require('../fakes/FakeBookRepository');
const { NotFoundError } = require('../../business/errors');

describe('BookService - deleteBook', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new FakeBookRepository();
    service = new BookService(repo);
    repo.seed([
      { title: 'A', author: 'B', isbn: '1111111111', publicationYear: 2000, quantity: 2 }
    ]);
  });

  it('21. Deletes an existing book and returns { id }', async () => {
    const res = await service.deleteBook(1);
    expect(res).toEqual({ id: 1 });
    const book = await repo.findById(1);
    expect(book).toBeNull();
  });

  it('22. Throws NotFoundError when the repository reports no row removed', async () => {
    await expect(service.deleteBook(999)).rejects.toThrow(NotFoundError);
  });
});
