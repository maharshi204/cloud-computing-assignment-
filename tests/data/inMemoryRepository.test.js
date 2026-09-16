const InMemoryBookRepository = require('../../data/repositories/InMemoryBookRepository');

describe('InMemoryBookRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryBookRepository();
  });

  it('assigns auto-incrementing ids', async () => {
    const b1 = await repo.create({ title: 'A', author: 'A', isbn: '1', publicationYear: 2000, quantity: 1 });
    const b2 = await repo.create({ title: 'B', author: 'B', isbn: '2', publicationYear: 2000, quantity: 1 });
    expect(b1.id).toBe(1);
    expect(b2.id).toBe(2);
  });

  it('performs case-insensitive partial search across title and author', async () => {
    await repo.create({ title: 'The Matrix', author: 'Wachowski', isbn: '1', publicationYear: 1999, quantity: 1 });
    await repo.create({ title: 'Dune', author: 'Frank Herbert', isbn: '2', publicationYear: 1965, quantity: 1 });

    const titleMatch = await repo.search('mat');
    expect(titleMatch).toHaveLength(1);
    expect(titleMatch[0].title).toBe('The Matrix');

    const authorMatch = await repo.search('her');
    expect(authorMatch).toHaveLength(1);
    expect(authorMatch[0].author).toBe('Frank Herbert');
  });

  it('sorts by field and direction', async () => {
    await repo.create({ title: 'Z', author: 'A', isbn: '1', publicationYear: 2000, quantity: 1 });
    await repo.create({ title: 'A', author: 'Z', isbn: '2', publicationYear: 2000, quantity: 1 });

    const byTitle = await repo.findAll({ sortBy: 'title', order: 'asc' });
    expect(byTitle[0].title).toBe('A');

    const byTitleDesc = await repo.findAll({ sortBy: 'title', order: 'desc' });
    expect(byTitleDesc[0].title).toBe('Z');
  });

  it('returns null on missing id for findById', async () => {
    const res = await repo.findById(999);
    expect(res).toBeNull();
  });

  it('returns false on missing id for delete', async () => {
    const res = await repo.delete(999);
    expect(res).toBe(false);
  });

  it('returns deep clones (mutating result does not change store)', async () => {
    const book = await repo.create({ title: 'Original', author: 'A', isbn: '1', publicationYear: 2000, quantity: 1 });
    
    // Mutate the returned object
    book.title = 'Hacked';
    
    const stored = await repo.findById(book.id);
    expect(stored.title).toBe('Original');
  });
});
