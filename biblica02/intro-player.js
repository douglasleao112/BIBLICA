(() => {
  'use strict';
  const box = document.querySelector('.intro-player');
  if (!box) return;
  const onlineCount = box.querySelector('[data-intro-online-count]');
  let simulatedOnline = 324;
  const changeSimulatedOnline = () => {
    const amount = 3 + Math.floor(Math.random() * 3);
    let direction = Math.random() < .6 ? 1 : -1;
    if (simulatedOnline + amount > 401) direction = -1;
    if (simulatedOnline - amount < 324) direction = 1;
    simulatedOnline += direction * amount;
    onlineCount.textContent = simulatedOnline;
    setTimeout(changeSimulatedOnline, 4000 + Math.random() * 3000);
  };
  setTimeout(changeSimulatedOnline, 4000 + Math.random() * 3000);
  const video = box.querySelector('video');
  const soundButton = document.createElement('button');
  soundButton.type = 'button';
  soundButton.className = 'intro-enable-sound';
  soundButton.textContent = 'Toque para escutar';
  soundButton.hidden = true;
  box.appendChild(soundButton);
  // Temporary test: set to true to restore the pause button and tap-to-pause.
  const allowUserPause = false;
  box.classList.toggle('pause-disabled', !allowUserPause);
  // Keep the original space and the same video element when floating.
  const playerSlot = document.createElement('div');
  playerSlot.className = 'intro-player-slot';
  box.before(playerSlot);
  document.body.appendChild(box);
  box.classList.add('intro-player-portal');
  let playerOutside = false;
  let ignorePlayerClickUntil = 0;
  let intentionalPause = false;
  let pauseRecoveryUsed = false;
  const syncFloating = () => {
    const rect = playerSlot.getBoundingClientRect();
    playerOutside = rect.bottom <= 0;
    const floating = playerOutside && started && !ended;
    box.classList.toggle('is-floating', floating);
    if (floating) {
      for (const property of ['top', 'left', 'width', 'height']) box.style.removeProperty(property);
    } else {
      // Document coordinates scroll naturally with the hero, without fixed-position lag.
      box.style.top = `${rect.top + window.scrollY}px`;
      box.style.left = `${rect.left + window.scrollX}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    }
  };
  const gate = box.querySelector('.intro-gate');
  const overlay = box.querySelector('.intro-overlay');
  const controls = box.querySelector('.intro-controls');
  const resume = box.querySelector('[data-intro-resume]');
  const speed = box.querySelector('[data-intro-speed]');
  const bar = box.querySelector('.intro-progress i');
  const key = 'biblica-intro2-v1';
  const mainVideoSrc = video.dataset.mainSrc || '';
  let mainVideoLoaded = !mainVideoSrc;
  // Every page visit opens with the muted preview, never a saved paused session.
  let started = false;
  let ended = false;
  let position = 0;
  let lastSecond = -1;
  const unlockContent = () => document.body.classList.add('intro-content-unlocked');
  // A click starts the full video once per page visit.
  let pageStartDone = false;
  const persist = () => { try { localStorage.setItem(key, JSON.stringify({started, ended, time:position, pageStartDone})); } catch {} };
  const state = value => {
    box.dataset.state = value;
    syncFloating();
    if (value === 'playing' && started) {
      pageStartDone = true;
      persist();
    }
    gate.hidden = value !== 'ready';
    overlay.hidden = value !== 'paused' && value !== 'ended';
    controls.hidden = value !== 'playing';
    soundButton.hidden = value !== 'playing' || !video.muted;
    resume.hidden = value === 'ended';
    box.querySelector('[data-intro-message]').textContent = value === 'ended' ? 'Chegaste ao final do vídeo.' : 'Continua a ver o vídeo.';
  };
  const playFrom = async (time, audible = true) => {
    intentionalPause = false;
    pauseRecoveryUsed = false;
    if (!mainVideoLoaded) {
      video.pause();
      video.src = mainVideoSrc;
      video.load();
      mainVideoLoaded = true;
    }
    started = true; ended = false; position = time;
    video.loop = false; video.muted = !audible;
    if (video.readyState < 1) {
      video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(time, Math.max(0, video.duration - .25)); }, {once:true});
    } else video.currentTime = Math.min(time, Math.max(0, video.duration - .25));
    persist();
    try {
      await video.play();
      // Muted preview may already be playing, so no new "play" event is emitted.
      if (!video.paused && !video.ended) state('playing');
    } catch { state('paused'); }
  };
  gate.addEventListener('click', () => playFrom(0));
  box.addEventListener('click', event => {
    // A touch-scroll can emit a synthetic click after starting playback.
    if (performance.now() < ignorePlayerClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  resume.addEventListener('click', () => playFrom(position));
  box.querySelector('[data-intro-restart]').addEventListener('click', () => playFrom(0));
  const pauseIntentionally = () => {
    if (!allowUserPause) return;
    intentionalPause = true;
    video.pause();
  };
  box.querySelector('[data-intro-pause]').addEventListener('click', pauseIntentionally);
  box.addEventListener('click', event => {
    // Buttons keep their own actions without toggling playback a second time.
    if (event.target.closest('button')) return;
    if (!started || ended) playFrom(0);
    else if (video.paused) playFrom(position);
    else pauseIntentionally();
  });
  const enableSound = async () => {
    if (!started || ended || !video.muted) return;
    video.muted = false;
    try {
      await video.play();
      state('playing');
    } catch {
      // Preserve uninterrupted playback when a browser rejects audible media.
      video.muted = true;
      try { await video.play(); state('playing'); } catch { state('paused'); }
    }
  };
  soundButton.addEventListener('click', enableSound);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-intro-pause], [data-intro-speed], [data-intro-restart]')) return;
    // The first genuine tap anywhere on the page replaces the looping preview
    // with the complete video. Keeping this on `click` avoids treating a swipe
    // used to scroll the page as an intent to start playback on mobile.
    if (!started) {
      playFrom(0);
      return;
    }
    if (started && video.muted) enableSound();
  });
  speed.addEventListener('click', () => {
    const speeds = [1, 1.2, 1.5];
    video.playbackRate = speeds[(speeds.indexOf(video.playbackRate) + 1) % speeds.length];
    speed.textContent = `${video.playbackRate.toFixed(1)}x`;
  });
  video.addEventListener('play', () => { if (started) state('playing'); });
  video.addEventListener('pause', () => {
    if (!started || video.ended || ended) return;
    // Recover one unsolicited pause without overriding a user's pause or retrying forever.
    if (!intentionalPause && !document.hidden && !pauseRecoveryUsed) {
      pauseRecoveryUsed = true;
      syncFloating();
      video.play().then(() => {
        if (!video.paused) state('playing');
      }).catch(() => {
        position = video.currentTime; persist(); state('paused');
        box.querySelector('[data-intro-message]').textContent = 'Toca para continuar com som.';
      });
      return;
    }
    position = video.currentTime; persist(); state('paused');
  });
  video.addEventListener('timeupdate', () => {
    if (!started || ended) return;
    const time = video.currentTime, duration = video.duration || 0;
    if (time >= 134) unlockContent();
    // Preserve the reference player's accelerated visual progress.
    const percent = time <= 30 ? time / 30 * 50 : time <= 60 ? 50 + (time - 30) / 30 * 25 : 75 + (duration > 60 ? (time - 60) / (duration - 60) * 25 : 25);
    bar.style.width = `${Math.min(100, percent)}%`;
    position = time;
    if (Math.floor(time) !== lastSecond) { lastSecond = Math.floor(time); persist(); }
  });
  video.addEventListener('ended', () => { unlockContent(); ended = true; position = 0; persist(); bar.style.width = '100%'; state('ended'); });
  video.addEventListener('error', () => { unlockContent(); state('paused'); box.querySelector('[data-intro-message]').textContent = 'Não foi possível carregar o vídeo. Tenta novamente.'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  window.addEventListener('pagehide', persist);
  state(ended ? 'ended' : started ? 'paused' : 'ready');
  window.addEventListener('scroll', () => {
    ignorePlayerClickUntil = performance.now() + 450;
    syncFloating();
  }, { passive: true });
  window.addEventListener('resize', syncFloating, { passive: true });
  if ('ResizeObserver' in window) {
    const layoutObserver = new ResizeObserver(syncFloating);
    layoutObserver.observe(playerSlot);
    layoutObserver.observe(playerSlot.parentElement);
  }
  window.addEventListener('load', syncFloating, { once: true });
  document.fonts?.ready.then(syncFloating);
  window.visualViewport?.addEventListener('resize', syncFloating, { passive: true });
  let dragY = null;
  let pointerOrigin = null;
  box.addEventListener('pointerdown', event => { pointerOrigin = { x: event.clientX, y: event.clientY }; }, { passive: true });
  document.addEventListener('pointermove', event => {
    if (pointerOrigin && Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 8) ignorePlayerClickUntil = performance.now() + 1000;
  }, { passive: true });
  document.addEventListener('pointerup', () => { pointerOrigin = null; }, { passive: true });
  document.addEventListener('pointercancel', () => { pointerOrigin = null; }, { passive: true });
  document.addEventListener('touchstart', event => { dragY = event.touches[0]?.clientY ?? null; }, { passive: true });
  document.addEventListener('touchmove', event => {
    if (dragY !== null && Math.abs((event.touches[0]?.clientY ?? dragY) - dragY) > 10) ignorePlayerClickUntil = performance.now() + 1000;
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const playerObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      playerOutside = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
      syncFloating();
    }, { threshold: 0 });
    playerObserver.observe(playerSlot);
  }
  if (ended) bar.style.width = '100%';
  if (!started) {
    video.muted = true; video.loop = true; video.play().catch(() => {});
  }
})();
