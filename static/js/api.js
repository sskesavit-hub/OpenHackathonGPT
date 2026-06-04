/**
 * API Client — all fetch and WebSocket communication
 */

const BASE = '';  // Same origin

// ─── HTTP Client ─────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = { 
    'Content-Type': 'application/json', 
    ...options.headers 
  };

  const res = await fetch(BASE + path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ─── Health ───────────────────────────────────────────────────────────────

export async function checkHealth() {
  return apiFetch('/api/health');
}

// ─── Models ───────────────────────────────────────────────────────────────

export async function listModels() {
  return apiFetch('/api/models');
}

export async function selectModel(modelName) {
  return apiFetch('/api/models/select', {
    method: 'POST',
    body: JSON.stringify({ model_name: modelName }),
  });
}

export async function refreshModels() {
  return apiFetch('/api/models/refresh', { method: 'POST' });
}

// ─── Chat Sessions ─────────────────────────────────────────────────────────

export async function listSessions(limit = 50) {
  return apiFetch(`/api/chat/sessions?limit=${limit}`);
}

export async function createSession(title = 'New Chat') {
  return apiFetch(`/api/chat/sessions?title=${encodeURIComponent(title)}`, { method: 'POST' });
}

export async function getSession(sessionId) {
  return apiFetch(`/api/chat/sessions/${sessionId}`);
}

export async function deleteSession(sessionId) {
  return apiFetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function updateSessionTitle(sessionId, title) {
  return apiFetch(`/api/chat/sessions/${sessionId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

// ─── Chat Messages ─────────────────────────────────────────────────────────

export async function sendMessage(message, sessionId = null, useAgents = false) {
  return apiFetch('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, session_id: sessionId, use_agents: useAgents }),
  });
}

// ─── Agents ───────────────────────────────────────────────────────────────

export async function listAgents() {
  return apiFetch('/api/agents/list');
}

export async function runAgentPipeline(topic, sessionId = null) {
  return apiFetch('/api/agents/run', {
    method: 'POST',
    body: JSON.stringify({ topic, session_id: sessionId }),
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────

export async function getSettings() {
  return apiFetch('/api/settings');
}

export async function saveSettings(settingsObj) {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings: settingsObj }),
  });
}

// ─── WebSocket Manager ─────────────────────────────────────────────────────

export class ChatWebSocket {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.ws = null;
    this.handlers = {};
  }

  connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/api/chat/ws/${this.sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this._emit('open');
    this.ws.onclose = (e) => this._emit('close', e);
    this.ws.onerror = (e) => this._emit('error', e);
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this._emit(data.type || 'message', data);
        this._emit('message', data);
      } catch {
        this._emit('raw', e.data);
      }
    };

    return this;
  }

  send(message, useAgents = false) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ message, use_agents: useAgents }));
    }
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    }
    return this;
  }

  _emit(event, data) {
    (this.handlers[event] || []).forEach(h => h(data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
