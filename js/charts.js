/**
 * PRCP-1023 Chart Manager & Canvas Visualizer
 * Integrates Chart.js with dynamic theme support (dark/light), custom tooltips & formatters
 */

const ChartManager = {
  instances: {},

  getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      textColor: isLight ? '#475569' : '#94a3b8',
      textPrimary: isLight ? '#0f172a' : '#f8fafc',
      gridColor: isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(51, 65, 85, 0.4)',
      cardBg: isLight ? '#ffffff' : '#0f172a',
      borderColor: isLight ? '#cbd5e1' : '#334155'
    };
  },

  formatNumber(val) {
    if (typeof val !== 'number') return val;
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString();
  },

  destroy(canvasId) {
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
      delete this.instances[canvasId];
    }
  },

  destroyAll() {
    Object.keys(this.instances).forEach(id => this.destroy(id));
  },

  createLineChart(canvasId, labels, datasets, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const theme = this.getThemeColors();
    const ctx = canvas.getContext('2d');

    const config = {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: options.showLegend ?? true,
            position: 'top',
            labels: { color: theme.textColor, font: { family: 'Inter', size: 12, weight: 500 } }
          },
          tooltip: {
            backgroundColor: theme.cardBg,
            titleColor: theme.textPrimary,
            bodyColor: theme.textColor,
            borderColor: theme.borderColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${this.formatNumber(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 12 }
          },
          y: {
            type: options.yScaleType || 'linear',
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => this.formatNumber(val)
            }
          }
        },
        ...options.customOptions
      }
    };

    const chart = new Chart(ctx, config);
    this.instances[canvasId] = chart;
    return chart;
  },

  createBarChart(canvasId, labels, datasets, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const theme = this.getThemeColors();
    const ctx = canvas.getContext('2d');

    const config = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: options.showLegend ?? true,
            labels: { color: theme.textColor, font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            backgroundColor: theme.cardBg,
            titleColor: theme.textPrimary,
            bodyColor: theme.textColor,
            borderColor: theme.borderColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => `${item.dataset.label}: ${typeof item.raw === 'number' ? item.raw.toLocaleString() : item.raw}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => this.formatNumber(val)
            }
          }
        },
        ...options.customOptions
      }
    };

    const chart = new Chart(ctx, config);
    this.instances[canvasId] = chart;
    return chart;
  },

  createScatterChart(canvasId, datasets, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const theme = this.getThemeColors();
    const ctx = canvas.getContext('2d');

    const config = {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: options.showLegend ?? true,
            labels: { color: theme.textColor }
          },
          tooltip: {
            backgroundColor: theme.cardBg,
            titleColor: theme.textPrimary,
            bodyColor: theme.textColor,
            borderColor: theme.borderColor,
            borderWidth: 1,
            callbacks: {
              label: (item) => {
                const pt = item.raw;
                return `${pt.label || 'Point'}: X=${this.formatNumber(pt.x)}, Y=${this.formatNumber(pt.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: options.xScaleType || 'linear',
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, callback: (v) => this.formatNumber(v) },
            title: { display: !!options.xTitle, text: options.xTitle, color: theme.textColor }
          },
          y: {
            type: options.yScaleType || 'linear',
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, callback: (v) => this.formatNumber(v) },
            title: { display: !!options.yTitle, text: options.yTitle, color: theme.textColor }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.instances[canvasId] = chart;
    return chart;
  }
};

window.ChartManager = ChartManager;
