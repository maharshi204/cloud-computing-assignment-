const {
  validateTitle,
  validateAuthor,
  validateIsbn,
  validatePublicationYear,
  validateQuantity
} = require('../../business/validation/bookValidator');

describe('bookValidator', () => {
  describe('validateTitle', () => {
    it('accepts valid title', () => {
      expect(validateTitle(' Dune ')).toEqual({ value: 'Dune' });
    });
    it('rejects empty title', () => {
      expect(validateTitle('   ')).toEqual({ error: 'Title cannot be empty.' });
    });
    it('rejects over 200 chars', () => {
      expect(validateTitle('a'.repeat(201))).toEqual({ error: 'Title must be 200 characters or fewer.' });
    });
  });

  describe('validateAuthor', () => {
    it('accepts valid author', () => {
      expect(validateAuthor('Frank Herbert')).toEqual({ value: 'Frank Herbert' });
    });
    it('rejects empty author', () => {
      expect(validateAuthor('')).toEqual({ error: 'Author cannot be empty.' });
    });
    it('rejects over 120 chars', () => {
      expect(validateAuthor('a'.repeat(121))).toEqual({ error: 'Author must be 120 characters or fewer.' });
    });
  });

  describe('validateIsbn', () => {
    it('accepts exactly 10 digits', () => {
      expect(validateIsbn('1234567890')).toEqual({ value: '1234567890' });
      expect(validateIsbn('123-45-678-90')).toEqual({ value: '1234567890' });
    });
    it('accepts exactly 13 digits', () => {
      expect(validateIsbn('1234567890123')).toEqual({ value: '1234567890123' });
    });
    it('rejects other lengths', () => {
      expect(validateIsbn('123456789')).toEqual({ error: 'ISBN must be exactly 10 or 13 digits.' });
      expect(validateIsbn('12345678901')).toEqual({ error: 'ISBN must be exactly 10 or 13 digits.' });
    });
    it('rejects letters', () => {
      expect(validateIsbn('123456789X')).toEqual({ error: 'ISBN must be exactly 10 or 13 digits.' });
    });
  });

  describe('validatePublicationYear', () => {
    const currentYear = new Date().getFullYear();

    it('accepts valid year', () => {
      expect(validatePublicationYear(1999)).toEqual({ value: 1999 });
      expect(validatePublicationYear('2000')).toEqual({ value: 2000 });
    });
    it('rejects non-integers', () => {
      expect(validatePublicationYear('abc')).toEqual({ error: 'Publication year must be a whole number.' });
      expect(validatePublicationYear(1999.5)).toEqual({ error: 'Publication year must be a whole number.' });
    });
    it('rejects future years', () => {
      expect(validatePublicationYear(currentYear + 1)).toEqual({ error: 'Publication year cannot be in the future.' });
    });
    it('accepts current year', () => {
      expect(validatePublicationYear(currentYear)).toEqual({ value: currentYear });
    });
    it('rejects before 1450', () => {
      expect(validatePublicationYear(1449)).toEqual({ error: 'Publication year must be 1450 or later.' });
    });
    it('accepts exactly 1450', () => {
      expect(validatePublicationYear(1450)).toEqual({ value: 1450 });
    });
  });

  describe('validateQuantity', () => {
    it('accepts valid quantity', () => {
      expect(validateQuantity(5)).toEqual({ value: 5 });
      expect(validateQuantity('0')).toEqual({ value: 0 });
    });
    it('rejects negative', () => {
      expect(validateQuantity(-1)).toEqual({ error: 'Quantity cannot be negative.' });
    });
    it('rejects non-integers', () => {
      expect(validateQuantity('abc')).toEqual({ error: 'Quantity must be a whole number.' });
    });
  });
});
