const BookService = require('../../business/services/BookService');
const FakeBookRepository = require('../fakes/FakeBookRepository');
const { NotFoundError } = require('../../business/errors');

describe('BookService - read', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new FakeBookRepository();
    service = new BookService(repo);
    repo.seed([
      { title: 'A', author: 'B', isbn: '1111111111', publicationYear: 2000, quantity: 2 },
      { title: 'C', author: 'D', isbn: '2222222222', publicationYear: 2001, quantity: 0 }
    ]);
  });

  it('10. getAllBooks returns everything the repository returns, untouched', async () => {
    const books = await service.getAllBooks();
    expect(books).toHaveLength(2);
    expect(repo.calls.some(c => c.method === 'findAll')).toBe(true);
  });

  it('11. getBookById throws NotFoundError when the repository returns null', async () => {
    await expect(service.getBookById(999)).rejects.toThrow(NotFoundError);
  });

  it('12. searchBooks forwards the term to repository.search', async () => {
    await service.searchBooks('term');
    const searchCall = repo.calls.find(c => c.method === 'search');
    expect(searchCall).toBeDefined();
    expect(searchCall.args[0]).toBe('term');
  });

  it('13. searchBooks("   ") falls back to findAll — search is not called', async () => {
    await service.searchBooks('   ');
    expect(repo.calls.some(c => c.method === 'search')).toBe(false);
    expect(repo.calls.some(c => c.method === 'findAll')).toBe(true);
  });

  it('14. An invalid sort field falls back to the default instead of throwing', async () => {
    await service.getAllBooks({ sortBy: 'invalidField', order: 'asc' });
    const call = repo.calls.find(c => c.method === 'findAll');
    expect(call.args[0].sortBy).toBe('createdAt');
    expect(call.args[0].order).toBe('asc');
  });

  it('15. getStats computes totalTitles, totalCopies, and outOfStock correctly from a seeded fake', async () => {
    const stats = await service.getStats();
    expect(stats.totalTitles).toBe(2);
    expect(stats.totalCopies).toBe(2);
    expect(stats.outOfStock).toBe(1);
  });
});
