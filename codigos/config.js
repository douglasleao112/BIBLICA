// Edite aqui textos, cartas, perfis, vídeo e links sem reconstruir a interface.
window.CODIGO4_CONFIG = {
  checkouts: {
    simple: 'https://pay.hotmart.com/T107665904F?off=it6mi6qu&checkoutMode=10',
    complete: 'https://pay.hotmart.com/T107665904F?checkoutMode=10'
  },
  videoUrl: 'assets/video/mini-vsl.mp4',
  vslTestOpen: true, // Durante os testes, permite iniciar o vídeo antes dos cinco checks.
  palmAnalysisUrl: 'https://zpupfwlufzbafwwebrgb.supabase.co/functions/v1/analyze-palm',
  // A leitura da mão usa a Edge Function; nenhum segredo privado é enviado ao navegador.
  // Esta chave anon é pública; OPENAI_API_KEY fica exclusivamente no Supabase.
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdXBmd2x1ZnpiYWZ3d2VicmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1OTYyNTMsImV4cCI6MjEwNTE3MjI1M30.YHgjIfU1nhFW4Ggkzr6WLg3wIkk5WOIWdJlQIe2wfl0',
  price: 'Preço a anunciar',
  guarantee: 'Condições e garantia a anunciar',
  diagnostics: {
    amor: {
      audio: 'assets/audio/amor.mp3',
      highlights: ['o amor', 'forma como se entrega', 'padrão emocional'],
      text: 'Interessante… a combinação das três cartas que escolheu revela um padrão que merece atenção. Isoladamente, cada carta tem o seu significado, mas no Código dos 4 Sinais procuramos algo mais importante: perceber se os diferentes sinais começam a alinhar-se na mesma direção. E como indicou que o amor é a área que mais procura compreender neste momento, esta combinação ganha um significado especial. Há aqui sinais ligados à forma como se entrega, ao que espera receber e a um padrão emocional que poderá estar a repetir-se. Mas não quero tirar conclusões ainda. Precisamos de cruzar estas cartas com os restantes sinais.'
    },
    'trabalho-dinheiro': {
      audio: 'assets/audio/trabalho-e-dinheiro.mp3',
      highlights: ['trabalho e no dinheiro', 'crescimento, decisões', 'dificultar o avanço'],
      text: 'Interessante… estas três cartas formaram uma combinação bastante particular. No Código dos 4 Sinais, não interpretamos uma carta isoladamente. Procuramos perceber se escolhas, nascimento, marcas da mão e momento atual começam a alinhar-se na mesma direção. E há um detalhe importante: indicou que procura respostas sobretudo no trabalho e no dinheiro. Nesta combinação aparecem sinais relacionados com crescimento, decisões e algo que poderá estar a dificultar o avanço que procura. Ainda não sabemos se é apenas uma coincidência ou o início de um padrão. Para isso, precisamos de encontrar os restantes sinais.'
    },
    'familia-pessoal': {
      audio: 'assets/audio/familia-e-vida.mp3',
      highlights: ['família e vida pessoal', 'relações, responsabilidades e decisões pessoais'],
      text: 'Há algo interessante na combinação que acabou de escolher. As três cartas parecem tocar em temas diferentes, mas existe um elemento que se repete entre elas. É precisamente isso que procuramos no Código dos 4 Sinais: pontos que começam a alinhar-se até formarem um padrão. Como escolheu família e vida pessoal, vou prestar especial atenção à forma como este padrão aparece nas suas relações, responsabilidades e decisões pessoais. Existe aqui um sinal que me chamou particularmente a atenção, mas seria demasiado cedo para interpretá-lo sozinho. Vamos agora cruzá-lo com a sua origem e com os restantes sinais.'
    },
    'bem-estar': {
      audio: 'assets/audio/saude-e-bem-estar.mp3',
      highlights: ['saúde e bem-estar', 'equilíbrio, hábitos, energia percebida e bem-estar pessoal'],
      text: 'A combinação que escolheu revelou um primeiro padrão interessante. No Código dos 4 Sinais, as cartas são apenas o início: precisamos de perceber se este sinal se alinha com o nascimento, as marcas da mão e aquilo que está a viver neste momento. Como indicou saúde e bem-estar, esta parte da leitura será interpretada apenas de forma simbólica, olhando sobretudo para equilíbrio, hábitos, energia percebida e bem-estar pessoal. Uma das suas escolhas reforçou particularmente esse tema. Mas ainda falta perceber se os outros sinais apontam na mesma direção. Vamos continuar a sua leitura.'
    },
    geral: {
      audio: 'assets/audio/outro.mp3',
      highlights: ['não limitou a sua procura a uma única área', 'fazer crescer, melhorar, desenvolver'],
      text: 'Interessante… as três cartas que escolheu já nos deram o primeiro sinal. E talvez seja ainda mais importante no seu caso, porque não limitou a sua procura a uma única área. Pode existir algo que queira fazer crescer, melhorar, desenvolver ou simplesmente compreender melhor na sua vida. No Código dos 4 Sinais, procuramos exatamente isso: cruzar elementos aparentemente separados até perceber se começam a alinhar-se na mesma direção. A sua combinação apresentou uma primeira correspondência, mas não quero influenciar a leitura antes de termos os restantes sinais. Vamos agora acrescentar a sua origem a esta análise.'
    }
  },
  cards: [
    { id: 'lua', image: 'assets/cards/lua.png', title: 'Lua', meaning: 'Escuta e tempo para compreender o que sente.', scores: { pessoal: 2, amor: 1 } },
    { id: 'fogo', image: 'assets/cards/fogo.png', title: 'Fogo', meaning: 'Coragem para considerar o próximo passo.', scores: { trabalho: 1, prosperidade: 1, geral: 1 } },
    { id: 'agua', image: 'assets/cards/agua.png', title: 'Água', meaning: 'Espaço para acolher emoções e relações.', scores: { amor: 1, relacionamento: 2 } },
    { id: 'ar', image: 'assets/cards/ar.png', title: 'Ar', meaning: 'Uma perspetiva mais clara sobre as escolhas.', scores: { pessoal: 1, trabalho: 1 } },
    { id: 'sol', image: 'assets/cards/sol.png', title: 'Sol', meaning: 'Expressão e abertura a novas possibilidades.', scores: { prosperidade: 1, amor: 1 } }
  ],
  areas: [
    { id: 'amor', icon: '♡', label: 'Amor', scores: { amor: 4, relacionamento: 1 } },
    { id: 'trabalho-dinheiro', icon: '◈', label: 'Trabalho e dinheiro', scores: { trabalho: 4, prosperidade: 4 } },
    { id: 'familia-pessoal', icon: '♧', label: 'Família e vida pessoal', scores: { relacionamento: 4, pessoal: 4 } },
    { id: 'bem-estar', icon: '❋', label: 'Saúde e bem-estar', scores: { pessoal: 3, geral: 1 } },
    { id: 'geral', icon: '✳', label: 'Outro', scores: { geral: 4 } }
  ],
  profiles: {
    amor: { label: 'Amor', insight: 'As suas escolhas sugerem uma atenção especial ao que deseja dar e receber numa ligação afetiva.' },
    relacionamento: { label: 'Relacionamento', insight: 'O seu percurso destaca a forma como se aproxima dos outros e os limites que procura compreender.' },
    prosperidade: { label: 'Prosperidade', insight: 'Surge um interesse em reconhecer oportunidades sem perder de vista as escolhas que estão nas suas mãos.' },
    trabalho: { label: 'Trabalho e propósito', insight: 'As respostas apontam para uma procura de direção e sentido no caminho que está a construir.' },
    pessoal: { label: 'Vida pessoal', insight: 'O fio comum parece ser a necessidade de escutar o seu próprio ritmo antes do próximo passo.' },
    geral: { label: 'Leitura geral', insight: 'Os sinais distribuem-se por diferentes áreas; a leitura convida a observar o que mais ressoa consigo agora.' }
  }
};
