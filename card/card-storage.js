window.BENCAO_CARD_STORAGE = (() => {
  const browserKey = 'bencao_browser_id_v1';
  const lockDuration = 5 * 60 * 1000;

  function keys() {
    const id = localStorage.getItem(browserKey);
    if (!id) throw new Error('Armazenamento local indisponível.');
    return { card: `bencao_card_v1:${id}`, pending: `bencao_card_pending_v1:${id}` };
  }

  function load() {
    try {
      const raw = localStorage.getItem(keys().card);
      if (!raw) return null;
      const card = JSON.parse(raw);
      return [1, 2, 3].includes(card?.version) && typeof card.name === 'string' &&
        /^data:image\/(?:png|jpeg|webp);base64,/.test(card.preview || '') ? card : null;
    } catch { return null; }
  }

  function reserve() {
    const { pending } = keys();
    if (load()) return { status: 'completed' };
    try {
      const active = JSON.parse(localStorage.getItem(pending) || 'null');
      if (active?.until > Date.now()) return { status: 'busy' };
    } catch { /* Uma reserva antiga ou inválida pode ser substituída. */ }
    const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    localStorage.setItem(pending, JSON.stringify({ token, until: Date.now() + lockDuration }));
    if (JSON.parse(localStorage.getItem(pending) || 'null')?.token !== token) return { status: 'busy' };
    return { status: 'reserved', token };
  }

  function release(token) {
    try {
      const { pending } = keys();
      if (JSON.parse(localStorage.getItem(pending) || 'null')?.token === token) localStorage.removeItem(pending);
    } catch { /* O bloqueio expira automaticamente. */ }
  }

  function clearSaved() {
    const { card, pending } = keys();
    localStorage.removeItem(card);
    localStorage.removeItem(pending);
  }

  async function compact(image, width, quality) {
    const picture = new Image();
    picture.src = image;
    await picture.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(width, picture.naturalWidth);
    canvas.height = Math.round(canvas.width * picture.naturalHeight / picture.naturalWidth);
    canvas.getContext('2d').drawImage(picture, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', quality);
  }

  async function save(name, image, token, fallback = false) {
    const { card } = keys();
    for (const [width, quality] of [[1024, .86], [900, .78], [720, .7], [560, .62]]) {
      const preview = await compact(image, width, quality);
      try {
        localStorage.setItem(card, JSON.stringify({ version: 3, name, preview, fallback }));
        release(token);
        return preview;
      } catch (error) {
        if (width === 560) throw error;
      }
    }
  }

  async function ensureWatermark(saved, locale = 'pt') {
    if (saved.version === 3) return saved;
    const image = await window.BENCAO_IMAGE.stampWebsite(saved.preview, locale);
    const { card } = keys();
    for (const [width, quality] of [[1024, .86], [900, .78], [720, .7], [560, .62]]) {
      const preview = await compact(image, width, quality);
      try {
        localStorage.setItem(card, JSON.stringify({ version: 3, name: saved.name, preview, fallback: !!saved.fallback }));
        return { version: 3, name: saved.name, preview, fallback: !!saved.fallback };
      } catch (error) {
        if (width === 560) return { version: 3, name: saved.name, preview: image, fallback: !!saved.fallback, storageError: true };
      }
    }
  }

  return { load, reserve, release, save, ensureWatermark, clearSaved };
})();
