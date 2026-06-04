/**
 * Sidebar Component
 */
import { AppState } from '../app.js?v=3';

const NAV_ITEMS = [
  { id: 'home',     icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', label: 'Dashboard',    badge: null },
  { id: 'chat',     icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', label: 'Chat',          badge: null, id_attr: 'nav-chat' },
  { id: 'agents',   icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>', label: 'Agents',        badge: '7' },
  { id: 'history',  icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', label: 'History',       badge: null },
  { id: 'settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', label: 'Settings',      badge: null },
];

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
      <span id="sidebar-toggle-icon">◀</span>
    </button>

    <div class="sidebar-logo" id="sidebar-logo">
      <div class="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/></svg></div>
      <div class="logo-text">
        <h2>HackathonGPT</h2>
        <span>AI-Powered Assistant</span>
      </div>
    </div>

    <div class="sidebar-nav">
      <button class="new-chat-btn" id="new-chat-btn">
        <span style="display:flex;align-items:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
        <span class="new-chat-btn-text" style="margin-left:6px">New Chat</span>
      </button>

      <div class="nav-section-label">Main</div>
      ${NAV_ITEMS.map(item => `
        <div class="nav-item ${AppState.currentPage === item.id ? 'active' : ''}"
             data-page="${item.id}"
             data-tooltip="${item.label}"
             id="nav-${item.id}">
          <div class="nav-item-icon">${item.icon}</div>
          <span class="nav-item-text">${item.label}</span>
          ${item.badge ? `<span class="nav-item-badge">${item.badge}</span>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-status">
        <span class="status-dot ${AppState.ollamaOnline ? 'online pulse' : 'offline'}" id="sidebar-ollama-dot"></span>
        <div class="status-info">
          <div class="status-label">Ollama</div>
          <div class="status-value" id="sidebar-model-name">
            ${AppState.activeModel || 'No model selected'}
          </div>
        </div>
      </div>
    </div>
  `;

  bindSidebarEvents();
}

function bindSidebarEvents() {
  // Toggle collapse
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    sidebar.classList.toggle('collapsed');
    icon.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });

  // Restore collapse state
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    document.getElementById('sidebar')?.classList.add('collapsed');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (icon) icon.textContent = '▶';
  }

  // Nav item clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      window.navigateTo(page);
    });
  });

  // New chat
  document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    window.navigateTo('chat', { newChat: true });
  });

  // Mobile overlay
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);
}

export function updateSidebarActive(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

export function updateSidebarStatus(ollamaOnline, modelName) {
  const dot = document.getElementById('sidebar-ollama-dot');
  const name = document.getElementById('sidebar-model-name');
  if (dot) {
    dot.className = `status-dot ${ollamaOnline ? 'online pulse' : 'offline'}`;
  }
  if (name) name.textContent = modelName || 'No model';
}

export function openMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.add('visible');
}

export function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
}
