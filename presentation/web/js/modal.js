export const bookModal = document.getElementById('book-modal');
export const deleteModal = document.getElementById('delete-modal');

// Close modals
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    closeBookModal();
  });
});

document.getElementById('btn-cancel-delete').addEventListener('click', () => {
  deleteModal.close();
});

// Close on click outside
bookModal.addEventListener('click', (e) => {
  if (e.target === bookModal) closeBookModal();
});
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) deleteModal.close();
});

export function openBookModal(book = null) {
  document.getElementById('modal-title').textContent = book ? 'Edit book' : 'Add book';
  
  document.getElementById('field-id').value = book ? book.id : '';
  document.getElementById('field-title').value = book ? book.title : '';
  document.getElementById('field-author').value = book ? book.author : '';
  document.getElementById('field-isbn').value = book ? book.isbn : '';
  document.getElementById('field-year').value = book ? book.publicationYear : '';
  document.getElementById('field-quantity').value = book ? book.quantity : '';

  clearErrors();
  bookModal.showModal();
}

export function closeBookModal() {
  // basic unsaved changes guard could go here
  bookModal.close();
}

export function openDeleteModal(book, onConfirm) {
  document.getElementById('delete-book-title').textContent = book.title;
  deleteModal.showModal();
  
  const confirmBtn = document.getElementById('btn-confirm-delete');
  // clear old listeners
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  
  newBtn.addEventListener('click', () => {
    onConfirm();
    deleteModal.close();
  });
}

export function setFormLoading(isLoading) {
  const btn = document.getElementById('btn-save');
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  
  btn.disabled = isLoading;
  if (isLoading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

export function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(el => el.removeAttribute('aria-invalid'));
}

export function showFieldErrors(details) {
  clearErrors();
  let firstFocused = false;
  
  details.forEach(err => {
    const input = document.getElementById(`field-${err.field}`);
    const msg = document.getElementById(`err-${err.field}`);
    if (input && msg) {
      input.setAttribute('aria-invalid', 'true');
      msg.textContent = err.message;
      if (!firstFocused) {
        input.focus();
        firstFocused = true;
      }
    }
  });
}
