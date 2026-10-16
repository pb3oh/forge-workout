/* BETA FIT service worker - offline start only.
   - Caches the app shell (page, manifest, icons) so the app opens with no signal. All workout data already lives in localStorage.
   - Navigations are NETWORK-FIRST (revalidated, 3.5 s timeout) and only fall back to the cached shell when the network is unavailable,
     so a new deploy is picked up exactly as it was before the service worker existed.
   - It never answers requests that carry a query string (the in-app update check fetches 'index.html?v=<time>' with no-store) nor any
     cross-origin request (the groups API), so the "New version available" banner and all API calls behave exactly as without it.
   Keep VERSION equal to BUILD in index.html (the regression test checks it). */
const VERSION = '2026.10.15-14';
const CACHE = 'betafit-shell-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const NAV_TIMEOUT_MS = 3500;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 'reload' bypasses the HTTP cache so a fresh install never stores a stale page
    const get = async (u, must) => { try { const r = await fetch(new Request(u, { cache: 'reload' })); if (r.ok) await c.put(u, r); else if (must) throw new Error('shell fetch ' + r.status); } catch (err) { if (must) throw err; } };
    await Promise.all(SHELL.map(u => get(u, u === './' || u === 'index.html')));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('betafit-shell-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const shellFallback = async () => (await caches.match('index.html', { ignoreSearch: true })) || (await caches.match('./', { ignoreSearch: true }));

async function navigate(req) {
  const c = await caches.open(CACHE);
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), NAV_TIMEOUT_MS);
    let r;
    try { r = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', signal: ctl.signal }); } finally { clearTimeout(t); }
    if (r && r.ok) { const u = new URL(req.url); c.put(u.search ? u.pathname : req.url, r.clone()).catch(() => {}); return r; } // keep the newest shell for the next offline start
    const fb = await shellFallback(); return fb || r; // server error page: prefer our own copy
  } catch (err) {
    const fb = await shellFallback(); if (fb) return fb;
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0b0b0d;color:#fff;padding:32px"><h2>BETA FIT is offline</h2><p>Open it once with a connection and it will start without signal next time.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return; // API + any third party: untouched
  if (req.mode === 'navigate') { e.respondWith(navigate(req)); return; }
  if (u.search) return; // '?v=' update checks and anything parameterised: straight to the network
  const name = u.pathname.split('/').pop() || '';
  if (!SHELL.includes(name) || name === 'sw.js') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()).catch(() => {}); return r; });
    if (hit) { net.catch(() => {}); return hit; } // stale-while-revalidate for manifest / icons
    return net;
  })());
});
