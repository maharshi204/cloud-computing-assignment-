const { normalizeString, normalizeIsbn, toInt } = require('./normalize');

function validateTitle(title) {
  const norm = normalizeString(title);
  if (norm.length < 1) return { error: 'Title cannot be empty.' };
  if (norm.length > 200) return { error: 'Title must be 200 characters or fewer.' };
  return { value: norm };
}

function validateAuthor(author) {
  const norm = normalizeString(author);
  if (norm.length < 1) return { error: 'Author cannot be empty.' };
  if (norm.length > 120) return { error: 'Author must be 120 characters or fewer.' };
  return { value: norm };
}

function validateIsbn(isbn) {
  const norm = normalizeIsbn(isbn);
  if (!/^\d{10}$/.test(norm) && !/^\d{13}$/.test(norm)) {
    return { error: 'ISBN must be exactly 10 or 13 digits.' };
  }
  return { value: norm };
}

function validatePublicationYear(year) {
  const norm = toInt(year);
  if (Number.isNaN(norm)) return { error: 'Publication year must be a whole number.' };
  const currentYear = new Date().getFullYear();
  if (norm > currentYear) return { error: 'Publication year cannot be in the future.' };
  if (norm < 1450) return { error: 'Publication year must be 1450 or later.' };
  return { value: norm };
}

function validateQuantity(quantity) {
  const norm = toInt(quantity);
  if (Number.isNaN(norm)) return { error: 'Quantity must be a whole number.' };
  if (norm < 0) return { error: 'Quantity cannot be negative.' };
  return { value: norm };
}

function validateNewBook(input) {
  const errors = [];
  const value = {};

  const titleRes = validateTitle(input.title);
  if (titleRes.error) errors.push({ field: 'title', message: titleRes.error });
  else value.title = titleRes.value;

  const authorRes = validateAuthor(input.author);
  if (authorRes.error) errors.push({ field: 'author', message: authorRes.error });
  else value.author = authorRes.value;

  const isbnRes = validateIsbn(input.isbn);
  if (isbnRes.error) errors.push({ field: 'isbn', message: isbnRes.error });
  else value.isbn = isbnRes.value;

  const yearRes = validatePublicationYear(input.publicationYear);
  if (yearRes.error) errors.push({ field: 'publicationYear', message: yearRes.error });
  else value.publicationYear = yearRes.value;

  const qtyRes = validateQuantity(input.quantity);
  if (qtyRes.error) errors.push({ field: 'quantity', message: qtyRes.error });
  else value.quantity = qtyRes.value;

  if (errors.length > 0) return { errors };
  return { value };
}

function validateBookUpdate(input) {
  const errors = [];
  const value = {};
  let providedCount = 0;

  if (input.title !== undefined) {
    providedCount++;
    const res = validateTitle(input.title);
    if (res.error) errors.push({ field: 'title', message: res.error });
    else value.title = res.value;
  }

  if (input.author !== undefined) {
    providedCount++;
    const res = validateAuthor(input.author);
    if (res.error) errors.push({ field: 'author', message: res.error });
    else value.author = res.value;
  }

  if (input.isbn !== undefined) {
    providedCount++;
    const res = validateIsbn(input.isbn);
    if (res.error) errors.push({ field: 'isbn', message: res.error });
    else value.isbn = res.value;
  }

  if (input.publicationYear !== undefined) {
    providedCount++;
    const res = validatePublicationYear(input.publicationYear);
    if (res.error) errors.push({ field: 'publicationYear', message: res.error });
    else value.publicationYear = res.value;
  }

  if (input.quantity !== undefined) {
    providedCount++;
    const res = validateQuantity(input.quantity);
    if (res.error) errors.push({ field: 'quantity', message: res.error });
    else value.quantity = res.value;
  }

  if (providedCount === 0) {
    return { errors: [{ field: 'general', message: 'No fields provided to update.' }] };
  }

  if (errors.length > 0) return { errors };
  return { value };
}

module.exports = {
  validateTitle,
  validateAuthor,
  validateIsbn,
  validatePublicationYear,
  validateQuantity,
  validateNewBook,
  validateBookUpdate
};
