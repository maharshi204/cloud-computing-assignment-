const BookService = require('../../business/services/BookService');
const FakeBookRepository = require('../fakes/FakeBookRepository');
const { NotFoundError, ValidationError, ConflictError } = require('../../business/errors');

describe('BookService - updateBook', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new FakeBookRepository();
    service = new BookService(repo);
    repo.seed([
      { title: 'A', author: 'B', isbn: '1111111111', publicationYear: 2000, quantity: 2 },
      { title: 'C', author: 'D', isbn: '2222222222', publicationYear: 2001, quantity: 1 }
    ]);
  });

  it('16. Updates a single field and leaves others alone', async () => {
    const updated = await service.updateBook(1, { title: 'New Title' });
    expect(updated.title).toBe('New Title');
    expect(updated.author).toBe('B');
  });

  it('17. Throws NotFoundError for an unknown id', async () => {
    await expect(service.updateBook(999, { title: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('18. Rejects an invalid field value in an otherwise valid patch', async () => {
    await expect(service.updateBook(1, { title: 'New', quantity: -1 })).rejects.toThrow(ValidationError);
  });

  it('19. Rejects an empty change set', async () => {
    await expect(service.updateBook(1, {})).rejects.toThrow(ValidationError);
  });

  it('20. Throws ConflictError when changing the ISBN to one held by a different book; allows changing it to its own', async () => {
    await expect(service.updateBook(1, { isbn: '2222222222' })).rejects.toThrow(ConflictError);
    
    const updated = await service.updateBook(1, { isbn: '1111111111' });
    expect(updated.isbn).toBe('1111111111');
  });
});
