// ===== Column Filter Module =====
class ColumnFilter {
  constructor() {
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.columnCards = document.querySelectorAll('.column-card');
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleFilterClick(e));
    });
  }

  handleFilterClick(event) {
    const button = event.currentTarget;
    const filterValue = button.dataset.filter;

    // Update active button state
    this.updateActiveButton(button);

    // Filter cards
    this.filterCards(filterValue);
  }

  updateActiveButton(activeButton) {
    this.filterButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
  }

  filterCards(filterValue) {
    this.columnCards.forEach(card => {
      const author = card.dataset.author;
      const shouldShow = filterValue === 'all' || author === filterValue;
      
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }
}

// ===== Progress Bar Module =====
class ProgressBar {
  constructor() {
    this.progressBar = document.querySelector('.progress-bar');
    this.init();
  }

  init() {
    if (!this.progressBar) return;
    window.addEventListener('scroll', () => this.updateProgress());
  }

  updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);

    this.progressBar.style.width = `${scrollPercent}%`;
    this.progressBar.setAttribute('aria-valuenow', Math.round(scrollPercent));
  }
}

// ===== Toast Notification Module =====
class ToastNotification {
  constructor() {
    this.toast = document.querySelector('.toast');
  }

  show(message, duration = 2000) {
    if (!this.toast) return;

    this.toast.textContent = message;
    this.toast.classList.add('show');

    setTimeout(() => {
      this.toast.classList.remove('show');
    }, duration);
  }
}

// ===== URL Copy Function =====
function copyURL() {
  const url = window.location.href;
  
  // Modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => {
        const toast = new ToastNotification();
        toast.show('URL이 복사되었습니다!');
      })
      .catch(err => {
        console.error('URL 복사 실패:', err);
        fallbackCopyURL(url);
      });
  } else {
    fallbackCopyURL(url);
  }
}

// Fallback for older browsers
function fallbackCopyURL(url) {
  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    const toast = new ToastNotification();
    toast.show('URL이 복사되었습니다!');
  } catch (err) {
    console.error('URL 복사 실패:', err);
  }
  
  document.body.removeChild(textarea);
}

// ===== Initialize on DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modules
  new ColumnFilter();
  new ProgressBar();
  
  // Make copyURL available globally for inline usage
  window.copyURL = copyURL;
});