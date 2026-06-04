/**
 * Home Dashboard Page
 */
import { checkHealth, listModels, listSessions } from '../api.js?v=3';
import { AppState } from '../app.js?v=3';

export async function renderHomePage(container) {
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <h1><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:8px"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/></svg> <span class="gradient-text">OpenHackathonGPT</span></h1>
      <p>Your fully local, multi-agent AI assistant for winning hackathons</p>
    </div>

    <div class="stats-grid" id="stats-grid">
      ${['blue','purple','green','orange'].map(() => `
        <div class="glass-card stat-card" style="animation:fadeIn 0.3s ease forwards">
          <div class="spinner" style="margin:0 auto"></div>
        </div>
      `).join('')}
    </div>

    <div class="dashboard-grid">
      <div>
        <!-- Quick Start -->
        <div class="glass-card section-card animate-slide-up" style="margin-bottom:20px">
          <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Quick Start</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <button class="btn btn-primary" onclick="window.navigateTo('chat', {newChat:true})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Start New Chat
            </button>
            <button class="btn btn-secondary" onclick="window.navigateTo('chat', {newChat:true,agentMode:true})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg> Run Agent Pipeline
            </button>
          </div>
          <div style="margin-top:16px">
            <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;font-weight:600">Try these prompts:</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="quick-prompts">
              ${[
                'Build a telemedicine platform',
                'Carbon footprint tracker with AI',
                'Adaptive learning for K-12',
                'Zero-trust security framework',
              ].map(p => `
                <span class="badge badge-blue" style="cursor:pointer;padding:6px 10px;font-size:0.78rem"
                      onclick="window.navigateTo('chat',{newChat:true,prompt:'${p.replace(/'/g,"\\'")}'})">${p}</span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Recent Chats -->
        <div class="glass-card section-card animate-slide-up">
          <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Recent Sessions
            <button class="btn btn-ghost" style="margin-left:auto;font-size:0.78rem" onclick="window.navigateTo('history')">View All →</button>
          </div>
          <div id="recent-chats" class="history-list">
            <div style="color:var(--text-muted);font-size:0.85rem">Loading sessions...</div>
          </div>
        </div>
      </div>

      <div>
        <!-- System Status -->
        <div class="glass-card section-card animate-slide-up" style="margin-bottom:20px">
          <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> System Status</div>
          <div id="system-status">
            <div class="spinner" style="margin:0 auto"></div>
          </div>
        </div>

        <!-- Agent Pipeline -->
        <div class="glass-card section-card animate-slide-up">
          <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Agent Pipeline</div>
          <div class="workflow-diagram">
            ${[
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>','Supervisor','Orchestrates workflow'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>','Problem Discovery','Analyzes pain points'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>','Research','Searches web & GitHub'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2v1"/><path d="M12 7a5 5 0 0 0-5 5c0 2 1.5 3.5 2 5h6c.5-1.5 2-3 2-5a5 5 0 0 0-5-5z"/></svg>','Innovation','Gap analysis & scoring'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>','Architecture','System & API design'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>','Pitch Deck','10-slide presentation'],
              ['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>','Judge Prep','15 Q&A answers'],
            ].map(([icon, name, desc], i) => `
              <div class="workflow-step" onclick="window.navigateTo('agents')">
                <div class="workflow-step-icon">${icon}</div>
                <div class="workflow-step-info">
                  <div class="workflow-step-name">${name}</div>
                  <div class="workflow-step-desc">${desc}</div>
                </div>
                <span class="badge badge-blue">${i+1}</span>
              </div>
              ${i < 6 ? '<div class="workflow-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>' : ''}
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Load data
  await Promise.all([loadStats(), loadRecentChats(), loadSystemStatus()]);
}

async function loadStats() {
  try {
    const [health, sessions, models] = await Promise.all([
      checkHealth(),
      listSessions(100),
      listModels(),
    ]);

    const stats = [
      { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', value: sessions.count || 0, label: 'Total Sessions', color: 'blue' },
      { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>', value: models.count || 0, label: 'Ollama Models', color: 'purple' },
      { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', value: 7, label: 'AI Agents', color: 'green' },
      { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', value: '3', label: 'Search Sources', color: 'orange' },
    ];

    document.getElementById('stats-grid').innerHTML = stats.map((s, i) => `
      <div class="glass-card stat-card ${s.color} animate-fade-in" style="animation-delay:${i*0.1}s">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('stats-grid').innerHTML =
      `<div style="color:var(--accent-red);padding:12px;display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${err.message}</div>`;
  }
}

async function loadRecentChats() {
  const el = document.getElementById('recent-chats');
  if (!el) return;
  try {
    const data = await listSessions(5);
    if (!data.sessions?.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">No sessions yet. Start a new chat!</div>';
      return;
    }
    el.innerHTML = data.sessions.map(s => `
      <div class="history-item" onclick="window.loadSession('${s.id}')">
        <span class="history-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
        <div class="history-item-info">
          <div class="history-item-title">${s.title || 'Untitled'}</div>
          <div class="history-item-meta">${s.model || 'Unknown model'} · ${new Date(s.updated_at).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">Could not load history.</div>';
  }
}

async function loadSystemStatus() {
  const el = document.getElementById('system-status');
  if (!el) return;
  try {
    const health = await checkHealth();
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['Server', health.server === 'online', 'FastAPI backend'],
          ['Ollama', health.ollama?.status === 'online', health.ollama?.version ? `v${health.ollama.version}` : 'Not found'],
          ['Database', true, 'SQLite ready'],
          ['Models', health.models_loaded > 0, `${health.models_loaded} loaded`],
        ].map(([name, ok, detail]) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-color)">
            <span class="status-dot ${ok ? 'online pulse' : 'offline'}"></span>
            <span style="font-size:0.85rem;font-weight:500;color:var(--text-primary)">${name}</span>
            <span style="margin-left:auto;font-size:0.75rem;color:var(--text-muted)">${detail}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div style="color:var(--accent-red);font-size:0.82rem;display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${err.message}</div>`;
  }
}
