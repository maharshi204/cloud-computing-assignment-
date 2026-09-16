/**
 * Maps database rows to domain entities and vice versa.
 * Translates snake_case DB columns to camelCase domain properties.
 */

function toEntity(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    publicationYear: row.publication_year,
    quantity: row.quantity,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

module.exports = {
  toEntity
};
