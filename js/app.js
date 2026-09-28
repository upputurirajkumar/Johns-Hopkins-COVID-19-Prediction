/**
 * PRCP-1023 Main Application Orchestrator & Router
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme
  window.UIManager.initTheme();

  // 2. Setup Navigation & SPA Router
  initNavigation();

  // 3. Initialize Data Explorer Table & Search
  initDataExplorerTable();

  // 4. Initialize Analytics, Feature Lab, Models, Optimization, Forecast, Decision
  window.AnalyticsManager.init();
  window.FeatureLab.init();
  window.ModelManager.init();
  window.OptimizationManager.init();
  window.ForecastManager.init();
  window.DecisionManager.init();

  // 5. Render Methodology & Limitations
  renderMethodology();
  renderLimitations();

  // 6. Setup Mobile Drawer Toggle
  const menuBtn = document.getElementById('btn-menu-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on click outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
});

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.page-section');
  const breadcrumbActive = document.getElementById('breadcrumb-active-title');

  function navigateTo(targetId) {
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${targetId}`);
    });

    navLinks.forEach(link => {
      const isTarget = link.getAttribute('data-target') === targetId;
      link.classList.toggle('active', isTarget);
      if (isTarget && breadcrumbActive) {
        breadcrumbActive.textContent = link.querySelector('.nav-item-text')?.textContent || targetId;
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }

    // Refresh charts if entering view
    setTimeout(() => {
      if (targetId === 'analytics' && window.AnalyticsManager) window.AnalyticsManager.refreshActiveCharts();
      if (targetId === 'models' && window.ModelManager) window.ModelManager.selectModel(window.ModelManager.selectedModelId);
      if (targetId === 'forecast' && window.ForecastManager) window.ForecastManager.renderForecastChart();
      if (targetId === 'optimization' && window.OptimizationManager) window.OptimizationManager.renderOptimizationChart();
    }, 50);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      navigateTo(target);
      window.location.hash = target;
    });
  });

  // Handle URL hash on load
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && document.getElementById(`section-${initialHash}`)) {
    navigateTo(initialHash);
  } else {
    navigateTo('overview');
  }
}

// Data Explorer Table Interactive Logic
let dataTableSearchTerm = '';
let dataTableCurrentPage = 1;
const dataTablePageSize = 10;

function initDataExplorerTable() {
  const searchInput = document.getElementById('data-table-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      dataTableSearchTerm = e.target.value.toLowerCase();
      dataTableCurrentPage = 1;
      renderDataExplorerRows();
    });
  }

  const prevBtn = document.getElementById('data-table-prev');
  const nextBtn = document.getElementById('data-table-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (dataTableCurrentPage > 1) {
        dataTableCurrentPage--;
        renderDataExplorerRows();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const filtered = getFilteredDataRows();
      const maxPage = Math.ceil(filtered.length / dataTablePageSize);
      if (dataTableCurrentPage < maxPage) {
        dataTableCurrentPage++;
        renderDataExplorerRows();
      }
    });
  }

  renderDataExplorerRows();
}

function getFilteredDataRows() {
  const rows = window.SAMPLE_PREVIEW_ROWS || [];
  if (!dataTableSearchTerm) return rows;
  return rows.filter(r => 
    r.countryRegion.toLowerCase().includes(dataTableSearchTerm) ||
    r.date.includes(dataTableSearchTerm) ||
    r.confirmed.toString().includes(dataTableSearchTerm)
  );
}

function renderDataExplorerRows() {
  const tbody = document.getElementById('data-preview-tbody');
  if (!tbody) return;

  const filtered = getFilteredDataRows();
  const maxPage = Math.ceil(filtered.length / dataTablePageSize) || 1;
  const startIdx = (dataTableCurrentPage - 1) * dataTablePageSize;
  const slice = filtered.slice(startIdx, startIdx + dataTablePageSize);

  tbody.innerHTML = slice.map(r => `
    <tr>
      <td class="font-mono" style="color: var(--text-muted);">${r.id}</td>
      <td style="font-weight: 600;">${r.countryRegion}</td>
      <td style="color: var(--text-secondary);">${r.provinceState}</td>
      <td class="font-mono">${r.date}</td>
      <td class="font-mono" style="font-weight: 700; color: var(--accent-blue);">${r.confirmed.toLocaleString()}</td>
      <td class="font-mono" style="color: var(--accent-rose);">${r.deaths.toLocaleString()}</td>
      <td class="font-mono" style="color: var(--accent-emerald);">${r.recovered.toLocaleString()}</td>
      <td class="font-mono" style="color: var(--accent-amber);">${r.active.toLocaleString()}</td>
      <td class="font-mono" style="color: var(--accent-cyan);">+${r.dailyNew.toLocaleString()}</td>
      <td class="font-mono">${r.cfr}</td>
    </tr>
  `).join('');

  const countInfo = document.getElementById('data-table-count-info');
  if (countInfo) {
    countInfo.textContent = `Showing ${Math.min(startIdx + 1, filtered.length)} - ${Math.min(startIdx + slice.length, filtered.length)} of ${filtered.length} observations`;
  }

  const pageInfo = document.getElementById('data-table-page-info');
  if (pageInfo) {
    pageInfo.textContent = `Page ${dataTableCurrentPage} of ${maxPage}`;
  }

  const prevBtn = document.getElementById('data-table-prev');
  const nextBtn = document.getElementById('data-table-next');
  if (prevBtn) prevBtn.disabled = dataTableCurrentPage === 1;
  if (nextBtn) nextBtn.disabled = dataTableCurrentPage === maxPage;
}

function renderMethodology() {
  const container = document.getElementById('methodology-stages-container');
  if (!container) return;

  const stages = window.PROJECT_META.methodologyStages;
  container.innerHTML = stages.map(s => `
    <div class="glass-card" style="display: flex; gap: 1.25rem; align-items: flex-start;">
      <div style="font-size: 1.5rem; font-weight: 800; font-family: 'JetBrains Mono'; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); width: 50px; height: 50px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${s.num}
      </div>
      <div>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">${s.title}</h4>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${s.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderLimitations() {
  const container = document.getElementById('limitations-grid-container');
  if (!container) return;

  const limits = window.PROJECT_META.limitations;
  container.innerHTML = limits.map(l => `
    <div class="glass-card" style="border-left: 4px solid var(--accent-rose);">
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="color: var(--accent-rose);">⚠</span>
        ${l.title}
      </h4>
      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">${l.desc}</p>
    </div>
  `).join('');
}
