const container = document.getElementById('toast-container');

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Maintain max 3 toasts
  while (container.children.length > 3) {
    container.removeChild(container.firstChild);
  }

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    });
  }, 4000);
}
