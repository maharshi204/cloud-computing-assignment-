import { api, ApiError } from './api.js';
import { showToast } from './toast.js';
import { openBookModal, closeBookModal, openDeleteModal, showFieldErrors, setFormLoading, clearErrors } from './modal.js';
import * as render from './render.js';

const state = {
  books: [],
  stats: null,
  loading: true,
  error: null,
  search: new URLSearchParams(window.location.search).get('q') || '',
  sort: 'createdAt-desc', // format: field-order
  view: localStorage.getItem('library-view') || 'table',
  theme: localStorage.getItem('library-theme') || 'system',
  abortController: null
};

const elements = {
  bookList: document.getElementById('book-list-container'),
  statsContainer: document.getElementById('stats-container'),
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  sortSelect: document.getElementById('sort-select'),
  viewTableBtn: document.getElementById('view-table'),
  viewGridBtn: document.getElementById('view-grid'),
  addBtn: document.getElementById('btn-add-book'),
  themeToggle: document.getElementById('theme-toggle'),
  badge: document.getElementById('data-source-badge'),
  form: document.getElementById('book-form')
};

// Bootstrap
async function init() {
  applyTheme(state.theme);
  updateViewButtons();
  
  elements.searchInput.value = state.search;
  toggleSearchClear();

  setupEventListeners();

  await fetchMeta();
  await loadData();
}

function updateViewButtons() {
  if (state.view === 'table') {
    elements.viewTableBtn.classList.add('active');
    elements.viewGridBtn.classList.remove('active');
  } else {
    elements.viewGridBtn.classList.add('active');
    elements.viewTableBtn.classList.remove('active');
  }
}

async function fetchMeta() {
  try {
    const meta = await api.getMeta();
    if (meta && meta.dataSource) {
      const dot = elements.badge.querySelector('.status-dot');
      const text = elements.badge.querySelector('.badge-text');
      text.textContent = meta.dataSource === 'memory' ? 'In-Memory' : 'Database';
      dot.className = `status-dot ${meta.dataSource === 'memory' ? 'warn' : 'ok'}`;
    }
  } catch (err) {
    console.error('Failed to fetch meta', err);
  }
}

async function loadData() {
  state.loading = true;
  state.error = null;
  render.renderLoading(elements.bookList, state.view);

  if (state.abortController) {
    state.abortController.abort();
  }
  state.abortController = new AbortController();

  try {
    const [sortBy, order] = state.sort.split('-');
    
    // parallel fetch
    const [books, stats] = await Promise.all([
      api.getBooks(state.search, sortBy, order, state.abortController.signal),
      api.getStats()
    ]);

    state.books = books || [];
    state.stats = stats;
    state.loading = false;
    renderApp();
  } catch (err) {
    if (err.name === 'AbortError') return;
    state.loading = false;
    state.error = err.message || 'Failed to load library data';
    renderApp();
  }
}

function renderApp() {
  render.renderStats(elements.statsContainer, state.stats);

  if (state.error) {
    render.renderErrorState(elements.bookList, state.error);
    const retryBtn = document.getElementById('btn-error-retry');
    if (retryBtn) retryBtn.addEventListener('click', loadData);
    return;
  }

  if (state.books.length === 0) {
    render.renderEmptyState(elements.bookList, state.search);
    const addBtn = document.getElementById('btn-empty-add');
    if (addBtn) addBtn.addEventListener('click', () => openBookModal());
    const clearBtn = document.getElementById('btn-empty-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      handleSearch('');
    });
    return;
  }

  render.renderBooks(elements.bookList, state.books, state.view, {
    onCheckout: handleCheckout,
    onEdit: handleEdit,
    onDelete: handleDelete
  });
}

function toggleSearchClear() {
  if (state.search) elements.searchClear.classList.remove('hidden');
  else elements.searchClear.classList.add('hidden');
}

function handleSearch(term) {
  state.search = term.trim();
  toggleSearchClear();
  
  // update url
  const url = new URL(window.location);
  if (state.search) url.searchParams.set('q', state.search);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url);

  loadData();
}

let searchTimeout;
function debounceSearch(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    handleSearch(e.target.value);
  }, 250);
}

async function handleCheckout(id) {
  try {
    await api.checkoutBook(id);
    showToast('Book checked out successfully', 'success');
    loadData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleEdit(id) {
  const book = state.books.find(b => b.id == id);
  if (book) openBookModal(book);
}

function handleDelete(id) {
  const book = state.books.find(b => b.id == id);
  if (!book) return;
  openDeleteModal(book, async () => {
    try {
      await api.deleteBook(id);
      showToast('Book deleted', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function handleSaveBook(e) {
  e.preventDefault();
  const formData = new FormData(elements.form);
  const id = formData.get('id') || elements.form.querySelector('#field-id').value;
  
  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    isbn: formData.get('isbn'),
    publicationYear: Number(formData.get('publicationYear')),
    quantity: Number(formData.get('quantity'))
  };

  setFormLoading(true);
  clearErrors();

  try {
    if (id) {
      await api.updateBook(id, bookData);
      showToast('Book updated', 'success');
    } else {
      await api.createBook(bookData);
      showToast('Book added', 'success');
    }
    closeBookModal();
    loadData();
  } catch (err) {
    if (err instanceof ApiError && err.details && err.details.length > 0) {
      showFieldErrors(err.details);
    } else {
      showToast(err.message, 'error');
    }
  } finally {
    setFormLoading(false);
  }
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('library-theme', theme);
  
  let effectiveTheme = theme;
  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // update icon
  const icon = effectiveTheme === 'dark' 
    ? '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  
  elements.themeToggle.innerHTML = icon;
}

function setupEventListeners() {
  elements.searchInput.addEventListener('input', debounceSearch);
  
  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = '';
    handleSearch('');
    elements.searchInput.focus();
  });

  elements.sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    loadData();
  });

  elements.viewTableBtn.addEventListener('click', () => {
    state.view = 'table';
    localStorage.setItem('library-view', 'table');
    updateViewButtons();
    renderApp();
  });

  elements.viewGridBtn.addEventListener('click', () => {
    state.view = 'grid';
    localStorage.setItem('library-view', 'grid');
    updateViewButtons();
    renderApp();
  });

  elements.addBtn.addEventListener('click', () => openBookModal());
  elements.form.addEventListener('submit', handleSaveBook);

  elements.themeToggle.addEventListener('click', () => {
    const newTheme = state.theme === 'light' ? 'dark' : (state.theme === 'dark' ? 'system' : 'light');
    applyTheme(newTheme);
  });

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== elements.searchInput) {
      e.preventDefault();
      elements.searchInput.focus();
    }
    if (e.key === 'n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openBookModal();
    }
  });

  // system theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') {
      applyTheme('system');
    }
  });
}

init();
