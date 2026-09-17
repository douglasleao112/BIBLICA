// Referências visuais disponíveis para a futura geração de imagens por IA.
// Os personagens fixos não aparecem na etapa de seleção.
window.BENCAO_CHARACTER_CATALOG = Object.freeze({
  selectable: Object.freeze([
    { id: 'jesus', name: 'Jesus', image: 'jesus.png' },
    { id: 'maria', name: 'Maria', image: 'maria.png' },
    { id: 'noe', name: 'Noé', image: 'noe.png' },
    { id: 'moises', name: 'Moisés', image: 'moises.png' },
    { id: 'adao', name: 'Adão', image: 'adao.png' },
    { id: 'eva', name: 'Eva', image: 'eva.png' }
  ]),
  fixed: Object.freeze([
    { id: 'leao', name: 'Leão', image: 'references/leao.png' },
    { id: 'pomba', name: 'Pomba', image: 'references/pomba.png' },
    { id: 'cordeiro', name: 'Cordeiro', image: 'references/cordeiro.png' }
  ]),
  generation: Object.freeze({
    promptTemplate: 'prompt-mestre.md',
    visualReference: 'references/sample.png',
    aspectRatio: '4:5',
    recommendedResolution: '1024x1280',
    model: 'gpt-image-1-mini'
  })
});
