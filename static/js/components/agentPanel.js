/**
 * Agent Panel Component — displays the 7 agents and workflow
 */
import { listAgents } from '../api.js?v=3';

const AGENT_COLORS = ['blue', 'purple', 'cyan', 'green', 'orange', 'pink', 'red'];
const AGENT_ICONS  = [
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2v1"/><path d="M12 7a5 5 0 0 0-5 5c0 2 1.5 3.5 2 5h6c.5-1.5 2-3 2-5a5 5 0 0 0-5-5z"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
];

export async function renderAgentPanel(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:text-bottom"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Multi-Agent Pipeline</h1>
      <p>7 specialized AI agents working in sequence to build your hackathon project</p>
    </div>

    <div class="dashboard-grid">
      <div>
        <div id="agents-grid" class="agents-grid">
          ${Array(7).fill(0).map((_, i) => `
            <div class="glass-card agent-card" style="animation-delay:${i * 0.05}s">
              <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                <div class="spinner"></div>
                <span style="color:var(--text-muted);font-size:0.85rem">Loading...</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <div class="glass-card section-card">
          <div class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Workflow</div>
          <div class="workflow-diagram" id="workflow-diagram">
            <div style="color:var(--text-muted);font-size:0.85rem">Loading workflow...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await listAgents();
    renderAgentCards(data.agents);
    renderWorkflowDiagram(data.agents, data.workflow);
  } catch (err) {
    document.getElementById('agents-grid').innerHTML =
      `<div style="color:var(--accent-red);padding:20px;display:flex;align-items:center;gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${err.message}</div>`;
  }
}

function renderAgentCards(agents) {
  const grid = document.getElementById('agents-grid');
  if (!grid) return;

  grid.innerHTML = agents.map((agent, i) => `
    <div class="glass-card agent-card animate-fade-in" style="animation-delay:${i * 0.07}s">
      <div class="agent-card-header">
        <div class="agent-icon-wrapper ${AGENT_COLORS[i]}">
          ${AGENT_ICONS[i]}
        </div>
        <span class="agent-step-num">Step ${i + 1}</span>
      </div>
      <div class="agent-card-name">${agent.name}</div>
      <div class="agent-card-desc">${agent.description}</div>
    </div>
  `).join('');
}

function renderWorkflowDiagram(agents, workflowStr) {
  const diag = document.getElementById('workflow-diagram');
  if (!diag) return;

  diag.innerHTML = agents.map((a, i) => `
    <div class="workflow-step" id="wf-${a.id}">
      <div class="workflow-step-icon">${AGENT_ICONS[i]}</div>
      <div class="workflow-step-info">
        <div class="workflow-step-name">${a.name}</div>
        <div class="workflow-step-desc">${a.description.substring(0, 50)}...</div>
      </div>
      <span class="badge badge-${AGENT_COLORS[i]}">${i + 1}</span>
    </div>
    ${i < agents.length - 1 ? '<div class="workflow-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>' : ''}
  `).join('');
}
