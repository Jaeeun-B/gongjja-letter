/**
 * Column Detail & Columns List - Unified JavaScript Module
 * 칼럼 상세 페이지와 칼럼 목록 페이지에서 공통으로 사용
 */

// ===== Utility Functions =====
const utils = {
  /**
   * 요소가 존재하는지 확인
   */
  elementExists(selector) {
    return document.querySelector(selector) !== null;
  },

  /**
   * 스크롤을 부드럽게 최상단으로 이동
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * 퍼센트를 계산하고 범위 제한
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
};

// ===== Toast Notification Module =====
class ToastNotification {
  constructor(selector = '.toast') {
    this.toast = document.querySelector(selector);
  }

  /**
   * 토스트 메시지 표시
   * @param {string} message - 표시할 메시지
   * @param {number} duration - 표시 시간 (ms)
   */
  show(message, duration = 2000) {
    if (!this.toast) {
      console.warn('Toast element not found');
      return;
    }

    this.toast.textContent = message;
    this.toast.classList.add('show');

    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * 토스트 메시지 숨기기
   */
  hide() {
    if (this.toast) {
      this.toast.classList.remove('show');
    }
  }
}

// ===== URL Copy Module =====
class URLCopier {
  constructor() {
    this.toast = new ToastNotification();
  }

  /**
   * 현재 페이지 URL을 클립보드에 복사
   */
  async copy() {
    const url = window.location.href;

    try {
      // Modern Clipboard API 사용
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        this.toast.show('URL이 복사되었습니다!');
      } else {
        // Fallback for older browsers
        this.fallbackCopy(url);
      }
    } catch (error) {
      console.error('URL 복사 실패:', error);
      this.fallbackCopy(url);
    }
  }

  /**
   * 레거시 브라우저용 복사 방법
   * @param {string} text - 복사할 텍스트
   */
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.toast.show('URL이 복사되었습니다!');
      } else {
        this.toast.show('복사에 실패했습니다.');
      }
    } catch (error) {
      console.error('Fallback 복사 실패:', error);
      this.toast.show('복사에 실패했습니다.');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// ===== Progress Bar Module =====
class ProgressBar {
  constructor(selector = '.progress-bar') {
    this.progressBar = document.querySelector(selector);
    this.init();
  }

  init() {
    if (!this.progressBar) return;

    // Throttle scroll event for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * 스크롤 진행률 업데이트
   */
  updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) {
      this.setProgress(0);
      return;
    }

    const scrollPercent = utils.clamp((scrollTop / docHeight) * 100, 0, 100);
    this.setProgress(scrollPercent);
  }

  /**
   * 진행률 바 설정
   * @param {number} percent - 진행률 (0-100)
   */
  setProgress(percent) {
    this.progressBar.style.width = `${percent}%`;
    
    // Update ARIA attribute for accessibility
    if (this.progressBar.hasAttribute('aria-valuenow')) {
      this.progressBar.setAttribute('aria-valuenow', Math.round(percent));
    }
  }
}

// ===== Column Filter Module (for columns.html) =====
class ColumnFilter {
  constructor() {
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.columnCards = document.querySelectorAll('.column-card');
    
    if (this.filterButtons.length === 0) return;
    
    this.init();
  }

  init() {
    this.attachEventListeners();
    
    // Set initial filter from URL hash if exists
    this.applyInitialFilter();
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleFilterClick(e));
      
      // Keyboard accessibility
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleFilterClick(e);
        }
      });
    });
  }

  /**
   * 필터 버튼 클릭 핸들러
   */
  handleFilterClick(event) {
    const button = event.currentTarget;
    const filterValue = button.dataset.filter;

    this.updateActiveButton(button);
    this.filterCards(filterValue);
    this.updateURL(filterValue);
  }

  /**
   * 활성 버튼 상태 업데이트
   */
  updateActiveButton(activeButton) {
    this.filterButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
  }

  /**
   * 카드 필터링
   */
  filterCards(filterValue) {
    let visibleCount = 0;

    this.columnCards.forEach(card => {
      const author = card.dataset.author;
      const shouldShow = filterValue === 'all' || author === filterValue;

      if (shouldShow) {
        card.style.display = 'block';
        visibleCount++;
        // Fade in animation
        card.style.animation = 'fadeIn 0.3s ease-in-out';
      } else {
        card.style.display = 'none';
      }
    });

    // Announce to screen readers
    this.announceFilterResult(visibleCount, filterValue);
  }

  /**
   * 필터 결과를 스크린 리더에 알림
   */
  announceFilterResult(count, filter) {
    const message = filter === 'all' 
      ? `전체 ${count}개의 칼럼이 표시됩니다.`
      : `${filter} 작가의 ${count}개 칼럼이 표시됩니다.`;
    
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * URL 해시 업데이트
   */
  updateURL(filterValue) {
    if (filterValue === 'all') {
      history.replaceState(null, '', window.location.pathname);
    } else {
      history.replaceState(null, '', `#${filterValue}`);
    }
  }

  /**
   * URL 해시에서 초기 필터 적용
   */
  applyInitialFilter() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const button = Array.from(this.filterButtons).find(
      btn => btn.dataset.filter === hash
    );

    if (button) {
      button.click();
    }
  }
}

// ===== Image Lazy Loading Enhancement =====
class ImageLazyLoader {
  constructor() {
    this.images = document.querySelectorAll('img[loading="lazy"]');
    this.init();
  }

  init() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports lazy loading natively
      return;
    }

    // Fallback for browsers that don't support lazy loading
    this.loadImagesWithIntersectionObserver();
  }

  loadImagesWithIntersectionObserver() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    this.images.forEach(img => imageObserver.observe(img));
  }
}

// ===== Initialize All Modules =====
class App {
  constructor() {
    this.modules = {};
  }

  init() {
    // Initialize modules based on page type
    this.modules.progressBar = new ProgressBar();
    this.modules.urlCopier = new URLCopier();
    
    // Initialize filter only if filter elements exist
    if (utils.elementExists('.filter-btn')) {
      this.modules.columnFilter = new ColumnFilter();
    }

    // Initialize lazy loading
    this.modules.imageLazyLoader = new ImageLazyLoader();

    // Make copyURL available globally
    window.copyURL = () => this.modules.urlCopier.copy();

    // Add CSS for fade-in animation if not exists
    this.addFadeInAnimation();
  }

  addFadeInAnimation() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .sr-only {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;
    
    if (!document.querySelector('style[data-app-styles]')) {
      style.setAttribute('data-app-styles', '');
      document.head.appendChild(style);
    }
  }
}

// ===== Initialize on DOM Ready =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}