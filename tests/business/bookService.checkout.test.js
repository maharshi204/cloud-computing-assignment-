const BookService = require('../../business/services/BookService');
const FakeBookRepository = require('../fakes/FakeBookRepository');
const { BusinessRuleError } = require('../../business/errors');

describe('BookService - checkoutBook', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new FakeBookRepository();
    service = new BookService(repo);
    repo.seed([
      { title: 'A', author: 'B', isbn: '1111111111', publicationYear: 2000, quantity: 3 },
      { title: 'C', author: 'D', isbn: '2222222222', publicationYear: 2001, quantity: 0 }
    ]);
  });

  it('23. Decrements quantity from 3 -> 2 and returns the updated book', async () => {
    const updated = await service.checkoutBook(1);
    expect(updated.quantity).toBe(2);
  });

  it('24. Throws BusinessRuleError when quantity is 0, and repository.update is never called', async () => {
    await expect(service.checkoutBook(2)).rejects.toThrow(BusinessRuleError);
    expect(repo.calls.some(c => c.method === 'update')).toBe(false);
  });

  it('25. Quantity never goes below 0 across repeated checkouts: 1 -> 0 succeeds, next throws', async () => {
    await service.updateBook(1, { quantity: 1 });
    
    // 1 -> 0
    await service.checkoutBook(1);
    
    // 0 -> throws
    await expect(service.checkoutBook(1)).rejects.toThrow(BusinessRuleError);
  });

  it('26. A repository failure propagates without being swallowed or misreported', async () => {
    repo.failNextWith(new Error('DB connection lost'));
    // Since getBookById calls the repo first, it will throw there.
    await expect(service.checkoutBook(1)).rejects.toThrow('DB connection lost');
  });
});
