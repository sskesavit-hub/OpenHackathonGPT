/**
 * Model Selector Component
 */
import { listModels, selectModel, refreshModels } from '../api.js?v=3';
import { AppState } from '../app.js?v=3';
import { updateStatusBar } from './statusBar.js?v=3';
import { updateSidebarStatus } from './sidebar.js?v=3';

export function renderModelSelector(container) {
  container.innerHTML = `
    <div class="model-select-wrap" id="model-selector-wrap">
      <button class="btn btn-secondary btn-icon" id="model-selector-btn" title="Change model">
        <span id="model-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></span>
        <span id="model-btn-label" style="font-size:0.8rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${AppState.activeModel || 'Select Model'}
        </span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="6 9 12 15 18 9"/></svg></span>
      </button>
      <div class="model-dropdown" id="model-dropdown" style="display:none;">
        <div class="model-dropdown-header" style="display:flex;justify-content:space-between;align-items:center;">
          <span style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg> Models</span>
          <button class="btn btn-ghost" style="font-size:0.75rem;padding:2px 8px;display:flex;align-items:center;gap:4px" id="model-refresh-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.43-8.8l5.44 5.23M21.5 8l-5.44 5.23M2.5 22v-6h6"/></svg> Refresh</button>
        </div>
        <div style="padding:10px;border-bottom:1px solid var(--border-color);">
          <input type="text" id="custom-model-input" class="input" placeholder="Custom model name..." style="width:100%;font-size:0.8rem;padding:6px;">
        </div>
        <div id="model-list">
          <div style="padding:16px;color:var(--text-muted);font-size:0.85rem;text-align:center">
            <div class="spinner" style="margin:0 auto 8px"></div>
            Loading models...
          </div>
        </div>
      </div>
    </div>
  `;

  bindModelEvents();
}

function bindModelEvents() {
  const btn = document.getElementById('model-selector-btn');
  const dropdown = document.getElementById('model-dropdown');

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display !== 'none';
    dropdown.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) loadModelList();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#model-selector-wrap')) {
      if (dropdown) dropdown.style.display = 'none';
    }
  });

  document.getElementById('model-refresh-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await loadModelList(true);
  });

  const customInput = document.getElementById('custom-model-input');
  customInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && customInput.value.trim()) {
      e.stopPropagation();
      await handleModelSelect(customInput.value.trim());
      if (dropdown) dropdown.style.display = 'none';
      customInput.value = '';
    }
  });
}

async function loadModelList(forceRefresh = false) {
  const listEl = document.getElementById('model-list');
  if (!listEl) return;

  listEl.innerHTML = `<div style="padding:16px;text-align:center"><div class="spinner" style="margin:0 auto 8px"></div><div style="font-size:0.8rem;color:var(--text-muted)">Scanning Ollama...</div></div>`;

  try {
    const data = forceRefresh ? await refreshModels() : await listModels();
    AppState.models = data.models || [];
    AppState.activeModel = data.active || AppState.activeModel;

    if (AppState.models.length === 0) {
      listEl.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--text-muted)">
          <div style="margin-bottom:8px;display:flex;justify-content:center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div style="font-size:0.85rem">No models found in Ollama.<br>Run <code style="background:var(--bg-tertiary);padding:2px 6px;border-radius:4px">ollama pull llama3</code></div>
        </div>`;
      return;
    }

    listEl.innerHTML = AppState.models.map(m => `
      <div class="model-option ${m.name === AppState.activeModel ? 'active' : ''}"
           data-model="${m.name}">
        <div style="font-weight:600;font-size:0.85rem">${m.name}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);display:flex;gap:8px;margin-top:2px">
          ${m.size_gb !== undefined ? `<span style="display:flex;align-items:center;gap:4px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> ${m.size_gb}GB</span>` : ''}
          ${m.parameter_size ? `<span>• ${m.parameter_size}</span>` : ''}
          ${m.quantization ? `<span>• ${m.quantization}</span>` : ''}
        </div>
      </div>
    `).join('');

    // Bind model selection
    listEl.querySelectorAll('.model-option').forEach(el => {
      el.addEventListener('click', async () => {
        const modelName = el.dataset.model;
        await handleModelSelect(modelName);
        document.getElementById('model-dropdown').style.display = 'none';
      });
    });

  } catch (err) {
    console.error('Model fetch failed:', err);
    listEl.innerHTML = `<div style="padding:16px;color:var(--accent-red);font-size:0.82rem;display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${err.message}</div>`;
  }
}

async function handleModelSelect(modelName) {
  try {
    await selectModel(modelName);
    AppState.activeModel = modelName;

    // Update all UI references
    const label = document.getElementById('model-btn-label');
    if (label) label.textContent = modelName;

    updateStatusBar({ activeModel: modelName });
    updateSidebarStatus(AppState.ollamaOnline, modelName);

    // Show toast
    showToast(`Switched to ${modelName}`, 'success');

    // Re-render model list to update active
    await loadModelList();

  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  }
}

function showToast(message, type = 'info') {
  const colors = { success: 'var(--accent-green)', error: 'var(--accent-red)', info: 'var(--accent-blue)' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:80px;right:24px;z-index:9999;
    padding:10px 18px;border-radius:10px;font-size:0.85rem;font-weight:500;
    background:var(--bg-card);border:1px solid ${colors[type]};color:var(--text-primary);
    box-shadow:var(--shadow-md);animation:slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
