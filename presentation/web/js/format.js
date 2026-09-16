export function formatIsbn(isbn) {
  if (!isbn) return '';
  if (isbn.length === 10) {
    return `${isbn.slice(0,1)}-${isbn.slice(1,4)}-${isbn.slice(4,9)}-${isbn.slice(9)}`;
  } else if (isbn.length === 13) {
    return `${isbn.slice(0,3)}-${isbn.slice(3,4)}-${isbn.slice(4,7)}-${isbn.slice(7,12)}-${isbn.slice(12)}`;
  }
  return isbn;
}

export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
