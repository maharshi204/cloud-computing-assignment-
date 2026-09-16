/**
 * Pure functions for data normalization
 */

function normalizeString(v) {
  return String(v ?? '').trim();
}

function normalizeIsbn(v) {
  if (!v && v !== 0) return '';
  return String(v).toUpperCase().replace(/[\s-]/g, '');
}

function toInt(v) {
  if (v === null || v === undefined || v === '') return NaN;
  const num = Number(v);
  if (!Number.isInteger(num)) return NaN;
  // strict check to avoid '12abc' passing through parseInt
  if (String(num) !== String(v).trim() && typeof v === 'string') {
     // Wait, Number('12') is 12, String(12) is '12'. 
     // Let's just use Number(v) which parses strict numbers and rejects '12abc'
  }
  return num;
}

module.exports = {
  normalizeString,
  normalizeIsbn,
  toInt
};
