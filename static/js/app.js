/**
 * Main Application Router & State Manager
 */
import { renderSidebar, updateSidebarActive, updateSidebarStatus } from './components/sidebar.js?v=3';
import { renderStatusBar, updateStatusBar } from './components/statusBar.js?v=3';
import { renderModelSelector } from './components/modelSelector.js?v=3';
import { renderHomePage } from './pages/home.js?v=3';
import { renderChatPage, destroyChat } from './components/chat.js?v=3';
import { renderAgentPanel } from './components/agentPanel.js?v=3';
import { renderSettings } from './components/settings.js?v=3';
import { checkHealth, listSessions, deleteSession, getSession } from './api.js?v=3';

// ─── Global App State ──────────────────────────────────────────────────────

export const AppState = {
  currentPage: 'home',
  currentSessionId: null,
  activeModel: null,
  models: [],
  ollamaOnline: false,
  serverOnline: false,
  theme: localStorage.getItem('theme') || 'dark',
  currentWS: null,
};

// ─── Custom Modal UI ────────────────────────────────────────────────────────
export function customConfirm(title, message, confirmText = 'Confirm', danger = false) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-title">${title}</div>
        <div class="custom-modal-body">${message}</div>
        <div class="custom-modal-actions">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Trigger animation
    requestAnimationFrame(() => overlay.classList.add('active'));

    const cleanup = (result) => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    overlay.querySelector('#modal-cancel').onclick = () => cleanup(false);
    overlay.querySelector('#modal-confirm').onclick = () => cleanup(true);
  });
}

// ─── Initialize ────────────────────────────────────────────────────────────

async function init() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', AppState.theme);

  // Render structural components
  renderSidebar();
  renderStatusBar(document.getElementById('status-bar-container'));

  // Expose globals for inline onclick handlers
  window.navigateTo = navigateTo;
  window.loadSession = loadSession;
  window.customConfirm = customConfirm;

  // Initial health check
  await pollHealth();

  // Navigate to default page
  navigateTo('home');

  // Start periodic health polling
  setInterval(pollHealth, 30000);
}

// ─── Health Polling ─────────────────────────────────────────────────────────

async function pollHealth() {
  try {
    const health = await checkHealth();
    AppState.serverOnline = true;
    AppState.ollamaOnline = health.ollama?.status === 'online';
    AppState.activeModel = health.active_model || AppState.activeModel;

    updateStatusBar({
      serverOnline: AppState.serverOnline,
      ollamaOnline: AppState.ollamaOnline,
      activeModel: AppState.activeModel,
    });
    updateSidebarStatus(AppState.ollamaOnline, AppState.activeModel);

    // Update model selector label
    const label = document.getElementById('model-btn-label');
    if (label && AppState.activeModel) label.textContent = AppState.activeModel;

  } catch {
    AppState.serverOnline = false;
    updateStatusBar({ serverOnline: false, ollamaOnline: false });
  }
}

// ─── Router ────────────────────────────────────────────────────────────────

export function navigateTo(page, options = {}) {
  // Cleanup previous page
  if (AppState.currentPage === 'chat' && page !== 'chat') {
    destroyChat();
  }

  AppState.currentPage = page;
  updateSidebarActive(page);

  const mainContent = document.getElementById('main-content');
  const pageContainer = document.getElementById('page-container');

  // Clear current page
  pageContainer.innerHTML = '';

  // Render page
  switch (page) {
    case 'home':
      renderPage(pageContainer, 'page-home', () => renderHomePage(pageContainer));
      break;

    case 'chat':
      renderPage(pageContainer, 'page-chat', () => renderChatPage(pageContainer, options));
      break;

    case 'agents':
      renderPage(pageContainer, 'page-agents', () => renderAgentPanel(pageContainer));
      break;

    case 'history':
      renderPage(pageContainer, 'page-history', () => renderHistoryPage(pageContainer));
      break;

    case 'settings':
      renderPage(pageContainer, 'page-settings', () => renderSettings(pageContainer));
      break;

    default:
      renderPage(pageContainer, 'page-404', () => {
        pageContainer.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="margin-bottom:12px;display:flex;justify-content:center"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <h2>Page Not Found</h2>
          </div>`;
      });
  }

  // Handle special navigation options
  if (options.prompt && page === 'chat') {
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) { input.value = options.prompt; input.focus(); }
    }, 200);
  }
}

function renderPage(container, className, renderFn) {
  container.className = `page active ${className}`;
  renderFn();
}

// ─── Session Management ────────────────────────────────────────────────────

export async function loadSession(sessionId) {
  AppState.currentSessionId = sessionId;
  navigateTo('chat', { sessionId });
}

// ─── History Page ──────────────────────────────────────────────────────────

async function renderHistoryPage(container) {
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:8px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Chat History</h1>
      <p>All your previous hackathon sessions</p>
    </div>
    <div id="history-list" class="glass-card section-card">
      <div class="spinner" style="margin:20px auto"></div>
    </div>
  `;

  try {
    const data = await listSessions(100);
    const listEl = document.getElementById('history-list');

    if (!data.sessions?.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted)">
          <div style="margin-bottom:10px;display:flex;justify-content:center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <p>No chat sessions yet.</p>
          <button class="btn btn-primary" style="margin-top:12px" onclick="navigateTo('chat',{newChat:true})">Start First Chat</button>
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${data.count} Sessions</div>
      <div class="history-list">
        ${data.sessions.map(s => `
          <div class="history-item ${s.id === AppState.currentSessionId ? 'active' : ''}"
               onclick="window.loadSession('${s.id}')">
            <span class="history-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            <div class="history-item-info">
              <div class="history-item-title">${s.title || 'Untitled'}</div>
              <div class="history-item-meta" style="display:flex;align-items:center;gap:8px;">
                <span style="display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> ${s.model || 'Unknown'}</span>
                <span style="display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${new Date(s.updated_at).toLocaleDateString()} ${new Date(s.updated_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            </div>
            <button class="history-item-delete" onclick="event.stopPropagation();handleDeleteSession('${s.id}',this)" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
          </div>
        `).join('')}
      </div>
    `;

    window.handleDeleteSession = async (id, btn) => {
      const confirmed = await window.customConfirm('Delete Session', 'Are you sure you want to permanently delete this chat session?', 'Delete', true);
      if (!confirmed) return;
      try {
        await deleteSession(id);
        btn.closest('.history-item').remove();
      } catch (err) {
        window.customConfirm('Error', 'Failed to delete: ' + err.message, 'OK');
      }
    };

  } catch (err) {
    document.getElementById('history-list').innerHTML =
      `<div style="color:var(--accent-red);padding:20px;display:flex;align-items:center;gap:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ${err.message}
      </div>`;
  }
}

// ─── Boot ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
