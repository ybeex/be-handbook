// ─── Extra playground templates — knowledge bank ─────────────────────────────

export interface PlayFile {
  id: string;
  name: string;
  ext: 'html' | 'css' | 'js' | 'jsx' | 'tsx' | 'ts' | 'json';
  content: string;
}

export interface HtmlTemplate { label: string; html: string; css: string; js: string }
export interface MultiFileTemplate { label: string; files: PlayFile[] }

// ── HTML Knowledge Bank ───────────────────────────────────────────────────────
export const HTML_KB: Record<string, HtmlTemplate> = {
  fetch_get: {
    label: '📡 Fetch GET',
    html: `<div class="app">
  <h1>JSONPlaceholder — GET</h1>
  <div class="controls">
    <select id="resource">
      <option value="posts">Posts</option>
      <option value="users">Users</option>
      <option value="todos">Todos</option>
    </select>
    <input id="limit" type="number" value="5" min="1" max="20" style="width:64px" />
    <button id="load">Fetch</button>
  </div>
  <div id="status" class="status"></div>
  <div id="list"></div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.controls { display: flex; gap: 8px; flex-wrap: wrap; }
select, input { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 7px 10px; color: #f1f5f9; font-size: 13px; outline: none; }
select:focus, input:focus { border-color: #c9a84c; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 8px; padding: 7px 16px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all .15s; }
button:hover { background: #e8c96b; }
button:disabled { opacity: 0.5; cursor: wait; }
.status { font-size: 12px; color: #64748b; min-height: 16px; }
.status.ok  { color: #4ade80; }
.status.err { color: #f87171; }
.list { display: flex; flex-direction: column; gap: 8px; }
.item { background: #1e293b; border: 1px solid #334155; border-radius: 9px; padding: 12px 14px; font-size: 13px; }
.item strong { display: block; color: #f1f5f9; margin-bottom: 3px; }
.item span { color: #64748b; font-size: 12px; }
pre { background: #0f172a; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #94a3b8; white-space: pre-wrap; overflow: auto; max-height: 80px; margin-top: 4px; }`,
    js: `const btn = document.getElementById('load');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');

async function load() {
  const resource = document.getElementById('resource').value;
  const limit = document.getElementById('limit').value;
  btn.disabled = true;
  statusEl.textContent = 'Fetching…';
  statusEl.className = 'status';
  listEl.innerHTML = '';

  try {
    const t0 = Date.now();
    const res = await fetch(\`https://jsonplaceholder.typicode.com/\${resource}?_limit=\${limit}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);

    const data = await res.json();
    const ms = Date.now() - t0;
    console.log(\`Fetched \${data.length} \${resource} in \${ms}ms\`, data);

    statusEl.className = 'status ok';
    statusEl.textContent = \`\${data.length} \${resource} · \${ms}ms\`;

    listEl.innerHTML = data.map(item => {
      const key = item.title ?? item.name ?? item.todo ?? item.email ?? '';
      const sub = item.email ?? item.username ?? (item.completed !== undefined ? (item.completed ? '✅ done' : '⬜ pending') : '');
      return \`<div class="item">
        <strong>\${key.slice(0, 60)}</strong>
        <span>ID: \${item.id} \${sub ? '· ' + sub : ''}</span>
        <pre>\${JSON.stringify(item, null, 2).slice(0, 200)}…</pre>
      </div>\`;
    }).join('');
  } catch (e) {
    statusEl.className = 'status err';
    statusEl.textContent = 'Error: ' + e.message;
    console.error(e);
  } finally { btn.disabled = false; }
}

btn.addEventListener('click', load);
load();`
  },

  fetch_post: {
    label: '📤 POST / PUT / DELETE',
    html: `<div class="app">
  <h1>CRUD Operations</h1>
  <div class="section">
    <h2>POST — Create</h2>
    <input id="post-title" placeholder="Title" />
    <textarea id="post-body" placeholder="Body…"></textarea>
    <button id="btn-create">Create Post</button>
    <pre id="res-create" class="result">Response appears here…</pre>
  </div>
  <div class="section">
    <h2>PUT — Replace</h2>
    <input id="put-title" value="Replaced title" />
    <button id="btn-put">PUT /posts/1</button>
    <pre id="res-put" class="result"></pre>
  </div>
  <div class="section">
    <h2>PATCH — Update fields</h2>
    <input id="patch-title" value="Patched title only" />
    <button id="btn-patch">PATCH /posts/1</button>
    <pre id="res-patch" class="result"></pre>
  </div>
  <div class="section">
    <h2>DELETE</h2>
    <button id="btn-delete" class="danger">DELETE /posts/1</button>
    <pre id="res-delete" class="result"></pre>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
h2 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
input, textarea { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 8px 11px; color: #f1f5f9; font-size: 13px; outline: none; font-family: inherit; width: 100%; }
textarea { min-height: 56px; resize: vertical; }
input:focus, textarea:focus { border-color: #c9a84c; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 7px; padding: 8px 14px; font-weight: 600; cursor: pointer; font-size: 13px; align-self: flex-start; transition: all .15s; }
button:hover { background: #e8c96b; }
button.danger { background: #ef4444; color: white; }
button.danger:hover { background: #dc2626; }
button:disabled { opacity: 0.5; cursor: wait; }
.result { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 10px 12px; font-size: 11.5px; color: #94a3b8; white-space: pre-wrap; min-height: 36px; font-family: monospace; }
.result.ok  { border-color: rgba(34,197,94,.4); color: #4ade80; }
.result.err { border-color: rgba(248,113,113,.4); color: #f87171; }`,
    js: `const BASE = 'https://jsonplaceholder.typicode.com';

async function req(id, method, url, body) {
  const el = document.getElementById('res-' + id);
  el.className = 'result';
  el.textContent = 'Loading…';
  const btn = document.getElementById('btn-' + id);
  btn.disabled = true;
  try {
    const res = await fetch(BASE + url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    console.log(method, url, '→', res.status, data);
    el.className = 'result ok';
    el.textContent = \`HTTP \${res.status}\\n\` + JSON.stringify(data, null, 2);
  } catch(e) {
    el.className = 'result err';
    el.textContent = 'Error: ' + e.message;
  } finally { btn.disabled = false; }
}

document.getElementById('btn-create').addEventListener('click', () =>
  req('create', 'POST', '/posts', {
    title: document.getElementById('post-title').value || 'My Post',
    body:  document.getElementById('post-body').value  || 'Content',
    userId: 1,
  })
);
document.getElementById('btn-put').addEventListener('click', () =>
  req('put', 'PUT', '/posts/1', {
    id: 1, title: document.getElementById('put-title').value, body: 'Replaced body', userId: 1,
  })
);
document.getElementById('btn-patch').addEventListener('click', () =>
  req('patch', 'PATCH', '/posts/1', { title: document.getElementById('patch-title').value })
);
document.getElementById('btn-delete').addEventListener('click', () =>
  req('delete', 'DELETE', '/posts/1')
);`
  },

  fetch_auth: {
    label: '🔐 Auth & JWT',
    html: `<div class="app">
  <h1>Auth Token Flow</h1>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <h2>Login — Get Access Token</h2>
      <div class="row"><input id="user" value="emilys" placeholder="Username"/><input id="pass" value="emilyspass" type="password" placeholder="Password"/></div>
      <button id="btn-login">Login</button>
      <pre id="res-login" class="result">Response appears here…</pre>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <h2>Authenticated Request</h2>
      <p class="hint">Token from step 1 is attached automatically as Bearer header</p>
      <button id="btn-me">GET /auth/me</button>
      <pre id="res-me" class="result"></pre>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <h2>Refresh Expired Token</h2>
      <button id="btn-refresh">Refresh Token</button>
      <pre id="res-refresh" class="result"></pre>
    </div>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.step { display: flex; gap: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
.step-num { width: 26px; height: 26px; border-radius: 50%; background: rgba(201,168,76,.15); border: 1px solid rgba(201,168,76,.35); color: #c9a84c; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.step-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
h2 { font-size: 13px; font-weight: 700; color: #f1f5f9; }
.hint { font-size: 12px; color: #475569; }
.row { display: flex; gap: 7px; }
input { flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 7px 10px; color: #f1f5f9; font-size: 13px; outline: none; }
input:focus { border-color: #c9a84c; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 7px; padding: 8px 14px; font-weight: 600; cursor: pointer; font-size: 13px; align-self: flex-start; transition: all .15s; }
button:hover { background: #e8c96b; }
button:disabled { opacity: 0.5; cursor: wait; }
.result { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 10px 12px; font-size: 11.5px; color: #94a3b8; white-space: pre-wrap; min-height: 36px; font-family: monospace; word-break: break-all; }
.result.ok  { border-color: rgba(34,197,94,.4); color: #4ade80; }
.result.err { border-color: rgba(248,113,113,.4); color: #f87171; }`,
    js: `const BASE = 'https://dummyjson.com';
let accessToken = '';
let refreshToken = '';

async function call(resultId, fn) {
  const el = document.getElementById('res-' + resultId);
  el.className = 'result';
  el.textContent = 'Loading…';
  try {
    const data = await fn();
    el.className = 'result ok';
    el.textContent = JSON.stringify(data, null, 2);
  } catch(e) {
    el.className = 'result err';
    el.textContent = 'Error: ' + e.message;
    console.error(e);
  }
}

document.getElementById('btn-login').addEventListener('click', () =>
  call('login', async () => {
    const res = await fetch(BASE + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('user').value, password: document.getElementById('pass').value, expiresInMins: 30 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    accessToken  = data.accessToken;
    refreshToken = data.refreshToken;
    console.log('Logged in. Token:', accessToken.slice(0, 40) + '…');
    return { id: data.id, name: data.firstName + ' ' + data.lastName, role: data.role, tokenPreview: accessToken.slice(0, 40) + '…' };
  })
);

document.getElementById('btn-me').addEventListener('click', () =>
  call('me', async () => {
    if (!accessToken) throw new Error('Login first to get a token');
    const res = await fetch(BASE + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unauthorized');
    return { id: data.id, name: data.firstName + ' ' + data.lastName, email: data.email };
  })
);

document.getElementById('btn-refresh').addEventListener('click', () =>
  call('refresh', async () => {
    if (!refreshToken) throw new Error('Login first to get a refresh token');
    const res = await fetch(BASE + '/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, expiresInMins: 30 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Refresh failed');
    accessToken  = data.accessToken;
    refreshToken = data.refreshToken;
    return { newTokenPreview: accessToken.slice(0, 40) + '…' };
  })
);`
  },

  fetch_abort: {
    label: '⏱ Abort & Retry',
    html: `<div class="app">
  <h1>Advanced Fetch Patterns</h1>
  <div class="section">
    <h2>AbortController — Cancel Stale Requests</h2>
    <p class="hint">Each keystroke cancels the previous in-flight request</p>
    <input id="search" placeholder="Type to search posts…" />
    <div id="abort-status" class="status"></div>
    <div id="abort-results"></div>
  </div>
  <div class="section">
    <h2>Fetch with Timeout</h2>
    <div class="row">
      <button id="btn-fast">Fast (5s timeout)</button>
      <button id="btn-timeout">Instant timeout (1ms)</button>
    </div>
    <div id="timeout-res" class="result"></div>
  </div>
  <div class="section">
    <h2>Exponential Backoff Retry</h2>
    <p class="hint">Simulates 60% failure rate — watch the retry log</p>
    <button id="btn-retry">Attempt with retry</button>
    <div id="retry-log" class="log"></div>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
h2 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
.hint { font-size: 12px; color: #475569; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
input { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 8px 11px; color: #f1f5f9; font-size: 13px; outline: none; width: 100%; }
input:focus { border-color: #c9a84c; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 7px; padding: 7px 14px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all .15s; }
button:hover { background: #e8c96b; }
.status { font-size: 12px; min-height: 16px; }
.status.ok { color: #4ade80; } .status.err { color: #f87171; } .status.warn { color: #f97316; }
.result { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 10px 12px; font-size: 12px; color: #94a3b8; min-height: 36px; font-family: monospace; white-space: pre-wrap; }
.result.ok { border-color: rgba(34,197,94,.35); color: #4ade80; } .result.err { border-color: rgba(248,113,113,.35); color: #f87171; }
.log { background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 10px 12px; font-size: 12px; font-family: monospace; min-height: 48px; max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.log-line { } .log-line.ok { color: #4ade80; } .log-line.warn { color: #fb923c; } .log-line.err { color: #f87171; }
.post-item { padding: 5px 0; border-bottom: 1px solid #1e293b; font-size: 12px; color: #cbd5e1; }`,
    js: `// ── AbortController ──────────────────────────────────────────
let ctrl = null;
const searchEl = document.getElementById('search');
const abortStatus = document.getElementById('abort-status');
const abortResults = document.getElementById('abort-results');

searchEl.addEventListener('input', async e => {
  if (ctrl) { ctrl.abort(); }
  const q = e.target.value.trim();
  if (!q) { abortStatus.textContent = ''; abortResults.innerHTML = ''; return; }
  ctrl = new AbortController();
  abortStatus.className = 'status'; abortStatus.textContent = 'Searching…';
  try {
    const res = await fetch(\`https://jsonplaceholder.typicode.com/posts?_limit=5\`, { signal: ctrl.signal });
    const posts = await res.json();
    const filtered = posts.filter(p => p.title.includes(q) || q.length <= 2);
    abortStatus.className = 'status ok'; abortStatus.textContent = \`\${posts.length} results\`;
    abortResults.innerHTML = posts.map(p => \`<div class="post-item">\${p.title}</div>\`).join('');
    console.log('Search complete:', posts.length, 'results');
  } catch(e) {
    if (e.name === 'AbortError') {
      abortStatus.className = 'status warn'; abortStatus.textContent = 'Request cancelled — superseded';
    } else {
      abortStatus.className = 'status err'; abortStatus.textContent = 'Error: ' + e.message;
    }
  }
});

// ── Timeout ───────────────────────────────────────────────────
async function fetchWithTimeout(url, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const res = await fetch(url, { signal: c.signal });
    return await res.json();
  } catch(e) {
    if (e.name === 'AbortError') throw new Error(\`Timeout after \${ms}ms\`);
    throw e;
  } finally { clearTimeout(t); }
}

const timeoutRes = document.getElementById('timeout-res');
document.getElementById('btn-fast').addEventListener('click', async () => {
  timeoutRes.className = 'result'; timeoutRes.textContent = 'Fetching (5s timeout)…';
  try { const d = await fetchWithTimeout('https://jsonplaceholder.typicode.com/posts/1', 5000); timeoutRes.className = 'result ok'; timeoutRes.textContent = JSON.stringify(d, null, 2); }
  catch(e) { timeoutRes.className = 'result err'; timeoutRes.textContent = e.message; }
});
document.getElementById('btn-timeout').addEventListener('click', async () => {
  timeoutRes.className = 'result'; timeoutRes.textContent = 'Trying (1ms timeout — will timeout)…';
  try { await fetchWithTimeout('https://jsonplaceholder.typicode.com/posts/1', 1); }
  catch(e) { timeoutRes.className = 'result err'; timeoutRes.textContent = e.message; }
});

// ── Retry with exponential backoff ────────────────────────────
async function fetchWithRetry(url, maxRetries = 3, baseDelay = 400) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    addLog(\`Attempt \${attempt + 1}…\`, 'warn');
    try {
      if (Math.random() < 0.6 && attempt < maxRetries) throw new Error('Simulated network failure');
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      if (attempt === maxRetries) throw e;
      const delay = baseDelay * Math.pow(2, attempt);
      addLog(\`  Failed: \${e.message}. Retry in \${delay}ms\`, 'err');
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

const retryLog = document.getElementById('retry-log');
function addLog(text, cls='') {
  const el = document.createElement('div');
  el.className = 'log-line ' + cls;
  el.textContent = new Date().toLocaleTimeString() + ' ' + text;
  retryLog.appendChild(el);
  retryLog.scrollTop = retryLog.scrollHeight;
}

document.getElementById('btn-retry').addEventListener('click', async () => {
  retryLog.innerHTML = '';
  try {
    const data = await fetchWithRetry('https://jsonplaceholder.typicode.com/posts/1');
    addLog('Success: ' + data.title, 'ok');
  } catch(e) { addLog('All retries failed: ' + e.message, 'err'); }
});`
  },

  websocket: {
    label: '🔌 WebSocket & SSE',
    html: `<div class="app">
  <h1>Real-Time Patterns</h1>
  <div class="section">
    <h2>WebSocket — Echo Server</h2>
    <div id="ws-badge" class="badge disconnected">● Disconnected</div>
    <div class="row">
      <input id="ws-msg" placeholder="Message to echo…" disabled />
      <button id="ws-send" disabled>Send</button>
    </div>
    <button id="ws-connect">Connect</button>
    <div id="ws-log" class="log"></div>
  </div>
  <div class="section">
    <h2>Server-Sent Events (simulated)</h2>
    <p class="hint">Real SSE: <code>new EventSource('/api/stream')</code></p>
    <div class="row">
      <button id="sse-start">Start stream</button>
      <button id="sse-stop" disabled class="ghost">Stop</button>
    </div>
    <div id="sse-log" class="log"></div>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
h2 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
.hint { font-size: 12px; color: #475569; }
.hint code { background: #0f172a; padding: 1px 5px; border-radius: 4px; font-size: 11px; color: #c9a84c; }
.row { display: flex; gap: 8px; }
input { flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 7px; padding: 7px 10px; color: #f1f5f9; font-size: 13px; outline: none; }
input:focus { border-color: #c9a84c; }
input:disabled { opacity: 0.4; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 7px; padding: 7px 14px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all .15s; white-space: nowrap; }
button:hover { background: #e8c96b; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
button.ghost { background: transparent; border: 1px solid #334155; color: #94a3b8; }
button.ghost:hover { background: #1e293b; }
.badge { display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 99px; }
.badge.connected { background: rgba(34,197,94,.12); color: #4ade80; }
.badge.disconnected { background: rgba(248,113,113,.1); color: #f87171; }
.log { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; font-family: monospace; min-height: 80px; max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ll { } .ll.sent { color: #60a5fa; } .ll.recv { color: #4ade80; } .ll.sys { color: #475569; font-style: italic; } .ll.err { color: #f87171; } .ll.evt { color: #c9a84c; }`,
    js: `// ── WebSocket ──────────────────────────────────────────────
let ws = null;
const wsLog = document.getElementById('ws-log');
const wsBadge = document.getElementById('ws-badge');
const wsMsgEl = document.getElementById('ws-msg');
const wsSendEl = document.getElementById('ws-send');
const wsConnEl = document.getElementById('ws-connect');

function ll(el, msg, cls='') {
  const d = document.createElement('div');
  d.className = 'll ' + cls;
  d.textContent = new Date().toLocaleTimeString() + ' ' + msg;
  el.appendChild(d); el.scrollTop = el.scrollHeight;
}

wsConnEl.addEventListener('click', () => {
  if (ws) { ws.close(); return; }
  ws = new WebSocket('wss://echo.websocket.org');
  ll(wsLog, 'Connecting to echo.websocket.org…', 'sys');
  ws.onopen    = () => {
    wsBadge.className = 'badge connected'; wsBadge.textContent = '● Connected';
    wsMsgEl.disabled = wsSendEl.disabled = false;
    wsConnEl.textContent = 'Disconnect';
    ll(wsLog, 'Connection open', 'sys');
  };
  ws.onmessage = e => { ll(wsLog, '← ' + e.data, 'recv'); console.log('Recv:', e.data); };
  ws.onerror   = () => ll(wsLog, 'Error', 'err');
  ws.onclose   = () => {
    wsBadge.className = 'badge disconnected'; wsBadge.textContent = '● Disconnected';
    wsMsgEl.disabled = wsSendEl.disabled = true;
    wsConnEl.textContent = 'Connect';
    ll(wsLog, 'Connection closed', 'sys'); ws = null;
  };
});

wsSendEl.addEventListener('click', () => {
  if (!ws || !wsMsgEl.value.trim()) return;
  ws.send(wsMsgEl.value);
  ll(wsLog, '→ ' + wsMsgEl.value, 'sent');
  wsMsgEl.value = '';
});
wsMsgEl.addEventListener('keydown', e => e.key === 'Enter' && wsSendEl.click());

// ── SSE Simulation ─────────────────────────────────────────
let sseTimer = null;
const sseLog = document.getElementById('sse-log');
const SSE_EVENTS = [
  { event: 'user:joined',  data: { user: 'Alice', room: 'general' } },
  { event: 'message',      data: { from: 'Bob', text: 'Hey team! 👋' } },
  { event: 'metric',       data: { cpu: '24%', mem: '1.1GB', rps: 842 } },
  { event: 'user:left',    data: { user: 'Charlie' } },
  { event: 'deploy',       data: { version: 'v1.4.2', env: 'prod', status: 'success' } },
  { event: 'alert',        data: { severity: 'warn', msg: 'Memory usage > 80%' } },
];
let sseIdx = 0;

document.getElementById('sse-start').addEventListener('click', () => {
  document.getElementById('sse-start').disabled = true;
  document.getElementById('sse-stop').disabled  = false;
  ll(sseLog, 'Stream opened', 'sys');
  sseTimer = setInterval(() => {
    const e = SSE_EVENTS[sseIdx++ % SSE_EVENTS.length];
    ll(sseLog, \`event: \${e.event}  data: \${JSON.stringify(e.data)}\`, 'evt');
    console.log('SSE:', e.event, e.data);
  }, 1000);
});

document.getElementById('sse-stop').addEventListener('click', () => {
  clearInterval(sseTimer);
  document.getElementById('sse-start').disabled = false;
  document.getElementById('sse-stop').disabled  = true;
  ll(sseLog, 'Stream closed', 'sys');
});`
  },

  api_client: {
    label: '🏗 API Client Class',
    html: `<div class="app">
  <h1>Production API Client</h1>
  <p class="desc">Reusable class with interceptors, typed errors, auth headers, and timeout. See console for request logs.</p>
  <div class="grid">
    <button data-action="list">List Posts (5)</button>
    <button data-action="get">Get Post #3</button>
    <button data-action="post">Create Post</button>
    <button data-action="404" class="danger">Trigger 404</button>
    <button data-action="users">List Users</button>
    <button data-action="comments">Comments (Post #1)</button>
  </div>
  <pre id="out" class="out">Click a button to make a request…</pre>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; min-height: 100vh; }
.app { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.desc { font-size: 13px; color: #64748b; line-height: 1.6; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
button { background: #1e293b; color: #f1f5f9; border: 1px solid #334155; border-radius: 8px; padding: 9px 14px; font-weight: 500; cursor: pointer; font-size: 13px; transition: all .15s; text-align: left; }
button:hover { background: #334155; border-color: #475569; }
button.danger { border-color: rgba(248,113,113,.35); color: #f87171; }
button.danger:hover { background: rgba(248,113,113,.1); }
button:disabled { opacity: 0.4; cursor: wait; }
.out { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; font-size: 12px; color: #94a3b8; white-space: pre-wrap; min-height: 160px; max-height: 400px; overflow-y: auto; font-family: monospace; }
.out.ok  { border-color: rgba(34,197,94,.35); }
.out.err { border-color: rgba(248,113,113,.35); color: #f87171; }`,
    js: `class ApiClient {
  constructor({ baseURL, headers = {}, timeout = 8000 }) {
    this.base = baseURL.replace(/\\/+$/, '');
    this.headers = headers;
    this.timeout = timeout;
    this._reqInterceptors = [];
    this._resInterceptors = [];
  }
  useRequest(fn)  { this._reqInterceptors.push(fn); return this; }
  useResponse(fn) { this._resInterceptors.push(fn); return this; }

  async request(method, path, { body, headers = {}, params } = {}) {
    let url = this.base + path;
    if (params) {
      const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null));
      if (q.toString()) url += '?' + q;
    }
    let cfg = { method, headers: { 'Content-Type':'application/json', ...this.headers, ...headers }, body: body ? JSON.stringify(body) : undefined };
    for (const fn of this._reqInterceptors) cfg = await fn(cfg, url) ?? cfg;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, { ...cfg, signal: controller.signal });
      clearTimeout(timer);
      const ct = res.headers.get('content-type') ?? '';
      const data = ct.includes('json') ? await res.json() : await res.text();
      if (!res.ok) { const err = new Error((data?.message) ?? \`HTTP \${res.status}\`); err.status = res.status; err.data = data; throw err; }
      let out = { data, status: res.status };
      for (const fn of this._resInterceptors) out = await fn(out) ?? out;
      return out;
    } catch(e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') { const t = new Error(\`Timeout after \${this.timeout}ms\`); t.status = 408; throw t; }
      throw e;
    }
  }
  get(path, opts)        { return this.request('GET',    path, opts); }
  post(path, body, opts) { return this.request('POST',   path, { body, ...opts }); }
  patch(path, body,opts) { return this.request('PATCH',  path, { body, ...opts }); }
  delete(path, opts)     { return this.request('DELETE', path, opts); }
}

// Instantiate with config
const api = new ApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: { 'X-Client': 'playground/1.0' },
  timeout: 6000,
});
// Add interceptors
api.useRequest((cfg, url) => { console.group(\`→ \${cfg.method} \${url}\`); return cfg; });
api.useResponse(res => { console.log(\`← \${res.status}\`, res.data); console.groupEnd(); return res; });

const out = document.getElementById('out');
const btns = document.querySelectorAll('button[data-action]');

async function run(action) {
  out.className = 'out'; out.textContent = 'Loading…';
  btns.forEach(b => b.disabled = true);
  try {
    let r;
    if (action === 'list')     r = await api.get('/posts', { params: { _limit: 5 } });
    if (action === 'get')      r = await api.get('/posts/3');
    if (action === 'post')     r = await api.post('/posts', { title: 'New Post', body: 'Body text', userId: 1 });
    if (action === '404')      r = await api.get('/posts/9999999');
    if (action === 'users')    r = await api.get('/users', { params: { _limit: 4 } });
    if (action === 'comments') r = await api.get('/posts/1/comments', { params: { _limit: 3 } });
    out.className = 'out ok';
    out.textContent = JSON.stringify(r.data, null, 2);
  } catch(e) {
    console.groupEnd();
    out.className = 'out err';
    out.textContent = \`Error \${e.status ?? ''}: \${e.message}\`;
  } finally { btns.forEach(b => b.disabled = false); }
}

btns.forEach(b => b.addEventListener('click', () => run(b.dataset.action)));`
  },
};

// ── React knowledge bank ──────────────────────────────────────────────────────
export const REACT_KB: Record<string, MultiFileTemplate> = {
  tanstack_query: {
    label: '🔄 TanStack Query',
    files: [
      { id: 'app', name: 'App', ext: 'jsx', content:
`import { useState } from 'react';
import './styles.css';

// TanStack Query v5 simulation without the package
// (real usage: npm install @tanstack/react-query)
// This shows the EXACT same API — just swap the import

// ── Simulated QueryClient (real: from '@tanstack/react-query') ─
const cache = new Map();
const listeners = new Set();
function notify() { listeners.forEach(fn => fn()); }

const queryClient = {
  getQueryData: key => cache.get(JSON.stringify(key)),
  setQueryData: (key, data) => { cache.set(JSON.stringify(key), data); notify(); },
  invalidateQueries: ({ queryKey }) => {
    const k = JSON.stringify(queryKey);
    [...cache.keys()].filter(k2 => k2.startsWith(k.slice(0,-1))).forEach(k2 => cache.delete(k2));
    notify();
  },
};

function useQuery({ queryKey, queryFn, staleTime = 30000, initialData }) {
  const [state, setState] = React.useState(() => {
    const cached = queryClient.getQueryData(queryKey);
    if (cached) return { data: cached, status: 'success', isFetching: false };
    if (initialData !== undefined) return { data: initialData, status: 'success', isFetching: false };
    return { data: undefined, status: 'loading', isFetching: true };
  });

  React.useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setState(s => ({ ...s, isFetching: true }));
      try {
        const data = await queryFn({ queryKey });
        if (!cancelled) {
          queryClient.setQueryData(queryKey, data);
          setState({ data, status: 'success', isFetching: false });
        }
      } catch(err) {
        if (!cancelled) setState({ data: undefined, status: 'error', error: err, isFetching: false });
      }
    };
    const cached = queryClient.getQueryData(queryKey);
    if (!cached) fetch();
    const unsub = () => listeners.delete(setState);
    listeners.add(() => { const d = queryClient.getQueryData(queryKey); if(d) setState(s=>({...s,data:d,status:'success'})); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryKey)]);

  return { ...state, refetch: () => { cache.delete(JSON.stringify(queryKey)); notify(); } };
}

function useMutation({ mutationFn, onSuccess }) {
  const [state, setState] = React.useState({ isPending: false, isError: false, error: null, isSuccess: false, data: null });
  const mutate = async (vars) => {
    setState({ isPending: true, isError: false, error: null, isSuccess: false, data: null });
    try {
      const data = await mutationFn(vars);
      setState({ isPending: false, isError: false, error: null, isSuccess: true, data });
      onSuccess?.(data, vars);
    } catch(err) {
      setState({ isPending: false, isError: true, error: err, isSuccess: false, data: null });
    }
  };
  return { ...state, mutate };
}
// ─────────────────────────────────────────────────────────────

// API functions
async function fetchPosts({ queryKey }) {
  const [, limit] = queryKey;
  const res = await fetch(\`https://jsonplaceholder.typicode.com/posts?_limit=\${limit}\`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
async function createPost(post) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post),
  });
  return res.json();
}

function PostsList() {
  const [limit, setLimit] = React.useState(3);
  const [title, setTitle] = React.useState('');

  const { data: posts, status, isFetching, refetch } = useQuery({
    queryKey: ['posts', limit],
    queryFn: fetchPosts,
  });

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      console.log('Created post:', data);
      setTitle('');
    },
  });

  return (
    <div className="container">
      <h1>TanStack Query</h1>
      <div className="create-row">
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="New post title…"
          onKeyDown={e => e.key === 'Enter' && mutation.mutate({ title, body: 'Content', userId: 1 })} />
        <button onClick={() => mutation.mutate({ title, body: 'Content', userId: 1 })}
          disabled={mutation.isPending || !title.trim()}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
      </div>
      {mutation.isSuccess && <div className="ok">Created (fake API returns ID {mutation.data.id})</div>}

      <div className="controls">
        {[3, 5, 10].map(n => (
          <button key={n} className={limit===n?'active':''} onClick={()=>setLimit(n)}>{n} posts</button>
        ))}
        <button onClick={refetch}>↺</button>
        {isFetching && <span className="fetching">Updating…</span>}
      </div>

      {status === 'loading' && <div className="loading">Loading…</div>}
      {posts?.map(p => (
        <div key={p.id} className="post">
          <span className="pid">#{p.id}</span>
          <span>{p.title}</span>
        </div>
      ))}
    </div>
  );
}
export default function App() { return <PostsList />; }` },
      { id: 'styles', name: 'styles', ext: 'css', content:
`* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; padding: 24px; }
.container { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.create-row { display: flex; gap: 8px; }
input { flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #f1f5f9; font-size: 13px; outline: none; }
input:focus { border-color: #c9a84c; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 8px; padding: 8px 14px; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; transition: all .15s; }
button:hover { background: #e8c96b; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.controls { display: flex; gap: 7px; align-items: center; }
.controls button { background: #334155; color: #f1f5f9; padding: 5px 12px; font-size: 12px; }
.controls button.active { background: #c9a84c; color: #0a0a0f; }
.fetching { font-size: 12px; color: #60a5fa; }
.post { display: flex; gap: 10px; align-items: center; background: #1e293b; border: 1px solid #334155; border-radius: 9px; padding: 11px 14px; }
.pid { font-size: 11px; color: #475569; font-family: monospace; min-width: 28px; }
.post span:last-child { font-size: 13px; color: #cbd5e1; }
.loading { color: #64748b; font-size: 13px; }
.ok  { font-size: 12px; color: #4ade80; }` },
    ],
  },

  zustand_store: {
    label: '🐻 Zustand Store',
    files: [
      { id: 'store', name: 'store', ext: 'js', content:
`// ── Zustand-like store without the npm package ────────────────
// Real usage: import { create } from 'zustand'
// This mirrors the EXACT same API

function create(initializer) {
  let state;
  const listeners = new Set();
  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach(fn => fn(state));
  };
  const getState = () => state;
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  state = initializer(setState, getState);
  // React hook equivalent
  state.__hook = function useStore(selector = s => s) {
    const [val, setVal] = React.useState(() => selector(getState()));
    React.useEffect(() => subscribe(s => setVal(selector(s))), []);
    return val;
  };
  return state.__hook;
}

// ── Cart store ─────────────────────────────────────────────────
export const useCart = create((set, get) => ({
  items: [],
  isOpen: false,

  get total() { return get().items.reduce((s, i) => s + i.price * i.qty, 0); },
  get count()  { return get().items.reduce((s, i) => s + i.qty, 0); },

  addItem: (product) => set(state => {
    const ex = state.items.find(i => i.id === product.id);
    return ex
      ? { items: state.items.map(i => i.id === product.id ? {...i, qty: i.qty+1} : i) }
      : { items: [...state.items, { ...product, qty: 1 }] };
  }),
  removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  updateQty:  (id, qty) => set(s => ({
    items: qty <= 0 ? s.items.filter(i => i.id !== id) : s.items.map(i => i.id===id ? {...i,qty} : i)
  })),
  clearCart:   () => set({ items: [] }),
  toggleCart:  () => set(s => ({ isOpen: !s.isOpen })),
}));` },
      { id: 'app', name: 'App', ext: 'jsx', content:
`import { useCart } from './store';
import './styles.css';

const PRODUCTS = [
  { id: 1, name: 'React Mastery',     price: 49, emoji: '⚛️' },
  { id: 2, name: 'TypeScript Pro',    price: 39, emoji: '📘' },
  { id: 3, name: 'Next.js Bootcamp', price: 59, emoji: '▲'  },
  { id: 4, name: 'Node.js Deep Dive', price: 44, emoji: '🟩' },
];

function ProductCard({ product }) {
  const addItem = useCart(s => s.addItem);
  const items   = useCart(s => s.items);
  const inCart  = items.find(i => i.id === product.id);
  return (
    <div className="product">
      <span className="emoji">{product.emoji}</span>
      <div className="info">
        <div className="name">{product.name}</div>
        <div className="price">\${product.price}</div>
      </div>
      <button onClick={() => addItem(product)} className={inCart ? 'added' : ''}>
        {inCart ? \`In cart (\${inCart.qty})\` : 'Add'}
      </button>
    </div>
  );
}

function CartDrawer() {
  const { items, total, count, removeItem, updateQty, clearCart, isOpen, toggleCart } = useCart();
  if (!isOpen) return null;
  return (
    <div className="cart-overlay" onClick={e => e.target === e.currentTarget && toggleCart()}>
      <div className="cart">
        <div className="cart-header">
          <span>Cart ({count})</span>
          <button onClick={toggleCart} className="close">×</button>
        </div>
        {items.length === 0
          ? <p className="empty">Cart is empty</p>
          : <>
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.emoji} {item.name}</span>
                  <div className="qty">
                    <button onClick={() => updateQty(item.id, item.qty-1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty+1)}>+</button>
                  </div>
                  <span>\${(item.price*item.qty).toFixed(2)}</span>
                  <button className="rm" onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
              <div className="cart-footer">
                <strong>Total: \${total.toFixed(2)}</strong>
                <button onClick={clearCart} className="clear">Clear</button>
              </div>
            </>
        }
      </div>
    </div>
  );
}

export default function App() {
  const { count, toggleCart } = useCart();
  return (
    <div className="app">
      <header>
        <h1>Dev Store</h1>
        <button className="cart-btn" onClick={toggleCart}>
          🛒 Cart {count > 0 && <span className="badge">{count}</span>}
        </button>
      </header>
      <div className="products">
        {PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      <CartDrawer />
    </div>
  );
}` },
      { id: 'styles', name: 'styles', ext: 'css', content:
`* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; padding: 24px; }
.app { max-width: 540px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h1 { font-size: 1.3rem; font-weight: 800; color: #c9a84c; }
.products { display: flex; flex-direction: column; gap: 10px; }
.product { display: flex; align-items: center; gap: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 11px; padding: 14px; }
.emoji { font-size: 1.6rem; }
.info { flex: 1; }
.name { font-weight: 600; font-size: 14px; }
.price { font-size: 12px; color: #94a3b8; }
button { background: #c9a84c; color: #0a0a0f; border: none; border-radius: 7px; padding: 7px 14px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all .15s; }
button:hover { background: #e8c96b; }
button.added { background: rgba(34,197,94,.18); color: #4ade80; border: 1px solid rgba(34,197,94,.3); }
.cart-btn { position: relative; }
.badge { position: absolute; top: -7px; right: -7px; background: #ef4444; color: white; border-radius: 99px; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
.cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; justify-content: flex-end; z-index: 50; }
.cart { width: 320px; height: 100vh; background: #1e293b; border-left: 1px solid #334155; padding: 16px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.cart-header { display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
.close { background: transparent; color: #94a3b8; font-size: 20px; padding: 0 6px; }
.close:hover { color: #f1f5f9; background: transparent; }
.cart-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.cart-item span:first-child { flex: 1; }
.qty { display: flex; align-items: center; gap: 4px; }
.qty button { padding: 3px 8px; font-size: 14px; background: #334155; color: #f1f5f9; }
.qty span { min-width: 20px; text-align: center; font-size: 13px; }
.rm { background: transparent; color: #475569; font-size: 16px; padding: 2px 6px; }
.rm:hover { color: #f87171; background: transparent; }
.cart-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 10px; margin-top: auto; }
.clear { background: transparent; border: 1px solid rgba(248,113,113,.3); color: #f87171; font-size: 12px; padding: 5px 10px; }
.empty { font-size: 13px; color: #475569; text-align: center; padding: 12px 0; }` },
    ],
  },
};

// ── Next.js backend integration guide ─────────────────────────────────────────
export const NEXT_KB: Record<string, MultiFileTemplate> = {
  backend_integration: {
    label: '🔌 Backend Integration Guide',
    files: [
      { id: 'guide', name: 'GUIDE', ext: 'ts', content:
`// ══════════════════════════════════════════════════════════════
//  INTEGRATING BACKEND ENDPOINTS — PRODUCTION PATTERNS
// ══════════════════════════════════════════════════════════════
//
// This template is a complete reference for connecting a
// Next.js App Router frontend to a backend API.
//
// Browse all files in this template:
//
//  GUIDE.ts               ← you are here (start here)
//  lib/api.ts             ← centralized typed API client
//  lib/auth.ts            ← JWT + refresh token management
//  app/dashboard/page.tsx ← Server Component data fetching
//  components/UserList.tsx ← Client Component + TanStack Query
//  app/actions.ts         ← Server Actions (mutations)
//  middleware.ts          ← Route protection
//  .env.example           ← Environment variables reference
//  CHECKLIST.ts           ← Production readiness checklist` },

      { id: 'lib_api', name: 'lib/api', ext: 'ts', content:
`// ── Centralized API client ────────────────────────────────────
// One file for all API calls. Never call fetch() directly in components.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown
  ) { super(message); this.name = 'ApiError'; }
  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isValidation()   { return this.status === 400 || this.status === 422; }
  get isServerError()  { return this.status >= 500; }
}

type FetchOpts = {
  method?: string; body?: unknown; headers?: Record<string,string>;
  token?: string;        // for client-side authenticated requests
  revalidate?: number;   // ISR: revalidate after N seconds
  tags?: string[];       // tag-based revalidation
  noCache?: boolean;     // force SSR (no caching)
};

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token, revalidate, tags, noCache } = opts;

  const res = await fetch(\`\${BASE}\${path}\`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': process.env.NEXT_PUBLIC_VERSION ?? '1.0',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    // Next.js fetch caching — choose the right strategy per call
    cache: noCache ? 'no-store' : revalidate !== undefined ? undefined : 'force-cache',
    next: {
      revalidate, // ISR
      tags,       // on-demand revalidation
    },
  });

  if (res.status === 204) return undefined as T;

  let data: unknown;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = (data as any)?.message ?? \`HTTP \${res.status}: \${res.statusText}\`;
    throw new ApiError(res.status, msg, (data as any)?.code, data);
  }
  return data as T;
}

// ── Typed resource methods ─────────────────────────────────────
export interface Post { id: string; title: string; body: string; userId: string; createdAt: string; }
export interface User { id: string; name: string; email: string; role: 'admin'|'user'|'editor'; }

export const postsApi = {
  // Static with tag — revalidated on demand after mutations
  list: (p?: { page?:number; limit?:number }) =>
    apiFetch<Post[]>(\`/posts?\${new URLSearchParams(p as any)}\`, { tags: ['posts'], revalidate: 60 }),

  // Single post — cache longer, own tag
  get: (id: string) =>
    apiFetch<Post>(\`/posts/\${id}\`, { tags: [\`post-\${id}\`], revalidate: 300 }),

  // Mutations always bypass cache
  create: (data: Pick<Post,'title'|'body'>, token: string) =>
    apiFetch<Post>('/posts', { method: 'POST', body: data, token, noCache: true }),

  update: (id: string, data: Partial<Post>, token: string) =>
    apiFetch<Post>(\`/posts/\${id}\`, { method: 'PATCH', body: data, token, noCache: true }),

  delete: (id: string, token: string) =>
    apiFetch<void>(\`/posts/\${id}\`, { method: 'DELETE', token, noCache: true }),
};

export const usersApi = {
  // Never cache user-specific data
  me:   (token: string)  => apiFetch<User>('/auth/me', { token, noCache: true }),
  list: ()               => apiFetch<User[]>('/users', { tags: ['users'], revalidate: 120 }),
};` },

      { id: 'lib_auth', name: 'lib/auth', ext: 'ts', content:
`// ── Token management ──────────────────────────────────────────
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_BASE = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Server-side: read from httpOnly cookie ────────────────────
// httpOnly cookies are inaccessible to JS — XSS-safe
export async function getServerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get('access_token')?.value ?? null;
}

// Require auth — redirects to /login if missing token
export async function requireAuth(): Promise<string> {
  const token = await getServerToken();
  if (!token) redirect('/login?reason=session_expired');
  return token;
}

// ── Client-side: in-memory storage (NOT localStorage) ─────────
// LocalStorage is XSS-vulnerable. Use httpOnly cookies instead,
// or in-memory state that refreshes from cookie on page load.
let _memToken: string | null = null;
export const getToken  = () => _memToken;
export const setToken  = (t: string) => { _memToken = t; };
export const clearToken = () => { _memToken = null; };

// ── Login ─────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await fetch(\`\${AUTH_BASE}/auth/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // receive httpOnly cookies from server
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Login failed');
  }
  const data = await res.json();
  // If API returns token in body (some APIs do this instead of cookies):
  if (data.accessToken) setToken(data.accessToken);
  return data;
}

// ── Refresh ───────────────────────────────────────────────────
export async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(\`\${AUTH_BASE}/auth/refresh\`, {
      method: 'POST',
      credentials: 'include', // sends httpOnly refresh_token cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) setToken(data.accessToken);
    return data.accessToken ?? null;
  } catch { return null; }
}

// ── Authenticated fetch with auto-refresh ─────────────────────
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) => fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
      ...(init.headers as Record<string,string> ?? {}),
    },
    credentials: 'include',
  });

  let res = await doFetch(getToken());

  // 401 → try refreshing once
  if (res.status === 401) {
    const fresh = await refreshToken();
    if (!fresh) { clearToken(); redirect('/login'); }
    res = await doFetch(fresh);
  }
  return res;
}` },

      { id: 'page', name: 'app/dashboard/page', ext: 'tsx', content:
`// ── Server Component — direct async data fetching ────────────
// No useEffect, no useState, no API routes needed.
// Data is fetched ON THE SERVER and streamed as HTML.

import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { postsApi, usersApi } from '@/lib/api';
import PostCard from '@/components/PostCard';
import UserList from '@/components/UserList'; // Client Component

export default async function DashboardPage() {
  // requireAuth redirects to /login if no cookie
  const token = await requireAuth();

  // Parallel fetch — both start at the same time
  // Total time = slowest request, not sum of both
  const [posts, users] = await Promise.all([
    postsApi.list({ limit: 6 }),
    usersApi.list(),
  ]);

  return (
    <main>
      <h1>Dashboard</h1>

      {/* Server Component — receives data as props */}
      <section>
        <h2>Recent Posts</h2>
        <div className="grid">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      </section>

      {/* Client Component — needs token for client-side requests */}
      {/* Suspense shows skeleton while this component loads */}
      <Suspense fallback={<div className="skeleton" />}>
        <UserList initialUsers={users} token={token} />
      </Suspense>
    </main>
  );
}

// ── generateMetadata — dynamic page titles ─────────────────────
export async function generateMetadata() {
  return {
    title: 'Dashboard | MyApp',
    description: 'Your personal dashboard',
  };
}` },

      { id: 'user_list', name: 'components/UserList', ext: 'tsx', content:
`'use client';
// ── Client Component with TanStack Query ──────────────────────
// Receives initialUsers from Server Component — instant first render.
// TanStack Query keeps data fresh in the background.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { User } from '@/lib/api';
import { authFetch } from '@/lib/auth';

interface Props {
  initialUsers: User[];
  token: string;  // passed from Server Component
}

export default function UserList({ initialUsers, token }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Use authFetch for authenticated requests + auto-refresh
      const res = await authFetch(\`\${process.env.NEXT_PUBLIC_API_URL}/users\`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<User[]>;
    },
    initialData: initialUsers,  // ← hydrate from server — no loading flash
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(\`\${process.env.NEXT_PUBLIC_API_URL}/users/\${id}\`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    // Optimistic update — UI updates before server responds
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['users'] });
      const prev = qc.getQueryData<User[]>(['users']);
      qc.setQueryData<User[]>(['users'], old => old?.filter(u => u.id !== id) ?? []);
      return { prev }; // return context for rollback
    },
    onError: (_, __, ctx) => {
      // Rollback on error
      if (ctx?.prev) qc.setQueryData(['users'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filtered = (users ?? []).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section>
      <h2>Users</h2>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users…"
      />
      {filtered.map(u => (
        <div key={u.id} className="user-row">
          <div className="avatar">{u.name[0]}</div>
          <div>
            <strong>{u.name}</strong>
            <span>{u.email}</span>
          </div>
          <span className="role">{u.role}</span>
          <button
            onClick={() => deleteMutation.mutate(u.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '…' : 'Delete'}
          </button>
        </div>
      ))}
    </section>
  );
}` },

      { id: 'actions', name: 'app/actions', ext: 'ts', content:
`'use server';
// ── Server Actions — mutations without API routes ─────────────
// Called directly from Client Components or <form action={...}>.
// Runs on the server — can access DB, secrets, cookies securely.

import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { postsApi, type Post, ApiError } from '@/lib/api';
import { getServerToken } from '@/lib/auth';

// ── Create post — called from Client Component ────────────────
export async function createPost(formData: FormData) {
  const token = await getServerToken();
  if (!token) redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const body  = (formData.get('body')  as string)?.trim();

  // Server-side validation (always validate on server!)
  if (!title) return { error: 'Title is required' };
  if (title.length > 200) return { error: 'Title too long (max 200 chars)' };

  try {
    const post = await postsApi.create({ title, body: body ?? '' }, token);

    // Invalidate cache → background refetch
    revalidateTag('posts');          // all lists with this tag
    revalidatePath('/dashboard');    // specific page

    return { success: true, post };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.isValidation) return { error: err.data };
      if (err.isUnauthorized) redirect('/login');
    }
    // Never expose raw error details to client
    console.error('[createPost]', err);
    return { error: 'Failed to create post. Please try again.' };
  }
}

// ── Delete post ───────────────────────────────────────────────
export async function deletePost(postId: string): Promise<{ error?: string }> {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    await postsApi.delete(postId, token);
    revalidateTag('posts');
    revalidateTag(\`post-\${postId}\`);
    return {};
  } catch (err) {
    console.error('[deletePost]', err);
    return { error: 'Failed to delete post' };
  }
}

// ── Logout ───────────────────────────────────────────────────
export async function logout() {
  const store = await cookies();
  store.delete('access_token');
  store.delete('refresh_token');
  redirect('/login');
}

// ── Usage from Client Component ──────────────────────────────
//
// Option A — HTML form (progressive enhancement, no JS needed):
//   <form action={createPost}>
//     <input name="title" required />
//     <textarea name="body" />
//     <button type="submit">Create</button>
//   </form>
//
// Option B — programmatic call:
//   const formData = new FormData();
//   formData.set('title', title);
//   const result = await createPost(formData);
//   if (result.error) showError(result.error);` },

      { id: 'middleware', name: 'middleware', ext: 'ts', content:
`// ── Edge middleware — runs BEFORE every request ───────────────
// Protects routes, redirects unauthenticated users.
// Runs at the Edge — must not import Node.js-only modules.

import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS  = ['/dashboard', '/profile', '/settings', '/admin'];
const AUTH_ONLY_PATHS  = ['/login', '/signup', '/forgot-password'];
const ADMIN_ONLY_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // ── Route protection ──────────────────────────────────────
  const isProtected  = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthOnly   = AUTH_ONLY_PATHS.includes(pathname);
  const isAdminOnly  = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));

  // Unauthenticated → redirect to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname); // remember destination
    return NextResponse.redirect(url);
  }

  // Authenticated → redirect away from auth pages
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin check — decode JWT payload at edge (no signature verify here)
  if (isAdminOnly && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── Inject user context into headers for Server Components ─
  const response = NextResponse.next();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      response.headers.set('x-user-id',   payload.sub  ?? '');
      response.headers.set('x-user-role', payload.role ?? 'user');
    } catch {}
  }

  // ── Security headers ──────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // Apply to all paths except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};` },

      { id: 'env', name: '.env.example', ext: 'ts', content:
`// ══════════════════════════════════════════════════════════════
//  ENVIRONMENT VARIABLES — copy to .env.local (never commit!)
// ══════════════════════════════════════════════════════════════

// ── Public (exposed to browser — NEXT_PUBLIC_ prefix) ─────────
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_WS_URL=wss://ws.yourapp.com
NEXT_PUBLIC_VERSION=1.0.0

// ── Private (server only — NO NEXT_PUBLIC_ prefix) ────────────
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key-minimum-32-characters-long
REFRESH_TOKEN_SECRET=another-secret-32-chars
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
S3_BUCKET_NAME=my-app-uploads
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

// ── Per-environment files (Next.js loads in order) ─────────────
// .env                  → All environments (commit, no secrets)
// .env.local            → Local override (never commit, in .gitignore)
// .env.development      → npm run dev (commit, no secrets)
// .env.production       → npm run build (commit, no secrets)
// .env.test             → tests only

// ── Accessing in code ─────────────────────────────────────────
//
// Server (API routes, Server Components, Server Actions, middleware):
//   process.env.DATABASE_URL         ✅ works
//   process.env.NEXT_PUBLIC_API_URL  ✅ works
//
// Client (Client Components, browser JS):
//   process.env.NEXT_PUBLIC_API_URL  ✅ works (inlined at build time)
//   process.env.DATABASE_URL         ❌ undefined — intentionally hidden

// ── Type-safe env validation (recommended) ─────────────────────
// npm install @t3-oss/env-nextjs zod
//
// env.ts:
// import { createEnv } from '@t3-oss/env-nextjs';
// import { z } from 'zod';
//
// export const env = createEnv({
//   server: {
//     DATABASE_URL: z.string().url(),
//     JWT_SECRET:   z.string().min(32),
//   },
//   client: {
//     NEXT_PUBLIC_API_URL: z.string().url(),
//   },
//   runtimeEnv: {
//     DATABASE_URL:        process.env.DATABASE_URL,
//     JWT_SECRET:          process.env.JWT_SECRET,
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//   },
// });
//
// Usage: import { env } from '@/env';
// env.DATABASE_URL  — fully typed, validated at startup` },

      { id: 'checklist', name: 'PRODUCTION_CHECKLIST', ext: 'ts', content:
`// ══════════════════════════════════════════════════════════════
//  PRODUCTION BACKEND INTEGRATION — CHECKLIST
// ══════════════════════════════════════════════════════════════

// ── Security ─────────────────────────────────────────────────
// ✅ Tokens in httpOnly + Secure + SameSite=Strict cookies
//    NOT localStorage — XSS can steal localStorage tokens
// ✅ Short-lived access tokens (15-60 min)
// ✅ Refresh tokens rotated on each use
// ✅ CSRF protection if using cookie-based auth
// ✅ All inputs validated on the SERVER (not just client)
// ✅ Never expose private env vars (no NEXT_PUBLIC_ prefix)
// ✅ Rate limiting on auth endpoints
// ✅ Helmet / security headers (see middleware.ts)
// ✅ HTTPS only — set HSTS header (Strict-Transport-Security)
// ✅ Log failed auth attempts, alert on anomalies

// ── Caching Strategy ─────────────────────────────────────────
// ✅ Public data: revalidate + tags (not cache: 'no-store' everywhere)
// ✅ User-specific data: cache: 'no-store' always
// ✅ Mutations: always noCache, then revalidateTag()
// ✅ Pass initialData from Server → Client (no double-fetch)
// ✅ TanStack Query staleTime > 0 (don't refetch on every focus)
// ✅ ISR for semi-static pages (product catalog, blog posts)

// ── Error Handling ────────────────────────────────────────────
// ✅ error.tsx for every route segment that can fail
// ✅ global-error.tsx for fatal app-level errors
// ✅ Consistent error response shape: { error, code, details }
// ✅ Log to Sentry/Datadog in production (not console.log)
// ✅ Error boundaries around independent UI sections
// ✅ Retry logic with exponential backoff for transient failures
// ✅ Timeout on all fetch calls (AbortController)
// ✅ Handle offline state — show retry UI, not blank screen

// ── Authentication ────────────────────────────────────────────
// ✅ Route protection in middleware (not just in components)
// ✅ Token refresh happens transparently — user never sees it
// ✅ Logout invalidates refresh token on server
// ✅ Handle 401 responses — refresh or redirect to login
// ✅ Admin routes checked both in middleware AND server actions

// ── Performance ───────────────────────────────────────────────
// ✅ Parallel fetch with Promise.all in Server Components
// ✅ Pagination — never fetch unlimited lists
// ✅ Server Components for data-heavy pages (less JS to client)
// ✅ Prefetch links for likely navigation (next/link does this)
// ✅ CDN / edge caching for public content

// ── Monitoring ────────────────────────────────────────────────
// ✅ Track API p99 latency and error rate
// ✅ Alert when error rate > 1% or p99 > 2s
// ✅ Correlation IDs (x-request-id) on all requests
// ✅ Structured logging (JSON) for searchability
// ✅ Core Web Vitals — slow API = poor LCP/INP

// ── Common Mistakes ───────────────────────────────────────────
// ❌ cache: 'no-store' on every fetch — kills performance
// ❌ Fetching in useEffect when Server Components could do it
// ❌ Storing tokens in localStorage
// ❌ Missing error boundaries — one crash = blank screen
// ❌ Calling fetch() directly in 20 components (use lib/api.ts)
// ❌ Not invalidating cache after mutations (stale UI)
// ❌ Showing raw error messages to users ("SQL error: ...")
// ❌ No loading states — users think the app is broken` },
    ],
  },

  error_patterns: {
    label: '🛡 Error Patterns',
    files: [
      { id: 'guide', name: 'error-patterns', ext: 'ts', content:
`// ── Comprehensive error handling in Next.js ───────────────────

// ── 1. Typed API error class ──────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isValidation()   { return this.status === 400 || this.status === 422; }
  get isServerError()  { return this.status >= 500; }
  get isRateLimited()  { return this.status === 429; }
}

// ── 2. Consistent response handler ───────────────────────────
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json();
  }
  let body: any;
  try { body = await res.json(); } catch {}
  throw new ApiError(
    res.status,
    body?.message ?? body?.error ?? \`HTTP \${res.status}\`,
    body?.code,
    body
  );
}

// ── 3. Error boundary component (error.tsx) ───────────────────
// app/dashboard/error.tsx
'use client';
export default function DashboardError({
  error, reset
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      captureException(error, { extra: { digest: error.digest } });
    } else {
      console.error(error);
    }
  }, [error]);

  return (
    <div role="alert" className="error-container">
      <h2>Something went wrong</h2>
      <p>
        {process.env.NODE_ENV === 'development'
          ? error.message       // Show details in dev
          : 'An unexpected error occurred. Please try again.'}  {/* Hide in prod */}
      </p>
      {error.digest && (
        <code className="error-id">Error ID: {error.digest}</code>
      )}
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// ── 4. Not found handling ─────────────────────────────────────
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug).catch(err => {
    if (err instanceof ApiError && err.isNotFound) notFound();
    throw err;  // Re-throw other errors → error.tsx catches them
  });
  return <Article post={post} />;
}

// ── 5. TanStack Query error handling ─────────────────────────
function PostsList() {
  const { data, error, isError, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    retry: (count, err) => {
      // Don't retry 4xx — they won't self-heal
      if (err instanceof ApiError && err.status < 500) return false;
      return count < 3;
    },
    // Exponential backoff: 1s, 2s, 4s
    retryDelay: n => Math.min(1000 * 2 ** n, 30_000),
  });

  if (isError) {
    if (error instanceof ApiError && error.isUnauthorized) return <LoginPrompt />;
    return (
      <div className="error-state">
        <p>Failed to load posts: {error.message}</p>
        <button onClick={() => refetch()}>Try again</button>
      </div>
    );
  }
}

// ── 6. Server Action error handling ──────────────────────────
'use server';
export async function updateUser(id: string, data: Partial<User>) {
  try {
    const token = await getServerToken();
    if (!token) redirect('/login');
    const user = await usersApi.update(id, data, token);
    revalidateTag('users');
    return { success: true, user };
  } catch (err) {
    // Return errors as data from Server Actions — don't throw
    if (err instanceof ApiError) {
      if (err.isValidation)   return { success: false, error: err.data };
      if (err.isUnauthorized) redirect('/login');
      if (err.isForbidden)    return { success: false, error: "Not authorized" };
    }
    console.error('[updateUser]', err);
    return { success: false, error: 'Update failed. Please try again.' };
  }
}

// ── 7. Global error boundary ─────────────────────────────────
// app/global-error.tsx — catches errors in the root layout
'use client';
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html><body>
      <div className="fatal-error">
        <h1>Application Error</h1>
        <p>Something went seriously wrong.</p>
        <button onClick={reset}>Reload application</button>
      </div>
    </body></html>
  );
}` },
    ],
  },
};
