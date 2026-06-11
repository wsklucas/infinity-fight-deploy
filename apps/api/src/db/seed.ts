import { PrismaClient, CriterionType, CriterionCategory, FichaCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUBLEVELS = [
  { id: '1A', level: 1, label: 'Postura, base e primeiros golpes', description: 'Construir base técnica, equilíbrio, coordenação e postura.', order: 1 },
  { id: '1B', level: 1, label: 'Chutes, esquivas e combinações', description: 'Introduzir chutes, defesas e combinações básicas.', order: 2 },
  { id: '1C', level: 1, label: 'Distância, defesa ativa e sparring leve', description: 'Controle de distância e primeiras defesas ativas.', order: 3 },
  { id: '2A', level: 2, label: 'Movimentação, combinações e ritmo', description: 'Unir técnica e fluidez com movimentação.', order: 4 },
  { id: '2B', level: 2, label: 'Defesas combinadas, timing e contra-ataque', description: 'Defesas combinadas e início do contra-ataque.', order: 5 },
  { id: '2C', level: 2, label: 'Clínch, fintas e estratégia inicial', description: 'Introdução ao clínch e primeiro jogo tático.', order: 6 },
  { id: '3A', level: 3, label: 'Leitura de padrões e controle de ângulo', description: 'Desenvolver fight IQ e controle de ângulo.', order: 7 },
  { id: '3B', level: 3, label: 'Armadilhas, indução avançada e clínch ofensivo', description: 'Armadilhas táticas e clínch ofensivo.', order: 8 },
  { id: '3C', level: 3, label: 'Psicologia de combate e adaptação de plano', description: 'Controle emocional e adaptação em tempo real.', order: 9 },
  { id: '4A', level: 4, label: 'Estilo pessoal e jogo próprio', description: 'Consolidar estilo pessoal e repertório.', order: 10 },
  { id: '4B', level: 4, label: 'Preparação competitiva e periodização', description: 'Preparação para competição real.', order: 11 },
  { id: '4C', level: 4, label: 'Elite — competidor formado', description: 'Repertório completo automatizado sob pressão.', order: 12 },
]

const CRITERIA: Array<{
  sublevelId: string
  type: CriterionType
  category: CriterionCategory
  text: string
  context?: string
  minimumValue?: number
  order: number
}> = [
  // 1A
  { sublevelId: '1A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Mantém postura e guarda corretas durante todo o round de shadowboxing', order: 1 },
  { sublevelId: '1A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Jab e direto com alinhamento correto e retorno imediato à guarda', order: 2 },
  { sublevelId: '1A', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Teep frontal com quadril abrindo e equilíbrio na perna de apoio', order: 3 },
  { sublevelId: '1A', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Guarda Alta Fechada absorve sequência sem abrir cotovelo', order: 4 },
  { sublevelId: '1A', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Solta o ar no golpe — não prende a respiração ao atacar', order: 5 },
  // 1B
  { sublevelId: '1B', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Dteh Tad com pivô do pé de apoio e quadril abrindo — visível no saco e no pad', order: 1 },
  { sublevelId: '1B', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Bang (check) Noi ou Nai correto — canela intercepta sem perder a guarda', order: 2 },
  { sublevelId: '1B', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Teep Kang com quadril girando para o lado antes de estender a perna', order: 3 },
  { sublevelId: '1B', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Bloqueio em X correto: fecha os dois braços sem abrir antes do chute encaixar', order: 4 },
  { sublevelId: '1B', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Combinações de 3 golpes fluidas no saco — 4/5 repetições sem pausa', minimumValue: 4, order: 5 },
  // 1C
  { sublevelId: '1C', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Postura e guarda mantidas durante sparring leve', context: 'Apenas jabs e teeps', order: 1 },
  { sublevelId: '1C', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Dteh Cheang executado sem telegrafar — quadril já posicionado antes do golpe', order: 2 },
  { sublevelId: '1C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Parry de jab com resposta de direto — toque leve, não empurrão', order: 3 },
  { sublevelId: '1C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Pivot sem cruzar base e sem perder guarda', order: 4 },
  { sublevelId: '1C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Tad Mala: fecha o bloqueio e responde sem pausar', order: 5 },
  { sublevelId: '1C', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Controla respiração durante 2 rounds de sparring leve', context: 'Não prende, não ofega excessivamente', order: 6 },
  // 2A
  { sublevelId: '2A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Movimentação lateral sem cruzar a base durante combinações', order: 1 },
  { sublevelId: '2A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Jab acompanha passada para frente — pé e punho chegam juntos', order: 2 },
  { sublevelId: '2A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Bate avançando e recuando sem perder equilíbrio ou guarda', context: 'Pad work', order: 3 },
  { sublevelId: '2A', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Combinações de 4 golpes com alternância alta/baixa — 4/5 fluidas', minimumValue: 4, order: 4 },
  { sublevelId: '2A', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Quebra de ritmo intencional visível: lento → explosão (instrutor confirma)', order: 5 },
  // 2B
  { sublevelId: '2B', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Slip Noi/Nai com rotação de tronco — pés não se movem, contra imediato', order: 1 },
  { sublevelId: '2B', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Bang + resposta no mesmo movimento — sem pausar entre defesa e contra', order: 2 },
  { sublevelId: '2B', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Defesa de joelho: frame no quadril antes do Khao encaixar', context: 'Parceiro anuncia e depois sem aviso', order: 3 },
  { sublevelId: '2B', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Perna segurada: executa pelo menos 2 saídas', context: 'Drill com parceiro', order: 4 },
  { sublevelId: '2B', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'No sparring de só contra-ataque, responde a 7/10 ataques com técnica limpa', minimumValue: 7, order: 5 },
  // 2C
  { sublevelId: '2C', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Plam — entrada de clínch com controle após combinação', context: 'Sparring', order: 1 },
  { sublevelId: '2C', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Khao Tee com trajetória de arco de fora para dentro, não chute lateral', order: 2 },
  { sublevelId: '2C', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Catch completo com pelo menos 2 saídas', context: 'Chute controlado do parceiro', order: 3 },
  { sublevelId: '2C', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Low kick no tempo de transferência de peso — instrutor confirma o timing', context: 'Drill', order: 4 },
  { sublevelId: '2C', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Finta com intenção real: adversário reage', context: 'Sparring, não drill', order: 5 },
  { sublevelId: '2C', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Induz o golpe do adversário pelo menos 2x em sparring de 3 rounds', minimumValue: 2, order: 6 },
  // 3A
  { sublevelId: '3A', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Salab Ka (switch stance) fluido e não telegrafado', context: 'Em sparring, não apenas em drill', order: 1 },
  { sublevelId: '3A', type: 'BLOCKER', category: 'QUANTITATIVE', text: 'Sai da linha de ataque e reposiciona com ângulo favorável — 3x em sparring', minimumValue: 3, order: 2 },
  { sublevelId: '3A', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Identifica e nomeia 2 padrões repetidos do adversário após sparring', minimumValue: 2, order: 3 },
  { sublevelId: '3A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Pivot tático: sai da linha de pressão sem recuar em linha reta', context: 'Sparring com adversário que pressiona', order: 4 },
  { sublevelId: '3A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Low kick de quebra de postura no timing certo', context: 'Instrutor confirma o momento do impacto', order: 5 },
  // 3B
  { sublevelId: '3B', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Executa indução com encontro em sparring', context: 'Não apenas em drill controlado', order: 1 },
  { sublevelId: '3B', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Domina entrada de clínch ofensivo com sequência completa', context: 'Sparring', order: 2 },
  { sublevelId: '3B', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Usa distância falsa e retorna com golpe no timing certo — 2x em sparring', minimumValue: 2, order: 3 },
  { sublevelId: '3B', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Off-balancing: desequilibra o adversário no clínch pelo menos 3x em sparring', minimumValue: 3, order: 4 },
  { sublevelId: '3B', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Demonstra gestão de energia: não gasta força desnecessária em 4 rounds', order: 5 },
  // 3C
  { sublevelId: '3C', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Adapta estratégia em tempo real durante sparring', context: 'Instrutor confirma mudança intencional', order: 1 },
  { sublevelId: '3C', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Reset técnico imediato após golpe forte — postura e guarda em menos de 2 segundos', order: 2 },
  { sublevelId: '3C', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Leitura de luta clara: identifica padrão e responde taticamente — 2x por round', minimumValue: 2, order: 3 },
  { sublevelId: '3C', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Usa teep exclusivamente como controle de distância em pelo menos 1 round', context: 'Sparring', order: 4 },
  { sublevelId: '3C', type: 'COMPLEMENTARY', category: 'QUANTITATIVE', text: 'Demonstra pelo menos 2 mudanças táticas intencionais em sparring de 5 rounds', minimumValue: 2, order: 5 },
  // 4A
  { sublevelId: '4A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Jogo próprio reconhecível e consistente em sparring — instrutor identifica o estilo', order: 1 },
  { sublevelId: '4A', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Transições entre distâncias fluidas e automatizadas — sem pausas visíveis', order: 2 },
  { sublevelId: '4A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Feint real: instrutor/parceiro reage ao feint', context: 'Sparring, não drill', order: 3 },
  { sublevelId: '4A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Adapta estilo ao adversário no round seguinte após instrução', context: 'Intervalo', order: 4 },
  { sublevelId: '4A', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Mantém controle técnico sob cansaço em todos os rounds', context: '5 rounds pesados', order: 5 },
  // 4B
  { sublevelId: '4B', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Muda plano de luta no round seguinte após instrução do corner', context: 'Simulação', order: 1 },
  { sublevelId: '4B', type: 'BLOCKER', category: 'OBSERVABLE', text: 'Vence round por tática — árbitro confirma pela pontuação tailandesa', order: 2 },
  { sublevelId: '4B', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Mantém controle técnico pleno no 5º round de sparring pesado', context: 'Fadiga máxima', order: 3 },
  { sublevelId: '4B', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Executa protocolo de recuperação nos 60 segundos de intervalo sem instrução', order: 4 },
  { sublevelId: '4B', type: 'COMPLEMENTARY', category: 'CONTEXTUAL', text: 'Usa Plam taticamente para quebrar ritmo — não apenas para atacar', context: 'Sparring', order: 5 },
  // 4C
  { sublevelId: '4C', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Mantém controle técnico completo sob cansaço e pressão máximos', context: 'Simulação de luta', order: 1 },
  { sublevelId: '4C', type: 'BLOCKER', category: 'CONTEXTUAL', text: 'Leitura completa do oponente: adapta em tempo real com adversário desconhecido', context: 'Sparring', order: 2 },
  { sublevelId: '4C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Ritmo, distância e estratégia automatizados — sem hesitação visível', order: 3 },
  { sublevelId: '4C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Vence por tática — análise de vídeo confirma decisões intencionais', order: 4 },
  { sublevelId: '4C', type: 'COMPLEMENTARY', category: 'OBSERVABLE', text: 'Maturidade emocional: mantém postura em situação adversa', order: 5 },
]

const FICHA_ITEMS: Array<{
  sublevelId: string
  category: FichaCategory
  title: string
  description: string
  order: number
}> = [
  // 1A — Técnicas
  { sublevelId: '1A', category: 'TECNICA', title: 'Guarda média neutra', description: 'Pés na largura dos ombros, joelhos semiflexionados, queixo abaixado.', order: 1 },
  { sublevelId: '1A', category: 'TECNICA', title: 'Pivot de 45°', description: 'Sair da linha de ataque sem perder o equilíbrio.', order: 2 },
  { sublevelId: '1A', category: 'TECNICA', title: 'Deslocamento lateral em quadrado', description: 'Movimentação nas 4 direções mantendo a base.', order: 3 },
  { sublevelId: '1A', category: 'TECNICA', title: 'Jab direto', description: 'Extensão controlada sem levantar o ombro da guarda.', order: 4 },
  // 1A — Drills
  { sublevelId: '1A', category: 'DRILL_FIXACAO', title: 'Sombra no espelho', description: '3 × 2 min de sombra em frente ao espelho. Checklist: queixo abaixado, cotovelos baixos, peso nas pontas dos pés.', order: 1 },
  { sublevelId: '1A', category: 'DRILL_FIXACAO', title: 'Parceiro corrijo', description: 'A lança jab; B observa e corrige postura após cada golpe. Trocar a cada 30 repetições.', order: 2 },
  { sublevelId: '1A', category: 'DRILL_FIXACAO', title: 'Pivot + jab', description: 'A avança com jab; B pivota 45° e responde com jab. 3 séries de 20 repetições por lado.', order: 3 },
  // 1A — Jogos
  { sublevelId: '1A', category: 'JOGO_TATICO', title: 'Duelo de jabs', description: 'Apenas jabs permitidos. 3 rounds de 2 min. Vence quem tocar mais vezes mantendo postura correta.', order: 1 },
  { sublevelId: '1A', category: 'JOGO_TATICO', title: 'Postura ganha pontos', description: 'Árbitro aponta quem perde a guarda. 1 ponto por break de postura. Menos pontos vence (90 s).', order: 2 },
  // 2B — Técnicas
  { sublevelId: '2B', category: 'TECNICA', title: 'Slip — esquiva lateral de cabeça', description: 'Esquiva lateral para jab e cross, mantendo equilíbrio.', order: 1 },
  { sublevelId: '2B', category: 'TECNICA', title: 'Parry — desvio de mão', description: 'Desvio com a palma aberta, pronto para o contra-ataque.', order: 2 },
  { sublevelId: '2B', category: 'TECNICA', title: 'Roll — giro de cabeça', description: 'Giro de cabeça para evitar gancho.', order: 3 },
  { sublevelId: '2B', category: 'TECNICA', title: 'Bloqueio de chute médio', description: 'Elbow shield para chutes na altura do corpo.', order: 4 },
  { sublevelId: '2B', category: 'TECNICA', title: 'Parry + cross imediato', description: 'Combinação defesa-contra: parry no jab e cross imediato sem pausa.', order: 5 },
  // 2B — Drills
  { sublevelId: '2B', category: 'DRILL_FIXACAO', title: 'Feed e slip', description: 'A lança jab; B faz slip e responde com cross. Alternar lados a cada 10 reps. 4 séries.', order: 1 },
  { sublevelId: '2B', category: 'DRILL_FIXACAO', title: 'Parry + contra', description: 'A lança jab; B faz parry com mão direita e responde com cross imediato. 3 × 20 reps.', order: 2 },
  { sublevelId: '2B', category: 'DRILL_FIXACAO', title: 'Combinação de defesas', description: 'A lança 1-2-3; B usa parry no 1, slip no 2 e bloqueio no 3. 4 séries de 10 reps.', order: 3 },
  // 2B — Jogos
  { sublevelId: '2B', category: 'JOGO_TATICO', title: 'Espelho de defesas', description: 'A inicia com qualquer golpe; B deve defender e espelhar a combinação de volta. 3 × 2 min.', order: 1 },
  { sublevelId: '2B', category: 'JOGO_TATICO', title: 'Defenda ou pague (avançado)', description: 'Erro na defesa = 3 polichinelos e recomeça do zero. Foco em slip e parry. 4 × 90 s.', order: 2 },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Academy
  const academy = await prisma.academy.upsert({
    where: { slug: 'infinity-fight-bsb' },
    update: {},
    create: {
      name: 'Infinity Fight Brasília',
      slug: 'infinity-fight-bsb',
      plan: 'PRO',
    },
  })
  console.log('✅ Academy created')

  // Admin
  const adminPwd = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@infinityfight.com' },
    update: {},
    create: {
      academyId: academy.id,
      name: 'Admin Infinity',
      email: 'admin@infinityfight.com',
      password: adminPwd,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin created')

  // Instructor
  const instructorPwd = await bcrypt.hash('instructor123', 10)
  const instructor = await prisma.user.upsert({
    where: { email: 'instrutor@infinityfight.com' },
    update: {},
    create: {
      academyId: academy.id,
      name: 'Mestre Silva',
      email: 'instrutor@infinityfight.com',
      password: instructorPwd,
      role: 'INSTRUCTOR',
    },
  })
  console.log('✅ Instructor created')

  // Students
  const studentPwd = await bcrypt.hash('aluno123', 10)
  const studentUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'rafael@teste.com' },
      update: {},
      create: { academyId: academy.id, name: 'Rafael Pereira', email: 'rafael@teste.com', password: studentPwd, role: 'STUDENT' },
    }),
    prisma.user.upsert({
      where: { email: 'marina@teste.com' },
      update: {},
      create: { academyId: academy.id, name: 'Marina Costa', email: 'marina@teste.com', password: studentPwd, role: 'STUDENT' },
    }),
    prisma.user.upsert({
      where: { email: 'lucas@teste.com' },
      update: {},
      create: { academyId: academy.id, name: 'Lucas Mendes', email: 'lucas@teste.com', password: studentPwd, role: 'STUDENT' },
    }),
  ])

  await prisma.student.upsert({
    where: { userId: studentUsers[0].id },
    update: {},
    create: { userId: studentUsers[0].id, instructorId: instructor.id, currentSublevel: '2B', intakeSublevel: '1A', styleTags: ['Muay Mat', 'Pressão'], currentStreak: 7, trainingDays: 47 },
  })
  await prisma.student.upsert({
    where: { userId: studentUsers[1].id },
    update: {},
    create: { userId: studentUsers[1].id, instructorId: instructor.id, currentSublevel: '1C', intakeSublevel: '1C', styleTags: ['Iniciante'], currentStreak: 2, trainingDays: 6 },
  })
  await prisma.student.upsert({
    where: { userId: studentUsers[2].id },
    update: {},
    create: { userId: studentUsers[2].id, instructorId: instructor.id, currentSublevel: '3A', intakeSublevel: '2A', styleTags: ['Muay Fimeu', 'Competidor'], currentStreak: 12, trainingDays: 112 },
  })
  console.log('✅ Students created')

  // Sublevels
  for (const sub of SUBLEVELS) {
    await prisma.sublevel.upsert({
      where: { id: sub.id },
      update: {},
      create: sub,
    })
  }
  console.log('✅ Sublevels created')

  // Criteria
  for (const crit of CRITERIA) {
    await prisma.criterion.upsert({
      where: { id: `${crit.sublevelId}-${crit.order}` },
      update: {},
      create: { id: `${crit.sublevelId}-${crit.order}`, ...crit },
    })
  }
  console.log('✅ Criteria created')

  // FichaItems — seed only if none exist for this academy
  const existingFichaItems = await prisma.fichaItem.count({ where: { academyId: academy.id } })
  if (existingFichaItems === 0) {
    await prisma.fichaItem.createMany({
      data: FICHA_ITEMS.map(item => ({ ...item, academyId: academy.id })),
    })
    console.log('✅ FichaItems created')
  } else {
    console.log('⏭️  FichaItems already exist, skipping')
  }

  console.log('\n🎉 Seed complete!')
  console.log('📧 Admin:      admin@infinityfight.com / admin123')
  console.log('📧 Instructor: instrutor@infinityfight.com / instructor123')
  console.log('📧 Student:    rafael@teste.com / aluno123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
