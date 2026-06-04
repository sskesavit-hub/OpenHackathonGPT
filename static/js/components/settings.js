/**
 * Settings Component
 */
import { getSettings, saveSettings } from '../api.js?v=3';
import { AppState } from '../app.js?v=3';

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:8px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Settings</h1>
      <p>Configure OpenHackathonGPT to your preferences</p>
    </div>
    <div id="settings-content">
      <div style="display:flex;gap:12px;align-items:center;color:var(--text-muted)">
        <div class="spinner"></div> Loading settings...
      </div>
    </div>
  `;

  try {
    const data = await getSettings();
    renderSettingsForm(container, data.settings || {});
  } catch (err) {
      `<div style="color:var(--accent-red);display:flex;align-items:center;gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${err.message}</div>`;
  }
}

function renderSettingsForm(container, current) {
  const theme = AppState.theme || current.theme || 'dark';
  const searchProvider = current.search_provider || 'duckduckgo';
  const searchEnabled = current.search_enabled !== false;
  const agentSteps = current.agent_steps_visible !== false;
  const typing = current.typing_animation !== false;
  const stream = current.stream_responses !== false;
  const llmProvider = current.llm_provider || 'ollama';
  const llmApiKey = current.llm_api_key || '';

  container.querySelector('#settings-content').innerHTML = `
    <div class="settings-grid">
      <!-- Appearance -->
      <div class="glass-card settings-section">
        <div class="settings-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><path d="M12 2c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"/><path d="M7 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M17 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg> Appearance</div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Theme</div>
            <div class="setting-label-desc">Switch between dark and light mode</div>
          </div>
          <div class="setting-control">
            <button class="theme-toggle-btn" id="theme-toggle-setting">
              <span id="theme-icon">${theme === 'dark' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'}</span>
              <span id="theme-label">${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Typing Animation</div>
            <div class="setting-label-desc">Show animated dots while AI responds</div>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap">
              <input type="checkbox" id="typing-toggle" ${typing ? 'checked' : ''} style="accent-color:var(--accent-blue)">
              <span class="toggle-label">${typing ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Show Agent Steps</div>
            <div class="setting-label-desc">Display individual agent progress</div>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap">
              <input type="checkbox" id="agent-steps-toggle" ${agentSteps ? 'checked' : ''} style="accent-color:var(--accent-blue)">
              <span class="toggle-label">${agentSteps ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Stream Responses</div>
            <div class="setting-label-desc">Show AI response token by token</div>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap">
              <input type="checkbox" id="stream-toggle" ${stream ? 'checked' : ''} style="accent-color:var(--accent-blue)">
              <span class="toggle-label">${stream ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Search & AI -->
      <div class="glass-card settings-section">
        <div class="settings-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search & AI</div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Web Search</div>
            <div class="setting-label-desc">Enable internet search in Research Agent</div>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap">
              <input type="checkbox" id="search-enabled-toggle" ${searchEnabled ? 'checked' : ''} style="accent-color:var(--accent-blue)">
              <span class="toggle-label">${searchEnabled ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Search Provider</div>
            <div class="setting-label-desc">Web search backend for Research Agent</div>
          </div>
          <div class="setting-control">
            <select class="input" id="search-provider-select" style="width:auto">
              <option value="duckduckgo" ${searchProvider === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo (free)</option>
              <option value="tavily" ${searchProvider === 'tavily' ? 'selected' : ''}>Tavily (API key)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- LLM Configuration -->
      <div class="glass-card settings-section">
        <div class="settings-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> LLM Configuration</div>
        
        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">LLM Provider</div>
            <div class="setting-label-desc">Switch between Ollama and cloud LLMs</div>
          </div>
          <div class="setting-control">
            <select class="input" id="llm-provider-select" style="width:auto">
              <option value="ollama" ${llmProvider === 'ollama' ? 'selected' : ''}>Ollama (Local)</option>
              <option value="openai" ${llmProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
              <option value="anthropic" ${llmProvider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude)</option>
              <option value="groq" ${llmProvider === 'groq' ? 'selected' : ''}>Groq</option>
              <option value="gemini" ${llmProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <div class="setting-label-text">Provider API Key</div>
            <div class="setting-label-desc">Required for cloud LLMs (OpenAI, Anthropic, etc.)</div>
          </div>
          <div class="setting-control">
            <input type="password" class="input" id="llm-api-key-input" placeholder="LLM Provider API Key" value="${llmApiKey}">
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="glass-card settings-section">
        <div class="settings-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> System Info</div>
        <div class="setting-row">
          <div class="setting-label"><div class="setting-label-text">Version</div></div>
          <div class="setting-control"><span class="badge badge-blue">v1.0.0</span></div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><div class="setting-label-text">Active Model</div></div>
          <div class="setting-control"><span class="badge badge-purple">${AppState.activeModel || '—'}</span></div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><div class="setting-label-text">Ollama URL</div></div>
          <div class="setting-control"><code style="font-size:0.75rem;color:var(--text-muted)">localhost:11434</code></div>
        </div>
      </div>
    </div>

    <div style="margin-top:20px;display:flex;gap:10px">
      <button class="btn btn-primary" id="save-settings-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Settings</button>
      <button class="btn btn-secondary" id="reset-settings-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg> Reset to Defaults</button>
    </div>
    <div id="settings-message" style="margin-top:12px;font-size:0.85rem"></div>
  `;

  bindSettingsEvents();
}

function bindSettingsEvents() {
  document.getElementById('theme-toggle-setting')?.addEventListener('click', () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) icon.innerHTML = AppState.theme === 'dark' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    if (label) label.textContent = AppState.theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('settings-message');
    try {
      const newSettings = {
        theme: AppState.theme || 'dark',
        typing_animation: document.getElementById('typing-toggle')?.checked ?? true,
        agent_steps_visible: document.getElementById('agent-steps-toggle')?.checked ?? true,
        stream_responses: document.getElementById('stream-toggle')?.checked ?? true,
        search_enabled: document.getElementById('search-enabled-toggle')?.checked ?? true,
        search_provider: document.getElementById('search-provider-select')?.value || 'duckduckgo',
        llm_provider: document.getElementById('llm-provider-select')?.value || 'ollama',
        llm_api_key: document.getElementById('llm-api-key-input')?.value.trim() || '',
      };
      
      const apiKeyInput = document.getElementById('auth-api-key-input')?.value.trim();
      if (apiKeyInput !== undefined) {
        if (apiKeyInput) localStorage.setItem('API_KEY', apiKeyInput);
        else localStorage.removeItem('API_KEY');
      }

      await saveSettings(newSettings);
      if (msg) { msg.style.color = 'var(--accent-green)'; msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Settings saved!'; }
      setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
    } catch (err) {
      if (msg) { msg.style.color = 'var(--accent-red)'; msg.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${err.message}`; }
    }
  });
}
