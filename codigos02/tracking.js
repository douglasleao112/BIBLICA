(() => {
  'use strict';
  const endpoint = 'https://script.google.com/macros/s/AKfycbyhwNWEO86s5XFk8Um-hpZGvqo9wDZYU6mm6uFFYqOw5gVNci3Jj7mgDsSeNYk6ULiqQg/exec';
  const funnel = 'codigos02';
  const idKey = 'codigo4_browser_id_v1';
  const paramsKey = 'codigo4_campaign_v1';
  const allowed = key => /^utm_[a-z0-9_]+$/i.test(key) || ['fbclid', 'gclid', 'ttclid', 'msclkid', 'sck', 'src'].includes(key.toLowerCase());
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  let browserId = read(idKey, '');
  if (!/^[a-z0-9-]{16,80}$/i.test(browserId)) {
    browserId = window.crypto?.randomUUID?.() || `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    write(idKey, browserId);
  }
  const campaign = read(paramsKey, {});
  for (const [key, value] of new URLSearchParams(location.search)) if (allowed(key) && value) campaign[key.toLowerCase()] = value.slice(0, 300);
  write(paramsKey, campaign);
  const ua = navigator.userAgent || '';
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Outro';
  const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|iphone|android/i.test(ua) ? 'Telemóvel' : 'Computador';
  const visit = new Date();
  const pad = n => String(n).padStart(2, '0');
  const visitDate = `${pad(visit.getDate())}/${pad(visit.getMonth() + 1)}/${visit.getFullYear()}`;
  const visitTime = `${pad(visit.getHours())}h${pad(visit.getMinutes())}`;
  let geo = {};
  let sequence = 0;
  function emit(event, fields = {}) {
    const payload = JSON.stringify({ browserId, funnel, userAgent: ua, webdriver: navigator.webdriver === true, event, sequence: ++sequence, visitDate, visitTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '', device, os,
      landingUrl: location.href.slice(0, 1500), referrer: (document.referrer || '').slice(0, 1000),
      campaign, geo, fields });
    try {
      fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: payload, keepalive: true }).catch(() => {});
    } catch {}
  }
  function exit(event, fields = {}) {
    const payload = JSON.stringify({ browserId, funnel, userAgent: ua, webdriver: navigator.webdriver === true, event, sequence: ++sequence, visitDate, visitTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '', device, os,
      landingUrl: location.href.slice(0, 1500), referrer: (document.referrer || '').slice(0, 1000), campaign, geo, fields });
    try {
      if (navigator.sendBeacon?.(endpoint, new Blob([payload], { type: 'text/plain' }))) return;
      fetch(endpoint, { method: 'POST', mode: 'no-cors', body: payload, keepalive: true }).catch(() => {});
    } catch {}
  }
  window.CODIGO4_TRACKER = { emit, exit, campaign, browserId, setGeo(value) { geo = value; emit('geo'); }, checkoutUrl(base) {
    const url = new URL(base, location.href);
    for (const [key, value] of Object.entries(campaign)) if (allowed(key) && value) url.searchParams.set(key, value);
    return url.href;
  } };
  emit('visit');
})();
