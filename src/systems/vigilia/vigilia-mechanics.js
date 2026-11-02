/**
 * vigilia-mechanics.js
 * Mecânicas de Regras Oficiais do Playtest Contos da Vigília (Ordem Paranormal II)
 * - Tabelas de Lesões (1d20), Traumas (1d20) e Falhas Críticas (1d8)
 * - Assistentes de Teste de Lesão (0 PV) e Teste de Trauma (0 PD)
 * - Sistema de Relações (Graus 1 a 3) e Invocações na Missão
 * - Dado de Pavor (d6 -> d8 -> d10 -> d12), Controlar e Abraçar
 * - Pontos de Armadura e Dano com Rolagem Alta (RA + X)
 */

export const LESOES_TABLE = [
  { min: 1, max: 4, name: 'Morte Súbita', desc: 'Você morre! Hora de criar um personagem novo.', fatal: true },
  { min: 5, max: 9, name: 'Morte Lenta', desc: 'O ferimento é fatal, mas gera um surto de adrenalina que permite a você agir uma última vez. Você recupera 1 PV e acorda, podendo agir na rodada seguinte. Contudo, ao fim dela, você morre. Nenhum efeito pode impedir isso.', fatal: true, pvBonus: 1 },
  { min: 10, max: 10, name: 'Laceração Profunda', desc: 'Uma ferida que reduz sua capacidade física permanente. Perde 2 PV máximo.', maxPvPenalty: 2 },
  { min: 11, max: 11, name: 'Sem Olho', desc: 'Você perde o uso de um olho. Sofre –1 permanente em Percepção e Pontaria.', skillPenalties: { 'PERCEPÇÃO': -1, 'PONTARIA': -1 } },
  { min: 12, max: 12, name: 'Sem Mão', desc: 'Você perde o uso de uma mão ou braço. Só pode empunhar um item e, em tarefas que precisam das duas mãos, sofre uma redução de passo ou falha.', handLost: true },
  { min: 13, max: 13, name: 'Sem Pé', desc: 'Você perde o uso de um pé ou perna. Sofre duas reduções de passo em testes de movimentar-se e em perseguição a pé.', footLost: true },
  { min: 14, max: 14, name: 'Tendão Comprometido', desc: 'Um de seus tendões tem capacidade reduzida, diminuindo agilidade e flexibilidade. Sofre –2 em Acrobacia.', skillPenalties: { 'ACROBACIA': -2 } },
  { min: 15, max: 15, name: 'Músculo Comprometido', desc: 'Um de seus músculos se rompe, diminuindo sua força motriz. Sofre –2 em Atletismo.', skillPenalties: { 'ATLETISMO': -2 } },
  { min: 16, max: 16, name: 'Órgão Interno Comprometido', desc: 'Um órgão vital é lesionado, reduzindo sua resistência corporal. Sofre –2 em Vigor.', skillPenalties: { 'VIGOR': -2 } },
  { min: 17, max: 17, name: 'Órgão Sensorial Comprometido', desc: 'Seus ouvidos ou sentidos são afetados pelo choque. Sofre –2 em Percepção.', skillPenalties: { 'PERCEPÇÃO': -2 } },
  { min: 18, max: 18, name: 'Cicatriz Horrenda', desc: 'A ferida deixa uma marca assustadora. Sofre –2 em Persuasão e ganha +1 em Intimidar.', skillPenalties: { 'PERSUASÃO': -2, 'INTIMIDAR': 1 } },
  { min: 19, max: 19, name: 'Contusão Séria', desc: 'Trauma contuso intenso. Sofre uma redução de passo no atributo Físico até o fim da cena.', tempStepPenalty: 'Físico' },
  { min: 20, max: 99, name: 'Surto de Adrenalina', desc: 'O ferimento não deixa sequelas duradouras e o choque faz seu corpo reagir: você recupera 1 PV!', pvBonus: 1 }
];

export const TRAUMAS_TABLE = [
  { min: 1, max: 4, name: 'Colapso Total', desc: 'Sua mente se estilhaça diante do horror incompreensível. Você enlouquece permanentemente.', insane: true },
  { min: 5, max: 7, name: 'TEPT', desc: 'Transtorno de Estresse Pós-Traumático. Você sofre +1 ponto de dano emocional sempre que sofrer dano emocional.', extraDamage: 1 },
  { min: 8, max: 9, name: 'Degradação Cognitiva', desc: 'O trauma prejudica seu raciocínio lógico e concentração. Sofre uma redução permanente de passo em Mente.', stepPenalty: 'Mente' },
  { min: 10, max: 10, name: 'Mácula Emocional', desc: 'O terror consome sua empatia e estabilidade. Sofre uma redução permanente de passo em Emoção.', stepPenalty: 'Emoção' },
  { min: 11, max: 12, name: 'Chaga da Alma', desc: 'Seu espírito se quebra e a vontade de viver se esvai. Perde 2 PD máximo permanente.', maxPdPenalty: 2 },
  { min: 13, max: 14, name: 'Retração Defensiva', desc: 'O trauma faz você se fechar em si mesmo e evitar contatos sociais. Sofre –2 permanente em Persuasão e Intuição.', skillPenalties: { 'PERSUASÃO': -2, 'INTUIÇÃO': -2 } },
  { min: 15, max: 17, name: 'Pânico', desc: 'O pavor se instala no seu coração! Você recebe um Dado de Pavor (ou ele sobe 1 passo se já tiver).', pavor: true },
  { min: 18, max: 19, name: 'Estupor Catatônico', desc: 'Você fica completamente paralisado de horror. Perde sua ação na próxima rodada.', stunned: true },
  { min: 20, max: 99, name: 'Injeção de Ânimo', desc: 'O terror não deixa sequelas duradouras e um lampejo de coragem renova suas forças: recupera 1 PD!', pdBonus: 1 }
];

export const FALHAS_CRITICAS_TABLE = [
  { roll: 1, name: 'Arma Quebrada / Avariada', desc: 'A arma se rompe, emperra ou perde o fio. Inutilizada até ser consertada com um teste de Ofício.' },
  { roll: 2, name: 'Fogo Amigo / Golpe Desastrado', desc: 'Seu golpe erra desastrosamente e atinge um aliado ou ser adjacente, causando dano igual à Rolagem Alta (RA).' },
  { roll: 3, name: 'Desarmado / Queda de Item', desc: 'A arma ou item escapa de suas mãos e cai a alcance curto de você.' },
  { roll: 4, name: 'Tropeço / Caído', desc: 'Você perde o equilíbrio e cai no chão (sofre redução de passo em testes físicos; inimigos ganham aumento de passo).' },
  { roll: 5, name: 'Guarda Totalmente Aberta', desc: 'Você se expõe completamente. O próximo ataque contra você recebe um aumento de passo.' },
  { roll: 6, name: 'Fracasso Desmoralizante', desc: 'A humilhação ou o choque abalam sua autoconfiança. Você sofre 1d4 pontos de dano emocional.' },
  { roll: 7, name: 'Distensão Muscular', desc: 'Você força um músculo ou articulação. Sofre –2 em testes físicos até o final da próxima rodada.' },
  { roll: 8, name: 'Hesitação / Congelamento', desc: 'O choque do erro faz você hesitar. Perde a sua próxima ação nesta rodada.' }
];

/**
 * Consulta o efeito de uma rolagem na tabela de Lesões
 */
export function getLesaoResult(roll) {
  return LESOES_TABLE.find(item => roll >= item.min && roll <= item.max) || LESOES_TABLE[LESOES_TABLE.length - 1];
}

/**
 * Consulta o efeito de uma rolagem na tabela de Traumas
 */
export function getTraumaResult(roll) {
  return TRAUMAS_TABLE.find(item => roll >= item.min && roll <= item.max) || TRAUMAS_TABLE[TRAUMAS_TABLE.length - 1];
}

/**
 * Consulta o efeito de uma rolagem na tabela de Falhas Críticas
 */
export function getFalhaCriticaResult(roll) {
  return FALHAS_CRITICAS_TABLE.find(item => item.roll === roll) || FALHAS_CRITICAS_TABLE[0];
}

/**
 * Retorna os benefícios de invocação conforme o grau de relação
 */
export function getRelationBenefits(degree) {
  const d = Number(degree) || 1;
  if (d === 1) {
    return [
      { id: 'bonus_test', label: '+1d6 no seu teste', desc: 'Recebe +1d6 em um teste diretamente relacionado à pessoa.', die: 6 },
      { id: 'bonus_help', label: '+1d6 ao Ajudar', desc: 'Ao fazer a ação Ajudar, fornece +1d6 no teste da pessoa (além do aumento de passo normal).', die: 6 }
    ];
  }
  if (d === 2) {
    return [
      { id: 'bonus_test', label: '+1d8 no seu teste', desc: 'Recebe +1d8 em um teste diretamente relacionado à pessoa.', die: 8 },
      { id: 'bonus_help', label: '+1d8 ao Ajudar', desc: 'Ao fazer a ação Ajudar, fornece +1d8 no teste da pessoa (além do aumento de passo normal).', die: 8 },
      { id: 'motivate_pd', label: 'Motivar (Recupera 2d4 PD)', desc: 'Gasta 1 ação para motivar a pessoa com palavras de ânimo: ela recupera 2d4 PD!', formula: '2d4' }
    ];
  }
  return [
    { id: 'bonus_test', label: '+1d12 no seu teste', desc: 'Recebe +1d12 em um teste diretamente relacionado à pessoa.', die: 12 },
    { id: 'bonus_help', label: '+1d12 ao Ajudar', desc: 'Ao fazer a ação Ajudar, fornece +1d12 no teste da pessoa (além do aumento de passo normal).', die: 12 },
    { id: 'motivate_pd', label: 'Motivar (Recupera 2d6 PD)', desc: 'Gasta 1 ação para motivar a pessoa: ela recupera 2d6 PD!', formula: '2d6' },
    { id: 'extra_action', label: 'Ação Extra de Proteção', desc: 'Se a pessoa estiver em perigo, você faz 1 ação extra no seu turno para protegê-la ou salvá-la.' }
  ];
}

/**
 * Próximo passo para o Dado de Pavor
 */
export function stepUpPavor(current) {
  if (!current) return 6;
  if (current === 6) return 8;
  if (current === 8) return 10;
  if (current === 10) return 12;
  return 12;
}

export function stepDownPavor(current) {
  if (!current || current <= 6) return null;
  if (current === 8) return 6;
  if (current === 10) return 8;
  if (current === 12) return 10;
  return null;
}

