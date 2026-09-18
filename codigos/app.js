(() => {
  'use strict';

  const config = window.CODIGO4_CONFIG;
  const app = document.querySelector('#app');
  const soundtrack = document.querySelector('#flow-soundtrack');
  const soundtrackVolume = .16;
  let soundtrackPending = false;
  const STORAGE_KEY = 'codigo4_quiz_v1';
  const steps = ['abertura', 'nome', 'área', 'cartas', 'primeiro sinal', 'nascimento', 'palma', 'análise', 'resultado'];
  const zodiacSigns = [
    { from: 120, name: 'Aquário', symbol: '♒', address: 'Aquariano' }, { from: 219, name: 'Peixes', symbol: '♓', address: 'Pisciano' },
    { from: 321, name: 'Áries', symbol: '♈', address: 'Ariano' }, { from: 420, name: 'Touro', symbol: '♉', address: 'Taurino' },
    { from: 521, name: 'Gêmeos', symbol: '♊', address: 'Geminiano' }, { from: 621, name: 'Câncer', symbol: '♋', address: 'Canceriano' },
    { from: 723, name: 'Leão', symbol: '♌', address: 'Leonino' }, { from: 823, name: 'Virgem', symbol: '♍', address: 'Virginiano' },
    { from: 923, name: 'Libra', symbol: '♎', address: 'Libriano' }, { from: 1023, name: 'Escorpião', symbol: '♏', address: 'Escorpiano' },
    { from: 1122, name: 'Sagitário', symbol: '♐', address: 'Sagitariano' }, { from: 1222, name: 'Capricórnio', symbol: '♑', address: 'Capricorniano' }
  ];
  // Draw icons as paths: Unicode pictographs can be replaced by colour emoji on mobile.
  const icon = (name, className = '') => {
    const paths = {
      amor: '<path d="M12 20.5 3.8 12.7C-1 8.1 5.1 1.8 10 5.7L12 7.4l2-1.7c4.9-3.9 11 2.4 6.2 7Z"/>',
      'trabalho-dinheiro': '<path d="m12 2 9 10-9 10-9-10Z"/><path d="M3 12h18M12 2v20"/>',
      'familia-pessoal': '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 20v-3a5 5 0 0 1 10 0v3H3Zm8 0v-3a5 5 0 0 1 10 0v3h-8"/>',
      'bem-estar': '<circle cx="12" cy="12" r="3"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5M4.9 4.9l3.5 3.5m7.2 7.2 3.5 3.5m0-14.2-3.5 3.5m-7.2 7.2-3.5 3.5"/>',
      geral: '<circle cx="12" cy="12" r="9"/><path d="m12 5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>',
      sparkle: '<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/>',
      play: '<path d="m8 4 12 8-12 8Z"/>',
      restart: '<path d="M20 11a8 8 0 1 1-2.3-5.6M20 4v7h-7"/>',
      check: '<path d="m4 12 5 5L20 6"/>',
      arrowUpRight: '<path d="M5 19 19 5M8 5h11v11"/>'
    };
    return `<svg class="vector-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.geral}</svg>`;
  };
  const analyticsEvents = new Set(['QuizStarted', 'AreaSelected', 'CardsCompleted', 'PartialDiagnosisViewed', 'HandUploaded', 'AnalysisStarted', 'ResultViewed', 'CheckoutClicked']);
  const freshState = () => ({ flowVersion: 5, step: 0, name: '', fullName: '', showPyramid: false, area: '', cards: [], birthDate: '', birthTime: '', showBirthTime: false, handPhoto: '', handPhotoWidth: 0, handPhotoHeight: 0, handLines: null, handFileName: '', handAnalysisError: '', answers: {}, analysisStartedAt: 0, analysisDone: false, videoEnded: false, fired: [] });
  let state = freshState();
  let analysisTimer = null;
  let pyramidRevealTimer = null;
  let pyramidScrollTimer = null;
  let vslObserver = null;
  let handAnalyzing = false;
  let handPhotoProcessing = false;
  let pendingHandUrl = '';
  let handScanActive = false;
  let handTraceStep = 0;
  let cardTimer = null;
  let cardPhase = 'idle';
  let spinningCardId = null;
  let cardAssetsPreloaded = false;
  const cardTilts = new Map();
  const cardFloats = new Map();
  const cardRitual = createCardRitual(config.cards.map(card => card.id));
  let geoPhrase = 'na Europa';
  const tracker = window.CODIGO4_TRACKER;
  let videoMaxSeconds = 0;
  let videoMilestone = 0;
  let videoPlaying = false;
  function trackStep() {
    tracker?.emit('step', { step: state.step + 1, name: state.fullName, area: state.area,
      cards: state.cards.join(', '), birthDate: state.birthDate, birthTime: state.birthTime,
      handUploaded: !!state.handPhoto, handLines: !!state.handLines, resultViewed: state.step === 8 });
  }
  function trackVideo(event) {
    const video = app.querySelector('#analysis-video');
    if (!video || video.loop || !Number.isFinite(video.currentTime)) return;
    videoMaxSeconds = Math.max(videoMaxSeconds, Math.floor(video.currentTime));
    const fields = { seconds: Math.floor(video.currentTime), maxSeconds: videoMaxSeconds,
      duration: Number.isFinite(video.duration) ? Math.floor(video.duration) : 0, completed: !!video.ended };
    if (event === 'video_exit') tracker?.exit(event, fields);
    else tracker?.emit(event, fields);
  }

  try {
    const cachedGeo = JSON.parse(sessionStorage.getItem('codigo4_geo_v1') || 'null');
    if (cachedGeo?.phrase && cachedGeo.expires > Date.now()) geoPhrase = cachedGeo.phrase;
  } catch { /* Mantém a localização de reserva. */ }

  try {
    const reloaded = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';
    if (reloaded) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        state = { ...freshState(), ...saved, answers: { ...saved.answers }, cards: Array.isArray(saved.cards) ? saved.cards.slice(0, 3) : [], fired: Array.isArray(saved.fired) ? saved.fired : [] };
        if (saved.flowVersion !== 5) {
          if (saved.flowVersion === 4 || saved.flowVersion === 3) {
            // As duas telas após o resultado deixam de existir; o limite abaixo leva ao resultado.
          } else if (saved.flowVersion === 2) {
            if (state.step >= 8) state.step -= 1;
          } else {
            if (state.step >= 9) state.step -= 2;
            else if (state.step >= 7) state.step = 7;
          }
          delete state.answers.momento;
          delete state.answers.necessidade;
          if (state.step === 7 && !state.analysisDone) state.analysisStartedAt = 0;
        }
        state.flowVersion = 5;
        state.step = Math.min(Math.max(Number(state.step) || 0, 0), steps.length - 1);
      }
    }
  } catch { /* A experiência continua sem armazenamento se o navegador o bloquear. */ }
  if (state.handLines && !['life', 'head', 'fate', 'heart'].every(id => Array.isArray(state.handLines[id]))) state.handLines = null;
  if ((state.step === 6 || state.step === 7) && state.handLines) handTraceStep = 4;

  function save() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Sem espaço: mantém os dados em memória nesta página. */ }
  }

  // Sessões antigas que pararam depois do envio retomam diretamente no vídeo.
  if (state.step === 6 && state.handPhoto) { state.step = 7; save(); }

  function startSoundtrack() {
    if (!soundtrack || !soundtrack.paused || soundtrackPending) return;
    soundtrackPending = true;
    soundtrack.volume = soundtrackVolume;
    Promise.resolve(soundtrack.play()).catch(() => { /* O navegador pode bloquear som antes de uma interação válida. */ }).finally(() => { soundtrackPending = false; });
  }

  function setSoundtrackDucked(ducked) {
    if (soundtrack) soundtrack.volume = ducked ? .035 : soundtrackVolume;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function displayBirthDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
  }

  function parseBirthDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return '';
    const date = `${match[3]}-${match[2]}-${match[1]}`;
    return zodiacForBirthDate(date) && date <= new Date().toLocaleDateString('sv-SE') ? date : '';
  }

  function parseBirthTime(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return '';
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  function zodiacForBirthDate(birthDate) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
    if (!parts) return null;
    const [, year, month, day] = parts.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    const monthDay = month * 100 + day;
    return zodiacSigns.filter(sign => monthDay >= sign.from).pop() || zodiacSigns[zodiacSigns.length - 1];
  }

  function highlightDiagnosis(text, phrases = []) {
    const matches = phrases.map(phrase => ({ phrase, start: text.indexOf(phrase) })).filter(match => match.start >= 0).sort((a, b) => a.start - b.start || b.phrase.length - a.phrase.length);
    let cursor = 0;
    let html = '';
    for (const match of matches) {
      if (match.start < cursor) continue;
      html += escapeHTML(text.slice(cursor, match.start));
      html += `<strong class="diagnosis-highlight">${escapeHTML(match.phrase)}</strong>`;
      cursor = match.start + match.phrase.length;
    }
    return html + escapeHTML(text.slice(cursor));
  }

  function createCardRitual(ids) {
    let previous = ids;
    const shuffle = () => {
      const order = [...ids];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      if (order.every((id, index) => id === previous[index])) order.push(order.shift());
      previous = order;
      return new Map(order.map((id, index) => [id, index - 2]));
    };
    return { fans: [shuffle(), shuffle(), shuffle()], final: shuffle() };
  }

  function track(name, extra = {}) {
    if (!analyticsEvents.has(name) || state.fired.includes(name)) return;
    state.fired.push(name);
    save();
    const detail = { event: name, ...extra };
    window.dataLayer?.push(detail);
    window.dispatchEvent(new CustomEvent('codigo4:analytics', { detail }));
  }

  function go(step) {
    if (state.step === 7 && step !== 7 && videoPlaying) { trackVideo('video_exit'); videoPlaying = false; }
    if (analysisTimer) { clearTimeout(analysisTimer); analysisTimer = null; }
    if (pyramidRevealTimer) { clearTimeout(pyramidRevealTimer); pyramidRevealTimer = null; }
    if (pyramidScrollTimer) { clearTimeout(pyramidScrollTimer); pyramidScrollTimer = null; }
    vslObserver?.disconnect();
    vslObserver = null;
    app.querySelector('#analysis-video')?.pause();
    handAnalyzing = false;
    handScanActive = false;
    handTraceStep = step === 6 && state.handLines ? 4 : 0;
    if (cardTimer) { clearTimeout(cardTimer); cardTimer = null; }
    spinningCardId = null;
    app.querySelector('#diagnosis-audio')?.pause();
    state.step = Math.min(Math.max(step, 0), steps.length - 1);
    if (state.step === 3) {
      cardPhase = state.cards.length === 3 ? 'reading' : 'dealing';
      if (cardPhase === 'dealing') startCardSequence();
    } else cardPhase = 'idle';
    save();
    trackStep();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function progress() {
    const bar = document.querySelector('#quiz-progress');
    if (!bar) return;
    const number = Math.min(state.step, steps.length - 1);
    bar.hidden = state.step === 0;
    bar.setAttribute('aria-valuenow', String(number));
    bar.querySelector('.header-progress-fill').style.width = `${Math.round(number / (steps.length - 1) * 100)}%`;
  }

  function frame(content) {
    return `<section class="screen"><div class="screen-inner">${content}</div></section>`;
  }

  function intro() {
    const today = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long' }).format(new Date());
    return frame(`<div class="intro-sigil" aria-hidden="true">${icon('sparkle')}</div><p class="eyebrow">Hoje, dia ${today}</p>
      <h1>A Janela de Convergência está aberta <span class="gold" id="geo-phrase">${escapeHTML(geoPhrase)}</span>.</h1>
      <p class="lead hero-subtitle">Descubra o que o Código dos 4 Sinais revela sobre o momento que está a viver.</p>
      <div class="actions intro-actions"><button class="primary" type="button" data-action="start">Iniciar a minha leitura personalizada <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div>
      <p class="intro-limit-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.8a2 2 0 0 1 3.4 0l8 13.5a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3l8-13.5Z"/><path d="M12 9v5"/><path d="M12 17.2h.01"/></svg><span>Uma avaliação por pessoa</span></p>`);
  }

  function cleanPlace(value) {
    if (typeof value !== 'string') return '';
    const place = value.trim();
    return place.length > 1 && place.length <= 55 && /^[\p{L}\p{M} .’'-]+$/u.test(place) ? place : '';
  }

  async function loadGeo() {
    try {
      const cached = JSON.parse(sessionStorage.getItem('codigo4_geo_v1') || 'null');
      if (cached?.phrase && cached.expires > Date.now()) {
        geoPhrase = cached.phrase;
        const target = app.querySelector('#geo-phrase');
        if (target) target.textContent = geoPhrase;
        return;
      }
    } catch { /* Continua com a consulta ou com a localização de reserva. */ }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch('https://ipapi.co/json/', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.error) return;
      const city = cleanPlace(data.city);
      tracker?.setGeo({ city, state: cleanPlace(data.region), country: cleanPlace(data.country_name) });
      let country = '';
      if (/^[A-Z]{2}$/i.test(data.country_code || '')) {
        try { country = new Intl.DisplayNames(['pt-PT'], { type: 'region' }).of(data.country_code.toUpperCase()); } catch { /* Usa o nome devolvido pela API. */ }
      }
      country = cleanPlace(country) || cleanPlace(data.country_name);
      if (!city && !country) return;
      geoPhrase = city ? `na cidade de ${city}` : `em ${country}`;
      try { sessionStorage.setItem('codigo4_geo_v1', JSON.stringify({ phrase: geoPhrase, expires: Date.now() + 12 * 60 * 60 * 1000 })); } catch {}
      const target = app.querySelector('#geo-phrase');
      if (target) target.textContent = geoPhrase;
    } catch { /* Se a localização falhar, a página mantém “na Europa”. */ }
    finally { clearTimeout(timer); }
  }

  function nameScreen() {
    return frame(`<p class="eyebrow">SINAL 1 · A LEITURA COMEÇA AGORA</p><h2>O seu primeiro e último nome nesta <em class="gold">leitura astral</em></h2>
      <p class="lead">Usaremos apenas estes dois nomes para construir a sua leitura personalizada.</p>
      <form id="name-form"><label class="field-label" for="full-name">Primeiro e último nome</label><input class="text-input" id="full-name" name="fullName" maxlength="90" autocomplete="name" placeholder="Escreva o primeiro e o último nome" value="${escapeHTML(state.fullName)}" required><div class="form-error" id="name-error" role="alert"></div><div class="actions"><button class="primary" type="submit">Continuar <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div></form>`);
  }

  function pyramidScreen() {
    const pyramid = window.CODIGO4_PYRAMID?.build(state.fullName);
    if (!pyramid) return frame('<p class="lead">Não foi possível formar a pirâmide com este nome.</p>');
    const meanings = {
      1: ['Iniciativa', 'O número final 1 convida a observar a sua autonomia e a forma como dá o primeiro passo.'],
      2: ['Relação', 'O número final 2 põe em foco a escuta, a cooperação e o equilíbrio nas relações.'],
      3: ['Expressão', 'O número final 3 destaca a criatividade e a vontade de comunicar o que sente.'],
      4: ['Estrutura', 'O número final 4 chama a atenção para bases, constância e organização.'],
      5: ['Mudança', 'O número final 5 sugere refletir sobre liberdade, movimento e adaptação.'],
      6: ['Cuidado', 'O número final 6 traz à reflexão os vínculos, o cuidado e as responsabilidades.'],
      7: ['Procura interior', 'O número final 7 favorece perguntas mais profundas e momentos de introspeção.'],
      8: ['Realização', 'O número final 8 convida a examinar objetivos, recursos e decisões práticas.'],
      9: ['Síntese', 'O número final 9 aponta para uma visão mais ampla e para o fecho de ciclos.'],
    };
    const themes = { 1: 'iniciativa', 2: 'vínculos', 3: 'expressão', 4: 'estrutura', 5: 'mudança', 6: 'cuidado', 7: 'introspeção', 8: 'realização', 9: 'síntese' };
    const [title, reading] = meanings[pyramid.final];
    const trincaStart = 4.3;
    const trincaInterval = .58;
    const finalMarkDelay = (trincaStart + pyramid.runs.length * trincaInterval + .12).toFixed(2);
    const rows = pyramid.rows.map((row, rowIndex) => `<div class="pyramid-row" style="--row-delay:${((rowIndex + 1) * 3.6 / pyramid.rows.length).toFixed(2)}s">${row.map((value, index) => {
      const runIndex = pyramid.runs.findIndex(run => run.row === rowIndex + 1 && index >= run.start && index < run.start + run.length);
      return `<span class="pyramid-cell ${runIndex >= 0 ? 'is-trinca' : ''}"${runIndex >= 0 ? ` style="--trinca-delay:${(trincaStart + runIndex * trincaInterval).toFixed(2)}s"` : ''}>${value}</span>`;
    }).join('')}</div>`).join('');
    const trincas = pyramid.runs.length
      ? pyramid.runs.map(run => `<li><strong>${run.value} × ${run.length}</strong><span>Na ${run.row}.ª linha, a repetição do ${run.value} destaca simbolicamente um tema de ${themes[run.value]}.</span></li>`).join('')
      : '<li><span>Não surgiram trincas consecutivas nesta pirâmide. A leitura segue pelo número final e pelos outros sinais.</span></li>';
    const repeatedThemes = [...new Set(pyramid.runs.map(run => themes[run.value]))].slice(0, 3);
    const repeatSummary = repeatedThemes.length
      ? `${pyramid.runs.length === 1 ? 'A trinca aponta' : 'As trincas apontam'} para ${repeatedThemes.join(', ')}.`
      : 'Sem trincas nesta sequência.';
    const diagnosis = `O seu nome converge no ${pyramid.final}: <span class="gold">${escapeHTML(title)}</span>. ${repeatSummary}`;
    return frame(`<div class="pyramid-stage"><div class="pyramid-intro"><div class="pyramid-intro-content"><p class="eyebrow">RESULTADO DO SINAL 1</p><h2>A pirâmide <em class="gold">invertida</em> cabalística.</h2>
      <p class="lead">${escapeHTML(state.name)}, o seu nome revela um número escondido.</p></div></div>
      <div class="pyramid-scroll" tabindex="0" aria-label="Pirâmide invertida; deslize na horizontal se necessário"><div class="pyramid-chart" style="--pyramid-size:${pyramid.letters.length};--final-mark-delay:${finalMarkDelay}s"><div class="pyramid-row pyramid-letters">${pyramid.letters.map(letter => `<span class="pyramid-cell">${letter}</span>`).join('')}</div>${rows}</div></div>
      <div class="pyramid-details" data-reveal-after="${(Number(finalMarkDelay) + 1).toFixed(2)}" hidden>
        <div class="pyramid-result"><span class="pyramid-number">${pyramid.final}</span><div><p class="eyebrow">O NÚMERO FINAL · ${title.toUpperCase()}</p><p>${reading}</p></div></div>
        <div class="pyramid-runs"><h3>As trincas encontradas</h3><ul>${trincas}</ul></div>
        <p class="quote">${diagnosis}</p>
        <div class="actions"><button class="primary" type="button" data-action="pyramid-next">Continuar a minha leitura <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div>
      </div></div>`);
  }

  function setupPyramidReveal() {
    if (pyramidRevealTimer) { clearTimeout(pyramidRevealTimer); pyramidRevealTimer = null; }
    if (pyramidScrollTimer) { clearTimeout(pyramidScrollTimer); pyramidScrollTimer = null; }
    const details = app.querySelector('.pyramid-details');
    if (!details) return;
    const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const scrollToResult = () => {
      pyramidScrollTimer = null;
      if (state.step !== 2 || !state.showPyramid || details.hidden) return;
      app.querySelector('.pyramid-result')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    };
    const reveal = () => {
      if (state.step !== 2 || !state.showPyramid || !details.hidden) return;
      if (pyramidRevealTimer) { clearTimeout(pyramidRevealTimer); pyramidRevealTimer = null; }
      details.hidden = false;
      details.classList.add('is-visible');
      const stage = app.querySelector('.pyramid-stage');
      stage?.classList.add('is-revealed');
      stage?.querySelector('.pyramid-intro')?.setAttribute('aria-hidden', 'true');
      // Deixar o título recolher antes de deslocar a página até ao resultado.
      if (reducedMotion) scrollToResult();
      else pyramidScrollTimer = setTimeout(scrollToResult, 760);
    };
    if (reducedMotion) { reveal(); return; }
    app.querySelector('.pyramid-chart .pyramid-row:last-child .pyramid-cell')?.addEventListener('animationend', event => {
      if (event.animationName === 'pyramidFinalMark') reveal();
    });
    pyramidRevealTimer = setTimeout(reveal, Math.ceil(Number(details.dataset.revealAfter) * 1000) + 150);
  }

  function areaScreen() {
    if (state.showPyramid) return pyramidScreen();
    return frame(`<p class="eyebrow">SINAL 1 · O QUE PROCURA</p><h2>${escapeHTML(state.name)}, <span class="gold">que área da sua vida</span> está buscando?</h2>
      <div class="choices">${config.areas.map(area => `<button class="choice" type="button" data-area="${area.id}" aria-pressed="${state.area === area.id}"><span class="choice-icon" aria-hidden="true">${icon(area.id)}</span><span>${escapeHTML(area.label)}</span><span class="choice-arrow" aria-hidden="true">${icon('arrowUpRight')}</span></button>`).join('')}</div>`);
  }

  function cardsScreen() {
    if (state.cards.length === 3) {
      for (const id of state.cards) {
        if (!cardTilts.has(id)) cardTilts.set(id, Math.round(Math.random() * 14) - 7);
        if (!cardFloats.has(id)) cardFloats.set(id, randomCardFloat());
      }
    }
    const ready = cardPhase === 'ready' || cardPhase === 'reading';
    const orderedCards = [...config.cards].sort((a, b) => cardRitual.final.get(a.id) - cardRitual.final.get(b.id));
    return frame(`${state.cards.length === 3 ? '' : '<p class="eyebrow">SINAL 2 · ESCOLHAS INTUITIVAS</p><h2>Não pense demasiado. <span class="gold">Escolha 3 cartas.</span></h2>'}
      <div class="card-table"><div class="card-deck is-${cardPhase}" role="group" aria-label="Cinco cartas; escolha três">${orderedCards.map((card, index) => { const chosen = state.cards.includes(card.id); const float = cardFloats.get(card.id) || { x: 0, y: 8, duration: 4, delay: 0 }; const fanStyles = cardRitual.fans.map((fan, cycle) => { const slot = fan.get(card.id); return `--fan-x-${cycle + 1}:${slot * 88}px;--fan-x-${cycle + 1}-mobile:${slot * 42}px;--fan-rotate-${cycle + 1}:${slot * 17}deg`; }).join(';'); return `<button class="card ${chosen ? 'chosen' : ''} ${spinningCardId === card.id ? 'is-spinning' : ''}" style="--card-index:${index};--deal-x:${(index - 2) * 26}px;--deal-rotate:${(index - 2) * 4}deg;${fanStyles};--spread-offset:${cardRitual.final.get(card.id) * 20}%;--chosen-tilt:${cardTilts.get(card.id) ?? 0}deg;--float-x:${float.x}px;--float-y:${float.y}px;--float-duration:${float.duration}s;--float-delay:${float.delay}s" type="button" data-card="${card.id}" aria-label="${chosen ? `${card.title}, carta escolhida` : 'Carta virada para baixo'}" aria-pressed="${chosen}" ${!ready || chosen || state.cards.length >= 3 ? 'disabled' : ''}><span class="card-face card-face-back" aria-hidden="true"><img src="assets/cards/tras.png" alt="" width="1024" height="1536"></span><span class="card-face card-face-front" aria-hidden="true"><img src="${card.image}" alt="" width="1024" height="1536"></span></button>`; }).join('')}</div></div>
      ${cardPhase === 'ready' ? `<p class="card-count" aria-live="polite">${state.cards.length} DE 3 CARTAS ESCOLHIDAS</p>` : ''}${cardPhase === 'reading' ? `${cardReading()}<div class="actions"><button class="primary" type="button" data-action="cards-next">Continuar a minha leitura <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div>` : ''}`);
  }

  function randomCardFloat() {
    return { x: (Math.random() < .5 ? -1 : 1) * (4 + Math.round(Math.random() * 5)), y: 7 + Math.round(Math.random() * 6), duration: (3.4 + Math.random() * 1.7).toFixed(2), delay: (-Math.random() * 3).toFixed(2) };
  }

  function cardReading() {
    const parts = state.fullName.trim().split(/\s+/u);
    const countLetters = word => [...word.normalize('NFC')].filter(character => /\p{L}/u.test(character)).length;
    const first = parts[0] || state.name;
    const last = parts.at(-1) || first;
    const diagnostic = config.diagnostics[state.area] || config.diagnostics.geral;
    const firstCount = countLetters(first);
    const lastCount = countLetters(last);
    const [firstCard, secondCard, thirdCard] = state.cards.map(id => config.cards.find(card => card.id === id)?.title || 'Carta');
    const weekday = new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(new Date());
    const weekdayArticle = ['sábado', 'domingo'].includes(weekday) ? 'neste' : 'nesta';
    return `<section class="card-reading" aria-label="Diagnóstico inicial das cartas"><p class="eyebrow">O SEU SEGUNDO SINAL</p>
      <p class="card-personal-note"><strong>${escapeHTML(state.fullName || state.name)}</strong>, <strong>${escapeHTML(firstCard)}</strong> abre a combinação do seu número simbólico <strong>${firstCount}${lastCount}</strong>: <strong>${firstCount} ${firstCount === 1 ? 'letra' : 'letras'}</strong> no primeiro nome e <strong>${lastCount}</strong> no último, numa ligação simbólica com <strong>${escapeHTML(secondCard)}</strong>. Hoje, ${weekdayArticle} <strong>${escapeHTML(weekday)}</strong>, <strong>${escapeHTML(thirdCard)}</strong> completa as suas três cartas para esta leitura ${escapeHTML(geoPhrase)}.</p>
      <div class="diagnosis-audio"><img class="diagnosis-avatar" src="assets/avatar-leitura.png" alt="Avatar da leitura" width="52" height="52"><button class="diagnosis-play" type="button" data-action="diagnosis-audio-toggle" aria-label="Reproduzir áudio do diagnóstico"><span class="audio-play-icon" aria-hidden="true"></span></button><div class="diagnosis-audio-main"><input class="diagnosis-seek" id="diagnosis-seek" type="range" min="0" max="100" value="0" aria-label="Posição do áudio"><span class="diagnosis-time" id="diagnosis-time">0:00</span></div><button class="audio-tap-badge" type="button" data-action="diagnosis-audio-toggle" aria-label="Toque para reproduzir o áudio">Toque</button><audio id="diagnosis-audio" preload="metadata" src="${escapeHTML(diagnostic.audio)}"></audio></div>
      <div class="diagnosis-reveal" aria-hidden="true"><div class="diagnosis-reveal-inner"><p class="diagnosis-text">${highlightDiagnosis(diagnostic.text, diagnostic.highlights)}</p></div></div></section>`;
  }

  function setupDiagnosisAudio() {
    const audio = app.querySelector('#diagnosis-audio');
    const seek = app.querySelector('#diagnosis-seek');
    const time = app.querySelector('#diagnosis-time');
    const button = app.querySelector('[data-action="diagnosis-audio-toggle"]');
    if (!audio || !seek || !time || !button) return;
    const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    const update = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      seek.value = duration ? String(Math.round(audio.currentTime / duration * 100)) : '0';
      time.textContent = `${clock(audio.currentTime)} / ${clock(duration)}`;
      button.classList.toggle('is-playing', !audio.paused);
      button.setAttribute('aria-label', audio.paused ? 'Reproduzir áudio do diagnóstico' : 'Pausar áudio do diagnóstico');
      const badge = app.querySelector('.audio-tap-badge');
      if (badge) badge.hidden = !audio.paused;
    };
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('play', () => {
      setSoundtrackDucked(true);
      const reading = audio.closest('.card-reading');
      reading?.classList.add('is-expanded');
      reading?.querySelector('.diagnosis-reveal')?.setAttribute('aria-hidden', 'false');
      update();
    });
    audio.addEventListener('pause', () => { setSoundtrackDucked(false); update(); });
    audio.addEventListener('ended', () => {
      setSoundtrackDucked(false);
      update();
      const continueButton = app.querySelector('[data-action="cards-next"]');
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      continueButton?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' });
    });
    audio.addEventListener('error', () => { button.disabled = true; time.textContent = 'Áudio indisponível'; });
    seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 100 * audio.duration; });
    update();
  }

  function startCardSequence() {
    cardTimer = setTimeout(() => {
      if (state.step !== 3 || cardPhase !== 'dealing') return;
      cardPhase = 'stacking'; render();
      cardTimer = setTimeout(() => {
        if (state.step !== 3 || cardPhase !== 'stacking') return;
        cardPhase = 'fanning'; render();
        cardTimer = setTimeout(() => {
          if (state.step !== 3 || cardPhase !== 'fanning') return;
          cardPhase = 'spreading'; render();
          cardTimer = setTimeout(() => {
            if (state.step !== 3 || cardPhase !== 'spreading') return;
            cardPhase = 'ready'; render(); cardTimer = null;
          }, 850);
        }, 4200);
      }, 750);
    }, 3200);
  }

  function microScreen() {
    const cards = state.cards.map(id => config.cards.find(card => card.id === id)).filter(Boolean);
    const nameParts = (state.fullName || state.name).trim().split(/\s+/u);
    const countLetters = word => [...(word || '').normalize('NFC')].filter(character => /\p{L}/u.test(character)).length;
    const symbolicNumber = `${countLetters(nameParts[0])}${countLetters(nameParts.at(-1))}`;
    return frame(`<p class="eyebrow">O SEGUNDO SINAL</p><h2>Encontrámos o seu <span class="gold">segundo sinal.</span></h2><p class="lead">As cartas que escolheu abrem três pistas simbólicas para esta leitura:</p>
      <div class="card-meanings">${cards.map(card => `<div class="card-meaning"><b>${escapeHTML(card.title)}</b><span>${escapeHTML(card.meaning)}</span></div>`).join('')}</div>
      <p class="quote micro-reveal-quote">O seu número simbólico <span class="gold">${symbolicNumber}</span> revela uma correspondência entre as suas escolhas. Este sinal está a convergir <span class="gold">${escapeHTML(geoPhrase)}</span> e merece ser cruzado com os restantes sinais.</p>
      <div class="actions micro-reveal-actions"><button class="primary" type="button" data-action="micro-next">Continuar a minha leitura <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div>`);
  }

  function birthScreen() {
    return frame(`<p class="eyebrow">SINAL 3 · ORIGEM</p><h2>O seu nascimento é <em class="gold">outra peça desta história.</em></h2><p class="lead">Indique a data de nascimento. A hora é opcional.</p>
      <form id="birth-form"><label class="field-label" for="birth-date">Data de nascimento</label><input class="text-input" id="birth-date" type="text" inputmode="numeric" autocomplete="bday" placeholder="DD/MM/AAAA" maxlength="10" required value="${escapeHTML(displayBirthDate(state.birthDate))}" aria-describedby="birth-error">
      <label class="check-row birth-time-toggle"><input id="show-birth-time" type="checkbox" aria-controls="birth-time-field" aria-expanded="${state.showBirthTime}" ${state.showBirthTime ? 'checked' : ''}> Hora de nascimento</label>
      <div id="birth-time-field" ${state.showBirthTime ? '' : 'hidden'}><label class="field-label" for="birth-time">Digite a hora de nascimento</label><input class="text-input" id="birth-time" type="text" inputmode="numeric" placeholder="HH:MM" maxlength="5" value="${escapeHTML(state.birthTime)}" ${state.showBirthTime ? '' : 'disabled'}></div>
      <div class="form-error" id="birth-error" role="alert"></div><div class="actions"><button class="primary" type="submit">Continuar <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div></form>`);
  }

  function handScreen() {
    const zodiac = zodiacForBirthDate(state.birthDate);
    const headingStart = zodiac ? `${zodiac.address}, mostre-me a` : 'Mostre-me a';
    const traceLabels = [['life', 'Linha da vida'], ['head', 'Linha da cabeça'], ['fate', 'Linha do destino'], ['heart', 'Linha do coração']];
    const dimensions = { width: state.handPhotoWidth || 800, height: state.handPhotoHeight || 800 };
    const tracePath = points => {
      const scaled = points.map(point => ({ x: Math.round(point.x * dimensions.width / 1000), y: Math.round(point.y * dimensions.height / 1000) }));
      return `M ${scaled.map(point => `${point.x} ${point.y}`).join(' L ')}`;
    };
    return frame(`<p class="eyebrow">SINAL 4 · MARCAS</p><h2>${escapeHTML(headingStart)} <span class="gold">palma da sua mão</span> para a leitura.</h2>${state.handPhoto ? '' : '<p class="lead">Para incluir as marcas da sua palma no quarto sinal, tire ou envie uma fotografia nítida da mão.</p>'}
      <label class="upload ${state.handPhoto ? 'has-photo' : ''}" for="hand-input"><input id="hand-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="${state.handPhoto ? 'Substituir fotografia da mão' : 'Tirar ou enviar fotografia da mão'}" ${handAnalyzing ? 'disabled' : ''}>${state.handPhoto ? `<img class="upload-preview" src="${state.handPhoto}" alt="Fotografia da palma da mão escolhida">${handScanActive ? '<span class="hand-scan" aria-hidden="true"></span>' : ''}${state.handLines ? `<svg class="hand-traces ${handTraceStep === 4 ? 'complete' : ''}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${traceLabels.map(([id]) => `<path class="hand-trace hand-trace-${id}" data-trace="${id}" d="${tracePath(state.handLines[id])}"/>`).join('')}</svg>` : ''}` : `<svg class="upload-icon" viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 15h9l3-4h10l3 4h9a3 3 0 0 1 3 3v20a3 3 0 0 1 3-3V18a3 3 0 0 1 3-3Z"/><circle cx="24" cy="27" r="8"/><path d="M36 21h2"/></svg><strong>Tirar ou enviar fotografia da mão</strong><small>JPG, PNG ou WebP · até 5 MB</small>`}</label>
      ${state.handLines ? `<div class="hand-checks" role="status" aria-live="polite" ${handTraceStep === 0 ? 'hidden' : ''}>${traceLabels.map(([id, label], index) => `<div class="hand-check ${handTraceStep === 4 ? state.handLines[id]?.length >= 4 ? 'done' : 'unavailable' : ''}" data-check="${id}" ${handTraceStep <= index ? 'hidden' : ''}><span class="hand-check-icon" aria-hidden="true">${state.handLines[id]?.length >= 4 ? '✓' : '—'}</span><span>${label}</span></div>`).join('')}</div>` : ''}
      <div class="form-error" id="hand-error" role="alert"></div>`);
  }

  const handSuitShapes = {
    life: '<path d="M16 2 29 16 16 30 3 16Z"/>',
    head: '<circle cx="16" cy="9" r="6"/><circle cx="9" cy="18" r="6"/><circle cx="23" cy="18" r="6"/><path d="M13 18h6l3 11H10Z"/>',
    fate: '<path d="M16 2C12 8 3 13 3 20a7 7 0 0 0 12 4l-2 5h6l-2-5a7 7 0 0 0 12-4C29 13 20 8 16 2Z"/>',
    heart: '<path d="M16 28 4.3 17C-2 10.7 4 2 11 4.2c2.3.6 4 2 5 3.8 1-1.8 2.7-3.2 5-3.8C28 2 34 10.7 27.7 17Z"/>'
  };
  const handSuitIcon = id => `<svg class="hand-suit" data-suit="${id}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${handSuitShapes[id]}</svg>`;

  function analysisScreen() {
    const labels = ['A interpretar as suas escolhas', 'A analisar o seu nascimento', 'A cruzar os seus sinais', 'A identificar correspondências', 'A procurar o seu Ponto de Convergência'];
    const handLabels = [['life', 'Linha da vida'], ['head', 'Linha da cabeça'], ['fate', 'Linha do destino'], ['heart', 'Linha do coração']];
    const dimensions = { width: state.handPhotoWidth || 800, height: state.handPhotoHeight || 800 };
    const tracePath = points => points?.length >= 4 ? `M ${points.map(point => `${Math.round(point.x * dimensions.width / 1000)} ${Math.round(point.y * dimensions.height / 1000)}`).join(' L ')}` : '';
    const handImage = state.handPhoto || pendingHandUrl;
    const handProgress = handImage ? `<div class="hand-analysis-overview"><div class="analysis-list hand-analysis-list" role="status" aria-live="polite">${handLabels.map(([id, label], index) => `<div class="analysis-item hand-analysis-item ${state.analysisDone ? state.handLines?.[id]?.length >= 4 ? 'done' : 'unavailable' : index === handTraceStep ? 'active' : ''}" data-check="${id}"><span class="analysis-tick">${state.analysisDone && !(state.handLines?.[id]?.length >= 4) ? '—' : handSuitIcon(id)}</span><span>${label}</span></div>`).join('')}</div><div class="hand-analysis-preview" aria-label="Fotografia da mão durante a leitura"><img src="${escapeHTML(handImage)}" alt="Palma da mão enviada" width="${dimensions.width}" height="${dimensions.height}">${!state.analysisDone ? '<span class="hand-scan" aria-hidden="true"></span>' : ''}<svg class="hand-traces ${state.handLines ? 'complete' : ''}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${handLabels.map(([id]) => `<path class="hand-trace hand-trace-${id}" data-trace="${id}" d="${tracePath(state.handLines?.[id])}"/>`).join('')}</svg></div></div><p id="hand-analysis-error" class="hand-analysis-error" role="alert" ${state.handAnalysisError ? '' : 'hidden'}><span>${escapeHTML(state.handAnalysisError)}</span> <button type="button" data-action="hand-retry">Tentar novamente</button><button type="button" data-action="hand-replace">Outra fotografia</button></p>` : `<div class="analysis-list">${labels.map((label, index) => `<div class="analysis-item ${state.analysisDone ? 'done' : ''}" data-analysis="${index}"><span class="analysis-tick">✓</span><span>${label}</span></div>`).join('')}</div>`;
    const videoReady = config.vslTestOpen || state.analysisDone || Boolean(handImage);
    const canContinue = state.analysisDone && (state.videoEnded || !config.videoUrl);
    return frame(`<p class="eyebrow">A CONVERGÊNCIA</p><h2>Os seus sinais estão a <span class="gold">encontrar-se.</span></h2>${handImage ? '' : '<p class="subtle">Estamos a organizar as suas respostas para apresentar uma leitura personalizada.</p>'}
      ${handProgress}
      <div class="video-box">${config.videoUrl ? `<div class="mini-vsl" data-state="ready" role="group" aria-label="Apresentação em vídeo"><video id="analysis-video" autoplay muted ${handImage ? '' : 'loop '}playsinline webkit-playsinline preload="auto" disablepictureinpicture src="${escapeHTML(config.videoUrl)}" aria-label="Mini apresentação da leitura"></video><button class="mini-vsl-gate" type="button" data-action="vsl-start" ${handImage ? 'hidden' : videoReady ? '' : 'disabled'}><strong>O seu vídeo está pronto</strong><span aria-hidden="true">▶</span><small>${videoReady ? 'Toque para escutar' : 'Disponível ao concluir a análise'}</small></button><button class="mini-vsl-sound" type="button" data-action="vsl-sound" hidden>Toque para escutar</button><div class="mini-vsl-overlay" hidden><strong>Continue a ver o vídeo.</strong><button type="button" data-action="vsl-resume">▶ Continuar a ver</button><button type="button" data-action="vsl-restart">↻ Ver desde o início</button></div><div class="mini-vsl-controls" hidden><button type="button" data-action="vsl-speed" aria-label="Alterar velocidade do vídeo">1.0x</button></div><div class="mini-vsl-progress" role="progressbar" aria-label="Progresso do vídeo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div>` : '<div class="video-placeholder"><strong>◈</strong>Vídeo indisponível. Pode avançar quando a análise terminar.</div>'}</div>
      <div id="analysis-continue" class="actions" ${canContinue ? '' : 'hidden'}><button class="primary" type="button" data-action="analysis-next">Ver o meu resultado <span aria-hidden="true">${icon('arrowUpRight')}</span></button></div>
      <p class="privacy-note analysis-privacy-note">As interpretações obtidas aqui são baseadas nas suas escolhas e respostas individuais.</p>`);
  }

  function profileResult() {
    const scores = Object.fromEntries(Object.keys(config.profiles).map(key => [key, 0]));
    function add(weights) { for (const [key, points] of Object.entries(weights || {})) if (key in scores) scores[key] += points; }
    add(config.areas.find(area => area.id === state.area)?.scores);
    state.cards.forEach(id => add(config.cards.find(card => card.id === id)?.scores));
    const top = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0] || 'geral';
    return { id: top, ...config.profiles[top] };
  }

  function reportPreviewScreen() {
    const result = profileResult();
    const fullName = state.fullName || state.name || 'Participante';
    const firstName = state.name || fullName.split(/\s+/u)[0];
    const now = new Date();
    const today = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long' }).format(now);
    const fullDate = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const zodiac = zodiacForBirthDate(state.birthDate);
    const pyramid = window.CODIGO4_PYRAMID?.build(fullName);
    const numberThemes = { 1: 'iniciativa', 2: 'relações', 3: 'expressão', 4: 'estrutura', 5: 'mudança', 6: 'cuidado', 7: 'procura interior', 8: 'realização', 9: 'síntese' };
    const totalNumbers = pyramid?.rows.reduce((total, row) => total + row.length, 0) || 0;
    const trincaText = pyramid?.runs.length
      ? pyramid.runs.slice(0, 3).map(run => `${run.value} repetido ${run.length} vezes na ${run.row}.ª linha`).join('; ')
      : 'não foram encontradas trincas consecutivas';
    const cards = state.cards.map(id => config.cards.find(card => card.id === id)).filter(Boolean);
    const cardNames = cards.map(card => card.title).join(', ') || 'nenhuma carta selecionada';
    const cardNotes = cards.map(card => `<li><strong>${escapeHTML(card.title)}</strong> — ${escapeHTML(card.meaning)}</li>`).join('');
    const futureVision = {
      amor: 'A sua visão do futuro para conquistar o amor',
      'trabalho-dinheiro': 'A sua visão do futuro para prosperar no trabalho e no dinheiro',
      'familia-pessoal': 'A sua visão do futuro para fortalecer a família e a vida pessoal',
      'bem-estar': 'A sua visão do futuro para cuidar da saúde e do bem-estar',
      geral: 'A sua visão do futuro para concretizar o que mais deseja'
    }[state.area] || 'A sua visão do futuro para concretizar os seus objetivos';
    const reportArt = index => {
      const card = cards[index];
      const title = card?.title || 'Sinal';
      return `<figure class="report-editorial-image"><img src="${escapeHTML(card?.image || 'assets/cards/tras.png')}" alt="Ilustração simbólica: ${escapeHTML(title)}" width="120" height="180" loading="lazy" decoding="async"><figcaption>${escapeHTML(title)}</figcaption></figure>`;
    };
    const handLabels = { life: 'vida', head: 'cabeça', fate: 'destino', heart: 'coração' };
    const foundLines = Object.entries(handLabels).filter(([id]) => state.handLines?.[id]?.length >= 4).map(([, label]) => label);
    const handNote = foundLines.length
      ? `A fotografia permitiu assinalar ${foundLines.length} ${foundLines.length === 1 ? 'linha' : 'linhas'}: ${foundLines.join(', ')}. São referências visuais para a leitura simbólica, não indicadores de saúde nem previsões.`
      : 'A etapa da mão não forneceu linhas suficientemente nítidas para esta prévia. Nenhuma marca foi inventada para preencher a leitura.';
    const handLineArticles = { life: 'da vida', head: 'da cabeça', fate: 'do destino', heart: 'do coração' };
    const namedLines = Object.keys(handLineArticles).filter(id => state.handLines?.[id]?.length >= 4).map(id => handLineArticles[id]);
    const lineList = namedLines.join(', ').replace(/, ([^,]*)$/, ' e $1');
    const handSummary = namedLines.length
      ? `Identificámos ${namedLines.length === 1 ? 'a linha' : 'as linhas'} ${lineList} na fotografia. Estas marcas completam o quarto sinal da leitura.`
      : 'Não foi possível distinguir as linhas da palma com nitidez. A leitura segue com os restantes sinais disponíveis.';
    const handWidth = state.handPhotoWidth || 800;
    const handHeight = state.handPhotoHeight || 800;
    const handTracePath = points => points?.length >= 4
      ? `M ${points.map(point => `${Math.round(point.x * handWidth / 1000)} ${Math.round(point.y * handHeight / 1000)}`).join(' L ')}`
      : '';
    const handArt = state.handPhoto
      ? `<figure class="report-editorial-image report-editorial-hand"><img src="${escapeHTML(state.handPhoto)}" alt="Fotografia da palma enviada para a leitura" width="${handWidth}" height="${handHeight}" loading="lazy" decoding="async"><svg class="hand-traces complete" viewBox="0 0 ${handWidth} ${handHeight}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${Object.keys(handLineArticles).map(id => `<path class="hand-trace hand-trace-${id}" d="${handTracePath(state.handLines?.[id])}"/>`).join('')}</svg><figcaption>PALMA DA MÃO</figcaption></figure>`
      : '<figure class="report-editorial-image report-editorial-hand"><div class="report-hand-placeholder">Fotografia da mão indisponível</div><figcaption>PALMA DA MÃO</figcaption></figure>';
    const lock = '<span class="report-lock" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="14" width="18" height="14" rx="3"/><path d="M11 14V9a5 5 0 0 1 10 0v5"/><circle cx="16" cy="21" r="1"/></svg><span>Conteúdo bloqueado</span></span>';
    return frame(`<p class="eyebrow">RESULTADO DA SUA LEITURA</p><h2>O seu diagnóstico <span class="gold">convergente está pronto.</span></h2>
      <p class="lead">${escapeHTML(firstName)}, os seus sinais foram reunidos numa prévia da sua análise pessoal.</p>
      <div class="report-stack" role="region" tabindex="0" aria-label="Prévia da análise em três folhas; deslize para ver as demais páginas">
        <article class="report-sheet report-sheet-first" aria-label="Folha 1 de 3, prévia parcialmente bloqueada"><div class="report-sheet-content">
          <div class="report-sheet-top"><span>CÓDIGO DOS 4 SINAIS</span><span>01 / 03</span></div><h3>A leitura ${zodiac ? `do ${escapeHTML(zodiac.address)} ` : 'de '}${escapeHTML(fullName)}</h3><p class="report-sheet-date">${escapeHTML(fullDate)} · análise pessoal</p>
          <div class="report-editorial report-editorial-main">${handArt}<div class="report-editorial-copy"><span class="report-editorial-kicker">O QUARTO SINAL</span><strong>As linhas da sua palma</strong><p>${escapeHTML(handSummary)}</p><span class="report-editorial-index">SINAL 04 / 04</span></div></div><div class="report-future-vision"><span>VISÃO DO FUTURO</span><strong>${escapeHTML(futureVision)}</strong></div><div class="report-sheet-rule"></div>
          <div class="report-locked-lines" aria-hidden="true"><span class="report-faux-heading"></span><span></span><span></span><span class="short"></span><span class="report-faux-heading"></span><span></span><span></span><span></span><span class="short"></span><span class="report-faux-heading"></span><span></span><span></span><span class="short"></span></div>
        </div><div class="report-sheet-fog" aria-hidden="true"></div>${lock}</article>
        <article class="report-sheet report-sheet-second" aria-label="Folha 2 de 3, conteúdo bloqueado"><div class="report-sheet-content"><div class="report-sheet-top"><span>CÓDIGO DOS 4 SINAIS</span><span>02 / 03</span></div><h3>Os sinais em conjunto</h3><div class="report-editorial report-editorial-muted">${reportArt(1)}<div class="report-editorial-copy"><span class="report-editorial-kicker">A LEITURA CRUZADA</span><strong>Três cartas, uma direção</strong><p>O sentido de cada escolha ganha profundidade quando os sinais são observados em conjunto.</p></div></div><p>${escapeHTML(firstName)}, o número ${pyramid?.final ?? '—'} encontra as cartas ${escapeHTML(cardNames)} nesta etapa da leitura. A relação entre essas escolhas abre uma reflexão sobre ${escapeHTML(result.label.toLowerCase())} e sobre o que se repete no seu momento atual.</p><div class="report-sheet-rule"></div><h4>Correspondências e contrastes</h4><p>Esta parte do documento aprofunda as relações entre os sinais, respeitando o contexto que deu a cada resposta. Algumas correspondências parecem reforçar-se; outras convidam a fazer uma pausa antes de chegar a uma conclusão.</p><p>A leitura prossegue com perguntas orientadoras, nuances dos símbolos e uma síntese que reúne o caminho percorrido até aqui. Ao comparar diferentes escolhas, é importante notar tanto o que se aproxima quanto o que se mantém em aberto.</p><h4>Temas que regressam</h4><p>Uma repetição numérica não precisa ser lida como certeza. Ela pode servir como convite para observar decisões recentes, relações que ganharam peso e possibilidades que ainda não foram consideradas com calma.</p><p>O significado de cada carta muda quando a colocamos ao lado da área de vida escolhida. O encontro entre esses elementos produz perguntas mais interessantes do que qualquer símbolo isolado, porque preserva o contexto das suas respostas.</p><p>Nas páginas seguintes, as observações são organizadas em uma síntese pessoal e em pontos de reflexão para o momento que está a viver.</p></div><div class="report-sheet-fog" aria-hidden="true"></div>${lock}</article>
        <article class="report-sheet report-sheet-third" aria-label="Folha 3 de 3, conteúdo bloqueado"><div class="report-sheet-content"><div class="report-sheet-top"><span>CÓDIGO DOS 4 SINAIS</span><span>03 / 03</span></div><h3>Síntese e próximos passos</h3><div class="report-editorial report-editorial-muted">${reportArt(2)}<div class="report-editorial-copy"><span class="report-editorial-kicker">PONTO DE CONVERGÊNCIA</span><strong>Um caminho de reflexão</strong><p>Nome, nascimento, cartas e marcas disponíveis formam uma leitura com perguntas para levar consigo.</p></div></div><div class="report-sheet-rule"></div><h4>O seu ponto de convergência</h4><p>A última parte organiza os temas que surgiram ao longo da leitura e propõe uma forma de revisitá-los com calma. A síntese reúne o percurso do nome, o número final, as cartas e os demais sinais disponíveis.</p><p>As cartas, a pirâmide do nome, o nascimento e as marcas da palma são colocados lado a lado. O objetivo não é prever acontecimentos, mas oferecer uma perspectiva estruturada sobre as escolhas e respostas que trouxe para esta experiência.</p><h4>Perguntas para levar consigo</h4><p>O que parece repetir-se? Que decisão pede mais atenção? Que parte da sua experiência dá contexto a estes sinais? Em que momento uma interpretação parece útil e em que momento prefere deixá-la em aberto?</p><p>Uma leitura pessoal ganha valor quando é confrontada com a vida real. Algumas ideias podem ressoar agora; outras talvez façam sentido apenas mais tarde, quando houver distância para olhar para as mesmas escolhas de outro modo.</p><h4>O próximo movimento</h4><p>A conclusão propõe um caminho de reflexão simples e concreto: reconhecer o que se destaca, escolher o que merece cuidado e avançar sem perder a sua própria autonomia diante dos símbolos.</p></div><div class="report-sheet-fog" aria-hidden="true"></div>${lock}</article>
      </div>
          <div class="report-cta"><p class="eyebrow">A SUA ANÁLISE COMPLETA</p><h3>Análise completa ${zodiac ? `do <span class="report-zodiac" aria-label="Signo de ${zodiac.name}">${zodiac.address}</span> ` : 'de '}<em class="report-person-name">${escapeHTML(fullName)}</em> para o dia <span class="report-current-date">${escapeHTML(today)}</span>.</h3>
            <p>Escolha abaixo a versão da análise que prefere.</p>
            <div class="plan-grid" aria-label="Planos da análise">
              <article class="plan-card plan-card-simple"><h4>Plano Simples</h4><div class="plan-price"><span class="plan-price-current">7,90 €</span><span class="plan-price-anchor" aria-label="Valor de referência: 19 euros">19 €</span></div>
                <ul class="plan-benefits"><li>Leitura personalizada dos 4 sinais de convergência</li><li>Acesso imediato<span class="plan-benefit-detail">Garantia de 15 dias</span></li></ul>
                <button class="primary" type="button" data-action="checkout" data-plan="simple">Escolher Plano Simples <span aria-hidden="true">${icon('arrowUpRight')}</span></button><div class="payment-methods"><img src="assets/pagamento.png" alt="Meios de pagamento aceites" width="2065" height="274" loading="lazy" decoding="async"></div></article>
              <article class="plan-card plan-card-complete"><div class="plan-card-ribbons"><span class="plan-popular">Mais escolhido</span><span class="plan-tag">Leitura ampliada</span></div><h4>Plano Completo</h4><div class="plan-price"><span class="plan-price-current">14,90 €</span><span class="plan-price-anchor" aria-label="Valor de referência: 35 euros">35 €</span></div>
                <ul class="plan-benefits"><li>Leitura personalizada dos 4 sinais de convergência</li><li>Interpretação das três cartas escolhidas</li><li class="plan-bonus"><strong>Bónus 1</strong> Diário dos Sinais (7 Dias)</li><li class="plan-bonus"><strong>Bónus 2</strong> Guia Completo das Cartas</li><li class="plan-bonus"><strong>Bónus 3</strong> Calendário dos Ciclos</li></ul>
                <button class="primary" type="button" data-action="checkout" data-plan="complete">Escolher Plano Completo <span aria-hidden="true">${icon('arrowUpRight')}</span></button><div class="payment-methods"><img src="assets/pagamento.png" alt="Meios de pagamento aceites" width="2065" height="274" loading="lazy" decoding="async"></div></article>
            </div><div id="checkout-error" class="checkout-error" role="alert"></div><img class="guarantee-seal" src="assets/garantia-15-dias.png" alt="Selo de garantia de 15 dias" width="500" height="500" loading="lazy" decoding="async"><p class="purchase-guarantee"><strong>Acesso imediato e garantia de satisfação de 15 dias.</strong><br>Se não gostar, basta pedir o seu dinheiro de volta.</p><small>Todo este material é confidencial e damos a maior importância à privacidade dos nossos clientes.</small></div>`);
  }

  function resultScreen() {
    return reportPreviewScreen();
  }

  const screens = [intro, nameScreen, areaScreen, cardsScreen, microScreen, birthScreen, handScreen, analysisScreen, resultScreen];

  function render() {
    app.innerHTML = screens[state.step]();
    progress();
    if (state.step === 2 && state.showPyramid) setupPyramidReveal();
    if (state.step === 3 && cardPhase === 'reading') setupDiagnosisAudio();
    if (state.step === 2 && !cardAssetsPreloaded) {
      cardAssetsPreloaded = true;
      for (const src of ['assets/cards/tras.png', ...config.cards.map(card => card.image)]) {
        const image = new Image(); image.src = src;
      }
    }
    if (state.step === 4) track('PartialDiagnosisViewed');
    if (state.step === 7) { track('AnalysisStarted'); startAnalysis(); }
    if (state.step === 8) track('ResultViewed', { profile: profileResult().id });
  }

  function startAnalysis() {
    if (state.handPhoto || pendingHandUrl) {
      if (state.handLines && !state.analysisDone) {
        state.analysisDone = true;
        handTraceStep = 4;
        save();
        app.querySelector('.hand-analysis-preview .hand-scan')?.remove();
        for (const id of ['life', 'head', 'fate', 'heart']) {
          const item = app.querySelector(`[data-check="${id}"]`);
          item?.classList.remove('active');
          item?.classList.add(state.handLines[id]?.length >= 4 ? 'done' : 'unavailable');
          if (!(state.handLines[id]?.length >= 4)) {
            const icon = item?.querySelector('.analysis-tick');
            if (icon) icon.textContent = '—';
          }
        }
        updateAnalysisContinue();
      }
    } else {
      const totalChecks = 5;
      const checkInterval = 15_000;
      const duration = totalChecks * checkInterval;
      if (state.analysisDone && !state.analysisStartedAt) state.analysisStartedAt = Date.now() - duration;
      if (!state.analysisStartedAt) { state.analysisStartedAt = Date.now(); save(); }
      const updateChecks = () => {
        const elapsed = Math.max(0, Date.now() - state.analysisStartedAt);
        const completed = state.analysisDone ? totalChecks : Math.min(totalChecks, Math.floor(elapsed / checkInterval));
        for (let index = 0; index < totalChecks; index++) {
          const item = app.querySelector(`[data-analysis="${index}"]`);
          item?.classList.toggle('done', index < completed);
          item?.classList.toggle('active', index === completed);
        }
        if (completed === totalChecks) {
          analysisTimer = null;
          if (!state.analysisDone) { state.analysisDone = true; save(); }
          app.querySelector('[data-action="vsl-start"]')?.removeAttribute('disabled');
          updateAnalysisContinue();
          return;
        }
        const nextCheckAt = state.analysisStartedAt + (completed + 1) * checkInterval;
        analysisTimer = setTimeout(updateChecks, Math.max(0, nextCheckAt - Date.now()));
      };
      updateChecks();
    }
    const video = app.querySelector('#analysis-video');
    if (video) {
      setupVslPlayer(video);
      video.addEventListener('ended', () => { trackVideo('video_complete'); videoPlaying = false; state.videoEnded = true; save(); setSoundtrackDucked(false); updateAnalysisContinue(); });
      video.addEventListener('error', () => {
        const holder = video.closest('.video-box');
        holder.textContent = 'Não foi possível carregar o vídeo. Pode prosseguir quando a análise terminar.';
        config.videoUrl = '';
        updateAnalysisContinue();
      });
    }
    if (state.handPhoto && !handPhotoProcessing && !state.handLines && !state.analysisDone && !handAnalyzing) void analyzeHand();
  }

  function updateAnalysisContinue() {
    const action = app.querySelector('#analysis-continue');
    if (action) action.hidden = !(state.analysisDone && (state.videoEnded || !config.videoUrl));
  }

  function setupVslPlayer(video) {
    const player = video.closest('.mini-vsl');
    const slot = player.parentElement;
    const gate = player.querySelector('.mini-vsl-gate');
    const overlay = player.querySelector('.mini-vsl-overlay');
    const controls = player.querySelector('.mini-vsl-controls');
    const sound = player.querySelector('.mini-vsl-sound');
    const progress = player.querySelector('.mini-vsl-progress');
    const sync = () => {
      const playing = !video.paused && !video.loop;
      player.dataset.state = video.ended ? 'ended' : playing ? 'playing' : video.loop ? 'ready' : 'paused';
      gate.hidden = !video.loop;
      overlay.hidden = video.loop || playing || video.ended;
      controls.hidden = !playing;
      sound.hidden = !playing || !video.muted;
    };
    video.addEventListener('play', () => { if (!video.loop) { videoPlaying = true; trackVideo('video_play'); } setSoundtrackDucked(!video.loop && !video.muted); sync(); });
    video.addEventListener('pause', () => { if (videoPlaying && !video.ended) { trackVideo('video_exit'); videoPlaying = false; } setSoundtrackDucked(false); sync(); });
    video.addEventListener('timeupdate', () => {
      if (video.loop || !Number.isFinite(video.duration) || !video.duration) return;
      videoMaxSeconds = Math.max(videoMaxSeconds, Math.floor(video.currentTime));
      const milestone = Math.floor(video.currentTime / 10) * 10;
      if (milestone > videoMilestone) { videoMilestone = milestone; trackVideo('video_progress'); }
      const percent = Math.min(100, Math.round(video.currentTime / video.duration * 100));
      progress.querySelector('i').style.width = `${percent}%`;
      progress.setAttribute('aria-valuenow', String(percent));
    });
    video.addEventListener('ended', () => { progress.querySelector('i').style.width = '100%'; sync(); });
    video.addEventListener('error', () => { setSoundtrackDucked(false); });
    if ('IntersectionObserver' in window) {
      vslObserver = new IntersectionObserver(() => {
        player.classList.toggle('is-floating', slot.getBoundingClientRect().bottom < 0 && !video.loop && !video.ended);
      });
      vslObserver.observe(slot);
    }
    if (state.handPhoto || pendingHandUrl) {
      // Iniciamos ainda no evento de seleção da foto; o Safari conserva o gesto do utilizador.
      // A reprodução automática deve começar silenciosa; o som pode ser ativado por toque.
      video.loop = false;
      try { video.currentTime = 0; } catch { /* O Safari pode ainda não ter carregado os metadados. */ }
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute?.('muted', '');
      video.setAttribute?.('playsinline', '');
      const showManualStart = () => {
        gate.hidden = false;
        overlay.hidden = true;
        controls.hidden = true;
        sound.hidden = true;
        player.dataset.state = 'ready';
        setSoundtrackDucked(false);
      };
      const attemptAutoplay = () => {
        let playback;
        try { playback = video.play(); } catch { showManualStart(); return; }
        void Promise.resolve(playback).then(sync).catch(showManualStart);
      };
      if (video.readyState === 0) {
        video.addEventListener('loadedmetadata', () => { if (video.paused) attemptAutoplay(); }, { once: true });
      }
      attemptAutoplay();
    } else {
      video.play().catch(() => {}); // Prévia silenciosa nas etapas sem fotografia.
      sync();
    }
  }

  function controlVsl(action) {
    const video = app.querySelector('#analysis-video');
    if (!video) return;
    if (action === 'vsl-start' && !config.vslTestOpen && !state.analysisDone && !state.handPhoto) return;
    const player = video.closest('.mini-vsl');
    if (action === 'vsl-start' || action === 'vsl-restart' || action === 'vsl-resume') {
      if (action !== 'vsl-resume') {
        video.currentTime = 0;
        if (state.videoEnded) { state.videoEnded = false; save(); updateAnalysisContinue(); }
      }
      video.loop = false;
      video.muted = false;
      // A prévia já pode estar a tocar em silêncio; nesse caso, play() não emite outro evento "play".
      player.querySelector('.mini-vsl-gate').hidden = true;
      player.querySelector('.mini-vsl-overlay').hidden = true;
      player.querySelector('.mini-vsl-controls').hidden = false;
      player.dataset.state = 'playing';
      setSoundtrackDucked(true);
      void video.play().catch(() => {
        player.querySelector('.mini-vsl-controls').hidden = true;
        player.querySelector('.mini-vsl-overlay').hidden = false;
        setSoundtrackDucked(false);
      });
    } else if (action === 'vsl-sound') {
      video.muted = false;
      player.querySelector('.mini-vsl-sound').hidden = true;
      setSoundtrackDucked(true);
    } else if (action === 'vsl-speed') {
      const speeds = [1, 1.2, 1.5];
      video.playbackRate = speeds[(speeds.indexOf(video.playbackRate) + 1) % speeds.length];
      player.querySelector('[data-action="vsl-speed"]').textContent = `${video.playbackRate.toFixed(1)}x`;
    }
  }

  function preserveParameters(base) {
    if (tracker) return tracker.checkoutUrl(base);
    const target = new URL(base, location.href);
    const original = new URLSearchParams(location.search);
    const allowed = key => key.startsWith('utm_') || ['fbclid', 'gclid', 'ttclid', 'msclkid', 'sck', 'src'].includes(key);
    for (const [key, value] of original) if (allowed(key) && value) target.searchParams.set(key, value);
    return target.href;
  }

  function checkout(plan) {
    const profile = profileResult().id;
    const url = ['simple', 'complete'].includes(plan) ? config.checkouts[plan] : '';
    const error = app.querySelector('#checkout-error');
    if (!url || !/^https:\/\//i.test(url)) { error.textContent = 'Não foi possível abrir este plano. Tente novamente mais tarde.'; return; }
    const destination = preserveParameters(url);
    tracker?.exit('checkout', { plan: plan === 'simple' ? 'Plano Simples' : 'Plano Completo' });
    track('CheckoutClicked', { profile, plan });
    window.location.assign(destination);
  }

  function enhancePalmImage(context, width, height) {
    if (typeof context.getImageData !== 'function' || typeof context.putImageData !== 'function') return;
    try {
      const image = context.getImageData(0, 0, width, height);
      const pixels = image.data;
      let brightness = 0;
      let samples = 0;
      for (let index = 0; index < pixels.length; index += 64) {
        brightness += .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2];
        samples++;
      }
      const lift = Math.max(-8, Math.min(22, (145 - brightness / samples) * .32));
      for (let index = 0; index < pixels.length; index += 4) {
        const light = .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2];
        for (let channel = 0; channel < 3; channel++) {
          const desaturated = light + (pixels[index + channel] - light) * .72;
          pixels[index + channel] = Math.max(0, Math.min(255, (desaturated - 128) * 1.18 + 128 + lift));
        }
      }
      context.putImageData(image, 0, 0);
    } catch { /* Se o navegador não permitir manipular pixels, mantemos a fotografia original. */ }
  }

  async function processHand(file) {
    const error = app.querySelector('#hand-error');
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      error.textContent = 'Escolha uma fotografia JPG, PNG ou WebP com até 5 MB.';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    pendingHandUrl = objectUrl;
    handPhotoProcessing = true;
    state.handPhoto = '';
    state.handPhotoWidth = 0;
    state.handPhotoHeight = 0;
    state.handLines = null;
    state.handAnalysisError = '';
    state.analysisDone = false;
    state.analysisStartedAt = 0;
    state.videoEnded = false;
    handTraceStep = 0;
    try {
      go(7); // O vídeo começa no próprio gesto de selecionar a foto, antes de descodificá-la.
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = objectUrl; });
      const scale = Math.min(1, 1100 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      enhancePalmImage(context, canvas.width, canvas.height);
      let quality = .86;
      do {
        state.handPhoto = canvas.toDataURL('image/jpeg', quality);
        quality -= .08;
      } while (state.handPhoto.length > 800_000 && quality >= .62);
      state.handPhotoWidth = canvas.width;
      state.handPhotoHeight = canvas.height;
      const preview = app.querySelector('.hand-analysis-preview img');
      if (preview) { preview.src = state.handPhoto; preview.width = canvas.width; preview.height = canvas.height; }
      app.querySelector('.hand-analysis-preview svg')?.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
      pendingHandUrl = '';
      handPhotoProcessing = false;
      state.handFileName = file.name;
      tracker?.emit('hand_upload', { handUploaded: true });
      save();
      track('HandUploaded');
      void analyzeHand();
    } catch {
      pendingHandUrl = '';
      handPhotoProcessing = false;
      state.handPhoto = '';
      go(6);
      app.querySelector('#hand-error').textContent = 'Não foi possível abrir esta fotografia. Experimente outra imagem.';
    } finally { URL.revokeObjectURL(objectUrl); }
  }

  function continueToAnalysis() {
    go(7);
    if (config.videoUrl && (config.vslTestOpen || state.analysisDone)) controlVsl('vsl-start');
  }

  async function analyzeHandSecurely() {
    if (!state.handPhoto || handAnalyzing) return;
    handAnalyzing = true;
    handScanActive = true;
    try {
      const response = await fetch(config.palmAnalysisUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: config.supabaseAnonKey, authorization: `Bearer ${config.supabaseAnonKey}` },
        body: JSON.stringify({ image: state.handPhoto }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível identificar as linhas da mão.');
      const ids = ['life', 'head', 'fate', 'heart'];
      const valid = points => Array.isArray(points) && (points.length === 0 || points.length >= 4 && points.length <= 15) && points.every(point => Number.isFinite(point?.x) && Number.isFinite(point?.y) && point.x >= 0 && point.x <= 1000 && point.y >= 0 && point.y <= 1000);
      if (!ids.every(id => valid(payload.lines?.[id])) || !ids.some(id => payload.lines[id].length >= 4)) throw new Error('Não conseguimos distinguir as linhas da palma. Tire outra fotografia com boa luz e a palma aberta.');
      if (state.step !== 6 && state.step !== 7) return;
      state.handLines = Object.fromEntries(ids.map(id => [id, payload.lines[id].map(point => ({ x: Math.round(point.x), y: Math.round(point.y) }))]));
      save();
      handScanActive = false;
      app.querySelector('.hand-analysis-preview .hand-scan')?.remove();
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      for (const [index, id] of ids.entries()) {
        if (state.step !== 6 && state.step !== 7) return;
        const check = app.querySelector(`[data-check="${id}"]`);
        const path = app.querySelector(`[data-trace="${id}"]`);
        const lineVisible = state.handLines[id].length >= 4;
        if (lineVisible) check?.classList.add('active');
        if (path && lineVisible) {
          path.setAttribute('d', `M ${state.handLines[id].map(point => `${Math.round(point.x * (state.handPhotoWidth || 800) / 1000)} ${Math.round(point.y * (state.handPhotoHeight || 800) / 1000)}`).join(' L ')}`);
          const length = path.getTotalLength();
          path.style.strokeDasharray = String(length);
          path.style.strokeDashoffset = String(length);
          path.getBoundingClientRect();
          path.style.transition = reducedMotion ? 'none' : 'stroke-dashoffset .72s ease-in-out';
          path.style.strokeDashoffset = '0';
        }
        await new Promise(resolve => setTimeout(resolve, reducedMotion || !lineVisible ? 0 : 760));
        check?.classList.remove('active');
        check?.classList.add(lineVisible ? 'done' : 'unavailable');
        if (!lineVisible) {
          const icon = check?.querySelector('.analysis-tick');
          if (icon) icon.textContent = '—';
        }
        handTraceStep = index + 1;
      }
      handAnalyzing = false;
      state.analysisDone = true;
      save();
      app.querySelector('.hand-analysis-preview .hand-traces')?.classList.add('complete');
      updateAnalysisContinue();
    } catch (error) {
      handAnalyzing = false;
      handScanActive = false;
      state.handLines = null;
      state.handAnalysisError = error instanceof TypeError
        ? 'O serviço de análise da mão não está acessível neste momento. Tente novamente mais tarde.'
        : error.message || 'Não foi possível concluir a análise.';
      state.analysisDone = true;
      handTraceStep = 4;
      save();
      app.querySelector('.hand-analysis-preview .hand-scan')?.remove();
      const notice = app.querySelector('#hand-analysis-error');
      if (notice) { notice.hidden = false; notice.querySelector('span').textContent = state.handAnalysisError; }
      updateAnalysisContinue();
    }
  }

  function analyzeHand() {
    return analyzeHandSecurely();
  }
  app.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !app.contains(button)) return;
    if (button.dataset.action === 'start') { track('QuizStarted'); return go(1); }
    if (button.dataset.area) {
      state.area = button.dataset.area;
      tracker?.emit('answer_area', { area: state.area });
      state.showPyramid = true;
      save();
      track('AreaSelected', { area: state.area });
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (button.dataset.card) {
      if (cardPhase !== 'ready' || spinningCardId || state.cards.length >= 3) return;
      const id = button.dataset.card;
      if (state.cards.includes(id)) return;
      spinningCardId = id;
      state.cards.push(id);
      tracker?.emit('answer_cards', { cards: state.cards.join(', ') });
      cardTilts.set(id, Math.round(Math.random() * 14) - 7);
      cardFloats.set(id, randomCardFloat());
      save();
      if (state.cards.length === 3) {
        track('CardsCompleted', { cards: state.cards.join(',') });
      }
      render();
      cardTimer = setTimeout(() => {
        spinningCardId = null;
        if (state.step === 3) {
          if (state.cards.length === 3) cardPhase = 'reading';
          render();
        }
        cardTimer = null;
      }, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1050);
      return;
    }
    switch (button.dataset.action) {
      case 'vsl-start': case 'vsl-resume': case 'vsl-restart': case 'vsl-speed': case 'vsl-sound': controlVsl(button.dataset.action); break;
      case 'diagnosis-audio-toggle': {
        const audio = app.querySelector('#diagnosis-audio');
        if (audio?.paused) void audio.play().catch(() => { app.querySelector('#diagnosis-time').textContent = 'Não foi possível reproduzir'; });
        else audio?.pause();
        break;
      }
      case 'cards-next': if (state.cards.length === 3) go(4); break;
      case 'pyramid-next': if (state.area) go(3); break;
      case 'micro-next': go(5); break;
      case 'hand-retry':
        state.handLines = null;
        state.handAnalysisError = '';
        state.analysisDone = false;
        handTraceStep = 0;
        save();
        render();
        break;
      case 'hand-replace':
        state.handPhoto = '';
        state.handPhotoWidth = 0;
        state.handPhotoHeight = 0;
        state.handLines = null;
        state.handAnalysisError = '';
        state.analysisDone = false;
        state.videoEnded = false;
        go(6);
        break;
      case 'analysis-next': if (state.analysisDone && (state.videoEnded || !config.videoUrl)) go(8); break;
      case 'checkout': checkout(button.dataset.plan); break;
    }
  });

  app.addEventListener('pointerdown', startSoundtrack, { capture: true });
  for (const type of ['selectstart', 'dblclick', 'dragstart', 'contextmenu']) {
    app.addEventListener(type, event => { if (event.target.closest?.('.report-stack')) event.preventDefault(); });
  }
  app.addEventListener('wheel', event => { if (event.ctrlKey && event.target.closest?.('.report-stack')) event.preventDefault(); }, { passive: false });
  app.addEventListener('touchstart', event => { if (event.touches.length > 1 && event.target.closest?.('.report-stack')) event.preventDefault(); }, { passive: false });
  app.addEventListener('gesturestart', event => { if (event.target.closest?.('.report-stack')) event.preventDefault(); }, { passive: false });
  app.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') startSoundtrack();
  }, { capture: true });

  app.addEventListener('submit', event => {
    if (event.target.id === 'name-form') {
      event.preventDefault();
      const value = app.querySelector('#full-name').value.trim().replace(/\s+/gu, ' ');
      const parts = value.split(' ');
      if (value.length > 90 || parts.length !== 2 || !parts.every(part => /^\p{L}[\p{L}\p{M}]*(?:[-'][\p{L}\p{M}]+)*$/u.test(part))) {
        app.querySelector('#name-error').textContent = 'Escreva apenas o primeiro e o último nome.';
        return;
      }
      state.fullName = value;
      tracker?.emit('answer_name', { name: value });
      state.name = parts[0].charAt(0).toLocaleUpperCase('pt-PT') + parts[0].slice(1);
      state.showPyramid = false;
      save();
      go(2);
    }
    if (event.target.id === 'birth-form') {
      event.preventDefault();
      const date = parseBirthDate(app.querySelector('#birth-date').value);
      const timeInput = app.querySelector('#birth-time').value.trim();
      const time = timeInput ? parseBirthTime(timeInput) : '';
      if (!date) { app.querySelector('#birth-error').textContent = 'Indique uma data válida no formato DD/MM/AAAA.'; return; }
      if (state.showBirthTime && timeInput && !time) { app.querySelector('#birth-error').textContent = 'Indique uma hora válida no formato HH:MM.'; return; }
      state.birthDate = date;
      state.birthTime = state.showBirthTime ? time : '';
      tracker?.emit('answer_birth', { birthDate: date, birthTime: state.birthTime });
      save();
      go(6);
    }
  });

  app.addEventListener('input', event => {
    if (event.target.id === 'full-name') {
      const value = event.target.value.normalize('NFC').replace(/[^\p{L}\p{M}\s'-]/gu, '').replace(/\s+/gu, ' ').replace(/^\s/u, '');
      event.target.value = value.split(' ').slice(0, 2).join(' ');
      app.querySelector('#name-error').textContent = '';
    }
    if (event.target.id === 'birth-date') {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
      event.target.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
      app.querySelector('#birth-error').textContent = '';
    }
    if (event.target.id === 'birth-time') {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
      event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
      app.querySelector('#birth-error').textContent = '';
    }
  });

  app.addEventListener('change', event => {
    if (event.target.id === 'show-birth-time') {
      state.showBirthTime = event.target.checked;
      const field = app.querySelector('#birth-time-field');
      const time = app.querySelector('#birth-time');
      field.hidden = !state.showBirthTime;
      time.disabled = !state.showBirthTime;
      event.target.setAttribute('aria-expanded', String(state.showBirthTime));
      if (!state.showBirthTime) { time.value = ''; state.birthTime = ''; }
      save();
    }
    if (event.target.id === 'hand-input') void processHand(event.target.files?.[0]);
  });

  if (state.step === 3) {
    cardPhase = state.cards.length === 3 ? 'reading' : 'dealing';
    if (cardPhase === 'dealing') startCardSequence();
  }
  render();
  trackStep();
  window.addEventListener?.('pagehide', () => { if (videoPlaying) trackVideo('video_exit'); });
  document.addEventListener?.('visibilitychange', () => { if (document.hidden && videoPlaying) { trackVideo('video_exit'); videoPlaying = false; } });
  if (state.step === 0) void loadGeo();
})();
