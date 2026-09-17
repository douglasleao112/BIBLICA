window.BENCAO_TRACKER = (() => {
  const ENDPOINT = window.BENCAO_TRACKING_ENDPOINT || '';
  const GEO_URL = 'https://ipapi.co/json/';
  const BROWSER_KEY = 'bencao_browser_id_v1';
  const SESSION_KEY = 'bencao_session_id_v1';
  const SESSION_TIME_KEY = 'bencao_session_time_v1';
  const landing = pageUrl();
  const referrer = document.referrer || '';
  const params = new URLSearchParams(location.search);

  function uuid() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  function stored(storage, key, create) {
    try {
      let value = storage.getItem(key);
      if (!value) { value = create(); storage.setItem(key, value); }
      return value;
    } catch { return create(); }
  }

  function safeStorage(name) {
    try { return window[name]; } catch { return null; }
  }

  const browserId = stored(safeStorage('localStorage'), BROWSER_KEY, uuid);
  const sessionId = stored(safeStorage('sessionStorage'), SESSION_KEY, uuid);
  const sessionStartedAt = stored(safeStorage('sessionStorage'), SESSION_TIME_KEY, () => new Date().toISOString());

  function pageUrl() {
    if (location.protocol === 'file:') return `arquivo-local:${location.pathname.split('/').pop()}`;
    return `${location.origin}${location.pathname}`;
  }

  function device() {
    const ua = navigator.userAgent || '';
    const os = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Outro';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /CriOS\//.test(ua) ? 'Chrome iOS' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Outro';
    const deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : /iPhone/i.test(ua) ? 'iPhone' : /Android.*Mobile/i.test(ua) ? 'Android telefone' : /Mobile/i.test(ua) ? 'telefone' : 'computador';
    return { os, browser, device_type: deviceType };
  }

  function metadata() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const attribution = {};
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','gclid','gbraid','wbraid','fbclid','msclkid','ttclid']) {
      attribution[key] = (params.get(key) || '').slice(0, 250);
    }
    return {
      ...attribution, ...device(), landingUrl: landing, currentUrl: pageUrl(),
      pageTitle: document.title, referrer, sessionStartedAt,
      local_date: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
      local_time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      timezone_offset: -now.getTimezoneOffset(), language: navigator.language || '',
      user_agent: navigator.userAgent || '',
      screen: `${screen.width}x${screen.height}`,
      viewport: `${innerWidth}x${innerHeight}`,
      color_scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro',
      connection_type: navigator.connection?.effectiveType || '',
      touch: navigator.maxTouchPoints > 0 ? 'sim' : 'não'
    };
  }

  function track(event, data = {}) {
    if (!ENDPOINT) return false;
    const body = JSON.stringify({ version: 1, browserId, sessionId, event, data, meta: metadata() });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }))) return true;
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, keepalive: true }).catch(() => {});
      return true;
    } catch { return false; }
  }

  let geoPromise;
  function getGeo() {
    if (!geoPromise) geoPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(GEO_URL, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return null;
        const geo = await response.json();
        return geo.error || !geo.country_code ? null : geo;
      } catch { return null; }
      finally { clearTimeout(timeout); }
    })();
    return geoPromise;
  }

  async function lookupGeo() {
    if (!ENDPOINT) return;
    const geo = await getGeo();
    if (geo) track('geo', { ip: geo.ip || '', country: geo.country_name || geo.country || '', region: geo.region || '', city: geo.city || '', geo_source: 'ipapi.co', geo_status: 'obtida' });
    else track('geo', { geo_source: 'ipapi.co', geo_status: 'indisponível' });
  }

  return { track, getGeo, lookupGeo, enabled: !!ENDPOINT };
})();
