window.BENCAO_I18N = (() => {
  const LATAM = new Set(['AR','BO','BR','BZ','CL','CO','CR','CU','DO','EC','SV','GT','HT','HN','MX','NI','PA','PY','PE','PR','UY','VE']);
  const copy = {
    pt: {
      pageTitle:'Um presente de bênção', description:'Crie uma mensagem de bênção personalizada para alguém de quem gosta.', ribbon:'Um momento de bênção', progress:'Progresso do presente', panel:'Criação do presente', modal:'Exemplo de presente. Toque na imagem para fechar', example:'Ver exemplo {number}', exampleAlt:'Exemplo de presente {number}',
      offerFlag:'Aproveite agora', offerKicker:'Super combo de PDF + conteúdos digitais', offerTitle:'Antes que o mundo ensine outra coisa, <span class="offer-title-highlight">ensine a Bíblia com cor e carinho.</span>', offerText:'Histórias para colorir, aprender e conversar em família.', offerOldPrice:'27,00 €', offerPayment:'pagamento único', offerBenefits:['Descobre a Bíblia — Livro de colorir','Aprenda a História da Bíblia — Audiolivro','Meu Caderninho de Oração','Meu Momento com Deus','Meu Primeiro Livro de Orações','Como Ensinar a Bíblia para Crianças','Série digital: Devocional Descobertas da Fé','15 dias de garantia','Acesso vitalício ao material'], offerProductAlt:'Biblioteca digital bíblica para crianças', offerPaymentsAlt:'MB Way, transferência bancária, Multibanco, Visa e Mastercard', offerButton:'Quero o super combo digital ↗',
      relationLabels:['Filho(a)','Neto(a)','Sobrinho(a)','Outra pessoa'], characterLabels:{'Noé':'Noé','Moisés':'Moisés','Adão':'Adão','Eva':'Eva','Maria':'Maria','Jesus':'Jesus'}, phraseOptions:['Que Deus ilumine sempre o teu caminho,','És uma bênção nas nossas vidas,','Que a fé te acompanhe em cada aventura,','Deus cuida de ti com muito amor,'], steps:['Passo 1 · O carinho começa aqui','Passo 2 · Um presente personalizado','Passo 3 · As suas palavras','Passo 4 · A história ganha vida','Passo 5 · Um ponto a melhorar','Passo 6 · A fotografia','Passo 7 · O seu WhatsApp'],
      yourGift:'O seu presente', back:'Voltar', continue:'Continuar', create:'Criar presente', start:'Começar',
      cropTitle:'Enquadrar fotografia', cropFrameAria:'Área de enquadramento. Arraste a fotografia ou use as setas para a mover.', cropZoomOut:'Afastar fotografia', cropZoomIn:'Aproximar fotografia', cropCancel:'Fechar sem guardar', cropConfirm:'Confirmar enquadramento', adjustPhoto:'Ajustar enquadramento',
      introKicker:'Uma surpresa especial', introHeading:'Uma <em class="hero-accent">bênção</em> para alguém que <em class="hero-accent">ama</em>.', introText:'Escolha personagens bíblicas e crie uma mensagem especial para alguém de quem gosta.', introNote:'Atenção: um cartão personalizado por pessoa.', languageChoice:'Escolha seu idioma',
      relationHeading:'Quem vai <em class="hero-accent">receber</em> este presente?', relationText:'Escolha a pessoa a quem deseja dedicar esta mensagem.', nameHeading:'Qual é o primeiro nome de <em class="hero-accent">quem vai receber</em>?', firstName:'Primeiro nome', firstNamePlaceholder:'Apenas o primeiro nome', phraseHeading:'Escolha uma mensagem para <em class="hero-accent">{name}</em>', customPhraseLabel:'Escreva uma frase personalizada de até 55 caracteres', customPhrasePlaceholder:'Ou escreva a sua frase', charactersHeading:'Escolha <em class="hero-accent">3 personagens</em> para incluir.', selected:', selecionado', reasonHeading:'Que comportamento de <em class="hero-accent">{name}</em> gostaria de ajudar a melhorar?', reasonLabel:'Conte-nos um exemplo recente', reasonPlaceholder:'O que aconteceu? O que gostaria que fosse diferente?', photoHeading:'Escolha uma fotografia da pessoa <em class="hero-accent">com o rosto nítido</em> e a <span class="smile-underline">sorrir</span>.', photoChosen:'Fotografia escolhida', choosePhoto:'Escolher fotografia', changePhoto:'Trocar fotografia', photoTypes:'JPG, PNG ou WebP · até 10 MB',
      whatsappHeading:'Para receber o seu cartão, indique o seu número de <em class="hero-accent">WhatsApp</em>.', country:'País', otherCountry:'🌍 Outro indicativo', ddi:'DDI', ddiAria:'Indicativo internacional', whatsappNumber:'DDD + número completo', whatsappPlaceholder:'DDD e número, sem DDI', privacy:'O número, as respostas e a localização aproximada poderão ser registados para acompanhar o cartão. O envio automático ainda não está ativo.', loadingHeading:'Aguarde...<br>A preparar <em class="hero-accent">o seu presente</em>', resultKicker:'Pronto para partilhar', resultHeading:'Um presente de bênção para {name}', resultAlt:'Pré-visualização do presente personalizado', shareButton:'↗ Partilhar com {name}', shareHint:'Toque no cartão para partilhar com {name}', shareHover:'Encaminhar para...',
      nameError:'Escreva o primeiro nome para continuar.', reasonError:'Descreva um comportamento para continuar.', photoError:'Escolha uma fotografia para continuar.', whatsappError:'Confirme o indicativo internacional e introduza um número de WhatsApp válido.', invalidPhoto:'Escolha uma imagem JPG, PNG ou WebP com até 10 MB.', imageOpenError:'Não foi possível abrir esta imagem.', imageReadError:'Não foi possível ler esta imagem.', generationConnectionError:'O serviço de criação está indisponível neste momento. Tente novamente mais tarde.', generationLimitError:'O limite de criações de hoje foi atingido. Volte amanhã.', generationError:'Não foi possível criar a imagem. Tente novamente.', generationInProgress:'Já existe uma criação em andamento neste navegador. Aguarde um pouco.', storageUnavailable:'Ative o armazenamento local do navegador para criar e guardar o cartão.', storageSaveError:'O cartão foi criado, mas não pôde ser guardado neste navegador. Descarregue-o agora.', shareError:'Não foi possível partilhar a imagem neste navegador.', shareDownloadedCopied:'Imagem descarregada e texto copiado. Envie ambos em conjunto.', shareDownloaded:'Imagem descarregada. Envie-a para partilhar.', shareMessage:'Aprenda a Bíblia colorindo, de maneira divertida. Você acabou de ganhar *30% de desconto* - {url}', fileName:'presente-de-bencao'
    },
    es: {
      pageTitle:'Un regalo de bendición', description:'Crea un mensaje de bendición personalizado para alguien que amas.', ribbon:'Un momento de bendición', progress:'Progreso del regalo', panel:'Creación del regalo', modal:'Ejemplo de regalo. Toca la imagen para cerrar', example:'Ver ejemplo {number}', exampleAlt:'Ejemplo de regalo {number}',
      offerFlag:'Aprovecha ahora', offerKicker:'Súper combo de PDF + contenidos digitales', offerTitle:'Antes de que el mundo les enseñe otra cosa, <span class="offer-title-highlight">enséñales la Biblia con color y cariño.</span>', offerText:'Historias para colorear, aprender y conversar en familia.', offerOldPrice:'US$ 27', offerPayment:'pago único', offerBenefits:['Descubre la Biblia — Libro para colorear','Aprende la Historia de la Biblia — Audiolibro','Mi Cuadernillo de Oración','Mi Momento con Dios','Mi Primer Libro de Oraciones','Cómo Enseñar la Biblia a los Niños','Serie digital: Devocional Descubrimientos de Fe','15 días de garantía','Acceso de por vida al material'], offerProductAlt:'Biblioteca digital bíblica para niños', offerPaymentsAlt:'MB Way, transferencia bancaria, Multibanco, Visa y Mastercard', offerButton:'Quiero el súper combo digital ↗',
      relationLabels:['Hijo(a)','Nieto(a)','Sobrino(a)','Otra persona'], characterLabels:{'Noé':'Noé','Moisés':'Moisés','Adão':'Adán','Eva':'Eva','Maria':'María','Jesus':'Jesús'}, phraseOptions:['Que Dios ilumine siempre tu camino,','Eres una bendición en nuestras vidas,','Que la fe te acompañe en cada aventura,','Dios te cuida con mucho amor,'], steps:['Paso 1 · El cariño comienza aquí','Paso 2 · Un regalo personalizado','Paso 3 · Tus palabras','Paso 4 · La historia cobra vida','Paso 5 · Algo por mejorar','Paso 6 · La fotografía','Paso 7 · Tu WhatsApp'],
      yourGift:'Tu regalo', back:'Volver', continue:'Continuar', create:'Crear regalo', start:'Comenzar',
      cropTitle:'Encuadrar fotografía', cropFrameAria:'Área de encuadre. Arrastra la fotografía o usa las flechas para moverla.', cropZoomOut:'Alejar fotografía', cropZoomIn:'Acercar fotografía', cropCancel:'Cerrar sin guardar', cropConfirm:'Confirmar encuadre', adjustPhoto:'Ajustar encuadre',
      introKicker:'Una sorpresa especial', introHeading:'Una <em class="hero-accent">bendición</em> para alguien que <em class="hero-accent">amas</em>.', introText:'Elige personajes bíblicos y crea un mensaje especial para alguien que amas.', introNote:'Atención: una tarjeta personalizada por persona.', languageChoice:'Elige tu idioma',
      relationHeading:'¿Quién va a <em class="hero-accent">recibir</em> este regalo?', relationText:'Elige a la persona a quien quieres dedicar este mensaje.', nameHeading:'¿Cómo se llama <em class="hero-accent">quien lo recibirá</em>?', firstName:'Nombre', firstNamePlaceholder:'Solo el primer nombre', phraseHeading:'Elige un mensaje para <em class="hero-accent">{name}</em>', customPhraseLabel:'Escribe una frase personalizada de hasta 55 caracteres', customPhrasePlaceholder:'O escribe tu propia frase', charactersHeading:'Elige <em class="hero-accent">3 personajes</em> para incluir.', selected:', seleccionado', reasonHeading:'¿Qué comportamiento de <em class="hero-accent">{name}</em> te gustaría ayudar a mejorar?', reasonLabel:'Cuéntanos un ejemplo reciente', reasonPlaceholder:'¿Qué pasó? ¿Qué te gustaría que fuera diferente?', photoHeading:'Elige una fotografía de la persona <em class="hero-accent">con el rostro nítido</em> y <span class="smile-underline">sonriendo</span>.', photoChosen:'Fotografía elegida', choosePhoto:'Elegir fotografía', changePhoto:'Cambiar fotografía', photoTypes:'JPG, PNG o WebP · hasta 10 MB',
      whatsappHeading:'Para recibir tu tarjeta, indica tu número de <em class="hero-accent">WhatsApp</em>.', country:'País', otherCountry:'🌍 Otro código', ddi:'DDI', ddiAria:'Código internacional', whatsappNumber:'Código de área + número', whatsappPlaceholder:'Código de área y número, sin DDI', privacy:'El número, las respuestas y la ubicación aproximada podrán registrarse para dar seguimiento a la tarjeta. El envío automático aún no está activo.', loadingHeading:'Espera...<br>Estamos preparando <em class="hero-accent">tu regalo</em>', resultKicker:'Listo para compartir', resultHeading:'Un regalo de bendición para {name}', resultAlt:'Vista previa del regalo personalizado', shareButton:'↗ Compartir con {name}', shareHint:'Toca la tarjeta para compartir con {name}', shareHover:'Enviar a...',
      nameError:'Escribe el primer nombre para continuar.', reasonError:'Describe un comportamiento para continuar.', photoError:'Elige una fotografía para continuar.', whatsappError:'Revisa el código internacional e introduce un número de WhatsApp válido.', invalidPhoto:'Elige una imagen JPG, PNG o WebP de hasta 10 MB.', imageOpenError:'No se pudo abrir esta imagen.', imageReadError:'No se pudo leer esta imagen.', generationConnectionError:'El servicio de creación no está disponible en este momento. Inténtalo más tarde.', generationLimitError:'Se alcanzó el límite de creaciones de hoy. Vuelve mañana.', generationError:'No se pudo crear la imagen. Inténtalo de nuevo.', generationInProgress:'Ya hay una creación en curso en este navegador. Espera un momento.', storageUnavailable:'Activa el almacenamiento local del navegador para crear y guardar la tarjeta.', storageSaveError:'La tarjeta se creó, pero no pudo guardarse en este navegador. Descárgala ahora.', shareError:'No se pudo compartir la imagen en este navegador.', shareDownloadedCopied:'Imagen descargada y texto copiado. Envía ambos juntos.', shareDownloaded:'Imagen descargada. Envíala para compartir.', shareMessage:'Aprende la Biblia coloreando de forma divertida. Acabas de recibir *30% de descuento* - {url}', fileName:'regalo-de-bendicion'
    }
  };

  const params = new URLSearchParams(location.search);
  const UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
  function checkoutUrl(language) {
    const base = language === 'es'
      ? 'https://pay.hotmart.com/V107625840T?checkoutMode=10'
      : 'https://pay.hotmart.com/B107588580K?off=mfqr0cf8&checkoutMode=10&sck=biblica01';
    const url = new URL(base);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) url.searchParams.set(key, value);
    }
    return url.href;
  }
  const urlLanguage = ['pt','es'].includes(params.get('lang')) ? params.get('lang') : null;
  let manualLanguage = null;
  try { const stored = window.localStorage.getItem('bencao_language_v1'); if (['pt','es'].includes(stored)) manualLanguage = stored; } catch {}
  const localeHint = /-(AR|BO|BR|BZ|CL|CO|CR|CU|DO|EC|SV|GT|HT|HN|MX|NI|PA|PY|PE|PR|UY|VE)$/i.exec(navigator.language || '');
  let lang = manualLanguage || urlLanguage || (localeHint ? 'es' : 'pt');
  let countryCode = localeHint?.[1]?.toUpperCase() || '';
  const listeners = new Set();
  const t = key => copy[lang][key];
  const format = (key, values = {}) => t(key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');

  function applyStatic() {
    document.documentElement.lang = lang === 'es' ? 'es-419' : 'pt-PT';
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('description');
    document.querySelector('.ribbon').innerHTML = `<span class="ribbon-star">✦</span> ${t('ribbon')} <span class="ribbon-star">✦</span>`;
    document.querySelector('.quiz-progress .progress').setAttribute('aria-label', t('progress'));
    document.querySelector('.panel').setAttribute('aria-label', t('panel'));
    document.querySelectorAll('[data-example]').forEach(card => card.setAttribute('aria-label', format('example', { number:card.dataset.example })));
    document.querySelector('#example-modal').setAttribute('aria-label', t('modal'));
    document.querySelector('#photo-crop-modal').setAttribute('aria-label', t('cropTitle'));
    document.querySelector('#photo-crop-frame').setAttribute('aria-label', t('cropFrameAria'));
    document.querySelector('#photo-crop-out').setAttribute('aria-label', t('cropZoomOut'));
    document.querySelector('#photo-crop-in').setAttribute('aria-label', t('cropZoomIn'));
    document.querySelector('#photo-crop-cancel').setAttribute('aria-label', t('cropCancel'));
    document.querySelector('#photo-crop-confirm').setAttribute('aria-label', t('cropConfirm'));
    document.querySelector('.offer-flag').textContent = t('offerFlag');
    document.querySelector('.offer-kicker').textContent = t('offerKicker');
    document.querySelector('#offer-title').innerHTML = t('offerTitle');
    document.querySelector('.offer-product').alt = t('offerProductAlt');
    document.querySelector('.old-price').textContent = t('offerOldPrice');
    document.querySelector('.old-price').hidden = !t('offerOldPrice');
    document.querySelector('.offer-price').textContent = lang === 'es' ? 'US$ 9,70' : '9,70 €';
    document.querySelector('.payment-once').textContent = t('offerPayment');
    document.querySelectorAll('.offer-benefits li').forEach((item, index) => { item.textContent = t('offerBenefits')[index]; });
    document.querySelector('.payment-methods').alt = t('offerPaymentsAlt');
    document.querySelector('#floating-whatsapp').setAttribute('aria-label', lang === 'es' ? 'Hablar con nosotros por WhatsApp' : 'Falar connosco pelo WhatsApp');
    document.querySelector('#discount-offer a').textContent = t('offerButton');
    document.querySelector('#discount-offer a').href = checkoutUrl(lang);
  }

  function setLanguage(next, country = '') {
    const previousCountry = countryCode;
    if (country) countryCode = country;
    if (next === lang && previousCountry === countryCode) return;
    lang = next;
    applyStatic();
    listeners.forEach(listener => listener(lang, countryCode));
  }

  function start() {
    applyStatic();
    window.BENCAO_TRACKER.getGeo().then(geo => {
      const code = String(geo?.country_code || '').toUpperCase();
      if (code) setLanguage(manualLanguage || urlLanguage || (LATAM.has(code) ? 'es' : 'pt'), code);
    });
  }

  function chooseCountry(code) {
    if (code && !manualLanguage && !urlLanguage) setLanguage(LATAM.has(code) ? 'es' : 'pt', code);
  }

  function setManualLanguage(next) {
    if (!['pt','es'].includes(next)) return;
    manualLanguage = next;
    try { window.localStorage.setItem('bencao_language_v1', next); } catch {}
    setLanguage(next);
  }

  return { t, format, start, chooseCountry, setManualLanguage, onChange:listener => listeners.add(listener), get lang() { return lang; }, get countryCode() { return countryCode; }, isLatinAmerica:code => LATAM.has(code) };
})();
