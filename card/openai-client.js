window.BENCAO_IMAGE = (() => {
  const ENDPOINT = 'https://zpupfwlufzbafwwebrgb.supabase.co/functions/v1/generate-card';
  // A chave pública anon do Supabase pode ficar no navegador; a chave OpenAI permanece na Edge Function.
  const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdXBmd2x1ZnpiYWZ3d2VicmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1OTYyNTMsImV4cCI6MjEwNTE3MjI1M30.YHgjIfU1nhFW4Ggkzr6WLg3wIkk5WOIWdJlQIe2wfl0';
  let assetsPromise;

  function loadAssets() {
    if (window.BENCAO_GENERATION_ASSETS) return Promise.resolve(window.BENCAO_GENERATION_ASSETS);
    if (!assetsPromise) assetsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'generation-assets.js';
      script.onload = () => window.BENCAO_GENERATION_ASSETS
        ? resolve(window.BENCAO_GENERATION_ASSETS)
        : reject(new Error('As referências da imagem não estão disponíveis.'));
      script.onerror = () => reject(new Error('Não foi possível carregar as referências da imagem.'));
      document.head.appendChild(script);
    }).catch(error => { assetsPromise = null; throw error; });
    return assetsPromise;
  }

  function shrinkImage(dataUrl, maxSide = 1024) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Não foi possível preparar as referências.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/webp', .86);
        const mimeType = compressed.startsWith('data:image/webp;') ? 'image/webp' : 'image/png';
        resolve({ type: 'image', mime_type: mimeType, data: compressed.split(',')[1] });
      };
      image.onerror = () => reject(new Error('Uma referência visual não pôde ser aberta.'));
      image.src = dataUrl;
    });
  }

  function stampWebsite(dataUrl, locale = 'pt') {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Não foi possível escrever o endereço no cartão.');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const address = `${locale === 'es' ? 'Genera también' : 'Gere também'} www.vivalavidas.com/card`;
          let fontSize = Math.max(18, Math.round(canvas.width * .037));
          context.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
          let textWidth = context.measureText(address).width;
          if (textWidth > canvas.width * .9) {
            fontSize = Math.max(12, Math.floor(fontSize * canvas.width * .9 / textWidth));
            context.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
            textWidth = context.measureText(address).width;
          }
          context.textAlign = 'center';
          context.textBaseline = 'bottom';
          const baseline = canvas.height - Math.max(16, Math.round(canvas.height * .02));
          const labelHeight = Math.round(fontSize * 1.7);
          context.fillStyle = 'rgba(0,0,0,.78)';
          context.fillRect(
            (canvas.width - textWidth) / 2 - fontSize * .55,
            baseline - labelHeight + fontSize * .25,
            textWidth + fontSize * 1.1,
            labelHeight
          );
          context.lineJoin = 'round';
          context.lineWidth = Math.max(4, Math.round(fontSize * .22));
          context.strokeStyle = 'rgba(0,0,0,.92)';
          context.shadowColor = 'rgba(0,0,0,.98)';
          context.shadowBlur = Math.max(8, Math.round(fontSize * .4));
          context.shadowOffsetY = Math.max(2, Math.round(fontSize * .14));
          context.strokeText(address, canvas.width / 2, baseline);
          context.fillStyle = '#fff';
          context.fillText(address, canvas.width / 2, baseline);
          const format = /^data:image\/webp;/.test(dataUrl) ? 'image/webp' : 'image/png';
          resolve(canvas.toDataURL(format, .9));
        } catch (error) { reject(error); }
      };
      image.onerror = () => reject(new Error('Não foi possível abrir a imagem para escrever o endereço.'));
      image.src = dataUrl;
    });
  }

  function buildPrompt(template, input, hasSample) {
    const replacements = {
      SEU_NOME: input.recipientName,
      FRASE_ESCOLHIDA: input.message,
      AVATAR_PRESENTEADO: 'fotografia da pessoa anexada a esta solicitação',
      PERSONAGEM_1: input.selectedCharacters[0].name,
      PERSONAGEM_2: input.selectedCharacters[1].name,
      PERSONAGEM_3: input.selectedCharacters[2].name
    };
    const filled = template.replace(/\{\{([A-Z_0-9]+)\}\}/g, (match, key) => replacements[key] ?? match);
    return `${filled}\n\nDADOS DESTA CRIAÇÃO: o primeiro anexo é a fotografia da pessoa presenteada; os três seguintes são os personagens selecionados, na ordem ${input.selectedCharacters.map(item => item.name).join(', ')}; em seguida vêm as referências fixas de leão, pomba e cordeiro.${hasSample ? ' O último anexo é a imagem amostra obrigatória de estilo e composição.' : ' A imagem amostra mencionada no texto ainda não foi fornecida; siga as descrições de estilo sem fingir que a recebeu.'} Gerar uma única imagem vertical 4:5. Texto exato do nome: ${JSON.stringify(input.recipientName)}. Texto exato da frase: ${JSON.stringify(input.message)}. Não acrescente nem troque palavras.`;
  }

  async function generate(input) {
    const assets = await loadAssets();
    const selected = input.selectedCharacters.map(item => item.id);
    const fixed = input.fixedCharacters.map(item => item.id);
    const keys = [...selected, ...fixed];
    if (assets.references.sample) keys.push('sample');
    const images = [await shrinkImage(input.photo, 1200)];
    for (const key of keys) {
      const encoded = assets.references[key];
      if (!encoded) throw new Error(`Falta a referência visual de ${key}.`);
      images.push(await shrinkImage(`data:image/jpeg;base64,${encoded}`));
    }
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: PUBLIC_ANON_KEY, Authorization: `Bearer ${PUBLIC_ANON_KEY}` },
      body: JSON.stringify({
        input: [{ type: 'text', text: buildPrompt(assets.prompt, input, !!assets.references.sample) }, ...images]
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof payload.error === 'string' ? payload.error : payload.error?.message || `HTTP ${response.status}`;
      const failure = new Error(`Geração: ${detail}`);
      failure.status = response.status;
      failure.dailyLimit = response.status === 429 &&
        (payload.error?.code === 'DAILY_LIMIT' || /^Limite de criações atingido\./i.test(detail));
      throw failure;
    }
    if (typeof payload.image !== 'string' || !/^data:image\/png;base64,/.test(payload.image)) {
      throw new Error('A API não devolveu uma imagem válida. Tente novamente.');
    }
    return stampWebsite(payload.image, input.locale);
  }

  return { generate, stampWebsite };
})();
