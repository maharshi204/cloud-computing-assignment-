const BookService = require('../../business/services/BookService');
const FakeBookRepository = require('../fakes/FakeBookRepository');
const { ValidationError, ConflictError } = require('../../business/errors');

describe('BookService - createBook', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = new FakeBookRepository();
    service = new BookService(repo);
  });

  const validBook = {
    title: 'Test Book',
    author: 'John Doe',
    isbn: '1234567890',
    publicationYear: 2020,
    quantity: 1
  };

  it('1. Creates a book with valid data and returns the stored entity with an id', async () => {
    const book = await service.createBook(validBook);
    expect(book).toHaveProperty('id');
    expect(book.title).toBe(validBook.title);
    expect(repo.calls.length).toBeGreaterThan(0);
    expect(repo.calls[repo.calls.length - 1].method).toBe('create');
  });

  it('2. Rejects an empty/whitespace-only title with ValidationError mentioning title, and repository.create is never called', async () => {
    await expect(service.createBook({ ...validBook, title: '   ' })).rejects.toThrow(ValidationError);
    try {
      await service.createBook({ ...validBook, title: '   ' });
    } catch (err) {
      expect(err.details).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: 'title' })
      ]));
    }
    expect(repo.calls.some(c => c.method === 'create')).toBe(false);
  });

  it('3. Rejects an empty author', async () => {
    await expect(service.createBook({ ...validBook, author: '' })).rejects.toThrow(ValidationError);
  });

  it('4. Rejects an ISBN of 9 digits, 12 digits, or one containing letters; accepts exactly 10 and exactly 13; accepts a hyphenated ISBN and stores it normalized', async () => {
    await expect(service.createBook({ ...validBook, isbn: '123456789' })).rejects.toThrow(ValidationError);
    await expect(service.createBook({ ...validBook, isbn: '123456789012' })).rejects.toThrow(ValidationError);
    await expect(service.createBook({ ...validBook, isbn: '123456789X' })).rejects.toThrow(ValidationError);
    
    const b10 = await service.createBook({ ...validBook, isbn: '0987654321' });
    expect(b10.isbn).toBe('0987654321');
    
    const b13 = await service.createBook({ ...validBook, isbn: '1234567890123' });
    expect(b13.isbn).toBe('1234567890123');

    const hyphenated = await service.createBook({ ...validBook, isbn: '123-456-789-0' });
    expect(hyphenated.isbn).toBe('1234567890');
  });

  it('5. Rejects a publication year in the future', async () => {
    const nextYear = new Date().getFullYear() + 1;
    await expect(service.createBook({ ...validBook, publicationYear: nextYear })).rejects.toThrow(ValidationError);
  });

  it('6. Rejects a negative quantity; accepts 0', async () => {
    await expect(service.createBook({ ...validBook, quantity: -1 })).rejects.toThrow(ValidationError);
    const b = await service.createBook({ ...validBook, quantity: 0, isbn: '9999999999' });
    expect(b.quantity).toBe(0);
  });

  it('7. Collects multiple field errors in a single ValidationError.details', async () => {
    try {
      await service.createBook({
        title: '',
        author: '',
        isbn: '123',
        publicationYear: 3000,
        quantity: -5
      });
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveLength(5);
    }
  });

  it('8. Throws ConflictError when findByIsbn returns an existing book', async () => {
    await service.createBook(validBook);
    await expect(service.createBook(validBook)).rejects.toThrow(ConflictError);
  });

  it('9. Trims whitespace from title and author before persisting', async () => {
    await service.createBook({ ...validBook, title: '  Trim Me  ', author: '  Me Too  ' });
    const createCall = repo.calls.find(c => c.method === 'create');
    expect(createCall.args[0].title).toBe('Trim Me');
    expect(createCall.args[0].author).toBe('Me Too');
  });
});
