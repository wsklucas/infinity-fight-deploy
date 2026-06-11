export interface Drill  { nome: string; descricao: string }
export interface Jogo   { nome: string; descricao: string }

export interface FichaContent {
  tecnicas: string[]
  drills:   Drill[]
  jogos:    Jogo[]
}

export const FICHAS: Record<string, FichaContent> = {

  /* ── Nível 1 · Fundamentos ─────────────────────────────────────────── */

  '1A': {
    tecnicas: [
      'Guarda média neutra — pés na largura dos ombros, joelhos semiflexionados, queixo abaixado',
      'Pivot de 45° — sair da linha de ataque sem perder o equilíbrio',
      'Deslocamento lateral em quadrado (4 direções)',
      'Jab direto — extensão controlada sem levantar o ombro da guarda',
    ],
    drills: [
      {
        nome: 'Sombra no espelho',
        descricao:
          '3 × 2 min de sombra em frente ao espelho. Checklist: queixo abaixado, cotovelos baixos, peso nas pontas dos pés.',
      },
      {
        nome: 'Parceiro corrijo',
        descricao:
          'A lança jab; B observa e corrige postura após cada golpe. Trocar a cada 30 repetições.',
      },
      {
        nome: 'Pivot + jab',
        descricao:
          'A avança com jab; B pivota 45° e responde com jab. 3 séries de 20 repetições por lado.',
      },
    ],
    jogos: [
      {
        nome: 'Duelo de jabs',
        descricao:
          'Apenas jabs permitidos. 3 rounds de 2 min. Vence quem tocar mais vezes mantendo postura correta.',
      },
      {
        nome: 'Postura ganha pontos',
        descricao:
          'Árbitro aponta quem perde a guarda. 1 ponto por break de postura. Menos pontos vence (90 s).',
      },
    ],
  },

  '1B': {
    tecnicas: [
      'Cross — direto do lado dominante com rotação de quadril',
      'Gancho (hook) alto e baixo',
      'Combinação jab-cross (1-2)',
      'Combinação 1-2-3 (jab-cross-gancho)',
      'Chute de frente (teep) — empurrão com a sola do pé',
    ],
    drills: [
      {
        nome: 'Mitts com combinações',
        descricao:
          '4 × 3 min com parceiro de mitts. Foco: sequências 1-2 e 1-2-3 com respiração controlada.',
      },
      {
        nome: 'Combinação + saída',
        descricao:
          'A lança 1-2-3; B recebe nos mitts e responde com teep. 10 repetições cada.',
      },
    ],
    jogos: [
      {
        nome: 'Sequência obrigatória',
        descricao:
          'A anuncia a combinação; B executa e tenta contra-atacar. Trocar a cada 5 rounds de 90 s.',
      },
    ],
  },

  '1C': {
    tecnicas: [
      'Bloqueio alto (cobrir a cabeça com as mãos)',
      'Cobertura de corpo (elbow block para chutes baixos)',
      'Esquiva de cabeça — bob and weave',
      'Recuo em linha reta + pivot de saída',
    ],
    drills: [
      {
        nome: 'Feed e defesa',
        descricao:
          'A joga golpes predefinidos; B defende usando a técnica específica do dia. 5 × 3 min.',
      },
      {
        nome: 'Defesa + contra',
        descricao:
          'Após cada defesa bem-sucedida, B obrigatoriamente responde com jab. 3 séries de 15 reps.',
      },
    ],
    jogos: [
      {
        nome: 'Defenda ou pague',
        descricao:
          'Erro na defesa = 5 polichinelos. 3 rounds de 2 min. Adaptável ao nível de fadiga.',
      },
    ],
  },

  /* ── Nível 2 · Técnico ─────────────────────────────────────────────── */

  '2A': {
    tecnicas: [
      'Movimentação em L (lateral + recuo combinados)',
      'Stepping — passo-cruzado lateral mantendo a guarda',
      'Footwork em quadrado + saída de ângulo',
      'Clinch walk — empurrar e redirecionar o oponente',
    ],
    drills: [
      {
        nome: 'Cone de movimentação',
        descricao:
          'Cones em X no chão. A percorre o padrão enquanto B tenta encostá-la na parede. 4 × 90 s.',
      },
      {
        nome: 'Shadow com deslocamento',
        descricao:
          'Sombra focada em mover antes e depois de cada combinação. 3 × 3 min.',
      },
    ],
    jogos: [
      {
        nome: 'Encosta na parede',
        descricao:
          'B vence se encostar A; A vence se manter mobilidade por 2 min. Trocar papéis.',
      },
    ],
  },

  '2B': {
    tecnicas: [
      'Slip — esquiva lateral de cabeça (jab e cross)',
      'Parry — desvio de mão com a palma aberta',
      'Roll — giro de cabeça para evitar gancho',
      'Bloqueio de chute médio (elbow shield)',
      'Combinação defesa-contra: parry + cross imediato',
    ],
    drills: [
      {
        nome: 'Feed e slip',
        descricao:
          'A lança jab; B faz slip e responde com cross. Alternar lados a cada 10 reps. 4 séries.',
      },
      {
        nome: 'Parry + contra',
        descricao:
          'A lança jab; B faz parry com mão direita e responde com cross imediato. 3 × 20 reps.',
      },
      {
        nome: 'Combinação de defesas',
        descricao:
          'A lança 1-2-3; B usa parry no 1, slip no 2 e bloqueio no 3. 4 séries de 10 reps.',
      },
    ],
    jogos: [
      {
        nome: 'Espelho de defesas',
        descricao:
          'A inicia com qualquer golpe; B deve defender e espelhar a combinação de volta. 3 × 2 min.',
      },
      {
        nome: 'Defenda ou pague (avançado)',
        descricao:
          'Erro na defesa = 3 polichinelos e recomeça do zero. Foco em slip e parry. 4 × 90 s.',
      },
    ],
  },

  '2C': {
    tecnicas: [
      'Entrada no clinch (underhook duplo)',
      'Quebra de clinch (push + step lateral)',
      'Finta de jab — mostrar e não executar',
      'Finta de chute — levantar o joelho sem chutar',
      'Combinação finta-real: finta-jab / real-cross',
    ],
    drills: [
      {
        nome: 'Clinch controlado',
        descricao:
          'A tenta fechar o clinch; B tenta quebrar. Trabalho de posição, sem golpes. 5 × 2 min.',
      },
      {
        nome: 'Finta e reação',
        descricao:
          'A executa fintas variadas; B reage defensivamente. Avaliar leitura da finta. 4 × 2 min.',
      },
    ],
    jogos: [
      {
        nome: 'Finta ganha ponto',
        descricao:
          'Cada finta que "vendeu" (B reagiu) vale 1 ponto. 3 rounds de 2 min. Contar com árbitro.',
      },
    ],
  },

  /* ── Nível 3 · Tático ──────────────────────────────────────────────── */

  '3A': {
    tecnicas: [
      'Leitura de intenção pelo ombro/cotovelo antes do golpe sair',
      'Ataque por ângulo externo — sair da linha e atacar o flanco',
      'Contra-timing — atacar no início do ataque adversário',
      'Controle de distância (range control) pelo jab',
    ],
    drills: [
      {
        nome: 'Leitura de shoulder tell',
        descricao:
          'A faz movimentos de ombro; B identifica jab ou cross ANTES do golpe sair. 5 × 2 min.',
      },
      {
        nome: 'Ângulo externo',
        descricao:
          'A lança 1-2; B passa por fora e ataca o flanco. Repetir dos dois lados. 3 séries de 12.',
      },
    ],
    jogos: [
      {
        nome: 'Leitura premiada',
        descricao:
          'B ganha ponto por cada golpe antecipado (bloqueado antes de sair). Árbitro conta. 3 × 2 min.',
      },
    ],
  },

  '3B': {
    tecnicas: [
      'Hand trap — captura do pulso do oponente para abrir guarda',
      'Puxada de cabeça para gancho',
      'Counter no recuo — atacar o vácuo deixado',
      'Pressão constante com encosto na corda',
    ],
    drills: [
      {
        nome: 'Hand trap drill',
        descricao:
          'A estende jab; B captura o pulso e lança gancho. Cuidado com velocidade. 3 × 15 reps.',
      },
      {
        nome: 'Counter no recuo',
        descricao:
          'A recua em linha; B treina atacar o vácuo. Alternado com pressão para corda. 4 × 2 min.',
      },
    ],
    jogos: [
      {
        nome: 'Armadilha vs evasão',
        descricao:
          'A tenta armar; B tenta evadir. Contar armadilhas bem-sucedidas. 3 × 2 min.',
      },
    ],
  },

  '3C': {
    tecnicas: [
      'Box breathing — respiração 4-4-4-4 sob pressão',
      'Ritmo de luta — burst de 20 s + recuperação de 10 s',
      'Adaptação ao estilo do oponente no round',
      'Manutenção emocional sob provocação',
    ],
    drills: [
      {
        nome: 'Box breathing sob pressão',
        descricao:
          'A pressiona fisicamente; B mantém respiração 4-4-4-4 enquanto defende. 3 × 3 min.',
      },
      {
        nome: 'Ritmo proposital',
        descricao:
          'B explode 20 s, descansa 10 s, explode novamente. A não sabe quando virá o burst. 5 séries.',
      },
    ],
    jogos: [
      {
        nome: 'Controle emocional',
        descricao:
          'A pressiona verbalmente e fisicamente. B vence se manter o plano por 3 min sem reagir fora dele.',
      },
    ],
  },

  /* ── Nível 4 · Competidor ──────────────────────────────────────────── */

  '4A': {
    tecnicas: [
      'Jogo de assinatura — identificar e consolidar as 3 melhores combinações',
      'Usar o próprio "tell" como isca',
      'Estratégia de abertura de round',
      'Plano A e plano B para cada perfil de adversário',
    ],
    drills: [
      {
        nome: 'Jogo de assinatura',
        descricao:
          'B luta usando apenas suas 3 melhores combinações. Instrutor avalia efetividade. 5 × 3 min.',
      },
    ],
    jogos: [
      {
        nome: 'Análise tática ao vivo',
        descricao:
          'Após 2 min de sparring, pausar. B descreve o que percebeu e adapta o plano. Repetir 3×.',
      },
    ],
  },

  '4B': {
    tecnicas: [
      'Simulação de regras de competição específica',
      'Gestão de pontuação no round (saber quando está na frente)',
      'Protocolo de recuperação entre rounds',
      'Trabalhar para os juízes (atividade visível)',
    ],
    drills: [
      {
        nome: 'Sparring com juízes',
        descricao:
          '3 × 3 min com 2 colegas como árbitros. Ao final, debatem quem venceu e por quê.',
      },
    ],
    jogos: [
      {
        nome: 'Recupera o round',
        descricao:
          'B começa "perdendo" (2 pontos abaixo). Tem 2 min para recuperar. Repetir com adversários diferentes.',
      },
    ],
  },

  '4C': {
    tecnicas: [
      'Análise de filmagem própria (3 pontos de melhoria por sessão)',
      'Preparação específica por oponente',
      'Periodização e gestão de carreira',
      'Mentalidade de performance de alto nível',
    ],
    drills: [
      {
        nome: 'Filmagem e análise',
        descricao:
          'Sessão de sparring filmada. Revisão quinzenal com o instrutor focando em 3 pontos de melhoria.',
      },
    ],
    jogos: [
      {
        nome: 'Camp simulado',
        descricao:
          'Semana de preparação para "adversário virtual" com perfil definido pelo instrutor. Avaliação de adaptação ao final.',
      },
    ],
  },
}

export const EMPTY_FICHA: FichaContent = { tecnicas: [], drills: [], jogos: [] }
