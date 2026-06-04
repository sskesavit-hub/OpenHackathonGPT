/**
 * Chat Component — full chat UI with WebSocket, streaming, agent pipeline
 */
import { ChatWebSocket, createSession, listSessions, deleteSession } from '../api.js?v=3';
import { AppState } from '../app.js?v=3';
import { updateStatusBar } from './statusBar.js?v=3';

let ws = null;
let reconnectTimeoutId = null;
let isStreaming = false;
let currentStreamEl = null;
let agentMode = false;
let attachedFileContext = null; // RAG context from uploaded file
let selectedScraper = localStorage.getItem('scraper_preference') || 'crawl4ai'; // 'crawl4ai' | 'wikipedia' | 'duckduckgo'

const SUGGESTIONS = [
  { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', title: 'Healthcare AI', desc: 'Build a symptom checker with AI diagnosis', prompt: 'Build a healthcare AI symptom checker app for rural areas' },
  { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', title: 'FinTech Idea', desc: 'Financial inclusion tool', prompt: 'Build a micro-investment platform for underbanked communities' },
  { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/></svg>', title: 'EdTech Platform', desc: 'Adaptive learning for students', prompt: 'Design an adaptive learning platform that personalizes education for students' },
  { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', title: 'Tech Stack', desc: 'System architecture design', prompt: 'Design a scalable cloud architecture for a real-time multiplayer game' },
];

export function renderChatPage(container, options = {}) {
  container.innerHTML = `
    <div class="chat-layout">
      <div class="chat-main">
        <div class="chat-header">
          <div class="chat-header-left">
            <button class="btn btn-ghost btn-icon" id="mobile-menu-btn" style="display:none">☰</button>
            <span class="chat-title" id="chat-session-title">New Chat</span>
            <div class="chat-model-badge">
              <span class="status-dot online pulse"></span>
              <span id="chat-model-name">${AppState.activeModel || 'No model'}</span>
            </div>
          </div>
          <div class="chat-header-actions">
            <div class="agent-toggle" id="agent-toggle-btn" title="Toggle 7-Agent Pipeline">
              <span style="display:flex;align-items:center;gap:6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg> Agent Mode</span>
              <div class="toggle-switch"></div>
            </div>
            <button class="btn btn-ghost btn-icon" id="clear-chat-btn" title="Clear chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>

        <div class="messages-container" id="messages-container">
          <div class="chat-welcome" id="chat-welcome">
            <div class="welcome-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M18 20l4-4-4-4"/><path d="M6 4L2 8l4 4"/></svg>
            </div>
            <h1 class="welcome-title gradient-text">OpenHackathonGPT</h1>
            <p class="welcome-subtitle">
              Your AI-powered hackathon assistant. Get problem analysis, research, innovation ideas,
              architecture design, pitch decks, and judge prep — all in one pipeline.
            </p>
            <div class="welcome-suggestions">
              ${SUGGESTIONS.map(s => `
                <div class="suggestion-card" data-prompt="${s.prompt}">
                  <div class="s-icon">${s.icon}</div>
                  <div class="s-title">${s.title}</div>
                  <div class="s-desc">${s.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <!-- File preview chips -->
          <div id="file-chips-area" style="display:none;padding:6px 14px 0;display:flex;flex-wrap:wrap;gap:6px;"></div>

          <div class="chat-input-wrapper">
            <input type="file" id="file-input" style="display:none"
              accept=".txt,.md,.pdf,.csv,.json,.py,.js,.html,.xml">
            <textarea id="chat-input" placeholder="Describe your hackathon idea or ask anything..."
              rows="1" aria-label="Chat input"></textarea>
            <div class="chat-input-actions">
              <button class="btn btn-ghost btn-icon" id="attach-btn" title="Attach file for RAG context">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button class="send-btn" id="send-btn" aria-label="Send message">
                <span id="send-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></span>
              </button>
            </div>
          </div>
          <div class="chat-hints">
            <span>Press <kbd style="background:var(--bg-tertiary);padding:1px 5px;border-radius:4px;font-size:0.7rem">Enter</kbd> to send · <kbd style="background:var(--bg-tertiary);padding:1px 5px;border-radius:4px;font-size:0.7rem">Shift+Enter</kbd> for new line</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:0.72rem;color:var(--text-muted);display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Scraper:</span>
              <div id="scraper-selector" style="display:flex;gap:4px;">
                <button class="scraper-pill ${selectedScraper === 'crawl4ai' ? 'active' : ''}" data-scraper="crawl4ai" title="Crawl4AI — deep web crawling">Crawl4AI</button>
                <button class="scraper-pill ${selectedScraper === 'wikipedia' ? 'active' : ''}" data-scraper="wikipedia" title="Wikipedia API — encyclopedia">Wikipedia</button>
                <button class="scraper-pill ${selectedScraper === 'duckduckgo' ? 'active' : ''}" data-scraper="duckduckgo" title="DuckDuckGo — web search only">DuckDuckGo</button>
              </div>
              <span id="ws-status-hint" style="color:var(--text-muted);font-size:0.72rem">Connecting...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindChatEvents();   // bind events FIRST — synchronous, always succeeds
  initChat(options);  // then connect WS async
}

async function initChat(options) {
  // Create or load session
  if (options.newChat || !AppState.currentSessionId) {
    try {
      const session = await createSession();
      AppState.currentSessionId = session.id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return;
    }
  } else {
    // Load existing session history
    try {
      const { getSession } = await import('../api.js');
      const data = await getSession(AppState.currentSessionId);
      if (data && data.messages && data.messages.length > 0) {
        // Hide welcome screen
        document.getElementById('chat-welcome')?.remove();
        
        // Render history
        data.messages.forEach(msg => {
          if (msg.role === 'user') {
            appendUserMessage(msg.content, msg.created_at);
          } else {
            appendAssistantMessage(msg.content, true, msg.created_at);
          }
        });
      }
      
      if (data && data.session && data.session.title) {
        const titleEl = document.getElementById('chat-session-title');
        if (titleEl) titleEl.textContent = data.session.title;
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      return;
    }
  }

  // Connect WebSocket
  connectWS(AppState.currentSessionId);
}

function connectWS(sessionId) {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
  
  if (ws) {
    ws.disconnect();
    ws = null;
  }

  ws = new ChatWebSocket(sessionId);
  ws.connect()
    .on('open', () => {
      updateStatusBar({ wsStatus: 'Connected' });
      const hint = document.getElementById('ws-status-hint');
      if (hint) {
        hint.textContent = '● Connected';
        hint.style.color = 'var(--text-muted)';
      }
    })
    .on('close', (e) => {
      updateStatusBar({ wsStatus: 'Disconnected' });
      const hint = document.getElementById('ws-status-hint');
      if (hint) {
        hint.style.color = 'var(--accent-red)';
        hint.textContent = '○ Disconnected';
      }
      
      // Stop reconnecting if it was a policy violation (e.g. Auth failed)
      if (e && e.code === 1008) {
        console.error('WebSocket closed: Policy Violation (Authentication Failed?)');
        return;
      }
      
      // Auto-reconnect after 3s
      if (!reconnectTimeoutId) {
        reconnectTimeoutId = setTimeout(() => { 
          if (AppState.currentSessionId) connectWS(AppState.currentSessionId); 
        }, 3000);
      }
    })
    .on('error', () => {
      updateStatusBar({ wsStatus: 'Error' });
    })
    .on('stream_start', () => {
      removeTypingIndicator();
      currentStreamEl = appendStreamMessage();
    })
    .on('token', (data) => {
      if (currentStreamEl) {
        currentStreamEl.dataset.raw = (currentStreamEl.dataset.raw || '') + data.content;
        currentStreamEl.innerHTML = renderMarkdown(currentStreamEl.dataset.raw);
      }
    })
    .on('stream_end', () => {
      if (currentStreamEl) {
        currentStreamEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      isStreaming = false;
      currentStreamEl = null;
      resetSendBtn();
    })
    .on('pipeline_start', (data) => {
      removeTypingIndicator();
      appendPipelineProgress(data.agents);
    })
    .on('agent_complete', (data) => {
      updatePipelineStep(data.agent, 'done');
      if (data.current_agent) updatePipelineStep(data.current_agent, 'active');
    })
    .on('complete', (data) => {
      updatePipelineStep('judge_prep', 'done');
      removePipelineProgress();
      if (data.content) {
        appendAssistantMessage(data.content, true);
      }
      isStreaming = false;
      resetSendBtn();
    })
    .on('error', (data) => {
      removeTypingIndicator();
      removePipelineProgress();
      // Only append error message if the backend explicitly sent a message
      if (data && data.message && !(data instanceof Event)) {
        appendErrorMessage(data.message);
      } else {
        // Native network error (data is a DOM Event). Just rely on status bar.
        console.warn('WebSocket encountered a network error.');
      }
      isStreaming = false;
      resetSendBtn();
    });

  AppState.currentWS = ws;
}

function bindChatEvents() {
  // Suggestion cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      const input = document.getElementById('chat-input');
      if (input) { input.value = prompt; input.focus(); autoResizeTextarea(input); }
    });
  });

  // Agent toggle
  document.getElementById('agent-toggle-btn')?.addEventListener('click', () => {
    agentMode = !agentMode;
    const btn = document.getElementById('agent-toggle-btn');
    btn?.classList.toggle('active', agentMode);
    const input = document.getElementById('chat-input');
    if (input) {
      input.placeholder = agentMode
        ? 'Describe your hackathon idea for full 7-agent analysis...'
        : 'Ask anything...';
    }
  });

  // Attach file button
  document.getElementById('attach-btn')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });

  // File input change
  document.getElementById('file-input')?.addEventListener('change', handleFileUpload);

  // Scraper pills
  document.querySelectorAll('.scraper-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedScraper = pill.dataset.scraper;
      localStorage.setItem('scraper_preference', selectedScraper);
      document.querySelectorAll('.scraper-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      // Persist to backend settings
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { search_provider: selectedScraper } }),
      }).catch(() => {});
    });
  });

  // Set initial active pill correctly after DOM renders
  setTimeout(() => {
    document.querySelectorAll('.scraper-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.scraper === selectedScraper);
    });
  }, 50);

  // Send button
  document.getElementById('send-btn')?.addEventListener('click', () => {
    if (isStreaming) {
      stopGeneration();
    } else {
      sendChatMessage();
    }
  });

  // Enter key
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Auto-resize textarea
  document.getElementById('chat-input')?.addEventListener('input', (e) => {
    autoResizeTextarea(e.target);
  });

  // Clear chat
  document.getElementById('clear-chat-btn')?.addEventListener('click', async () => {
    const confirmed = await window.customConfirm('Clear Chat', 'Are you sure you want to start a new chat? The current history will remain saved.', 'New Chat');
    if (!confirmed) return;
    const msgs = document.getElementById('messages-container');
    if (msgs) msgs.innerHTML = '';
    // Create new session
    const session = await createSession();
    AppState.currentSessionId = session.id;
    connectWS(session.id);
    renderWelcome();
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (window.innerWidth <= 768 && mobileBtn) {
    mobileBtn.style.display = 'flex';
    mobileBtn.addEventListener('click', () => {
      import('./sidebar.js').then(m => m.openMobileSidebar());
    });
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input?.value?.trim();
  if (!message || isStreaming) return;

  // Hide welcome
  document.getElementById('chat-welcome')?.remove();

  // Build message — prepend file context if present
  let finalMessage = message;
  if (attachedFileContext) {
    finalMessage = `[RAG CONTEXT]\n${attachedFileContext}\n[/RAG CONTEXT]\n\nUser question: ${message}`;
    // Clear attachment after sending
    attachedFileContext = null;
    document.getElementById('file-chips-area').style.display = 'none';
    document.getElementById('file-chips-area').innerHTML = '';
    document.getElementById('file-input').value = '';
  }

  // Append user message (show clean version in UI)
  appendUserMessage(message);
  input.value = '';
  autoResizeTextarea(input);

  // Start streaming state
  isStreaming = true;
  setSendBtnLoading();

  // Show typing
  if (!agentMode) appendTypingIndicator();

  // Send via WebSocket
  if (ws?.connected) {
    ws.send(finalMessage, agentMode);
    updateStatusBar({ wsStatus: agentMode ? 'Running pipeline...' : 'Streaming...' });
  } else {
    removeTypingIndicator();
    appendErrorMessage('WebSocket not connected. Reconnecting...');
    isStreaming = false;
    resetSendBtn();
    connectWS(AppState.currentSessionId);
  }
}

function stopGeneration() {
  if (ws && isStreaming) {
    ws.disconnect();
    isStreaming = false;
    removeTypingIndicator();
    resetSendBtn();
    appendErrorMessage('Generation stopped by user.', 'yellow');
    // Reconnect to allow future messages
    connectWS(AppState.currentSessionId);
  }
}

// ─── File Upload ─────────────────────────────────────────────────────────────

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const attachBtn = document.getElementById('attach-btn');
  const chipsArea = document.getElementById('file-chips-area');

  // Show loading chip
  chipsArea.style.display = 'flex';
  chipsArea.innerHTML = `
    <div class="file-chip loading">
      <span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span>
      Uploading ${file.name}...
    </div>`;

  attachBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/rag/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    attachedFileContext = data.text;

    // Show success chip
    chipsArea.innerHTML = `
      <div class="file-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>${data.filename}</span>
        <span style="color:var(--text-muted);font-size:0.7rem;margin-left:6px;">${(data.size/1024).toFixed(1)}KB · ${data.chars_extracted} chars</span>
        <button class="file-chip-remove" title="Remove file" onclick="
          attachedFileContext = null;
          document.getElementById('file-chips-area').style.display='none';
          document.getElementById('file-chips-area').innerHTML='';
          document.getElementById('file-input').value='';
        "><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>`;
  } catch (err) {
    chipsArea.innerHTML = `<div class="file-chip error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      ${err.message}
    </div>`;
    setTimeout(() => { chipsArea.style.display = 'none'; chipsArea.innerHTML = ''; }, 4000);
  } finally {
    attachBtn.disabled = false;
  }
}

// ─── Message Renderers ──────────────────────────────────────────────────────

function appendUserMessage(content, timestamp = null) {
  const container = document.getElementById('messages-container');
  let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  const el = document.createElement('div');
  el.className = 'message user animate-fade-in';
  el.innerHTML = `
    <div class="message-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
    <div class="message-body">
      <div class="message-bubble">${escapeHtml(content)}</div>
      <div class="message-time">${timeStr}</div>
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function appendAssistantMessage(content, isMarkdown = false, timestamp = null) {
  const container = document.getElementById('messages-container');
  let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  const el = document.createElement('div');
  el.className = 'message assistant animate-fade-in';
  el.innerHTML = `
    <div class="message-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    </div>
    <div class="message-body">
      <div class="message-bubble ${isMarkdown ? 'markdown-content' : ''}">
        ${isMarkdown ? renderMarkdown(content) : escapeHtml(content)}
      </div>
      <div class="message-time">${timeStr}</div>
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function appendStreamMessage() {
  const container = document.getElementById('messages-container');
  const el = document.createElement('div');
  el.className = 'message assistant animate-fade-in';
  el.dataset.raw = '';
  el.innerHTML = `
    <div class="message-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    </div>
    <div class="message-body">
      <div class="message-bubble markdown-content" id="stream-bubble"></div>
      <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el.querySelector('#stream-bubble');
}

function appendTypingIndicator() {
  removeTypingIndicator();
  const container = document.getElementById('messages-container');
  const el = document.createElement('div');
  el.className = 'message assistant typing-message animate-fade-in';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="message-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    </div>
    <div class="message-body">
      <div class="message-bubble typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

function appendErrorMessage(msg, colorType = 'red') {
  const container = document.getElementById('messages-container');
  const el = document.createElement('div');
  el.className = 'message assistant animate-fade-in';
  
  const isYellow = colorType === 'yellow';
  const colorVar = isYellow ? 'var(--accent-orange)' : 'var(--accent-red)';
  const bgRgba = isYellow ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239,68,68,0.05)';
  const svgIcon = isYellow 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  el.innerHTML = `
    <div class="message-avatar" style="color:${colorVar}">${svgIcon}</div>
    <div class="message-body">
      <div class="message-bubble" style="border-color:${colorVar};background:${bgRgba}">
        <span style="color:${colorVar}">${escapeHtml(msg)}</span>
      </div>
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// ─── Pipeline Progress UI ───────────────────────────────────────────────────

const AGENT_META = {
  supervisor:        { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', label: 'Supervisor' },
  problem_discovery: { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', label: 'Problem Discovery' },
  research:          { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>', label: 'Research' },
  innovation:        { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2v1"/><path d="M12 7a5 5 0 0 0-5 5c0 2 1.5 3.5 2 5h6c.5-1.5 2-3 2-5a5 5 0 0 0-5-5z"/></svg>', label: 'Innovation' },
  architecture:      { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', label: 'Architecture' },
  ppt:               { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', label: 'Pitch Deck' },
  judge_prep:        { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', label: 'Judge Prep' },
};

function appendPipelineProgress(agents) {
  const container = document.getElementById('messages-container');
  const el = document.createElement('div');
  el.id = 'pipeline-progress';
  el.className = 'pipeline-progress animate-fade-in';
  el.innerHTML = `
    <div class="pipeline-title">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      Running 7-Agent Pipeline...
    </div>
    <div class="pipeline-steps">
      ${agents.map(a => `
        <div class="pipeline-step ${a === 'supervisor' ? 'active' : ''}" id="step-${a}">
          <span style="display:flex;align-items:center">${AGENT_META[a]?.icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'}</span>
          <span>${AGENT_META[a]?.label || a}</span>
        </div>
      `).join('')}
    </div>
  `;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function updatePipelineStep(agentName, status) {
  const el = document.getElementById(`step-${agentName}`);
  if (el) {
    el.className = `pipeline-step ${status}`;
  }
}

function removePipelineProgress() {
  document.getElementById('pipeline-progress')?.remove();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function setSendBtnLoading() {
  const btn = document.getElementById('send-btn');
  const icon = document.getElementById('send-icon');
  if (btn) {
    btn.classList.add('stop-btn');
    btn.title = "Stop Generating";
  }
  if (icon) icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>';
}

function resetSendBtn() {
  const btn = document.getElementById('send-btn');
  const icon = document.getElementById('send-icon');
  if (btn) {
    btn.classList.remove('stop-btn');
    btn.title = "Send Message";
  }
  if (icon) icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  updateStatusBar({ wsStatus: 'Connected' });
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function renderWelcome() {
  const container = document.getElementById('messages-container');
  if (container) {
    const welcome = document.createElement('div');
    welcome.id = 'chat-welcome';
    welcome.className = 'chat-welcome';
    welcome.innerHTML = `<div class="welcome-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><h1 class="welcome-title gradient-text">New Chat</h1>`;
    container.appendChild(welcome);
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderMarkdown(text) {
  // Simple markdown renderer
  return text
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export function destroyChat() {
  if (ws) {
    ws.disconnect();
    ws = null;
  }
}
