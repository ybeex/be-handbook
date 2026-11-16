'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, Copy, Check, ChevronDown, Code, Eye,
  Terminal, BookOpen, Plus, X, FileCode,
  Cpu, Database, Globe, Layers,
} from 'lucide-react';
import {
  NODEJS_TEMPLATES, SQL_TEMPLATES, API_TEMPLATES, ARCHITECTURE_TEMPLATES,
  type BackendTemplate, type PlayFile,
} from '@/data/backendPlaygroundTemplates';

// ─── Types ────────────────────────────────────────────────────────────────────
type PlaygroundMode = 'nodejs' | 'sql' | 'api' | 'architecture';
type FileExt = 'js' | 'ts' | 'sql' | 'json' | 'yaml' | 'sh' | 'md';
type ConsoleMsg = { type: 'log' | 'error' | 'warn' | 'info'; text: string; time: string };

const EXT_COLORS: Record<FileExt, string> = {
  js:   '#facc15', ts:   '#3b82f6', sql:  '#34d399',
  json: '#a3e635', yaml: '#fb923c', sh:   '#f87171', md:   '#c084fc',
};

const MODE_TABS: { id: PlaygroundMode; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: 'nodejs',       label: 'Node.js',      icon: Cpu,      desc: 'Event loop, streams, workers, patterns', color: '#68a063' },
  { id: 'sql',          label: 'SQL',           icon: Database, desc: 'Queries, indexes, transactions, schemas', color: '#34d399' },
  { id: 'api',          label: 'API Design',    icon: Globe,    desc: 'REST patterns, auth, idempotency',        color: '#60a5fa' },
  { id: 'architecture', label: 'Architecture',  icon: Layers,   desc: 'CQRS, Saga, Outbox, Circuit Breaker',    color: '#c084fc' },
];

const ALL_TEMPLATES: Record<PlaygroundMode, Record<string, BackendTemplate>> = {
  nodejs:       NODEJS_TEMPLATES,
  sql:          SQL_TEMPLATES,
  api:          API_TEMPLATES,
  architecture: ARCHITECTURE_TEMPLATES,
};

const EXT_STARTERS: Record<FileExt, string> = {
  js:   `// New file\nconsole.log('Hello from Node.js');`,
  ts:   `// New TypeScript file\nexport function hello(): string {\n  return 'Hello!';\n}`,
  sql:  `-- New SQL file\nSELECT 1;`,
  json: `{\n  "key": "value"\n}`,
  yaml: `# New YAML file\nkey: value`,
  sh:   `#!/bin/bash\necho "Hello"`,
  md:   `# Documentation\n\nContent here.`,
};

// ─── Shared browser runtime shims (Node-like) ─────────────────────────────────
const RUNTIME_SHIM = `// ── Browser runtime shims (Node-like) ───────────────────
(function(){
  var g = window;
  var slice = [].slice;

  // timers
  g.setImmediate = function(fn){ var a = slice.call(arguments, 1); return setTimeout(function(){ fn.apply(null, a); }, 0); };
  g.clearImmediate = function(id){ clearTimeout(id); };

  // SharedArrayBuffer / Atomics — polyfill when not cross-origin isolated
  if (typeof g.SharedArrayBuffer !== 'function') {
    g.SharedArrayBuffer = function(len){ return new ArrayBuffer(len); };
    g.Atomics = {
      add: function(a,i,v){ var o=a[i]; a[i]=o+v; return o; },
      sub: function(a,i,v){ var o=a[i]; a[i]=o-v; return o; },
      load: function(a,i){ return a[i]; },
      store: function(a,i,v){ a[i]=v; return v; },
      exchange: function(a,i,v){ var o=a[i]; a[i]=v; return o; },
      compareExchange: function(a,i,e,r){ var o=a[i]; if(o===e) a[i]=r; return o; },
      and: function(a,i,v){ var o=a[i]; a[i]=o&v; return o; },
      or: function(a,i,v){ var o=a[i]; a[i]=o|v; return o; },
      xor: function(a,i,v){ var o=a[i]; a[i]=o^v; return o; },
      notify: function(){ return 0; },
      wait: function(){ return 'not-equal'; }
    };
  }

  // process
  var pl = {};
  g.process = {
    env: { NODE_ENV: 'development' },
    argv: ['node', 'main.js'],
    version: 'v20.11.0',
    versions: { node: '20.11.0' },
    platform: 'linux',
    pid: 1,
    uptime: function(){ return performance.now() / 1000; },
    cwd: function(){ return '/app'; },
    hrtime: function(t){ var n = performance.now() * 1e6; if (t) { var d = n - (t[0]*1e9 + t[1]); return [Math.floor(d/1e9), Math.floor(d%1e9)]; } return [Math.floor(n/1e9), Math.floor(n%1e9)]; },
    nextTick: function(fn){ var a = slice.call(arguments, 1); Promise.resolve().then(function(){ fn.apply(null, a); }); },
    on: function(e,fn){ (pl[e] = pl[e] || []).push(fn); return g.process; },
    once: function(e,fn){ var self = g.process; function w(){ self.off(e,w); fn.apply(null,arguments); } return self.on(e,w); },
    off: function(e,fn){ pl[e] = (pl[e] || []).filter(function(f){ return f !== fn; }); return g.process; },
    removeListener: function(e,fn){ return g.process.off(e,fn); },
    emit: function(e){ var a = slice.call(arguments, 1); (pl[e] || []).forEach(function(f){ f.apply(null, a); }); return true; },
    listeners: function(e){ return (pl[e] || []).slice(); },
    listenerCount: function(e){ return (pl[e] || []).length; },
    exit: function(code){ console.log('[process.exit(' + (code || 0) + ')]'); },
    memoryUsage: function(){ return { rss: 5e7, heapTotal: 2e7, heapUsed: 1e7 }; },
    stdout: { write: function(s){ console.log(String(s).replace(/\\n$/, '')); return true; }, isTTY: false, columns: 80, rows: 24 },
    stderr: { write: function(s){ console.error(String(s).replace(/\\n$/, '')); return true; }, isTTY: false }
  };
  g.global = g;

  // Buffer
  function u8enc(s){ return new TextEncoder().encode(s); }
  function u8b64(u8){ var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function u8unb64(s){ s = String(s).replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '='; var b = atob(s); var u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function u8hex(u8){ var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }
  function u8unhex(s){ var n = Math.floor(s.length/2); var u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = parseInt(s.substr(i*2,2),16); return u; }
  function mk(u8){
    u8 = (u8 instanceof Uint8Array) ? u8 : new Uint8Array(u8 || 0);
    u8.toString = function(enc){
      enc = enc || 'utf8';
      if (enc === 'hex') return u8hex(this);
      if (enc === 'base64') return u8b64(this);
      if (enc === 'base64url') return u8b64(this).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
      if (enc === 'latin1' || enc === 'binary') { var s = ''; for (var i = 0; i < this.length; i++) s += String.fromCharCode(this[i]); return s; }
      return new TextDecoder().decode(this);
    };
    return u8;
  }
  g.Buffer = {
    from: function(v, enc){
      if (typeof v === 'string') {
        if (enc === 'hex') return mk(u8unhex(v));
        if (enc === 'base64' || enc === 'base64url') return mk(u8unb64(v));
        return mk(u8enc(v));
      }
      if (v instanceof ArrayBuffer) return mk(new Uint8Array(v));
      if (v && v.buffer instanceof ArrayBuffer) return mk(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
      if (Array.isArray(v)) return mk(new Uint8Array(v));
      return mk(v);
    },
    alloc: function(n){ return mk(new Uint8Array(n)); },
    allocUnsafe: function(n){ return mk(new Uint8Array(n)); },
    isBuffer: function(b){ return b instanceof Uint8Array; },
    byteLength: function(s, enc){ if (typeof s !== 'string') return s.length; return enc === 'hex' ? s.length/2 : u8enc(s).length; },
    concat: function(list, total){ var t = total || 0; if (!total) list.forEach(function(b){ t += b.length; }); var out = new Uint8Array(t); var o = 0; list.forEach(function(b){ out.set(b,o); o += b.length; }); return mk(out); }
  };

  g.__filename = '/app/main.js';
  g.__dirname = '/app';

  // events
  function EventEmitter(){ this._events = {}; }
  EventEmitter.prototype.on = function(e,fn){ (this._events[e] = this._events[e] || []).push(fn); return this; };
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.once = function(e,fn){ var self = this; function w(){ self.removeListener(e,w); fn.apply(null,arguments); } w.listener = fn; return this.on(e,w); };
  EventEmitter.prototype.removeListener = function(e,fn){ this._events[e] = (this._events[e] || []).filter(function(f){ return f !== fn && f.listener !== fn; }); return this; };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.removeAllListeners = function(e){ if (e) this._events[e] = []; else this._events = {}; return this; };
  EventEmitter.prototype.emit = function(e){ var a = slice.call(arguments, 1); var l = this._events[e] || []; l.slice().forEach(function(f){ f.apply(null, a); }); return l.length > 0; };
  EventEmitter.prototype.listeners = function(e){ return (this._events[e] || []).slice(); };
  EventEmitter.prototype.listenerCount = function(e){ return (this._events[e] || []).length; };
  EventEmitter.prototype.setMaxListeners = function(){ return this; };
  EventEmitter.prototype.prependListener = EventEmitter.prototype.on;
  g.EventEmitter = EventEmitter;
  g._eventsShim = { EventEmitter: EventEmitter };

  // crypto
  function digest(parts, prefix, enc){
    var u = u8enc(prefix + parts.join(''));
    if (enc === 'hex') return u8hex(u);
    if (enc === 'base64') return u8b64(u);
    if (enc === 'base64url') return u8b64(u).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
    return mk(u);
  }
  g._cryptoShim = {
    randomBytes: function(n){ var b = new Uint8Array(n); crypto.getRandomValues(b); return mk(b); },
    randomUUID: function(){ return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random()*16|0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); },
    createHash: function(){ var parts = []; return { update: function(d){ parts.push(typeof d === 'string' ? d : new TextDecoder().decode(d)); return this; }, digest: function(enc){ return digest(parts, '', enc); } }; },
    createHmac: function(alg, key){ var parts = []; return { update: function(d){ parts.push(typeof d === 'string' ? d : new TextDecoder().decode(d)); return this; }, digest: function(enc){ return digest(parts, String(key) + ':', enc); } }; },
    timingSafeEqual: function(a,b){ if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
  };

  // util
  g._utilShim = {
    promisify: function(fn){ return function(){ var args = slice.call(arguments); return new Promise(function(res,rej){ args.push(function(e,v){ e ? rej(e) : res(v); }); fn.apply(null, args); }); }; },
    inspect: function(o){ try { return JSON.stringify(o, null, 2); } catch (e) { return String(o); } },
    format: function(){ return slice.call(arguments).join(' '); },
    inherits: function(c,p){ c.prototype = Object.create(p.prototype); c.prototype.constructor = c; }
  };

  // path
  g._pathShim = {
    sep: '/',
    join: function(){ return slice.call(arguments).filter(Boolean).join('/').replace(/\\/+/g,'/'); },
    resolve: function(){ return slice.call(arguments).filter(Boolean).join('/').replace(/\\/+/g,'/'); },
    basename: function(p){ return String(p).split('/').pop(); },
    dirname: function(p){ var a = String(p).split('/'); a.pop(); return a.join('/') || '.'; },
    extname: function(p){ var m = /\\.[^.\\/]+$/.exec(String(p)); return m ? m[0] : ''; }
  };

  // os
  g._osShim = {
    cpus: function(){ var n = navigator.hardwareConcurrency || 4; var a = []; for (var i = 0; i < n; i++) a.push({ model: 'Simulated CPU', speed: 2400 }); return a; },
    totalmem: function(){ return 8e9; },
    freemem: function(){ return 4e9; },
    platform: function(){ return 'linux'; },
    hostname: function(){ return 'localhost'; },
    arch: function(){ return 'x64'; },
    EOL: '\\n'
  };

  // streams
  function inherit(child, parent){ child.prototype = Object.create(parent.prototype); child.prototype.constructor = child; }

  function Readable(opts){
    opts = opts || {};
    EventEmitter.call(this);
    this._readFn = opts.read || function(){};
    this._isPull = typeof opts.read === 'function';
    this._buf = []; this._flowing = false; this._ended = false; this._started = false;
    this.readable = true;
  }
  inherit(Readable, EventEmitter);
  Readable.prototype.push = function(chunk){
    if (chunk === null || chunk === undefined) {
      if (this._ended) return false;
      this._ended = true;
      var self = this;
      setTimeout(function(){ self.emit('end'); self.emit('close'); }, 0);
      return false;
    }
    if (!(chunk instanceof Uint8Array)) chunk = g.Buffer.from(String(chunk));
    if (this._flowing) this.emit('data', chunk); else this._buf.push(chunk);
    return true;
  };
  Readable.prototype._start = function(){
    var self = this;
    if (this._started) return;
    this._started = true;
    if (this._buf.length) { var b = this._buf; this._buf = []; b.forEach(function(c){ self.emit('data', c); }); }
    if (!this._isPull) return;
    (function step(){
      if (self._ended) return;
      try { self._readFn.call(self); } catch (e) { self.emit('error', e); return; }
      if (!self._ended) setTimeout(step, 0);
    })();
  };
  Readable.prototype.pipe = function(dest){
    var self = this;
    this.on('data', function(c){ dest.write(c); });
    this.on('end', function(){ if (dest.end) dest.end(); });
    this.on('error', function(e){ if (dest.emit) dest.emit('error', e); });
    this._flowing = true;
    this._start();
    return dest;
  };
  Readable.prototype.read = function(){ if (this._isPull) this._readFn.call(this); return null; };
  Readable.prototype.resume = function(){ this._flowing = true; this._start(); return this; };
  Readable.prototype.pause = function(){ this._flowing = false; return this; };
  Readable.prototype.setEncoding = function(){ return this; };

  function Writable(opts){
    opts = opts || {};
    EventEmitter.call(this);
    this._writeFn = opts.write || function(c,e,cb){ cb(); };
    this._hwm = opts.highWaterMark || 16;
    this._len = 0; this._queue = []; this._busy = false;
    this.writable = true;
  }
  inherit(Writable, EventEmitter);
  Writable.prototype.write = function(chunk, enc, cb){
    if (typeof enc === 'function') { cb = enc; enc = 'utf8'; }
    if (typeof chunk === 'string') chunk = g.Buffer.from(chunk);
    var len = (chunk && chunk.length) || 0;
    this._len += len;
    var ok = this._len < this._hwm;
    this._queue.push({ chunk: chunk, enc: enc || 'utf8', cb: cb, len: len });
    this._drain();
    return ok;
  };
  Writable.prototype._drain = function(){
    var self = this;
    if (this._busy) return;
    var job = this._queue.shift();
    if (!job) return;
    this._busy = true;
    try {
      this._writeFn.call(this, job.chunk, job.enc, function(err){
        self._busy = false;
        self._len -= job.len;
        if (self._len < 0) self._len = 0;
        if (job.cb) job.cb(err);
        if (self._len === 0) self.emit('drain');
        self._drain();
      });
    } catch (e) { self._busy = false; self.emit('error', e); }
  };
  Writable.prototype.end = function(chunk, enc, cb){
    if (typeof chunk === 'function') { cb = chunk; chunk = null; }
    if (chunk) this.write(chunk, enc);
    var self = this;
    function finish(){ self.writable = false; self.emit('finish'); self.emit('close'); if (typeof cb === 'function') cb(); }
    (function wait(){ if (self._busy || self._queue.length) setTimeout(wait, 5); else finish(); })();
  };
  Writable.prototype.cork = function(){ return this; };
  Writable.prototype.uncork = function(){ return this; };
  Writable.prototype.setDefaultEncoding = function(){ return this; };

  function Transform(opts){
    opts = opts || {};
    Readable.call(this, opts);
    this._isPull = false;
    this._buf = []; this._ended = false; this._flowing = false; this._started = false;
  }
  inherit(Transform, Readable);
  Transform.prototype._transform = function(c, e, cb){ cb(null, c); };
  Transform.prototype._flush = function(cb){ cb(); };
  Transform.prototype.write = function(chunk, enc, cb){
    if (typeof enc === 'function') { cb = enc; enc = 'utf8'; }
    if (typeof chunk === 'string') chunk = g.Buffer.from(chunk);
    this._transform(chunk, enc || 'utf8', function(err){ if (typeof cb === 'function') cb(err); });
    return true;
  };
  Transform.prototype.end = function(chunk, enc, cb){
    if (typeof chunk === 'function') { cb = chunk; chunk = null; }
    var self = this;
    if (chunk) this.write(chunk, enc);
    this._flush(function(){ self.push(null); if (typeof cb === 'function') cb(); });
  };

  g._streamShim = {
    Readable: Readable, Writable: Writable, Transform: Transform, Duplex: Transform, PassThrough: Transform,
    pipeline: function(){
      var args = slice.call(arguments);
      var cb = typeof args[args.length - 1] === 'function' ? args.pop() : function(){};
      var done = false;
      function finish(err){ if (done) return; done = true; cb(err); }
      for (var i = 0; i < args.length - 1; i++) { args[i].on('error', finish); args[i].pipe(args[i+1]); }
      var last = args[args.length - 1];
      last.on('finish', function(){ finish(); });
      last.on('end', function(){ finish(); });
      last.on('error', finish);
      setTimeout(function(){ finish(); }, 5000);
      return last;
    },
    finished: function(s, cb){ s.on('finish', cb); s.on('end', cb); }
  };

  // worker_threads (in-thread emulation)
  function Worker(pathOrCode, opts){
    var self = this;
    opts = opts || {};
    EventEmitter.call(this);
    var wt = { Worker: Worker, isMainThread: false, parentPort: null, workerData: opts.workerData };
    var parentPort = { postMessage: function(v){ setTimeout(function(){ self.emit('message', v); }, 0); } };
    wt.parentPort = parentPort;
    var code = opts.eval ? String(pathOrCode) : (g.__mainSource || '');
    setTimeout(function(){
      try {
        var workerRequire = function(m){ return m === 'worker_threads' ? wt : g.require(m); };
        // Do not inject Worker/isMainThread/parentPort/workerData as params:
        // the worker code declares them itself via require('worker_threads').
        var fn = new Function('require','process','Buffer','setImmediate','clearImmediate','console','Atomics','SharedArrayBuffer','__filename','__dirname', code);
        fn(workerRequire, g.process, g.Buffer, g.setImmediate, g.clearImmediate, console, g.Atomics, g.SharedArrayBuffer, '/app/worker.js', '/app');
      } catch (e) { self.emit('error', e); }
    }, 0);
  }
  inherit(Worker, EventEmitter);
  g._workerShim = { Worker: Worker, isMainThread: true, parentPort: null, workerData: undefined };

  // fs — the sandbox has no real files; reads return the running source
  g._fsShim = {
    readFile: function(path, opts, cb){ if (typeof opts === 'function') cb = opts; setTimeout(function(){ cb(null, mk(u8enc(g.__mainSource || ''))); }, 0); },
    readFileSync: function(){ return mk(u8enc(g.__mainSource || '')); },
    writeFile: function(path, data, cb){ setTimeout(function(){ if (typeof cb === 'function') cb(null); }, 0); },
    writeFileSync: function(){ return undefined; },
    appendFile: function(path, data, cb){ setTimeout(function(){ if (typeof cb === 'function') cb(null); }, 0); },
    existsSync: function(){ return true; },
    statSync: function(){ return { isFile: function(){ return true; }, size: 1024 }; },
    mkdirSync: function(){}, unlinkSync: function(){}, readdirSync: function(){ return []; },
    createReadStream: function(){ return new g._streamShim.Readable({ read: function(){ this.push(mk(u8enc(g.__mainSource || ''))); this.push(null); } }); },
    promises: {
      readFile: function(){ return Promise.resolve(mk(u8enc(g.__mainSource || ''))); },
      writeFile: function(){ return Promise.resolve(); },
      mkdir: function(){ return Promise.resolve(); }
    }
  };

  // require
  g.require = function(mod){
    mod = String(mod).replace(/^node:/, '');
    var m = { 'fs': g._fsShim, 'stream': g._streamShim, 'events': g._eventsShim, 'crypto': g._cryptoShim,
      'util': g._utilShim, 'path': g._pathShim, 'os': g._osShim, 'worker_threads': g._workerShim }[mod];
    if (!m) { console.warn('Module not available in browser: ' + mod); return {}; }
    return m;
  };
})();`;

// ─── Express shim (API mode) ──────────────────────────────────────────────────
const EXPRESS_SHIM = `// ── express shim ────────────────────────────────────────
(function(){
  var g = window;
  var slice = [].slice;

  function matchPath(routePath, url){
    var rp = String(routePath).split('/').filter(Boolean);
    var up = String(url).split('?')[0].split('/').filter(Boolean);
    if (rp.length !== up.length) return null;
    var params = {};
    for (var i = 0; i < rp.length; i++) {
      if (rp[i].charAt(0) === ':') params[rp[i].slice(1)] = decodeURIComponent(up[i]);
      else if (rp[i] !== up[i]) return null;
    }
    return params;
  }

  function makeRes(req){
    var res = { statusCode: 200, headers: {}, locals: {}, _req: req || {} };
    res.status = function(n){ res.statusCode = n; return res; };
    res.setHeader = function(k, v){ res.headers[k] = v; return res; };
    res.getHeader = function(k){ return res.headers[k]; };
    res.type = function(t){ return res.setHeader('Content-Type', t); };
    res.json = function(body){
      res.body = body;
      console.log('  → ' + res.statusCode + ' ' + JSON.stringify(body));
      // Surface the response payload as a designed table in the panel above.
      try {
        if (window.__hbResults) {
          var rows = window.__hbResults.toRows(body);
          if (rows.length) {
            var label = res._req.method && res._req.url
              ? res._req.method + ' ' + res._req.url + ' → ' + res.statusCode
              : 'response ' + res.statusCode;
            window.__hbResults.render(label, rows);
          }
        }
      } catch (e) {}
      return res;
    };
    res.send = function(body){ return res.json(body); };
    res.end = function(){ return res; };
    res.redirect = function(u){ res.statusCode = 302; res.setHeader('Location', u); return res; };
    return res;
  }

  function dispatch(stack, req, out){
    req = req || {};
    req.method = String(req.method || 'GET').toUpperCase();
    req.url = req.url || '/';
    req.query = req.query || {};
    req.params = req.params || {};
    req.headers = req.headers || {};
    req.body = req.body || {};
    var res = makeRes(req);
    var i = 0;
    function next(err){
      while (i < stack.length) {
        var layer = stack[i++];
        if (layer.kind === 'use') {
          if (layer.prefix !== '/' && req.url.indexOf(layer.prefix) !== 0) continue;
          var isErrHandler = layer.fn.length === 4;
          if (err) { if (isErrHandler) return layer.fn(err, req, res, next); continue; }
          if (isErrHandler) continue;
          return layer.fn(req, res, next);
        }
        if (err) continue;
        if (layer.method !== req.method && layer.method !== 'ALL') continue;
        var params = matchPath(layer.path, req.url);
        if (params === null) continue;
        req.params = Object.assign({}, req.params, params);
        var k = 0;
        (function routeNext(e){
          if (e) return next(e);
          var f = layer.hs[k++];
          if (f) return f(req, res, routeNext);
          next();
        })();
        return;
      }
      if (err) console.error('Unhandled error: ' + err.message);
      if (out) out(err, req, res);
    }
    next();
    return res;
  }

  function createApplication(){
    var stack = [];
    function app(req, out){ return dispatch(stack, req, out); }
    app.stack = stack;
    app.use = function(){
      var args = slice.call(arguments);
      var prefix = typeof args[0] === 'string' ? args.shift() : '/';
      args.forEach(function(fn){ stack.push({ kind: 'use', prefix: prefix, fn: fn }); });
      return app;
    };
    ['get','post','put','patch','delete','head','options','all'].forEach(function(m){
      app[m] = function(path){
        var hs = slice.call(arguments, 1);
        stack.push({ kind: 'route', method: m.toUpperCase(), path: String(path), hs: hs });
        return app;
      };
    });
    app.handle = function(req, out){ return dispatch(stack, req, out); };
    app.listen = function(){ console.log('[express] listening on :3000 (simulated)'); return { close: function(){}, address: function(){ return { port: 3000 }; } }; };
    return app;
  }

  createApplication.json = function(){ return function(req, res, next){ req.body = req.body || {}; if (next) next(); }; };
  createApplication.urlencoded = createApplication.json;
  createApplication.text = createApplication.json;
  createApplication.raw = createApplication.json;
  createApplication.static = function(){ return function(req, res, next){ if (next) next(); }; };
  createApplication.Router = createApplication;

  g.express = createApplication;
  g._expressShim = createApplication;
})();`;

// ─── Zod shim (API mode) — real validation with error.issues ──────────────────
const ZOD_SHIM = `// ── zod shim ────────────────────────────────────────────
(function(){
  var g = window;

  function issue(code, path, message){ return { code: code, path: path, message: message }; }
  function zodError(issues){ var e = new Error('ZodError: ' + issues.map(function(i){ return i.message; }).join('; ')); e.name = 'ZodError'; e.issues = issues; return e; }
  function typeName(v){ return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }

  function run(def, value, path){
    if (value === undefined) {
      if (def.hasDefault) value = typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue;
      else if (def.optional) return { success: true, data: undefined };
      else return { success: false, issues: [issue('invalid_type', path, 'Required')] };
    } else if (value === null) {
      if (!def.nullable) return { success: false, issues: [issue('invalid_type', path, 'Expected ' + def.kind + ', received null')] };
      return { success: true, data: null };
    }

    if (def.kind === 'any') return { success: true, data: value };

    if (def.kind === 'array') {
      if (!Array.isArray(value)) return { success: false, issues: [issue('invalid_type', path, 'Expected array, received ' + typeName(value))] };
      var arr = []; var aissues = [];
      value.forEach(function(v, i){ var r = run(def.item._def, v, path.concat([i])); if (r.success) arr.push(r.data); else aissues = aissues.concat(r.issues); });
      if (aissues.length) return { success: false, issues: aissues };
      return { success: true, data: arr };
    }

    if (def.kind === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) return { success: false, issues: [issue('invalid_type', path, 'Expected object, received ' + typeName(value))] };
      var out = {}; var oissues = [];
      Object.keys(def.shape).forEach(function(k){
        var r = run(def.shape[k]._def, value[k], path.concat([k]));
        if (r.success) { if (r.data !== undefined) out[k] = r.data; }
        else oissues = oissues.concat(r.issues);
      });
      if (oissues.length) return { success: false, issues: oissues };
      return { success: true, data: out };
    }

    if (def.kind === 'literal') {
      if (value !== def.value) return { success: false, issues: [issue('invalid_literal', path, 'Invalid literal value, expected ' + JSON.stringify(def.value))] };
      return { success: true, data: value };
    }

    if (def.coerce) {
      if (def.kind === 'number') value = (value === '' ? NaN : Number(value));
      else if (def.kind === 'string') value = String(value);
      else if (def.kind === 'boolean') value = (String(value) === 'false' || String(value) === '0') ? false : Boolean(value);
    }

    if (def.kind === 'enum') {
      if (def.values.indexOf(value) === -1) {
        var opts = def.values.map(function(v){ return "'" + v + "'"; }).join(' | ');
        return { success: false, issues: [issue('invalid_enum_value', path, 'Invalid enum value. Expected ' + opts + ', received ' + (typeof value === 'string' ? "'" + value + "'" : String(value)))] };
      }
      return { success: true, data: value };
    }

    if (typeof value !== def.kind) return { success: false, issues: [issue('invalid_type', path, 'Expected ' + def.kind + ', received ' + typeName(value))] };

    for (var t = 0; t < def.transforms.length; t++) {
      var tf = def.transforms[t].t;
      if (tf === 'trim') value = value.trim();
      else if (tf === 'lower') value = value.toLowerCase();
      else if (tf === 'upper') value = value.toUpperCase();
    }

    var found = [];
    for (var c = 0; c < def.checks.length; c++) {
      var chk = def.checks[c];
      if (typeof value === 'string') {
        if (chk.t === 'min' && value.length < chk.n) found.push(issue('too_small', path, chk.msg || ('String must contain at least ' + chk.n + ' character(s)')));
        else if (chk.t === 'max' && value.length > chk.n) found.push(issue('too_big', path, chk.msg || ('String must contain at most ' + chk.n + ' character(s)')));
        else if (chk.t === 'email' && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value)) found.push(issue('invalid_string', path, chk.msg || 'Invalid email'));
        else if (chk.t === 'uuid' && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) found.push(issue('invalid_string', path, chk.msg || 'Invalid uuid'));
        else if (chk.t === 'regex' && !chk.re.test(value)) found.push(issue('invalid_string', path, chk.msg || 'Invalid'));
      } else if (typeof value === 'number') {
        if (chk.t === 'int' && !Number.isInteger(value)) found.push(issue('invalid_type', path, 'Expected integer, received float'));
        else if (chk.t === 'min' && value < chk.n) found.push(issue('too_small', path, chk.msg || ('Number must be greater than or equal to ' + chk.n)));
        else if (chk.t === 'max' && value > chk.n) found.push(issue('too_big', path, chk.msg || ('Number must be less than or equal to ' + chk.n)));
      }
    }
    if (found.length) return { success: false, issues: found };
    return { success: true, data: value };
  }

  function schema(def){
    var s = {};
    s._def = def;
    s.min = function(n, m){ def.checks.push({ t: 'min', n: n, msg: m }); return s; };
    s.max = function(n, m){ def.checks.push({ t: 'max', n: n, msg: m }); return s; };
    s.email = function(m){ def.checks.push({ t: 'email', msg: m }); return s; };
    s.uuid = function(m){ def.checks.push({ t: 'uuid', msg: m }); return s; };
    s.regex = function(re, m){ def.checks.push({ t: 'regex', re: re, msg: m }); return s; };
    s.int = function(){ def.checks.push({ t: 'int' }); return s; };
    s.positive = function(){ def.checks.push({ t: 'min', n: 0 }); return s; };
    s.nonnegative = function(){ def.checks.push({ t: 'min', n: 0 }); return s; };
    s.negative = function(){ def.checks.push({ t: 'max', n: 0 }); return s; };
    s.trim = function(){ def.transforms.push({ t: 'trim' }); return s; };
    s.toLowerCase = function(){ def.transforms.push({ t: 'lower' }); return s; };
    s.toUpperCase = function(){ def.transforms.push({ t: 'upper' }); return s; };
    s.optional = function(){ def.optional = true; return s; };
    s.nullable = function(){ def.nullable = true; return s; };
    s.nullish = function(){ def.optional = true; def.nullable = true; return s; };
    s.default = function(v){ def.hasDefault = true; def.defaultValue = v; return s; };
    s.parse = function(v){ var r = run(def, v, []); if (!r.success) throw zodError(r.issues); return r.data; };
    s.safeParse = function(v){ var r = run(def, v, []); return r.success ? { success: true, data: r.data } : { success: false, error: zodError(r.issues) }; };
    s.parseAsync = function(v){ return Promise.resolve(s.parse(v)); };
    s.safeParseAsync = function(v){ return Promise.resolve(s.safeParse(v)); };
    return s;
  }

  function base(kind, extra){
    var def = { kind: kind, checks: [], transforms: [], optional: false, nullable: false, hasDefault: false };
    if (extra) Object.keys(extra).forEach(function(k){ def[k] = extra[k]; });
    return def;
  }

  var z = {
    string: function(){ return schema(base('string')); },
    number: function(){ return schema(base('number')); },
    boolean: function(){ return schema(base('boolean')); },
    any: function(){ return schema(base('any')); },
    unknown: function(){ return schema(base('any')); },
    enum: function(values){ return schema(base('enum', { values: values })); },
    literal: function(v){ return schema(base('literal', { value: v })); },
    object: function(shape){ return schema(base('object', { shape: shape || {} })); },
    array: function(item){ return schema(base('array', { item: item })); },
    coerce: {
      number: function(){ return schema(base('number', { coerce: true })); },
      string: function(){ return schema(base('string', { coerce: true })); },
      boolean: function(){ return schema(base('boolean', { coerce: true })); }
    }
  };

  g.z = z;
  g.ZodError = zodError;
  g._zodShim = { z: z, ZodError: zodError };
})();`;

// ─── Shared results panel (designed tables for every mode) ────────────────────
// The panel sits directly above the console/terminal. SQL DQL result sets and
// Node/server responses are rendered with the same table design so the preview
// reads like a database client instead of a wall of source code.
// Scrollbars: globals.css cannot reach into a srcdoc iframe, so the preview
// document carries its own themed scrollbars.
const DOC_SCROLLBAR_CSS = `
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #0f0f1a; }
  ::-webkit-scrollbar-thumb { background: #1e1e35; border-radius: 5px;
    border: 2px solid #0f0f1a; }
  ::-webkit-scrollbar-thumb:hover { background: #9b7b2e; }
  ::-webkit-scrollbar-thumb:active { background: #c9a84c; }
  ::-webkit-scrollbar-corner { background: #0f0f1a; }
  @supports not selector(::-webkit-scrollbar) {
    * { scrollbar-width: thin; scrollbar-color: #1e1e35 #0f0f1a; }
  }
`;
const RESULTS_CSS = `
${DOC_SCROLLBAR_CSS}
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #50507a; margin-bottom: 10px; }
  .summary { font-size: 12px; color: #9090b8; padding: 10px 14px;
    background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.2);
    border-radius: 10px; margin-bottom: 12px; }
  .summary strong { color: #34d399; }
  .res { background: #0f0f1a; border: 1px solid #1e1e35; border-radius: 10px;
    margin-bottom: 10px; overflow: hidden; }
  .res.ok { border-left: 3px solid #34d399; }
  .res.skip { border-left: 3px solid #c9a84c; }
  .res.err { border-left: 3px solid #f87171; }
  .res-head { display: flex; gap: 10px; align-items: center; padding: 8px 12px;
    background: #12121e; border-bottom: 1px solid #1e1e35; }
  .res-num { background: #1e1e35; color: #34d399; font-size: 10px; font-weight: 700;
    border-radius: 5px; padding: 1px 7px; flex-shrink: 0; }
  .res-sql { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #9090b8;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .res-body { padding: 10px 12px; }
  .rblock { margin-bottom: 14px; }
  .result-title { display: flex; align-items: center; gap: 7px; font-size: 11px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: #50507a; margin-bottom: 8px; }
  .result-title .dot { width: 6px; height: 6px; border-radius: 99px; background: #34d399; }
  .tbl-wrap { overflow: auto; max-height: 340px; border-radius: 8px;
    border: 1px solid #1e1e35; }
  table.tbl { border-collapse: collapse; width: 100%;
    font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
  table.tbl th { position: sticky; top: 0; background: #14142a; color: #34d399;
    text-align: left; padding: 6px 12px; border: 1px solid #1e1e35; font-weight: 600;
    white-space: nowrap; }
  table.tbl td { padding: 5px 12px; border: 1px solid #1e1e35; color: #cdd6f4; }
  table.tbl tr:nth-child(even) td { background: #0c0c18; }
  .num { color: #f78c6c; }
  .nul { color: #50507a; font-style: italic; }
  .rows, .more { font-size: 11px; color: #50507a; margin-top: 6px; }
  .ok-note { color: #34d399; font-size: 12px; }
  .skip { color: #c9a84c; font-size: 12px; line-height: 1.6; }
  .err-msg { color: #f87171; font-size: 12px; font-family: 'JetBrains Mono', monospace;
    white-space: pre-wrap; }
  .placeholder { font-size: 12px; color: #50507a; font-style: italic; padding: 8px 2px; }
  details.source { background: #0f0f1a; border: 1px solid #1e1e35; border-radius: 10px;
    margin-top: 18px; }
  details.source > summary { cursor: pointer; padding: 10px 14px; font-size: 11px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #50507a;
    list-style: none; }
  details.source > summary::-webkit-details-marker { display: none; }
  details.source > summary::before { content: '▸ '; }
  details.source[open] > summary::before { content: '▾ '; }
  details.source pre { border: none; border-top: 1px solid #1e1e35; border-radius: 0; }
  pre { background: #0f0f1a; border: 1px solid #1e1e35; border-radius: 10px;
    padding: 16px; overflow: auto; white-space: pre; font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px; }
`;

// Runtime helper injected into the sandbox: collects structured values and
// renders them as the same designed table used by the SQL workbench.
const RESULTS_RUNTIME = `
window.__hbResults = (function(){
  function host(){ return document.getElementById('results'); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function isObj(v){ return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Uint8Array) && !(v instanceof Date); }
  function fmt(v){
    if (v === null || v === undefined) return '<span class="nul">NULL</span>';
    if (v instanceof Uint8Array) return '<span class="nul">[blob ' + v.length + ' B]</span>';
    if (typeof v === 'number' || typeof v === 'boolean') return '<span class="num">' + v + '</span>';
    if (typeof v === 'object') return esc(JSON.stringify(v));
    return esc(String(v));
  }
  function toRows(v){
    if (Array.isArray(v)) {
      if (!v.length) return [];
      if (v.every(isObj)) return v;
      if (v.every(function(x){ return Array.isArray(x); })) {
        return v.map(function(a){ var o = {}; a.forEach(function(x, i){ o['col' + (i + 1)] = x; }); return o; });
      }
      return v.map(function(x){ return { value: x }; });
    }
    if (isObj(v)) {
      if (Array.isArray(v.data)) return v.data;
      if (Array.isArray(v.rows)) return v.rows;
      if (Array.isArray(v.items)) return v.items;
      return [v];
    }
    return [];
  }
  function cols(rows){
    var order = [];
    rows.forEach(function(r){
      if (isObj(r)) { for (var k in r) { if (Object.prototype.hasOwnProperty.call(r, k) && order.indexOf(k) < 0) order.push(k); } }
      else if (order.indexOf('value') < 0) order.push('value');
    });
    return order;
  }
  function render(title, rows){
    if (!rows || !rows.length) return false;
    var h = host(); if (!h) return false;
    var ph = h.querySelector('.placeholder'); if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
    var c = cols(rows), lim = 100;
    var html = '<div class="rblock">';
    if (title) html += '<div class="result-title"><span class="dot"></span>' + esc(title) + '</div>';
    html += '<div class="tbl-wrap"><table class="tbl"><thead><tr>';
    c.forEach(function(k){ html += '<th>' + esc(k) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.slice(0, lim).forEach(function(r){
      html += '<tr>';
      c.forEach(function(k){ html += '<td>' + fmt(isObj(r) ? r[k] : (k === 'value' ? r : undefined)) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    if (rows.length > lim) html += '<div class="more">… ' + (rows.length - lim) + ' more row(s) not shown</div>';
    html += '<div class="rows">' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + ' × ' + c.length + ' column' + (c.length === 1 ? '' : 's') + '</div></div>';
    h.insertAdjacentHTML('beforeend', html);
    return true;
  }
  function labelFor(args, fallback){
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] === 'string' && args[i].trim()) return args[i].trim().replace(/[:\\s]+$/, '') || fallback;
    }
    return fallback;
  }
  function fromArgs(args, method){
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (method !== 'table' && typeof a === 'string') continue;
      var rows = toRows(a);
      if (rows.length) render(labelFor(args, method === 'table' ? 'table' : 'result'), rows);
    }
  }
  return { render: render, fromArgs: fromArgs, toRows: toRows };
})();
`;

// Console capture shared by every mode — streams to the parent console panel and
// mirrors structured values into the results table above it.
const CONSOLE_HOOK = `<script>
(function(){
  var orig = {};
  ['log','error','warn','info','table'].forEach(function(m){
    orig[m] = (console[m] || console.log).bind(console);
    console[m] = function(){
      var args = [].slice.call(arguments);
      try { orig[m].apply(console, args); } catch (e) {}
      try { if (window.__hbResults) window.__hbResults.fromArgs(args, m); } catch (e) {}
      var text;
      if (m === 'table') {
        var label = null;
        for (var i = 0; i < args.length; i++) { if (typeof args[i] === 'string') { label = args[i]; break; } }
        text = '[table] ' + (label || 'rendered in the panel above');
      } else {
        text = args.map(function(x){
          try { return (typeof x === 'object' && x !== null) ? JSON.stringify(x, null, 2) : String(x); }
          catch (e) { return String(x); }
        }).join(' ');
      }
      window.parent.postMessage({ type: '__console__', method: (m === 'table' ? 'log' : m), args: text }, '*');
    };
  });
  window.onerror = function(msg, _, l){
    window.parent.postMessage({ type: '__console__', method: 'error', args: msg + ' (line ' + l + ')' }, '*');
  };
  window.addEventListener('unhandledrejection', function(e){
    window.parent.postMessage({ type: '__console__', method: 'error',
      args: 'Unhandled rejection: ' + ((e.reason && e.reason.message) || String(e.reason)) }, '*');
  });
})();
</script>`;

// ─── Build Node.js doc ────────────────────────────────────────────────────────
function buildNodeDoc(files: PlayFile[]) {
  const mainFile = files.find(f => f.name === 'main') ?? files[0];
  const allCode = files
    .map(f => f.content)
    .join('\n\n');

  const escaped = allCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'JetBrains Mono', monospace; background: #08080f; color: #cdd6f4;
    padding: 20px; font-size: 13px; line-height: 1.7; min-height: 100vh; }
  .banner { background: rgba(104,160,99,0.1); border: 1px solid rgba(104,160,99,0.3);
    border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #86a686; }
  .banner strong { color: #68a063; }
  code { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
${RESULTS_CSS}
  pre { white-space: pre-wrap; word-break: break-all; }
</style>
</head><body>
<div class="banner">
  <strong>Node.js Playground</strong> — Code runs in your browser via a sandboxed environment.
  Structured output is tabulated above; the full log streams to the console panel below.
</div>

<div class="section">
  <h3>Query results</h3>
  <div id="results"><div class="placeholder">No tabular data — this lesson writes text output to the console panel below.</div></div>
</div>

<details class="source">
  <summary>Source — ${mainFile?.name ?? 'code'}.${mainFile?.ext ?? 'js'}</summary>
  <pre><code>${escaped}</code></pre>
</details>
${CONSOLE_HOOK}
<script>
${RUNTIME_SHIM}
${RESULTS_RUNTIME}

window.__mainSource = ${JSON.stringify(allCode)};

try {
${allCode}
} catch(e) { console.error('Runtime error: ' + e.message); }
</script>
</body></html>`;
}

// ─── Build SQL doc ────────────────────────────────────────────────────────────
function buildSqlDoc(files: PlayFile[], activeFileId: string) {
  const active = files.find(f => f.id === activeFileId) ?? files[0];
  const source = active?.content ?? '';
  const escaped = source.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sourceJson = JSON.stringify(source).replace(/</g, '\\u003c');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #08080f; color: #cdd6f4;
    padding: 20px; font-size: 13px; line-height: 1.7; min-height: 100vh; }
  .banner { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25);
    border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
  .banner h2 { font-size: 14px; font-weight: 700; color: #34d399; margin-bottom: 6px; }
  .banner p { font-size: 12px; color: #9090b8; line-height: 1.6; }
  .banner code { color: #34d399; font-family: 'JetBrains Mono', monospace; }
${RESULTS_CSS}
</style>
</head><body>
<div class="banner">
  <h2>SQL Workbench — ${active?.name ?? 'query'}.sql</h2>
  <p>Every statement runs live in your browser against an in-memory SQLite engine
  (<code>sql.js</code>). Results render in the panel below and stream into the console.
  PostgreSQL-only constructs (triggers, partitions, advisory locks, full-text search, …)
  are flagged and skipped — run those against a real PostgreSQL instance.</p>
</div>

<div class="section">
  <h3>Query results</h3>
  <div id="results"><div class="summary">Loading SQL engine…</div></div>
</div>

<details class="source">
  <summary>Source — ${active?.name ?? 'query'}.sql</summary>
  <pre>${escaped}</pre>
</details>

<script>
${RESULTS_RUNTIME}
</script>
${CONSOLE_HOOK}
<script src="/sqljs/sql-wasm.js"></script>
<script>
var SQL_SOURCE = ${sourceJson};
(function(){
  var resultsEl = document.getElementById('results');

  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function oneLine(s){ return s.replace(/\\s+/g, ' ').trim(); }
  function truncate(s, n){ return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // Split on ';' while respecting string literals, comments and dollar-quoted blocks.
  function splitStatements(sql){
    var out = [], cur = '', i = 0, n = sql.length;
    var inStr = false, inDollar = false, inLine = false, inBlock = false, dtag = '';
    while (i < n) {
      var ch = sql.charAt(i), nx = sql.charAt(i + 1);
      if (inLine) { cur += ch; if (ch === '\\n') inLine = false; i++; continue; }
      if (inBlock) { cur += ch; if (ch === '*' && nx === '/') { cur += nx; i += 2; inBlock = false; continue; } i++; continue; }
      if (inStr) { cur += ch; if (ch === "'" && nx === "'") { cur += nx; i += 2; continue; } if (ch === "'") inStr = false; i++; continue; }
      if (inDollar) {
        if (ch === '$' && sql.substr(i, dtag.length) === dtag) { cur += dtag; i += dtag.length; inDollar = false; dtag = ''; continue; }
        cur += ch; i++; continue;
      }
      if (ch === '-' && nx === '-') { cur += '--'; i += 2; inLine = true; continue; }
      if (ch === '/' && nx === '*') { cur += '/*'; i += 2; inBlock = true; continue; }
      if (ch === "'") { cur += ch; i++; inStr = true; continue; }
      if (ch === '$') {
        var m = /^\\$[A-Za-z_0-9]*\\$/.exec(sql.slice(i));
        if (m) { dtag = m[0]; cur += dtag; i += dtag.length; inDollar = true; continue; }
      }
      if (ch === ';') { out.push(cur); cur = ''; i++; continue; }
      cur += ch; i++;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  function stripComments(s){ return s.replace(/--[^\\n]*/g, ' ').replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ').trim(); }

  var PG_ONLY = [
    /\\bCREATE\\s+(OR\\s+REPLACE\\s+)?FUNCTION\\b/i,
    /\\bCREATE\\s+TRIGGER\\b/i,
    /\\bLANGUAGE\\s+plpgsql\\b/i,
    /\\bCREATE\\s+POLICY\\b/i,
    /\\bPARTITION\\s+OF\\b/i,
    /\\bATTACH\\s+PARTITION\\b/i,
    /pg_advisory_/i,
    /current_setting\\s*\\(/i,
    /to_tsvector/i, /to_tsquery/i,
    /@>/, /<@/, /@@/,
    /\\bGROUPING\\s+SETS\\b/i,
    /\\bARRAY\\s*\\[/i,
    /tsrange/i,
    /\\bSET\\s+TRANSACTION\\s+ISOLATION\\b/i,
    /\\bBEGIN\\s+TRANSACTION\\s+ISOLATION\\b/i
  ];
  function isPgOnly(sql){
    for (var i = 0; i < PG_ONLY.length; i++) if (PG_ONLY[i].test(sql)) return true;
    return false;
  }

  // Best-effort PostgreSQL → SQLite dialect translation.
  function translate(sql){
    var s = sql;
    s = s.replace(/EXPLAIN\\s*\\([^)]*\\)/gi, 'EXPLAIN QUERY PLAN');
    s = s.replace(/::\\s*[A-Za-z_][A-Za-z0-9_]*(\\s*\\[\\s*\\])?(\\s*\\(\\s*[^)]*\\))?/g, '');
    s = s.replace(/\\bNOW\\s*\\(\\s*\\)/gi, 'CURRENT_TIMESTAMP');
    s = s.replace(/(CURRENT_TIMESTAMP|CURRENT_DATE|[A-Za-z_][A-Za-z0-9_.]*)\\s*([-+])\\s*INTERVAL\\s*'(\\d+)\\s+([A-Za-z]+)'/gi,
      function(m, expr, op, num, unit){
        var base = /^current_/i.test(expr) ? "'now'" : expr;
        return 'datetime(' + base + ", '" + op + num + ' ' + unit + "')";
      });
    s = s.replace(/INTERVAL\\s*'([^']+)'/gi, "'$1'");
    s = s.replace(/date_trunc\\s*\\(\\s*'([A-Za-z]+)'\\s*,\\s*([^)]+)\\)/gi, function(m, unit, expr){
      var f = { month: '%Y-%m-01', year: '%Y-01-01', day: '%Y-%m-%d', hour: '%Y-%m-%d %H:00:00' }[unit.toLowerCase()] || '%Y-%m-%d';
      return "strftime('" + f + "', " + expr + ')';
    });
    s = s.replace(/\\bCOUNT\\s*\\(\\s*\\*\\s*\\)\\s*FILTER\\s*\\(\\s*WHERE\\s+([^)]+)\\)/gi, function(m, cond){
      return 'SUM(CASE WHEN ' + cond + ' THEN 1 ELSE 0 END)';
    });
    s = s.replace(/\\b(SUM|AVG|MIN|MAX|COUNT)\\s*\\(\\s*([^)]+?)\\s*\\)\\s*FILTER\\s*\\(\\s*WHERE\\s+([^)]+)\\)/gi, function(m, fn, arg, cond){
      return fn + '(CASE WHEN ' + cond + ' THEN ' + arg + ' ELSE 0 END)';
    });
    s = s.replace(/\\bBIGSERIAL\\b/gi, 'INTEGER').replace(/\\bSERIAL\\b/gi, 'INTEGER');
    s = s.replace(/\\bTIMESTAMPTZ\\b/gi, 'TEXT');
    s = s.replace(/\\bJSONB\\b/gi, 'TEXT');
    s = s.replace(/\\bUUID\\b/gi, 'TEXT');
    s = s.replace(/\\bBYTEA\\b/gi, 'BLOB');
    s = s.replace(/\\bINET\\b/gi, 'TEXT');
    s = s.replace(/\\bCITEXT\\b/gi, 'TEXT');
    s = s.replace(/\\b[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\]/g, 'TEXT');
    s = s.replace(/\\bCREATE\\s+(UNIQUE\\s+)?INDEX\\s+CONCURRENTLY\\b/gi, 'CREATE $1INDEX');
    s = s.replace(/\\bUSING\\s+(HASH|GIN|GIST|BRIN|BTREE)\\b/gi, '');
    s = s.replace(/\\s+INCLUDE\\s*\\([^)]*\\)/gi, '');
    if (/^\\s*CREATE\\s+(UNIQUE\\s+)?INDEX/i.test(s)) s = s.replace(/\\s+WITH\\s*\\([^)]*\\)/gi, '');
    s = s.replace(/\\s+PARTITION\\s+BY\\s+(RANGE|LIST|HASH)\\s*\\([^)]*\\)/gi, '');
    s = s.replace(/\\s+FOR\\s+(NO\\s+KEY\\s+)?(UPDATE|SHARE)(\\s+SKIP\\s+LOCKED)?/gi, '');
    return s;
  }

  function fmtCell(v){
    if (v === null || v === undefined) return '<span class="nul">NULL</span>';
    if (v instanceof Uint8Array) return '<span class="nul">[blob ' + v.length + ' B]</span>';
    if (typeof v === 'number') return '<span class="num">' + v + '</span>';
    return esc(String(v));
  }

  function renderResult(res){
    if (!res || !res.length) return { html: '<div class="ok-note">✓ Statement executed</div>', rows: 0 };
    var block = res[res.length - 1];
    var cols = block.columns || [], vals = block.values || [];
    var limit = 60;
    var h = '<div class="tbl-wrap"><table class="tbl"><thead><tr>';
    for (var c = 0; c < cols.length; c++) h += '<th>' + esc(cols[c]) + '</th>';
    h += '</tr></thead><tbody>';
    for (var r = 0; r < Math.min(vals.length, limit); r++) {
      h += '<tr>';
      for (var k = 0; k < vals[r].length; k++) h += '<td>' + fmtCell(vals[r][k]) + '</td>';
      h += '</tr>';
    }
    h += '</tbody></table></div>';
    if (vals.length > limit) h += '<div class="more">… ' + (vals.length - limit) + ' more row(s) not shown</div>';
    h += '<div class="rows">' + vals.length + ' row' + (vals.length === 1 ? '' : 's') + ' × ' + cols.length + ' column' + (cols.length === 1 ? '' : 's') + '</div>';
    return { html: h, rows: vals.length };
  }

  function card(idx, sql, body, kind){
    var d = document.createElement('div');
    d.className = 'res ' + kind;
    d.innerHTML = '<div class="res-head"><span class="res-num">' + idx + '</span><code class="res-sql">' + esc(truncate(oneLine(sql), 220)) + '</code></div><div class="res-body">' + body + '</div>';
    resultsEl.appendChild(d);
  }

  function fatal(msg){
    resultsEl.innerHTML = '<div class="res err"><div class="res-body"><div class="err-msg">' + esc(msg) + '</div></div></div>';
  }

  function boot(){
    var chunks = splitStatements(SQL_SOURCE);
    var jobs = [];
    for (var i = 0; i < chunks.length; i++) {
      var clean = stripComments(chunks[i]);
      if (clean) jobs.push(clean);
    }
    if (!jobs.length) { fatal('No SQL statements found to run.'); return; }
    if (typeof initSqlJs !== 'function') {
      fatal('Could not load the SQL engine. Expected /sqljs/sql-wasm.js to expose initSqlJs().');
      return;
    }
    initSqlJs({ locateFile: function(f){ return '/sqljs/' + f; } }).then(function(SQL){
      var db = new SQL.Database();
      resultsEl.innerHTML = '';
      var ran = 0, rows = 0, skipped = 0, failed = 0;
      for (var j = 0; j < jobs.length; j++) {
        var sql = jobs[j], n = j + 1;
        if (isPgOnly(sql)) {
          skipped++;
          card(n, sql, '<div class="skip">PostgreSQL-only construct — skipped by the in-browser SQLite engine. Run this statement on a real PostgreSQL server.</div>', 'skip');
          continue;
        }
        var translated = translate(sql);
        if (!translated.trim()) {
          skipped++;
          card(n, sql, '<div class="skip">Nothing left to execute after dialect translation.</div>', 'skip');
          continue;
        }
        var res = null, err = null;
        try { res = db.exec(translated); }
        catch (e1) {
          try { res = db.exec(sql); }
          catch (e2) { err = e1; }
        }
        if (err) {
          failed++;
          card(n, sql, '<div class="err-msg">' + esc(err.message || String(err)) + '</div>', 'err');
          continue;
        }
        ran++;
        var out = renderResult(res);
        rows += out.rows;
        card(n, sql, out.html, 'ok');
      }
      var sum = document.createElement('div');
      sum.className = 'summary';
      sum.innerHTML = '<strong>' + ran + '</strong> statement(s) executed · <strong>' + rows + '</strong> row(s) returned · <strong>' + skipped + '</strong> skipped · <strong>' + failed + '</strong> error(s)';
      resultsEl.insertBefore(sum, resultsEl.firstChild);
      console.log('[sql] ' + ran + ' executed · ' + rows + ' rows · ' + skipped + ' skipped · ' + failed + ' failed');
    }).catch(function(e){
      fatal('SQL engine failed to initialise: ' + ((e && e.message) || String(e)));
    });
  }

  boot();
})();
</script>
</body></html>`;
}

// ─── Build API doc ────────────────────────────────────────────────────────────
function buildApiDoc(files: PlayFile[], activeFileId: string) {
  const active = files.find(f => f.id === activeFileId) ?? files[0];
  const escaped = (active?.content ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const allCode = files.filter(f => f.ext === 'js' || f.ext === 'ts').map(f => f.content).join('\n\n');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'JetBrains Mono', monospace; background: #08080f; color: #cdd6f4;
    padding: 20px; font-size: 13px; line-height: 1.7; min-height: 100vh; }
  .banner { background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.25);
    border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #9090b8; }
  .banner strong { color: #60a5fa; }
${RESULTS_CSS}
  pre { white-space: pre-wrap; word-break: break-all; }
</style>
</head><body>
<div class="banner">
  <strong>API Design Playground</strong> — Code executes with browser shims for express + zod.
  Request and response payloads are tabulated below; the raw log streams to the console panel.
</div>

<div class="section">
  <h3>Server responses</h3>
  <div id="results"><div class="placeholder">No response payloads yet — this lesson writes text output to the console panel below.</div></div>
</div>

<details class="source">
  <summary>Source — ${active?.name ?? 'code'}.${active?.ext ?? 'js'}</summary>
  <pre><code>${escaped}</code></pre>
</details>

<script>
${RESULTS_RUNTIME}
</script>
${CONSOLE_HOOK}
<script>
${RUNTIME_SHIM}
${EXPRESS_SHIM}
${ZOD_SHIM}
(function(){
  var g = window;
  var baseRequire = g.require;
  g.require = function(mod){
    mod = String(mod).replace(/^node:/, '');
    if (mod === 'express') return g._expressShim;
    if (mod === 'zod') return g._zodShim;
    return baseRequire(mod);
  };
})();

window.__mainSource = ${JSON.stringify(allCode)};

try {
${allCode}
} catch(e) { console.error('Runtime error: ' + e.message + '\\n' + (e.stack || '')); }
</script>
</body></html>`;
}

// ─── Build Architecture doc ───────────────────────────────────────────────────
function buildArchDoc(files: PlayFile[], activeFileId: string) {
  const active = files.find(f => f.id === activeFileId) ?? files[0];
  const escaped = (active?.content ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const allCode = files.filter(f => f.ext === 'js' || f.ext === 'ts').map(f => f.content).join('\n\n');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'JetBrains Mono', monospace; background: #08080f; color: #cdd6f4;
    padding: 20px; font-size: 13px; line-height: 1.7; min-height: 100vh; }
  .banner { background: rgba(192,132,252,0.08); border: 1px solid rgba(192,132,252,0.25);
    border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #9090b8; }
  .banner strong { color: #c084fc; }
${RESULTS_CSS}
  pre { white-space: pre-wrap; word-break: break-all; }
</style>
</head><body>
<div class="banner">
  <strong>Architecture Playground</strong> — Patterns run in a simulated browser environment.
  Structured output is tabulated below; the raw log streams to the console panel.
</div>

<div class="section">
  <h3>Query results</h3>
  <div id="results"><div class="placeholder">No tabular data — this lesson writes text output to the console panel below.</div></div>
</div>

<details class="source">
  <summary>Source — ${active?.name ?? 'code'}.${active?.ext ?? 'js'}</summary>
  <pre><code>${escaped}</code></pre>
</details>

<script>
${RESULTS_RUNTIME}
</script>
${CONSOLE_HOOK}
<script>
${RUNTIME_SHIM}

window.__mainSource = ${JSON.stringify(allCode)};

try {
${allCode}
} catch(e){ console.error('Runtime error: ' + e.message + '\\n' + (e.stack || '')); }
</script>
</body></html>`;
}

// ─── New File Dialog ──────────────────────────────────────────────────────────
function NewFileDialog({ onAdd, onClose, existingNames }: {
  onAdd: (f: PlayFile) => void; onClose: () => void; existingNames: string[];
}) {
  const [name, setName] = useState('');
  const [ext, setExt] = useState<FileExt>('js');
  const EXTS: FileExt[] = ['js', 'ts', 'sql', 'json', 'yaml', 'sh', 'md'];
  const safeName = name.trim();
  const duplicate = existingNames.includes(safeName);
  const valid = safeName.length > 0 && !duplicate;

  const submit = () => {
    if (!valid) return;
    let _id = Math.random().toString(36).slice(2);
    onAdd({ id: _id, name: safeName, ext, content: EXT_STARTERS[ext] });
    onClose();
  };

  return (
    <div className="pg-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pg-dialog" style={{ background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#e8e8f5' }}>New file</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#50507a' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#9090b8', display: 'block', marginBottom: '6px' }}>File name</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="my-module"
              style={{ width: '100%', background: '#14142a', border: `1px solid ${duplicate ? '#f87171' : '#1e1e35'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#e8e8f5', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
            {duplicate && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Name already exists</div>}
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#9090b8', display: 'block', marginBottom: '6px' }}>Extension</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EXTS.map(e => (
                <button key={e} onClick={() => setExt(e)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', border: `1px solid ${ext === e ? EXT_COLORS[e] + '60' : '#1e1e35'}`, background: ext === e ? EXT_COLORS[e] + '15' : 'transparent', color: ext === e ? EXT_COLORS[e] : '#50507a' }}>
                  .{e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#50507a' }}>
            Preview: <span style={{ color: EXT_COLORS[ext], fontFamily: 'JetBrains Mono, monospace' }}>{safeName || 'file'}.{ext}</span>
          </div>
          <button onClick={submit} disabled={!valid} style={{ background: valid ? 'linear-gradient(135deg, #9B7B2E, #C9A84C)' : '#1e1e35', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, color: valid ? '#0A0A0F' : '#2E2E4E', cursor: valid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif' }}>
            Create file
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Monaco Editor ────────────────────────────────────────────────────────────
type Monaco = typeof import('monaco-editor');

interface AmdRequire {
  (deps: string[], onLoad: (m: Monaco) => void, onError?: (e: unknown) => void): void;
  config(opts: { paths: Record<string, string> }): void;
}

const MONACO_LANG: Record<FileExt, string> = {
  js: 'javascript', ts: 'typescript', sql: 'sql', json: 'json',
  yaml: 'yaml', sh: 'shell', md: 'markdown',
};

// Self-hosted AMD build lives in /public/monaco (copied from monaco-editor/min/vs).
// The default worker factory resolves vs/base/worker/workerMain.js through
// require.toUrl, so configuring the `vs` path is all that is needed.
let monacoLoader: Promise<Monaco> | null = null;

function loadMonaco(): Promise<Monaco> {
  if (monacoLoader) return monacoLoader;
  monacoLoader = new Promise<Monaco>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/monaco/vs/loader.js';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load /monaco/vs/loader.js'));
    script.onload = () => {
      const amd = (window as unknown as { require?: AmdRequire }).require;
      if (!amd) return reject(new Error('Monaco AMD loader unavailable'));
      // Must be absolute (origin included): the worker runs from a blob: URL,
      // where root-relative paths cannot be resolved.
      amd.config({ paths: { vs: `${window.location.origin}/monaco/vs` } });
      amd(['vs/editor/editor.main'], monaco => {
        monaco.editor.defineTheme('handbook-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'CDD6F4' },
            { token: 'comment', foreground: '546E7A', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'C792EA' },
            { token: 'number', foreground: 'F78C6C' },
            { token: 'string', foreground: 'C3E88D' },
            { token: 'type', foreground: 'FFCB6B' },
            { token: 'function', foreground: '82AAFF' },
            { token: 'operator', foreground: '89DDFF' },
            { token: 'delimiter', foreground: 'A6ACCD' },
            { token: 'variable', foreground: 'F07178' },
            { token: 'constant', foreground: 'F78C6C' },
            { token: 'regexp', foreground: '89DDFF' },
          ],
          colors: {
            'editor.background': '#0A0A0F',
            'editor.foreground': '#CDD6F4',
            'editorLineNumber.foreground': '#2E2E4E',
            'editorLineNumber.activeForeground': '#C9A84C',
            'editor.selectionBackground': '#C9A84C40',
            'editor.inactiveSelectionBackground': '#C9A84C20',
            'editor.lineHighlightBackground': '#12121E',
            'editor.lineHighlightBorder': '#00000000',
            'editorCursor.foreground': '#C9A84C',
            'editorIndentGuide.background1': '#1E1E35',
            'editorIndentGuide.activeBackground1': '#2E2E4E',
            'editorGutter.background': '#0A0A0F',
            'editorWidget.background': '#0F0F1A',
            'editorWidget.border': '#1E1E35',
            'editorSuggestWidget.background': '#0F0F1A',
            'editorSuggestWidget.selectedBackground': '#1E1E35',
            'editorHoverWidget.background': '#0F0F1A',
            'editorHoverWidget.border': '#1E1E35',
            'scrollbarSlider.background': '#1E1E3580',
            'scrollbarSlider.hoverBackground': '#2E2E4EAA',
            'scrollbarSlider.activeBackground': '#C9A84C60',
            'editorBracketMatch.background': '#C9A84C20',
            'editorBracketMatch.border': '#C9A84C60',
          },
        });
        resolve(monaco);
      }, reject);
    };
    document.head.appendChild(script);
  });
  return monacoLoader;
}

function CodeEditor({ value, onChange, lang }: { value: string; onChange: (v: string) => void; lang: FileExt }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const suppressRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  onChangeRef.current = onChange;
  valueRef.current = value;

  useEffect(() => {
    let disposed = false;
    loadMonaco().then(monaco => {
      if (disposed || !hostRef.current) return;
      monacoRef.current = monaco;
      const editor = monaco.editor.create(hostRef.current, {
        value: valueRef.current,
        language: MONACO_LANG[lang],
        theme: 'handbook-dark',
        automaticLayout: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 22,
        fontLigatures: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        padding: { top: 14, bottom: 14 },
        glyphMargin: false,
        folding: true,
        lineNumbersMinChars: 3,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      });
      editor.onDidChangeModelContent(() => {
        if (!suppressRef.current) onChangeRef.current(editor.getValue());
      });
      editorRef.current = editor;
      setStatus('ready');
    }).catch(() => { if (!disposed) setStatus('error'); });
    return () => {
      disposed = true;
      const editor = editorRef.current;
      if (editor) {
        const model = editor.getModel();
        editor.dispose();
        model?.dispose();
      }
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, []);

  // Sync content changes coming from outside the editor (template load / reset).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.getValue() === value) return;
    suppressRef.current = true;
    editor.setValue(value);
    suppressRef.current = false;
  }, [value]);

  // Sync language when switching to a file with a different extension.
  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (monaco && model) monaco.editor.setModelLanguage(model, MONACO_LANG[lang]);
  }, [lang]);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      {status !== 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E2E4E', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none' }}>
          {status === 'error' ? 'Editor failed to load' : 'Loading editor…'}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `f${++_uid}`;

export default function BackendPlayground() {
  const [mode, setMode] = useState<PlaygroundMode>('nodejs');
  const [activeTemplate, setActiveTemplate] = useState<Record<PlaygroundMode, string>>({
    nodejs: 'event_loop', sql: 'window_functions', api: 'rest_patterns', architecture: 'cqrs',
  });
  const [filesByMode, setFilesByMode] = useState<Record<PlaygroundMode, PlayFile[]>>({
    nodejs:       NODEJS_TEMPLATES.event_loop.files.map(f => ({ ...f })),
    sql:          SQL_TEMPLATES.window_functions.files.map(f => ({ ...f })),
    api:          API_TEMPLATES.rest_patterns.files.map(f => ({ ...f })),
    architecture: ARCHITECTURE_TEMPLATES.cqrs.files.map(f => ({ ...f })),
  });
  const [activeFileId, setActiveFileId] = useState<Record<PlaygroundMode, string>>({
    nodejs: 'main', sql: 'main', api: 'main', architecture: 'main',
  });
  const [srcDoc, setSrcDoc] = useState('');
  const [console_, setConsole] = useState<ConsoleMsg[]>([]);
  const [autoRun, setAutoRun] = useState(true);
  const [layout, setLayout] = useState<'split' | 'code' | 'preview'>('split');
  const [showConsole, setShowConsole] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastDocRef = useRef<string>('');
  const runSeqRef = useRef(0);

  const files = filesByMode[mode];
  const curActiveId = activeFileId[mode];
  const activeFile = files.find(f => f.id === curActiveId) ?? files[0];

  const setFiles = useCallback((fn: (prev: PlayFile[]) => PlayFile[]) => {
    setFilesByMode(prev => ({ ...prev, [mode]: fn(prev[mode]) }));
  }, [mode]);

  const setActive = useCallback((id: string) => {
    setActiveFileId(prev => ({ ...prev, [mode]: id }));
  }, [mode]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== '__console__') return;
      setConsole(prev => [...prev.slice(-99), {
        type: e.data.method as ConsoleMsg['type'],
        text: e.data.args,
        time: new Date().toLocaleTimeString('en', { hour12: false }),
      }]);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const run = useCallback((force = false) => {
    const f = filesByMode[mode];
    const aid = activeFileId[mode];
    let doc = '';
    if (mode === 'nodejs') doc = buildNodeDoc(f);
    else if (mode === 'sql') doc = buildSqlDoc(f, aid);
    else if (mode === 'api') doc = buildApiDoc(f, aid);
    else doc = buildArchDoc(f, aid);
    // Skip no-op runs so the console isn't wiped when the source hasn't changed.
    if (!force && doc === lastDocRef.current) return;
    lastDocRef.current = doc;
    setConsole([]);
    // Force runs bump a sequence comment so React reloads the iframe even for identical source.
    setSrcDoc(force ? `${doc}\n<!--run-${++runSeqRef.current}-->` : doc);
  }, [mode, filesByMode, activeFileId]);

  useEffect(() => {
    if (!autoRun) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(false), 800);
    return () => clearTimeout(debounceRef.current);
  }, [filesByMode, activeFileId, autoRun, run]);

  useEffect(() => { run(true); }, [mode]);

  const loadTemplate = (key: string) => {
    const t = ALL_TEMPLATES[mode][key];
    setFilesByMode(prev => ({ ...prev, [mode]: t.files.map(f => ({ ...f })) }));
    setActiveTemplate(prev => ({ ...prev, [mode]: key }));
    setActive(t.files[0]?.id ?? 'main');
    setConsole([]);
    setShowTemplates(false);
  };

  const resetTemplate = () => loadTemplate(activeTemplate[mode]);

  const updateFileContent = useCallback((content: string) => {
    setFiles(fs => fs.map(f => f.id === activeFile?.id ? { ...f, content } : f));
  }, [activeFile?.id, setFiles]);

  const addFile = (f: PlayFile) => { setFiles(fs => [...fs, f]); setActive(f.id); };
  const deleteFile = (id: string) => {
    if (files.length <= 1) return;
    setFiles(fs => fs.filter(f => f.id !== id));
    if (curActiveId === id) setActive(files.find(f => f.id !== id)?.id ?? '');
  };

  const copyCode = () => {
    const text = files.map(f => `// ── ${f.name}.${f.ext} ──\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const currentMode = MODE_TABS.find(t => t.id === mode)!;
  const templates = ALL_TEMPLATES[mode];
  const currentTemplateLabel = templates[activeTemplate[mode]]?.label ?? '';

  const CONSOLE_COLORS: Record<ConsoleMsg['type'], string> = {
    log: '#CDD6F4', error: '#F87171', warn: '#FBBF24', info: '#93C5FD',
  };

  return (
    <div className="pg-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0F', fontFamily: 'Inter, sans-serif', overflow: 'hidden', color: '#F0F0F8' }}>

      {showNewFile && (
        <NewFileDialog onAdd={addFile} onClose={() => setShowNewFile(false)} existingNames={files.map(f => f.name)} />
      )}

      {/* ── Toolbar ── */}
      <div className="pg-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderBottom: '1px solid #1E1E35', background: '#0F0F1A', flexShrink: 0, flexWrap: 'wrap' }}>

        {/* Mode tabs */}
        <div className="pg-tabs" style={{ display: 'flex', background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '9px', padding: '3px', gap: '2px' }}>
          {MODE_TABS.map(tab => (
            <button key={tab.id} title={tab.desc} onClick={() => { setMode(tab.id); setShowTemplates(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', background: mode === tab.id ? '#1E1E35' : 'transparent', color: mode === tab.id ? tab.color : '#555570', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <tab.icon size={11} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="pg-sep" style={{ width: '1px', height: '20px', background: '#1E1E35' }} />

        {/* Template selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTemplates(s => !s)} style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '7px', padding: '6px 12px', fontSize: '12px', color: '#8888AA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
            <BookOpen size={12} /> {currentTemplateLabel} <ChevronDown size={11} />
          </button>
          {showTemplates && (
            <div className="pg-dropdown" style={{ position: 'absolute', top: '34px', left: 0, zIndex: 100, background: '#12121E', border: '1px solid #1E1E35', borderRadius: '10px', minWidth: '220px', maxWidth: '320px', maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {Object.entries(templates).map(([key, t]) => (
                <button key={key} onClick={() => loadTemplate(key)} style={{ display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', color: key === activeTemplate[mode] ? currentMode.color : '#8888AA', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderBottom: '1px solid #1E1E35' }}>
                  <span style={{ fontWeight: 500 }}>{t.label}</span>
                  <span style={{ fontSize: '11px', color: '#50507a', marginTop: '1px' }}>{t.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pg-sep" style={{ width: '1px', height: '20px', background: '#1E1E35' }} />

        {/* Run */}
        <button onClick={() => run(true)} style={{ background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)', border: 'none', borderRadius: '7px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#0A0A0F', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Inter, sans-serif' }}>
          <Play size={11} /> Run
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#555570', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)} style={{ accentColor: '#C9A84C', cursor: 'pointer' }} /> Auto
        </label>

        <div style={{ flex: 1 }} />

        {/* Layout */}
        <div style={{ display: 'flex', gap: '3px', background: '#12121E', border: '1px solid #1E1E35', borderRadius: '7px', padding: '3px' }}>
          {([['split', 'Split', Code], ['code', 'Code', Code], ['preview', 'Preview', Eye]] as const).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setLayout(k as any)} style={{ padding: '4px 9px', borderRadius: '5px', fontSize: '11px', border: 'none', cursor: 'pointer', background: layout === k ? '#1E1E35' : 'transparent', color: layout === k ? '#F0F0F8' : '#555570', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon size={10} /> {l}
            </button>
          ))}
        </div>

        {/* Console toggle */}
        <button onClick={() => setShowConsole(s => !s)} style={{ background: showConsole ? 'rgba(201,168,76,0.1)' : 'transparent', border: `1px solid ${showConsole ? 'rgba(201,168,76,0.3)' : '#1E1E35'}`, borderRadius: '7px', padding: '5px 10px', fontSize: '11px', color: showConsole ? '#C9A84C' : '#555570', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif' }}>
          <Terminal size={11} />
          {console_.length > 0 && <span style={{ background: console_.some(m => m.type === 'error') ? '#F87171' : '#C9A84C', color: '#0A0A0F', borderRadius: '99px', padding: '0 4px', fontSize: '9px', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>{console_.length}</span>}
        </button>

        <button onClick={resetTemplate} title="Reset to template" style={{ background: 'transparent', border: '1px solid #1E1E35', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', color: '#555570' }}>
          <RotateCcw size={12} />
        </button>

        <button onClick={copyCode} title="Copy all files" style={{ background: 'transparent', border: '1px solid #1E1E35', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', color: copied ? '#22C55E' : '#555570' }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      {/* ── Main area ── */}
      <div className={`pg-main pg-main-${layout}`} style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Editor panel ── */}
        {layout !== 'preview' && (
          <div className="pg-pane pg-pane-editor" style={{ width: layout === 'code' ? '100%' : '50%', display: 'flex', flexDirection: 'column', borderRight: layout !== 'code' ? '1px solid #1E1E35' : 'none' }}>

            {/* File tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E1E35', background: '#0F0F1A', overflowX: 'auto', flexShrink: 0 }}>
              {files.map(f => (
                <div key={f.id} onClick={() => setActive(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', borderBottom: `2px solid ${curActiveId === f.id ? EXT_COLORS[f.ext] : 'transparent'}`, color: curActiveId === f.id ? EXT_COLORS[f.ext] : '#555570', background: curActiveId === f.id ? `${EXT_COLORS[f.ext]}08` : 'transparent', flexShrink: 0, userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <FileCode size={11} />
                  <span>{f.name}.{f.ext}</span>
                  {files.length > 1 && (
                    <span onClick={e => { e.stopPropagation(); deleteFile(f.id); }} style={{ marginLeft: '2px', opacity: 0.4, cursor: 'pointer', lineHeight: 1, fontSize: '14px' }}>×</span>
                  )}
                </div>
              ))}
              <button onClick={() => setShowNewFile(true)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#555570', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}>
                <Plus size={13} /> New file
              </button>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {activeFile && (
                <CodeEditor lang={activeFile.ext} value={activeFile.content} onChange={updateFileContent} />
              )}
            </div>
          </div>
        )}

        {/* ── Preview + Console ── */}
        {layout !== 'code' && (
          <div className="pg-pane pg-pane-preview" style={{ flex: layout === 'preview' ? 1 : undefined, width: layout !== 'preview' ? '50%' : undefined, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Mode-specific hint bar */}
            <div className="pg-hint" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: `${currentMode.color}08`, borderBottom: `1px solid ${currentMode.color}20`, fontSize: '12px', color: '#9090b8', flexShrink: 0 }}>
              <currentMode.icon size={12} color={currentMode.color} />
              <span style={{ color: currentMode.color, fontWeight: 600 }}>{currentMode.label}</span>
              <span>—</span>
              <span>{currentMode.desc}</span>
            </div>

            {/* Preview */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
              <iframe title="preview" srcDoc={srcDoc} sandbox="allow-scripts allow-same-origin" style={{ width: '100%', height: '100%', border: 'none', background: '#08080f' }} />
            </div>

            {/* Console */}
            {showConsole && (
              <div className="pg-console" style={{ height: '200px', flexShrink: 0, borderTop: '1px solid #1E1E35', display: 'flex', flexDirection: 'column', background: '#060608' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 14px', borderBottom: '1px solid #1E1E35', background: '#0A0A0F', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: '#555570' }}>
                    <Terminal size={11} /> Output
                    {console_.some(m => m.type === 'error') && (
                      <span style={{ color: '#F87171', fontSize: '10px' }}>{console_.filter(m => m.type === 'error').length} error{console_.filter(m => m.type === 'error').length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <button onClick={() => setConsole([])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555570', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>Clear</button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                  {console_.length === 0
                    ? <div style={{ padding: '8px 14px', fontSize: '12px', color: '#2E2E4E', fontFamily: 'JetBrains Mono, monospace' }}>Hit Run to see output…</div>
                    : console_.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '2px 14px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', alignItems: 'flex-start' }}>
                        <span style={{ color: '#2E2E4E', flexShrink: 0, fontSize: '10px', paddingTop: '2px' }}>{msg.time}</span>
                        <span style={{ color: msg.type === 'error' ? '#F87171' : msg.type === 'warn' ? '#FBBF24' : msg.type === 'info' ? '#93C5FD' : '#555570', flexShrink: 0, fontSize: '10px', paddingTop: '2px', textTransform: 'uppercase', fontWeight: 700 }}>{msg.type}</span>
                        <span style={{ color: CONSOLE_COLORS[msg.type], wordBreak: 'break-all', lineHeight: 1.6 }}>{msg.text}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
