/**
 * Status Bar Component — bottom bar showing server/Ollama status
 */
import { AppState } from '../app.js?v=3';

export function renderStatusBar(container) {
  container.innerHTML = `
    <div class="status-bar" id="status-bar">
      <div class="status-item">
        <span class="status-dot ${AppState.serverOnline ? 'online' : 'offline'}" id="sb-server-dot"></span>
        <span class="label">Server</span>
        <span class="value" id="sb-server-val">${AppState.serverOnline ? 'Online' : 'Offline'}</span>
      </div>
      <div class="status-separator"></div>
      <div class="status-item">
        <span class="status-dot ${AppState.ollamaOnline ? 'online pulse' : 'offline'}" id="sb-ollama-dot"></span>
        <span class="label">Ollama</span>
        <span class="value" id="sb-ollama-val">${AppState.ollamaOnline ? 'Online' : 'Offline'}</span>
      </div>
      <div class="status-separator"></div>
      <div class="status-item">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></span>
        <span class="label">Model</span>
        <span class="value" id="sb-model-val" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${AppState.activeModel || '—'}
        </span>
      </div>
      <div class="status-separator"></div>
      <div class="status-item">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg></span>
        <span class="label">WS</span>
        <span class="value" id="sb-ws-val">Idle</span>
      </div>
      <div style="margin-left:auto" class="status-item">
        <span style="font-size:0.68rem;color:var(--text-muted)">OpenHackathonGPT v1.0</span>
      </div>
    </div>
  `;
}

export function updateStatusBar({ serverOnline, ollamaOnline, activeModel, wsStatus }) {
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setClass = (id, cls) => { const el = document.getElementById(id); if (el) el.className = `status-dot ${cls}`; };

  if (serverOnline !== undefined) {
    setClass('sb-server-dot', serverOnline ? 'online' : 'offline');
    set('sb-server-val', serverOnline ? 'Online' : 'Offline');
  }
  if (ollamaOnline !== undefined) {
    setClass('sb-ollama-dot', ollamaOnline ? 'online pulse' : 'offline');
    set('sb-ollama-val', ollamaOnline ? 'Online' : 'Offline');
  }
  if (activeModel !== undefined) set('sb-model-val', activeModel || '—');
  if (wsStatus !== undefined) set('sb-ws-val', wsStatus);
}
