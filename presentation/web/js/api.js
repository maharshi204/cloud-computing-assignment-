export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `/api${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  
  const config = { ...options, headers };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = data && data.error ? data.error : {};
    throw new ApiError(
      res.status,
      errorBody.code || 'UNKNOWN_ERROR',
      errorBody.message || `HTTP Error ${res.status}`,
      errorBody.details || []
    );
  }

  return data ? data.data : null;
}

export const api = {
  getHealth: () => request('/health'),
  getMeta: () => request('/meta'),
  getStats: () => request('/books/stats'),
  getBooks: (search = '', sortBy = 'createdAt', order = 'desc', signal) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);
    
    return request(`/books?${params.toString()}`, { signal });
  },
  getBookById: (id) => request(`/books/${id}`),
  createBook: (book) => request('/books', { method: 'POST', body: book }),
  updateBook: (id, book) => request(`/books/${id}`, { method: 'PUT', body: book }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),
  checkoutBook: (id) => request(`/books/${id}/checkout`, { method: 'POST' })
};
