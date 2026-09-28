/**
 * PRCP-1023 UI Interactivity & DOM Utilities
 */

const UIManager = {
  theme: 'dark',

  initTheme() {
    const saved = localStorage.getItem('covid_theme') || 'dark';
    this.setTheme(saved);
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('covid_theme', theme);

    const themeLabel = document.getElementById('theme-toggle-label');
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';

    // Re-render active charts with updated theme colors
    if (window.AnalyticsManager && window.AnalyticsManager.refreshActiveCharts) {
      window.AnalyticsManager.refreshActiveCharts();
    }
  },

  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  animateCounter(elementId, targetValue, duration = 1200, isCurrency = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (targetValue - start) * ease);

      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = targetValue.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-left: 4px solid ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-blue)'};
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      color: var(--text-primary);
      font-size: 0.85rem;
      margin-top: 0.5rem;
      animation: fadeIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  exportToCSV(filename, rows) {
    const processRow = (row) => row.map(val => {
      let text = (val === null || val === undefined) ? '' : String(val);
      if (text.search(/("|,|\n)/g) >= 0) text = `"${text.replace(/"/g, '""')}"`;
      return text;
    }).join(',');

    const csvFile = rows.map(processRow).join('\n');
    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Exported ${filename} successfully!`, 'success');
  }
};

window.UIManager = UIManager;
