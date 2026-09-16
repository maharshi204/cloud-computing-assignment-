import { escapeHtml, formatIsbn } from './format.js';

export function renderLoading(container, viewType) {
  if (viewType === 'table') {
    let html = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title & Author</th>
              <th>ISBN</th>
              <th>Year</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
    `;
    for (let i = 0; i < 5; i++) {
      html += `
        <tr>
          <td><div class="skeleton" style="height:20px; width:60%; margin-bottom:4px;"></div><div class="skeleton" style="height:14px; width:40%;"></div></td>
          <td><div class="skeleton" style="height:16px; width:120px;"></div></td>
          <td><div class="skeleton" style="height:16px; width:40px;"></div></td>
          <td><div class="skeleton" style="height:24px; width:80px; border-radius:12px;"></div></td>
          <td><div class="skeleton" style="height:28px; width:140px;"></div></td>
        </tr>
      `;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } else {
    let html = `<div class="grid-view">`;
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="book-card skeleton" style="height:180px;"></div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
  }
}

export function renderEmptyState(container, term = '') {
  if (term) {
    container.innerHTML = `
      <div class="state-box">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3>No books match '${escapeHtml(term)}'</h3>
        <p>Try adjusting your search term.</p>
        <button id="btn-empty-clear" class="button outline">Clear search</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="state-box">
        <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        <h3>Your shelf is empty</h3>
        <p>Get started by adding your first book to the library collection.</p>
        <button id="btn-empty-add" class="button primary">Add your first book</button>
      </div>
    `;
  }
}

export function renderErrorState(container, message) {
  container.innerHTML = `
    <div class="state-box">
      <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" class="text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button id="btn-error-retry" class="button outline">Try again</button>
    </div>
  `;
}

function getQuantityPill(qty) {
  if (qty === 0) return `<span class="pill red">Out of stock</span>`;
  if (qty <= 2) return `<span class="pill amber">Low &middot; ${qty}</span>`;
  return `<span class="pill green">${qty} available</span>`;
}

export function renderBooks(container, books, viewType, callbacks) {
  if (viewType === 'table') {
    let html = `
      <div class="table-wrapper">
        <table>
          <caption class="sr-only">List of books in the library</caption>
          <thead>
            <tr>
              <th>Title & Author</th>
              <th>ISBN</th>
              <th>Year</th>
              <th>Quantity</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    books.forEach(book => {
      const checkoutDisabled = book.quantity === 0 ? 'disabled title="Out of stock"' : '';
      html += `
        <tr>
          <td>
            <div class="td-title">${escapeHtml(book.title)}</div>
            <div class="td-author">${escapeHtml(book.author)}</div>
          </td>
          <td class="td-isbn">${escapeHtml(formatIsbn(book.isbn))}</td>
          <td class="td-num">${book.publicationYear}</td>
          <td>${getQuantityPill(book.quantity)}</td>
          <td class="td-actions">
            <button class="button outline btn-action-checkout" data-id="${book.id}" ${checkoutDisabled}>Check out</button>
            <button class="icon-button btn-action-edit" data-id="${book.id}" aria-label="Edit"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="icon-button btn-action-delete" data-id="${book.id}" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } else {
    let html = `<div class="grid-view">`;
    books.forEach(book => {
      const checkoutDisabled = book.quantity === 0 ? 'disabled title="Out of stock"' : '';
      html += `
        <div class="book-card">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(book.title)}</h3>
            <div class="card-author">${escapeHtml(book.author)}</div>
          </div>
          <div class="card-meta">
            <span>ISBN ${escapeHtml(formatIsbn(book.isbn))}</span>
            <span>${book.publicationYear}</span>
          </div>
          <div class="card-meta" style="margin-bottom:8px">
            ${getQuantityPill(book.quantity)}
          </div>
          <div class="card-actions">
            <button class="button outline btn-action-checkout" data-id="${book.id}" ${checkoutDisabled}>Check out</button>
            <div style="flex:1"></div>
            <button class="icon-button btn-action-edit" data-id="${book.id}" aria-label="Edit"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="icon-button btn-action-delete" data-id="${book.id}" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  }
  
  // Attach handlers
  container.querySelectorAll('.btn-action-checkout').forEach(btn => {
    btn.addEventListener('click', (e) => callbacks.onCheckout(e.currentTarget.dataset.id));
  });
  container.querySelectorAll('.btn-action-edit').forEach(btn => {
    btn.addEventListener('click', (e) => callbacks.onEdit(e.currentTarget.dataset.id));
  });
  container.querySelectorAll('.btn-action-delete').forEach(btn => {
    btn.addEventListener('click', (e) => callbacks.onDelete(e.currentTarget.dataset.id));
  });
}

export function renderStats(container, stats) {
  if (!stats) return;
  const outOfStockClass = stats.outOfStock > 0 ? 'warn-state' : '';
  
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalTitles}</div>
      <div class="stat-label">Titles</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalCopies}</div>
      <div class="stat-label">Total copies</div>
    </div>
    <div class="stat-card ${outOfStockClass}">
      <div class="stat-value">${stats.outOfStock}</div>
      <div class="stat-label">Out of stock</div>
    </div>
  `;
}
