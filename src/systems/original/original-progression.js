// Motor de progressão, pendências, pré-requisitos e sub-escolhas da ficha de
// Ordem Paranormal 1 (sistema original).
import {
  ATRIBUTOS,
  PERICIAS,
  ORIGENS,
  CLASSES,
  PODERES_GERAIS,
  PODERES_PARANORMAIS,
  RITUAIS,
  NEX_AUMENTO_ATRIBUTO,
  classeAtual,
  classeEhMundana,
  origemAtual,
  trilhaAtual,
  progressaoDeTrilhas,
  rotuloNivel,
  aprimoramentoDeOrigemAtual,
  periciasTreinadasDaOrigem,
  PODERES_TREINO_OU_MAIS_2,
  calcPvMax,
  calcPeMax,
  calcSanMax,
  temHabilidadeDeTrilha,
  poderesDisponiveis,
} from './original-system.js';
import { renderModalPendenciaOriginal } from './original-views.js';

export { PODERES_TREINO_OU_MAIS_2 };

export const ELEMENTOS_AFINIDADE = ['Sangue', 'Morte', 'Conhecimento', 'Energia'];

// Poderes que exigem que o jogador faça uma escolha específica ao pegá-los
// (ou quando destravam na trilha/origem).
export const PODERES_COM_ESCOLHA = {
  'Treinamento em Perícia': {
    tipo: 'pericias_duplas',
    titulo: 'Escolha 2 perícias para treinar (ou aprimorar grau em NEX 35%+ / 70%+)',
  },
  'Foco em Perícia': {
    tipo: 'pericia',
    exceto: ['luta', 'pontaria'],
    apenasTreinadas: true,
    titulo: 'Escolha uma perícia treinada (exceto Luta e Pontaria) para receber +1d20',
  },
  'Especialista em Elemento': {
    tipo: 'elemento',
    titulo: 'Escolha o elemento para +2 na DT dos rituais',
  },
  'Mestre em Elemento': {
    tipo: 'elemento',
    titulo: 'Escolha o elemento para −1 PE no custo dos rituais',
  },
  'Ritual Predileto': {
    tipo: 'ritual_conhecido',
    titulo: 'Escolha um ritual conhecido para reduzir o custo em −1 PE',
  },
  'A Favorita': {
    tipo: 'texto',
    placeholder: 'Ex: Katana, Fuzil de Assalto, Acha...',
    titulo: 'Qual é a sua arma favorita?',
  },
  'Carteirada': {
    tipo: 'pericia_opcoes',
    opcoes: ['diplomacia', 'enganacao'],
    treinarOuMais2: true,
    titulo: 'Escolha entre Diplomacia ou Enganação (treina ou +2 se já treinado)',
  },
  'Mascate': {
    tipo: 'texto_opcoes',
    opcoes: ['Armeiro', 'Engenheiro', 'Químico'],
    periciaFixa: 'profissao',
    titulo: 'Escolha a especialidade de Profissão (Armeiro, Engenheiro ou Químico)',
  },
  'Laboratório de Campo': {
    tipo: 'texto_opcoes',
    opcoes: ['Armeiro', 'Engenheiro', 'Químico'],
    periciaFixa: 'profissao',
    treinarOuMais5: true,
    titulo: 'Escolha a especialidade de Profissão (+5 se já treinado)',
  },
  'Ser Amaldiçoado': {
    tipo: 'elemento',
    titulo: 'Escolha o elemento da sua maldição (Monstruoso)',
  },
  'Especialização': {
    tipo: 'elemento',
    titulo: 'Escolha a entidade paranormal estudada (Exorcista)',
  },
  'Esperto': {
    tipo: 'pericia',
    treinar: true,
    titulo: 'Escolha uma perícia adicional para se tornar treinado',
  },
  'Entendido': {
    tipo: 'pericias_duplas',
    exceto: ['luta', 'pontaria'],
    apenasTreinadas: true,
    naoTreinar: true,
    titulo: 'Escolha 2 perícias treinadas (exceto Luta e Pontaria)',
  },
  'A Força do Saber': {
    tipo: 'pericia',
    titulo: 'Escolha uma perícia para trocar seu atributo-base para Intelecto',
  },
  'Cicatrizado': {
    tipo: 'elemento',
    titulo: 'Escolha o elemento paranormal que marcou você',
  },
  'Estudos Aprofundados': {
    tipo: 'pericia_atributo',
    atributo: 'int',
    titulo: 'Escolha uma perícia baseada em Intelecto (19 conta como 20 natural)',
  },
  'Companheiro Animal': {
    tipo: 'pericia',
    bonusFixo: 2,
    titulo: 'Escolha a perícia que recebe +2 do seu Companheiro Animal',
  },
  'Mutação': {
    tipo: 'pericia_atributos',
    atributos: ['for', 'agi', 'vig'],
    bonusFixo: 2,
    titulo: 'Escolha uma perícia de Força, Agilidade ou Vigor para receber +2',
  },
  'Pai de Pet': {
    tipo: 'pericias_duplas',
    exceto: ['luta', 'pontaria'],
    bonusFixo: 2,
    naoTreinar: true,
    titulo: 'Escolha 2 perícias (exceto Luta e Pontaria) para receber +2 do seu pet',
  },
  'Ferramenta de Trabalho': {
    tipo: 'texto',
    placeholder: 'Ex: Marreta, Machado, Maçarico...',
    titulo: 'Escolha a arma que serve como ferramenta de trabalho',
  },
};

const norm = str => String(str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ---------------------------------------------------------------------------
// 1. VALIDADOR DE PRÉ-REQUISITOS
// ---------------------------------------------------------------------------

// Conta quantos poderes paranormais de determinado elemento o personagem possui.
export function contarPoderesElemento(sheet, elemento) {
  const elNorm = norm(elemento);
  let count = (sheet.poderesParanormais || []).filter(p => norm(p.elemento) === elNorm).length;
  // Cultista Arrependido com aprimoramento "Mergulho Paranormal" reduz pré-requisito em 1
  const ap = aprimoramentoDeOrigemAtual(sheet);
  if (ap?.poder?.nome === 'Mergulho Paranormal') count += 1;
  return count;
}

function temPericiaComGrau(sheet, nomePericia, grauMinimo = 5) {
  const n = norm(nomePericia);
  const per = PERICIAS.find(p => norm(p.nome) === n || norm(p.id) === n);
  if (!per) return false;
  return (Number(sheet.pericias?.[per.id]?.treino) || 0) >= grauMinimo;
}

function temPoderOuHabilidade(sheet, nomePoder) {
  const n = norm(nomePoder);
  if ((sheet.poderesEscolhidos || []).some(p => norm(p.nome) === n)) return true;
  if ((sheet.poderesParanormais || []).some(p => norm(p.nome) === n)) return true;
  if (progressaoDeTrilhas(sheet).some(item => norm(item.poder?.nome) === n)) return true;
  const o = origemAtual(sheet);
  if (o?.poder && norm(o.poder.nome) === n) return true;
  return false;
}

function avaliarClausulaSimples(clausula, sheet) {
  const txt = clausula.trim();
  if (!txt) return { ok: true, texto: txt };

  // 1) "Treinado na perícia escolhida" -> se tem ao menos 1 perícia treinada (exceto luta/pontaria)
  if (/treinado na per[ií]cia escolhida/i.test(txt)) {
    const ok = PERICIAS.some(p => !['luta', 'pontaria'].includes(p.id) && (Number(sheet.pericias?.[p.id]?.treino) || 0) >= 5);
    return { ok, texto: txt };
  }

  // 2) "Especialista em Elemento no elemento escolhido"
  if (/especialista em elemento/i.test(txt)) {
    const ok = temPoderOuHabilidade(sheet, 'Especialista em Elemento');
    return { ok, texto: txt };
  }

  // 3) "NEX 30%"
  const mNex = txt.match(/^NEX\s*(\d+)%?$/i);
  if (mNex) {
    const reqNex = Number(mNex[1]);
    const ok = !classeEhMundana(classeAtual(sheet)) && (Number(sheet.nex) || 0) >= reqNex;
    return { ok, texto: txt };
  }

  // 4) "INT 2 ou PRE 2" / "INT ou AGI 2" / "FOR 2"
  const mAttrOu = txt.match(/^(FOR|AGI|VIG|INT|PRE)\s*(\d+)?\s+ou\s+(FOR|AGI|VIG|INT|PRE)\s*(\d+)$/i);
  if (mAttrOu) {
    const a1 = mAttrOu[1].toLowerCase();
    const v2 = Number(mAttrOu[4]);
    const v1 = mAttrOu[2] ? Number(mAttrOu[2]) : v2;
    const a2 = mAttrOu[3].toLowerCase();
    const ok = (Number(sheet.atributos?.[a1]) || 0) >= v1 || (Number(sheet.atributos?.[a2]) || 0) >= v2;
    return { ok, texto: txt };
  }

  const mAttr = txt.match(/^(FOR|AGI|VIG|INT|PRE)\s+(\d+)$/i);
  if (mAttr) {
    const attr = mAttr[1].toLowerCase();
    const val = Number(mAttr[2]);
    const ok = (Number(sheet.atributos?.[attr]) || 0) >= val;
    return { ok, texto: txt };
  }

  // 5) Elementos paranormais: "Sangue 1", "Morte 2", "Conhecimento 1", "Energia 1"
  const mElem = txt.match(/^(Sangue|Morte|Conhecimento|Energia)\s+(\d+)$/i);
  if (mElem) {
    const elem = mElem[1];
    const qtd = Number(mElem[2]);
    const ok = contarPoderesElemento(sheet, elem) >= qtd;
    return { ok, texto: `${elem} ${qtd}` };
  }

  // 6) "Treinado em X ou Y", "Treinado em X e Y", "Veterano em X"
  const mTreino = txt.match(/^(Treinado|Veterano|Expert)\s+em\s+(.+)$/i);
  if (mTreino) {
    const grauStr = norm(mTreino[1]);
    const grau = grauStr === 'expert' ? 15 : (grauStr === 'veterano' ? 10 : 5);
    const resto = mTreino[2].trim();
    if (/\s+ou\s+/i.test(resto)) {
      const partes = resto.split(/\s+ou\s+/i);
      const ok = partes.some(p => temPericiaComGrau(sheet, p, grau));
      return { ok, texto: txt };
    }
    if (/\s+e\s+/i.test(resto)) {
      const partes = resto.split(/\s+e\s+/i);
      const ok = partes.every(p => temPericiaComGrau(sheet, p, grau));
      return { ok, texto: txt };
    }
    const ok = temPericiaComGrau(sheet, resto, grau);
    return { ok, texto: txt };
  }

  // 7) Nome de outro poder ou habilidade (ex: "Proteção Pesada", "Artista Marcial", "Wing Chun", "Paramédico")
  const ok = temPoderOuHabilidade(sheet, txt);
  return { ok, texto: txt };
}

// Extrai o pré-requisito tanto do campo `preRequisito` quanto do texto de
// poderes paranormais ("Pré-requisito: Sangue 1.").
export function extrairTextoPreRequisito(poder) {
  if (!poder) return '';
  if (poder.preRequisito) return String(poder.preRequisito).trim();
  const m = String(poder.descricao || '').match(/Pr[éê]-requisito:\s*([^\n.]+)/i);
  return m ? m[1].trim() : '';
}

export function avaliarPreRequisito(poder, sheet) {
  const raw = extrairTextoPreRequisito(poder);
  if (!raw) return { ok: true, cumprido: true, raw: '', texto: '', itens: [], faltando: [] };
  // Divide por vírgula, preservando cláusulas "INT 2 ou PRE 2"
  const partes = raw.split(',').map(s => s.trim()).filter(Boolean);
  const itens = partes.map(p => avaliarClausulaSimples(p, sheet));
  const faltando = itens.filter(i => !i.ok).map(i => i.texto);
  const ok = faltando.length === 0;
  return {
    ok,
    cumprido: ok,
    raw,
    texto: raw,
    itens,
    faltando,
  };
}

// ---------------------------------------------------------------------------
// 2. CÁLCULO DE COTAS E PENDÊNCIAS DE PROGRESSÃO
// ---------------------------------------------------------------------------

// Cota de Poderes de Classe que a tabela de NEX concede até o NEX atual.
export function cotaPoderesDeClasse(sheet) {
  const c = classeAtual(sheet);
  if (classeEhMundana(c)) {
    // Sobrevivente começa com 1 Aprimoramento + 1 Poder Geral no Estágio 1
    return 2;
  }
  const nex = Number(sheet.nex) || 0;
  // Marcos em que a tabelaNex menciona "poder de <classe>"
  const marcos = (c.tabelaNex || []).filter(item => item.nex <= nex && /poder de /i.test(item.texto));
  // Se o personagem veio de Sobrevivente e manteve poderes de sobrevivente/geral inicial,
  // contamos apenas os poderes escolhidos que NÃO são o aprimoramento inicial de sobrevivente
  // ou ajustamos pela quantidade de poderes de classe/gerais adquiridos como agente.
  return marcos.length;
}

// Quantos poderes escolhidos contam para a cota de poderes de classe.
export function poderesContabilizadosNaCota(sheet) {
  const c = classeAtual(sheet);
  const lista = sheet.poderesEscolhidos || [];
  if (classeEhMundana(c)) return lista.length;
  // Ignora aprimoramentos exclusivos de Sobrevivente caso tenham ficado da transição,
  // e se a ficha veio do tutorial de Sobrevivente (que dá 1 Poder Geral no Estágio 1),
  // desconta 1 se `sheet.veioDeSobrevivente` estiver marcado.
  const nomesSobrevivente = new Set((CLASSES.sobrevivente?.poderes || []).map(p => p.nome));
  const validos = lista.filter(p => !nomesSobrevivente.has(p.nome));
  const descontoInicial = sheet.veioDeSobrevivente ? 1 : 0;
  return Math.max(0, validos.length - descontoInicial);
}

// Círculo máximo de ritual que o personagem pode aprender no NEX atual.
export function circuloMaximoRitual(sheet) {
  const c = classeAtual(sheet);
  const nex = Number(sheet.nex) || 0;
  if (classeEhMundana(c)) return 1;
  if (sheet.classeId === 'ocultista') {
    if (nex >= 75) return 4;
    if (nex >= 50) return 3;
    if (nex >= 25) return 2;
    return 1;
  }
  // Outras classes (via Aprender Ritual): 2º círculo em NEX 45%, 3º em NEX 75%
  if (nex >= 75) return 3;
  if (nex >= 45) return 2;
  return 1;
}

// Cota de rituais que o personagem deve conhecer (Escolhido pelo Outro Lado +
// trilhas Graduado / Esotérico / Lâmina Paranormal / NEX 99% / Aprender Ritual).
export function calcularCotaRituais(sheet) {
  const nex = Number(sheet.nex) || 0;
  const c = classeAtual(sheet);
  const mundana = classeEhMundana(c);
  const habsTrilha = progressaoDeTrilhas(sheet).map(i => i.poder?.nome);
  const temHabilidadeTrilha = nome => habsTrilha.includes(nome);

  let total = 0;
  const detalhes = [];
  const rituaisFixosSugeridos = [];

  // 1) Ocultista: Escolhido pelo Outro Lado (3 no NEX 5% + 1 a cada 5% de NEX seguinte)
  if (sheet.classeId === 'ocultista' && !mundana) {
    const passos = Math.max(0, Math.floor(((nex >= 99 ? 100 : nex) - 5) / 5));
    const baseOcultista = 3 + passos;
    total += baseOcultista;
    detalhes.push(`${baseOcultista} de Escolhido pelo Outro Lado`);
  }

  // 2) Sobrevivente trilha Esotérico (ou Ocultista que veio de Esotérico): Iniciado (+1 de 1º círculo)
  if (temHabilidadeTrilha('Iniciado') || sheet.teveIniciado) {
    total += 1;
    detalhes.push('1 de Iniciado');
  }

  // 3) Trilha Graduado:
  // - NEX 10% Saber Ampliado: +1 no 1º círculo, +1 a cada novo círculo liberado (25%, 50%, 75%)
  if (temHabilidadeTrilha('Saber Ampliado')) {
    const circulos = 1 + (nex >= 25 ? 1 : 0) + (nex >= 50 ? 1 : 0) + (nex >= 75 ? 1 : 0);
    total += circulos;
    detalhes.push(`${circulos} de Saber Ampliado`);
  }
  // - NEX 40% Grimório Ritualístico: +Intelecto rituais (mais +1 em 50% e +1 em 75%)
  if (temHabilidadeTrilha('Grimório Ritualístico')) {
    const int = Math.max(0, Number(sheet.atributos?.int) || 0);
    const extrasCirculo = (nex >= 50 ? 1 : 0) + (nex >= 75 ? 1 : 0);
    const qtdGrimorio = int + extrasCirculo;
    if (qtdGrimorio > 0) {
      total += qtdGrimorio;
      detalhes.push(`${qtdGrimorio} do Grimório Ritualístico`);
    }
  }

  // 4) Trilha Lâmina Paranormal (NEX 10% Lâmina Maldita -> Amaldiçoar Arma)
  if (temHabilidadeTrilha('Lâmina Maldita')) {
    const jaTemAmaldicoar = (sheet.rituaisConhecidos || []).some(id => id.startsWith('amaldicoar-arma'));
    if (!jaTemAmaldicoar) {
      total += 1;
      rituaisFixosSugeridos.push({ idPrefix: 'amaldicoar-arma', nome: 'Amaldiçoar Arma' });
    } else {
      total += 1;
    }
    detalhes.push('Amaldiçoar Arma (Lâmina Maldita)');
  }

  // 5) Rituais de NEX 99% de trilhas
  const rituais99 = [
    ['Canalizar o Medo', 'canalizar-o-medo'],
    ['Medo Tangível', 'medo-tangivel'],
    ['Conhecendo o Medo', 'conhecendo-o-medo'],
    ['Presença do Medo', 'presenca-do-medo'],
    ['Lâmina do Medo', 'lamina-do-medo'],
  ];
  rituais99.forEach(([nomeHab, rId]) => {
    if (temHabilidadeTrilha(nomeHab)) {
      total += 1;
      if (!(sheet.rituaisConhecidos || []).includes(rId)) {
        rituaisFixosSugeridos.push({ id: rId, nome: nomeHab });
      }
      detalhes.push(nomeHab);
    }
  });

  // 6) Origem Inventor Paranormal (Invenção Paranormal -> 1 ritual de 1º círculo)
  if (sheet.origemId === 'inventor-paranormal') {
    total += 1;
    detalhes.push('1 de Invenção Paranormal');
  }

  // 7) Poder Paranormal "Aprender Ritual" (+1 ritual, ou +2 se tiver afinidade marcada nele)
  const aprenderRitualList = (sheet.poderesParanormais || []).filter(p => p.nome === 'Aprender Ritual');
  if (aprenderRitualList.length > 0) {
    const qtdAprender = aprenderRitualList.reduce((acc, p) => acc + (p.comAfinidade ? 2 : 1), 0);
    total += qtdAprender;
    detalhes.push(`${qtdAprender} de Aprender Ritual`);
  }

  const conhecidos = (sheet.rituaisConhecidos || []).length;
  const faltando = Math.max(0, total - conhecidos);
  return {
    esperado: total,
    totalEsperado: total,
    conhecidos,
    atuais: conhecidos,
    faltando,
    faltam: faltando,
    circuloMax: circuloMaximoRitual(sheet),
    detalhes,
    fontes: detalhes,
    rituaisFixosSugeridos,
  };
}

// Verifica quantos aumentos de atributo o personagem tem direito e quais estão pendentes.
export function calcularPendenciaAtributos(sheet) {
  const c = classeAtual(sheet);
  const nex = Number(sheet.nex) || 0;
  const marcos = classeEhMundana(c)
    ? (nex >= 10 ? [10] : []) // Estágio 3 (nex=10) do Sobrevivente concede +1 atributo
    : NEX_AUMENTO_ATRIBUTO.filter(n => n <= nex);
  const atribuicoes = sheet.aumentosAtributo || {};
  const pendentes = marcos.filter(n => !atribuicoes[n]);
  return {
    marcos,
    pendentes,
    marcosPendentes: pendentes,
    faltam: pendentes.length,
    atribuicoes,
  };
}

// Verifica quantos poderes "Transcender" a ficha escolheu vs quantos poderes paranormais possui.
export function contarTranscender(sheet) {
  const escolhidos = (sheet.poderesEscolhidos || []).filter(p => p.nome === 'Transcender').length;
  // Origem Cultista Arrependido dá +1 poder paranormal inicial sem precisar do poder Transcender.
  const bonusCultista = sheet.origemId === 'cultista-arrependido' ? 1 : 0;
  const esperadoParanormais = escolhidos + bonusCultista;
  const listaParanormais = sheet.poderesParanormais || [];
  const atuaisParanormais = listaParanormais.length + listaParanormais.filter(p => p.comAfinidade).length;
  return {
    transcenderCount: escolhidos,
    esperadoParanormais,
    atuaisParanormais,
    faltandoParanormais: Math.max(0, esperadoParanormais - atuaisParanormais),
  };
}

// Calcula a cota de perícias treinadas iniciais da classe + origem + Intelecto
// e a cota de Graus de Treinamento (Veterano em NEX 35%+ e Expert em NEX 70%+).
export function calcularCotaPericias(sheet) {
  const c = classeAtual(sheet);
  const mundana = classeEhMundana(c);
  const nex = Number(sheet.nex) || 0;
  const int = Math.max(0, Number(sheet.atributos?.int) || 0);

  // Perícias treinadas (grau >= 5)
  const treinadasIds = PERICIAS.filter(p => (Number(sheet.pericias?.[p.id]?.treino) || 0) >= 5).map(p => p.id);
  const veteranasIds = PERICIAS.filter(p => (Number(sheet.pericias?.[p.id]?.treino) || 0) >= 10).map(p => p.id);
  const expertsIds = PERICIAS.filter(p => (Number(sheet.pericias?.[p.id]?.treino) || 0) >= 15).map(p => p.id);

  // Obrigações de classe (para Combatente e Ocultista)
  const obrigatoriasFaltando = [];
  if (!mundana && sheet.classeId === 'combatente') {
    if (!treinadasIds.includes('luta') && !treinadasIds.includes('pontaria')) {
      obrigatoriasFaltando.push({ grupo: ['luta', 'pontaria'], label: 'Luta ou Pontaria' });
    }
    if (!treinadasIds.includes('fortitude') && !treinadasIds.includes('reflexos')) {
      obrigatoriasFaltando.push({ grupo: ['fortitude', 'reflexos'], label: 'Fortitude ou Reflexos' });
    }
  } else if (!mundana && sheet.classeId === 'ocultista') {
    if (!treinadasIds.includes('ocultismo')) {
      obrigatoriasFaltando.push({ grupo: ['ocultismo'], label: 'Ocultismo' });
    }
    if (!treinadasIds.includes('vontade')) {
      obrigatoriasFaltando.push({ grupo: ['vontade'], label: 'Vontade' });
    }
  }

  const origemTreinadas = periciasTreinadasDaOrigem(sheet);
  const livresClasse = mundana ? 2 : (sheet.classeId === 'especialista' ? 7 : (sheet.classeId === 'ocultista' ? 3 : 2));
  const obrigatoriasCount = (!mundana && (sheet.classeId === 'combatente' || sheet.classeId === 'ocultista')) ? 2 : 0;
  const totalEsperadoTreinadas = origemTreinadas.length + obrigatoriasCount + livresClasse + int;

  // Cota de Grau de Treinamento (35% -> Veterano; 70% -> Expert)
  const baseGrau = sheet.classeId === 'especialista' ? 5 : 3;
  const cotaVeterano = (!mundana && nex >= 35) ? (baseGrau + int) : 0;
  const cotaExpert = (!mundana && nex >= 70) ? (baseGrau + int) : 0;

  return {
    treinadasCount: treinadasIds.length,
    atuaisTreinadas: treinadasIds.length,
    totalEsperadoTreinadas,
    faltamTreinadas: Math.max(0, totalEsperadoTreinadas - treinadasIds.length),
    veteranasCount: veteranasIds.length,
    atuaisVeterano: veteranasIds.length,
    expertsCount: expertsIds.length,
    atuaisExpert: expertsIds.length,
    obrigatoriasFaltando,
    escolhasObrigatoriasFaltando: obrigatoriasFaltando,
    cotaVeterano,
    faltandoVeterano: Math.max(0, cotaVeterano - veteranasIds.length),
    cotaExpert,
    faltandoExpert: Math.max(0, cotaExpert - expertsIds.length),
  };
}

// Consolida TODAS as pendências da ficha em uma lista ordenada de ações de QoL.
export function calcularPendencias(sheet) {
  if (!sheet || sheet.systemMode !== 'original') return [];
  const pendencias = [];
  const c = classeAtual(sheet);
  const mundana = classeEhMundana(c);
  const nex = Number(sheet.nex) || 0;

  const pushPend = item => {
    pendencias.push({
      ...item,
      detalhe: item.detalhe || item.descricao || '',
      descricao: item.descricao || item.detalhe || '',
      acaoLabel: item.acaoLabel || item.botao || 'ESCOLHER',
      botao: item.botao || item.acaoLabel || 'ESCOLHER',
    });
  };

  // 1. Perícias obrigatórias de classe (ex: acabou de mudar para Combatente ou Ocultista)
  const periciasInfo = calcularCotaPericias(sheet);
  if (periciasInfo.obrigatoriasFaltando.length > 0 && !sheet.ignorarPendencias?.periciasClasse) {
    pushPend({
      id: 'pericias_classe',
      tipo: 'pericias_classe',
      icone: 'shield',
      cor: '#e5b839',
      titulo: `Perícias Iniciais de ${c.nome}`,
      descricao: `Falta treinar: ${periciasInfo.obrigatoriasFaltando.map(o => o.label).join(' e ')}.`,
      botao: 'TREINAR AGORA',
      dados: periciasInfo.obrigatoriasFaltando,
    });
  }

  // 2. Aumentos de Atributo pendentes (NEX 20%, 45%, 80%, 95% ou Estágio 3)
  const attrInfo = calcularPendenciaAtributos(sheet);
  if (attrInfo.pendentes.length > 0 && !sheet.ignorarPendencias?.aumento_atributo) {
    const proximoNex = attrInfo.pendentes[0];
    pushPend({
      id: 'aumento_atributo',
      tipo: 'aumento_atributo',
      nexMarco: proximoNex,
      icone: 'sparkles',
      cor: '#38bdf8',
      titulo: `Aumento de Atributo (${rotuloNivel(sheet, proximoNex)})`,
      descricao: attrInfo.pendentes.length > 1
        ? `Você tem ${attrInfo.pendentes.length} aumentos de atributo (+1) para distribuir.`
        : `Escolha qual atributo recebe +1 em ${rotuloNivel(sheet, proximoNex)} (máx. 5).`,
      botao: 'ESCOLHER ATRIBUTO',
    });
  }

  // 3. Poderes de Classe pendentes
  const cotaPoderes = cotaPoderesDeClasse(sheet);
  const atuaisPoderes = poderesContabilizadosNaCota(sheet);
  const faltamPoderes = Math.max(0, cotaPoderes - atuaisPoderes);
  if (faltamPoderes > 0 && !sheet.ignorarPendencias?.poder_classe) {
    pushPend({
      id: 'poder_classe',
      tipo: 'poder_classe',
      quantidade: faltamPoderes,
      icone: 'skull',
      cor: '#e0150d',
      titulo: faltamPoderes === 1
        ? `1 Poder de ${c.nome} Disponível`
        : `${faltamPoderes} Poderes de ${c.nome} Disponíveis`,
      descricao: `Seu ${rotuloNivel(sheet)} concede escolha de poder de ${c.nome} ou poder geral (incluindo Transcender).`,
      botao: 'ESCOLHER PODER',
    });
  }

  // 4. Transcender sem Poder Paranormal correspondente
  const transcInfo = contarTranscender(sheet);
  if (transcInfo.faltandoParanormais > 0 && !sheet.ignorarPendencias?.poder_paranormal) {
    pushPend({
      id: 'poder_paranormal',
      tipo: 'poder_paranormal',
      quantidade: transcInfo.faltandoParanormais,
      icone: 'brain',
      cor: '#a230ed',
      titulo: transcInfo.faltandoParanormais === 1
        ? '1 Poder Paranormal Pendente (Transcender)'
        : `${transcInfo.faltandoParanormais} Poderes Paranormais Pendentes`,
      descricao: 'Você possui Transcender (ou Cultista Arrependido) e ainda não escolheu o poder paranormal.',
      botao: 'ESCOLHER PODER PARANORMAL',
    });
  }

  // 5. Afinidade Elemental em NEX 50%+
  if (!mundana && nex >= 50 && !sheet.elementoAfinidade && !sheet.ignorarPendencias?.afinidade) {
    pushPend({
      id: 'afinidade',
      tipo: 'afinidade',
      icone: 'flame',
      cor: '#a230ed',
      titulo: 'NEX 50% · Afinidade com Elemento',
      descricao: 'Escolha com qual entidade do Outro Lado seu agente se conectou permanentemente.',
      botao: 'ESCOLHER AFINIDADE',
    });
  }

  // 6. Rituais pendentes (Ocultista / Graduado / Lâmina / Iniciado / Inventor / Aprender Ritual)
  const rituaisInfo = calcularCotaRituais(sheet);
  if (rituaisInfo.faltando > 0 && !sheet.ignorarPendencias?.rituais) {
    const fixo = rituaisInfo.rituaisFixosSugeridos[0];
    pushPend({
      id: 'rituais',
      tipo: 'rituais',
      quantidade: rituaisInfo.faltando,
      circuloMax: rituaisInfo.circuloMax,
      fixoSugerido: fixo || null,
      icone: 'flame',
      cor: '#e5a11c',
      titulo: rituaisInfo.faltando === 1
        ? `1 Ritual para Aprender (até ${rituaisInfo.circuloMax}º Círculo)`
        : `${rituaisInfo.faltando} Rituais para Aprender (até ${rituaisInfo.circuloMax}º Círculo)`,
      descricao: fixo
        ? `Sua trilha concede o ritual ${fixo.nome}. (${rituaisInfo.detalhes.join(' · ')})`
        : `Você conhece ${rituaisInfo.conhecidos} de ${rituaisInfo.esperado} rituais previstos (${rituaisInfo.detalhes.join(' · ')}).`,
      botao: fixo ? `APRENDER ${fixo.nome.toUpperCase()}` : 'APRENDER RITUAL',
    });
  }

  // 7. Grau de Treinamento (NEX 35% Veterano / NEX 70% Expert)
  if ((periciasInfo.faltandoVeterano > 0 || periciasInfo.faltandoExpert > 0) && !sheet.ignorarPendencias?.grauTreinamento) {
    const ehExpert = periciasInfo.faltandoExpert > 0;
    const qtd = ehExpert ? periciasInfo.faltandoExpert : periciasInfo.faltandoVeterano;
    const grauLabel = ehExpert ? 'Expert (+15)' : 'Veterano (+10)';
    pushPend({
      id: 'grau_treinamento',
      tipo: 'grau_treinamento',
      grauAlvo: ehExpert ? 15 : 10,
      nomeGrau: grauLabel,
      quantidade: qtd,
      icone: 'd20',
      cor: ehExpert ? '#c084fc' : '#38bdf8',
      titulo: `Grau de Treinamento: ${qtd} ${qtd === 1 ? `perícia para ${grauLabel}` : `perícias para ${grauLabel}`}`,
      descricao: ehExpert
        ? `Em NEX 70%+, você pode elevar até ${periciasInfo.cotaExpert} perícias veteranas para Expert (+15).`
        : `Em NEX 35%+, você pode elevar até ${periciasInfo.cotaVeterano} perícias treinadas para Veterano (+10).`,
      botao: 'ELEVAR PERÍCIAS',
    });
  }

  // 8. Sub-escolhas pendentes em poderes/trilhas já adquiridos
  const subEscolhas = listarSubEscolhasPendentes(sheet);
  subEscolhas.forEach(sub => {
    const idSub = `sub_escolha:${sub.chave}`;
    if (sheet.ignorarPendencias?.[idSub]) return;
    pushPend({
      id: idSub,
      tipo: 'sub_escolha',
      sub,
      icone: 'info',
      cor: '#e5b839',
      titulo: `Configurar: ${sub.nomePoder}`,
      descricao: sub.config.titulo,
      botao: 'CONFIGURAR',
    });
  });

  return pendencias;
}

// Verifica se algum poder escolhido ou habilidade de trilha ativa exige sub-escolha
// e ainda não tem valor registrado em `sheet.escolhasDePoderes[nomePoder]`.
export function listarSubEscolhasPendentes(sheet) {
  const escolhas = sheet.escolhasDePoderes || {};
  const pendentes = [];
  const vistos = new Set();

  const checar = (nomePoder, origemLabel) => {
    if (!nomePoder || vistos.has(nomePoder)) return;
    const config = PODERES_COM_ESCOLHA[nomePoder];
    if (!config) return;
    vistos.add(nomePoder);
    const valorAtual = escolhas[nomePoder];
    const preenchido = Array.isArray(valorAtual) ? valorAtual.length > 0 : Boolean(valorAtual);
    if (!preenchido) {
      pendentes.push({ chave: nomePoder, nomePoder, origemLabel, config });
    }
  };

  const o = origemAtual(sheet);
  if (o?.poder) checar(o.poder.nome, `Origem: ${o.nome}`);
  (o?.poderesExtras || []).forEach(p => checar(p.nome, `Origem: ${o.nome}`));
  (sheet.poderesEscolhidos || []).forEach(p => checar(p.nome, p.origemTipo || 'Poder Escolhido'));
  progressaoDeTrilhas(sheet).forEach(item => checar(item.poder?.nome, `Trilha: ${item.trilhaObj?.nome || ''}`));

  // Caso especial: "Aprimoramento de Origem" quando a perícia da origem já era treinada ou é livre
  const ap = aprimoramentoDeOrigemAtual(sheet);
  if (ap && ap.pericia) {
    const perObj = PERICIAS.find(p => p.id === ap.pericia);
    if (!perObj && !escolhas['Aprimoramento de Origem']) {
      pendentes.push({
        chave: 'Aprimoramento de Origem',
        nomePoder: 'Aprimoramento de Origem',
        origemLabel: 'Poder de Classe',
        config: {
          tipo: 'pericia',
          treinar: true,
          titulo: `Escolha a perícia concedida pelo Aprimoramento de Origem (${ap.pericia})`,
        },
      });
    }
  }

  return pendentes;
}

// ---------------------------------------------------------------------------
// 3. APLICAÇÃO DE EFEITOS (ATRIBUTOS, PERÍCIAS, TRANSIÇÃO DE CLASSE)
// ---------------------------------------------------------------------------

// Aplica ou troca o aumento de atributo de um NEX específico, atualizando
// também o valor real em `sheet.atributos[attr]`.
export function definirAumentoAtributo(sheet, nexMarco, novoAttr) {
  if (!sheet.aumentosAtributo) sheet.aumentosAtributo = {};
  const antigoAttr = sheet.aumentosAtributo[nexMarco] || '';
  if (antigoAttr === novoAttr) return true;

  if (novoAttr && (Number(sheet.atributos?.[novoAttr]) || 0) >= 5) {
    return false; // Teto de atributo = 5
  }
  if (antigoAttr && sheet.atributos?.[antigoAttr] !== undefined) {
    sheet.atributos[antigoAttr] = Math.max(0, Number(sheet.atributos[antigoAttr]) - 1);
  }
  if (novoAttr) {
    sheet.atributos[novoAttr] = Math.min(5, (Number(sheet.atributos?.[novoAttr]) || 0) + 1);
    sheet.aumentosAtributo[nexMarco] = novoAttr;
  } else {
    delete sheet.aumentosAtributo[nexMarco];
  }
  return true;
}

// Quando um poder que dá perícia ("treinado ou +2 se já treinado") é adicionado,
// se a perícia estava destreinada (0), passa a Treinado (5) e registra em
// `sheet.periciasTreinadasPorPoder[nomePoder] = periciaId`. Se já era treinada (>=5),
// não mexe no grau — o `bonusPoderesPorPericia` dará +2 automaticamente!
export function aplicarTreinoDePoder(sheet, nomePoder, periciaIds) {
  if (!sheet.pericias) sheet.pericias = {};
  if (!sheet.periciasTreinadasPorPoder) sheet.periciasTreinadasPorPoder = {};
  const ids = Array.isArray(periciaIds) ? periciaIds : [periciaIds];
  const treinadasAgora = [];
  ids.forEach(pid => {
    if (!pid || !PERICIAS.some(p => p.id === pid)) return;
    if (!sheet.pericias[pid]) sheet.pericias[pid] = { treino: 0, extra: 0 };
    const treinoAtual = Number(sheet.pericias[pid].treino) || 0;
    if (treinoAtual === 0) {
      sheet.pericias[pid].treino = 5;
      treinadasAgora.push(pid);
    }
  });
  if (treinadasAgora.length > 0) {
    sheet.periciasTreinadasPorPoder[nomePoder] = treinadasAgora;
  }
}

// Registra uma sub-escolha de poder e aplica treinamentos de perícia se cabível.
export function salvarSubEscolhaPoder(sheet, chavePoder, valor) {
  if (!sheet.escolhasDePoderes) sheet.escolhasDePoderes = {};
  sheet.escolhasDePoderes[chavePoder] = valor;
  const config = PODERES_COM_ESCOLHA[chavePoder];
  if (!config) {
    if (chavePoder === 'Aprimoramento de Origem' && typeof valor === 'string') {
      aplicarTreinoDePoder(sheet, chavePoder, [valor]);
    }
    return;
  }

  if (chavePoder === 'Treinamento em Perícia') {
    const ids = Array.isArray(valor) ? valor : [valor];
    const nex = Number(sheet.nex) || 0;
    ids.forEach(pid => {
      if (!sheet.pericias?.[pid]) sheet.pericias[pid] = { treino: 0, extra: 0 };
      const atual = Number(sheet.pericias[pid].treino) || 0;
      if (atual === 0) sheet.pericias[pid].treino = 5;
      else if (atual === 5 && nex >= 35) sheet.pericias[pid].treino = 10;
      else if (atual === 10 && nex >= 70) sheet.pericias[pid].treino = 15;
    });
  } else if (config.treinar || config.treinarOuMais2) {
    aplicarTreinoDePoder(sheet, chavePoder, valor);
  } else if (config.periciaFixa) {
    aplicarTreinoDePoder(sheet, chavePoder, [config.periciaFixa]);
  }
  if (chavePoder === 'Ser Amaldiçoado' && sheet.elementoAfinidade && sheet.elementoAfinidade !== valor) {
    sheet.elementoAfinidade = valor;
  }
}

// Realiza a transição inteligente quando uma ficha deixa de ser Sobrevivente
// para virar Combatente, Especialista ou Ocultista (ou troca de classe).
export function aplicarTransicaoDeClasse(sheet, classeAnteriorId, novaClasseId) {
  if (classeAnteriorId === novaClasseId) return;
  if (classeAnteriorId === 'sobrevivente' && novaClasseId !== 'sobrevivente') {
    sheet.veioDeSobrevivente = true;
    // Se era da trilha Esotérico e tinha Iniciado, preserva o direito ao ritual extra
    if (sheet.trilhaId === 'esoterico' && (Number(sheet.nex) || 0) >= 15) {
      sheet.teveIniciado = true;
    }
    // Se era Ocultista, já treina Ocultismo e Vontade automaticamente
    if (novaClasseId === 'ocultista') {
      ['ocultismo', 'vontade'].forEach(pid => {
        if (!sheet.pericias[pid]) sheet.pericias[pid] = { treino: 0, extra: 0 };
        sheet.pericias[pid].treino = Math.max(5, Number(sheet.pericias[pid].treino) || 0);
      });
    }
  }
  if (sheet.ignorarPendencias) {
    delete sheet.ignorarPendencias.periciasClasse;
    delete sheet.ignorarPendencias.rituais;
  }
}

export function reverterTreinoDePoder(sheet, nomePoder) {
  const treinadas = sheet.periciasTreinadasPorPoder?.[nomePoder];
  if (Array.isArray(treinadas)) {
    treinadas.forEach(pid => {
      if (sheet.pericias?.[pid] && Number(sheet.pericias[pid].treino) === 5) {
        sheet.pericias[pid].treino = 0;
      }
    });
    delete sheet.periciasTreinadasPorPoder[nomePoder];
  }
  if (sheet.escolhasDePoderes && nomePoder in sheet.escolhasDePoderes) {
    delete sheet.escolhasDePoderes[nomePoder];
  }
}

// Controle de disparo automático de prompts quando o NEX sobe ou a classe/trilha muda.
let promptProgressaoSolicitado = null;
let promptProgressaoPreferido = null;
const promptsAdiados = new Set();

export function solicitarPromptProgressao(sheetId, preferidoId = null) {
  if (!sheetId) return;
  for (const k of Array.from(promptsAdiados)) {
    if (k.startsWith(`${sheetId}:`)) promptsAdiados.delete(k);
  }
  promptProgressaoSolicitado = sheetId;
  if (preferidoId) promptProgressaoPreferido = preferidoId;
}

function chaveAdiamento(sheet, pendenciaId) {
  return `${sheet?.id || 'sheet'}:${Number(sheet?.nex) || 0}:${pendenciaId}`;
}

function proximaPendenciaNaoAdiada(sheet, preferidoId = null) {
  const lista = calcularPendencias(sheet);
  if (preferidoId) {
    const pref = lista.find(p => p.id === preferidoId && !promptsAdiados.has(chaveAdiamento(sheet, p.id)));
    if (pref) return pref;
  }
  return lista.find(p => !promptsAdiados.has(chaveAdiamento(sheet, p.id))) || null;
}

// Chamado quando o NEX sobe ou desce: ajusta PV/PE/SAN atuais proporcionalmente
// ao novo máximo e aplica treinamentos automáticos de habilidades de trilha recém-destravadas.
export function sincronizarAoMudarNex(sheet, aplicarMudanca) {
  const nexAntes = Number(sheet.nex) || 0;
  const classeAntes = sheet.classeId;
  const pvMaxAntes = calcPvMax(sheet);
  const peMaxAntes = calcPeMax(sheet);
  const sanMaxAntes = calcSanMax(sheet);
  const pendAntes = new Map(calcularPendencias(sheet).map(p => [p.id, p.quantidade || 1]));

  aplicarMudanca();

  const nexDepois = Number(sheet.nex) || 0;
  // Se o NEX diminuiu, desfaz aumentos de atributo de marcos acima do NEX atual
  if (nexDepois < nexAntes && sheet.aumentosAtributo) {
    Object.keys(sheet.aumentosAtributo).forEach(m => {
      if (Number(m) > nexDepois) {
        definirAumentoAtributo(sheet, Number(m), '');
      }
    });
  }

  // Se o NEX subiu ou a classe mudou, reativa avisos de progressão e solicita prompt automático
  if (nexDepois > nexAntes || sheet.classeId !== classeAntes) {
    if (sheet.ignorarPendencias) {
      delete sheet.ignorarPendencias.rituais;
      delete sheet.ignorarPendencias.poder_classe;
      delete sheet.ignorarPendencias.aumento_atributo;
      delete sheet.ignorarPendencias.grauTreinamento;
    }
    if (sheet?.id) {
      const pendDepois = calcularPendencias(sheet);
      let recemDestravada = null;
      if (sheet.classeId !== classeAntes) {
        recemDestravada = 'pericias_classe';
      } else {
        const prioridadeNex = ['aumento_atributo', 'poder_classe', 'afinidade', 'rituais', 'grau_treinamento'];
        recemDestravada = prioridadeNex.find(id => {
          const item = pendDepois.find(p => p.id === id);
          if (!item) return false;
          const qtdAntes = pendAntes.get(id) || 0;
          const qtdDepois = item.quantidade || 1;
          return !pendAntes.has(id) || qtdDepois > qtdAntes;
        }) || null;
      }
      solicitarPromptProgressao(sheet.id, recemDestravada);
    }
  }

  // Verifica se alguma habilidade de trilha que treina perícia foi destravada
  ['Rastrear o Paranormal', 'Ser Amaldiçoado'].forEach(hab => {
    if (temHabilidadeDeTrilha(sheet, hab) && PODERES_TREINO_OU_MAIS_2[hab]) {
      aplicarTreinoDePoder(sheet, hab, PODERES_TREINO_OU_MAIS_2[hab]);
    }
  });

  const pvMaxDepois = calcPvMax(sheet);
  const peMaxDepois = calcPeMax(sheet);
  const sanMaxDepois = calcSanMax(sheet);

  sheet.maxPv = pvMaxDepois;
  sheet.maxPe = peMaxDepois;
  sheet.maxSan = sanMaxDepois;

  const deltaPv = pvMaxDepois - pvMaxAntes;
  const deltaPe = peMaxDepois - peMaxAntes;
  const deltaSan = sanMaxDepois - sanMaxAntes;

  if (deltaPv > 0) sheet.pv = Math.min(pvMaxDepois, (Number(sheet.pv) || 0) + deltaPv);
  else sheet.pv = Math.min(pvMaxDepois, Number(sheet.pv ?? pvMaxDepois));

  if (deltaPe > 0) sheet.pe = Math.min(peMaxDepois, (Number(sheet.pe) || 0) + deltaPe);
  else sheet.pe = Math.min(peMaxDepois, Number(sheet.pe ?? peMaxDepois));

  if (deltaSan > 0) sheet.san = Math.min(sanMaxDepois, (Number(sheet.san) || 0) + deltaSan);
  else sheet.san = Math.min(sanMaxDepois, Number(sheet.san ?? sanMaxDepois));
}

// ---------------------------------------------------------------------------
// 7. CONTROLADOR DE MODAIS E EVENTOS DE PROGRESSÃO NA FICHA
// ---------------------------------------------------------------------------

let modalProgAtivo = null;
let tempModalState = {};

export function fecharModalProgressao(adiarSheet = null) {
  if (adiarSheet && modalProgAtivo) {
    // Quando o jogador fecha/adia, adia as pendências atuais deste NEX para não reabrir sozinho
    calcularPendencias(adiarSheet).forEach(p => {
      promptsAdiados.add(chaveAdiamento(adiarSheet, p.id));
    });
    promptProgressaoSolicitado = null;
    promptProgressaoPreferido = null;
  }
  document.querySelector('#original-prog-modal')?.remove();
  modalProgAtivo = null;
  tempModalState = {};
}

function avancarOuFecharModalProgressao(ctx, preferidoId = null) {
  const sheet = ctx.getSheet();
  const pendentes = calcularPendencias(sheet);
  if (preferidoId && pendentes.some(p => p.id === preferidoId)) {
    abrirModalProgressao(preferidoId, ctx);
    return;
  }
  if (modalProgAtivo && pendentes.some(p => p.id === modalProgAtivo)) {
    abrirModalProgressao(modalProgAtivo, ctx);
    return;
  }
  const prox = proximaPendenciaNaoAdiada(sheet);
  if (prox) {
    tempModalState = {};
    abrirModalProgressao(prox.id, ctx);
  } else {
    promptProgressaoSolicitado = null;
    promptProgressaoPreferido = null;
    fecharModalProgressao();
  }
}

export function syncPromptDeProgressao(ctx) {
  const sheet = ctx.getSheet?.();
  if (!sheet || sheet.systemMode !== 'original' || ctx.isLocked?.()) {
    fecharModalProgressao();
    return;
  }
  // Não abre por cima do modal de Trilha Inicial ou Versatilidade
  if (document.querySelector('#trilha-decisao-modal')) return;

  if (promptProgressaoSolicitado === sheet.id) {
    const prox = proximaPendenciaNaoAdiada(sheet, modalProgAtivo || promptProgressaoPreferido);
    if (prox) {
      promptProgressaoPreferido = null;
      abrirModalProgressao(prox.id, ctx);
    } else {
      promptProgressaoSolicitado = null;
      promptProgressaoPreferido = null;
    }
  }
}

export function abrirModalProgressao(pendenciaId, ctx) {
  const sheet = ctx.getSheet();
  if (!sheet || sheet.systemMode !== 'original') return;
  modalProgAtivo = pendenciaId;
  const html = renderModalPendenciaOriginal(sheet, pendenciaId, tempModalState);
  if (!html) {
    fecharModalProgressao();
    return;
  }

  let modal = document.querySelector('#original-prog-modal');
  const prevScroll = modal?.querySelector('.prog-modal-body')?.scrollTop || 0;
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal open trilha-decisao-modal original-prog-modal';
    modal.id = 'original-prog-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div class="backdrop" data-close-prog-modal></div><section>${html}</section>`;
  const bodyEl = modal.querySelector('.prog-modal-body');
  if (bodyEl && prevScroll > 0) bodyEl.scrollTop = prevScroll;

  modal.querySelectorAll('[data-close-prog-modal]').forEach(btn => {
    btn.onclick = () => fecharModalProgressao(sheet);
  });

  modal.querySelectorAll('[data-prog-switch-step]').forEach(btn => {
    btn.onclick = () => {
      const nextStep = btn.dataset.progSwitchStep;
      if (!nextStep || nextStep === pendenciaId) return;
      tempModalState = {};
      abrirModalProgressao(nextStep, ctx);
    };
  });

  const searchInp = modal.querySelector('[data-prog-search]');
  if (searchInp) {
    if (tempModalState.focusSearch) {
      searchInp.focus();
      const len = searchInp.value.length;
      searchInp.setSelectionRange(len, len);
      tempModalState.focusSearch = false;
    }
    searchInp.oninput = e => {
      tempModalState.busca = e.target.value;
      tempModalState.focusSearch = true;
      abrirModalProgressao(pendenciaId, ctx);
    };
  }

  modal.querySelectorAll('[data-prog-filter-grupo]').forEach(btn => {
    btn.onclick = () => {
      tempModalState.grupo = btn.dataset.progFilterGrupo;
      abrirModalProgressao(pendenciaId, ctx);
    };
  });

  modal.querySelectorAll('[data-prog-filter-el]').forEach(btn => {
    btn.onclick = () => {
      tempModalState.elemento = btn.dataset.progFilterEl;
      abrirModalProgressao(pendenciaId, ctx);
    };
  });

  modal.querySelectorAll('[data-prog-filter-circ]').forEach(btn => {
    btn.onclick = () => {
      const val = btn.dataset.progFilterCirc;
      tempModalState.circulo = val === 'ate_meu' || val === 'todos' ? val : Number(val);
      abrirModalProgressao(pendenciaId, ctx);
    };
  });

  modal.querySelectorAll('[data-prog-filter-disp]').forEach(btn => {
    btn.onclick = () => {
      tempModalState.apenasDisponiveis = tempModalState.apenasDisponiveis === false;
      abrirModalProgressao(pendenciaId, ctx);
    };
  });

  modal.querySelectorAll('[data-prog-open-compendium]').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.progOpenCompendium || 'poderes';
      fecharModalProgressao(sheet);
      ctx.openCompendium?.({ tab, pick: true, ateMeuCirculo: tab === 'rituais' });
    };
  });

  modal.querySelectorAll('[data-prog-pick-poder]').forEach(btn => {
    btn.onclick = () => {
      const nome = btn.dataset.progPickPoder;
      const power = poderesDisponiveis(sheet).find(p => p.nome === nome);
      if (!power) return;
      const { label, ...escolhido } = power;
      if (!Array.isArray(sheet.poderesEscolhidos)) sheet.poderesEscolhidos = [];
      sheet.poderesEscolhidos.push(escolhido);

      if (PODERES_TREINO_OU_MAIS_2[power.nome]) {
        aplicarTreinoDePoder(sheet, power.nome, PODERES_TREINO_OU_MAIS_2[power.nome]);
      }

      let preferido = null;
      if (power.nome === 'Transcender') {
        sheet.maxSan = calcSanMax(sheet);
        sheet.san = Math.min(sheet.san ?? sheet.maxSan, sheet.maxSan);
        preferido = 'poder_paranormal';
      } else if (PODERES_COM_ESCOLHA[power.nome]) {
        preferido = `sub_escolha:${power.nome}`;
      }

      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx, preferido);
    };
  });

  modal.querySelectorAll('[data-prog-pick-paranormal]').forEach(btn => {
    btn.onclick = () => {
      const nome = btn.dataset.progPickParanormal;
      const power = PODERES_PARANORMAIS.find(p => p.nome === nome);
      if (!power) return;
      if (!Array.isArray(sheet.poderesParanormais)) sheet.poderesParanormais = [];
      if (sheet.poderesParanormais.some(p => p.nome === nome)) return;
      const pvMaxAntes = calcPvMax(sheet);
      const peMaxAntes = calcPeMax(sheet);
      sheet.poderesParanormais.push(JSON.parse(JSON.stringify(power)));
      const pvMaxDepois = calcPvMax(sheet);
      const peMaxDepois = calcPeMax(sheet);
      if (pvMaxDepois > pvMaxAntes) sheet.pv = (Number(sheet.pv) || 0) + (pvMaxDepois - pvMaxAntes);
      if (peMaxDepois > peMaxAntes) sheet.pe = (Number(sheet.pe) || 0) + (peMaxDepois - peMaxAntes);
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx, power.nome === 'Aprender Ritual' ? 'rituais' : null);
    };
  });

  modal.querySelectorAll('[data-prog-pick-afinidade-poder]').forEach(btn => {
    btn.onclick = () => {
      const nome = btn.dataset.progPickAfinidadePoder;
      const existing = (sheet.poderesParanormais || []).find(p => p.nome === nome);
      if (!existing) return;
      const peMaxAntes = calcPeMax(sheet);
      existing.comAfinidade = true;
      if (!sheet.elementoAfinidade && existing.elemento && existing.elemento !== 'Medo') {
        sheet.elementoAfinidade = existing.elemento;
      }
      const peMaxDepois = calcPeMax(sheet);
      if (peMaxDepois > peMaxAntes) sheet.pe = (Number(sheet.pe) || 0) + (peMaxDepois - peMaxAntes);
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-prog-pick-ritual]').forEach(btn => {
    btn.onclick = () => {
      const rId = btn.dataset.progPickRitual;
      if (!RITUAIS.some(r => r.id === rId)) return;
      if (!Array.isArray(sheet.rituaisConhecidos)) sheet.rituaisConhecidos = [];
      if (sheet.rituaisConhecidos.includes(rId)) return;
      sheet.rituaisConhecidos.push(rId);
      ctx.saveAndRender();
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-select-marco-attr]').forEach(btn => {
    btn.onclick = () => {
      tempModalState.marco = Number(btn.dataset.selectMarcoAttr);
      abrirModalProgressao(pendenciaId, ctx);
    };
  });

  modal.querySelectorAll('[data-confirm-aumento]').forEach(btn => {
    btn.onclick = () => {
      const [marcoStr, attrId] = btn.dataset.confirmAumento.split(':');
      const marco = Number(marcoStr);
      const pvMaxAntes = calcPvMax(sheet);
      const peMaxAntes = calcPeMax(sheet);
      definirAumentoAtributo(sheet, marco, attrId);
      const pvMaxDepois = calcPvMax(sheet);
      const peMaxDepois = calcPeMax(sheet);
      if (pvMaxDepois > pvMaxAntes) sheet.pv = (Number(sheet.pv) || 0) + (pvMaxDepois - pvMaxAntes);
      if (peMaxDepois > peMaxAntes) sheet.pe = (Number(sheet.pe) || 0) + (peMaxDepois - peMaxAntes);
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-confirm-afinidade]').forEach(btn => {
    btn.onclick = () => {
      sheet.elementoAfinidade = btn.dataset.confirmAfinidade;
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-toggle-pericia-treino]').forEach(btn => {
    btn.onclick = () => {
      const pid = btn.dataset.togglePericiaTreino;
      if (!sheet.pericias[pid]) sheet.pericias[pid] = { treino: 0, extra: 0 };
      const atual = Number(sheet.pericias[pid].treino) || 0;
      sheet.pericias[pid].treino = atual >= 5 ? 0 : 5;
      ctx.saveAndRender();
      abrirModalProgressao('pericias_classe', ctx);
    };
  });

  modal.querySelectorAll('[data-set-pericia-grau]').forEach(btn => {
    btn.onclick = () => {
      const [pid, grauStr] = btn.dataset.setPericiaGrau.split(':');
      if (!sheet.pericias[pid]) sheet.pericias[pid] = { treino: 0, extra: 0 };
      sheet.pericias[pid].treino = Number(grauStr) || 5;
      ctx.saveAndRender();
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-save-subescolha]').forEach(btn => {
    btn.onclick = () => {
      const sep = btn.dataset.saveSubescolha.indexOf(':');
      const nomePoder = btn.dataset.saveSubescolha.slice(0, sep);
      const valor = btn.dataset.saveSubescolha.slice(sep + 1);
      salvarSubEscolhaPoder(sheet, nomePoder, valor);
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-save-subescolha-input]').forEach(btn => {
    btn.onclick = () => {
      const nomePoder = btn.dataset.saveSubescolhaInput;
      const inp = modal.querySelector('#prog-subescolha-input');
      const valor = (inp?.value || '').trim();
      if (!valor) return;
      salvarSubEscolhaPoder(sheet, nomePoder, valor);
      ctx.saveAndRender();
      tempModalState = {};
      avancarOuFecharModalProgressao(ctx);
    };
  });

  modal.querySelectorAll('[data-toggle-subescolha-dupla]').forEach(btn => {
    btn.onclick = () => {
      const sep = btn.dataset.toggleSubescolhaDupla.indexOf(':');
      const nomePoder = btn.dataset.toggleSubescolhaDupla.slice(0, sep);
      const pid = btn.dataset.toggleSubescolhaDupla.slice(sep + 1);
      const atual = Array.isArray(tempModalState.duplas)
        ? [...tempModalState.duplas]
        : (Array.isArray(sheet.escolhasDePoderes?.[nomePoder]) ? [...sheet.escolhasDePoderes[nomePoder]] : []);
      const idx = atual.indexOf(pid);
      if (idx >= 0) atual.splice(idx, 1);
      else if (atual.length < 2) atual.push(pid);
      tempModalState.duplas = atual;
      if (atual.length === 2) {
        salvarSubEscolhaPoder(sheet, nomePoder, atual);
        ctx.saveAndRender();
        tempModalState = {};
        avancarOuFecharModalProgressao(ctx);
      } else {
        abrirModalProgressao(pendenciaId, ctx);
      }
    };
  });
}

export function bindEventosProgressaoOriginal(ctx) {
  const sheet = ctx.getSheet();
  if (!sheet || sheet.systemMode !== 'original') return;

  document.querySelectorAll('[data-pendencia-acao]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if (ctx.isLocked?.()) return;
      const acao = btn.dataset.pendenciaAcao;
      if (acao === 'trilha_inicial') {
        ctx.onOpenTrilhaInicial?.();
      } else if (acao === 'versatilidade') {
        ctx.onOpenVersatilidade?.();
      } else {
        tempModalState = {};
        abrirModalProgressao(acao, ctx);
      }
    };
  });

  document.querySelectorAll('[data-pendencia-ignorar]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const id = btn.dataset.pendenciaIgnorar;
      if (!sheet.ignorarPendencias) sheet.ignorarPendencias = {};
      if (id === 'pericias_classe') sheet.ignorarPendencias.periciasClasse = true;
      else if (id === 'grau_treinamento') sheet.ignorarPendencias.grauTreinamento = true;
      else sheet.ignorarPendencias[id] = true;
      ctx.saveAndRender();
    };
  });

  document.querySelectorAll('[data-edit-subescolha]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if (ctx.isLocked?.()) return;
      tempModalState = {};
      abrirModalProgressao(`sub_escolha:${btn.dataset.editSubescolha}`, ctx);
    };
  });

  document.querySelectorAll('[data-toggle-afinidade-poder]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if (ctx.isLocked?.()) return;
      const idx = Number(btn.dataset.toggleAfinidadePoder);
      const p = sheet.poderesParanormais?.[idx];
      if (!p) return;
      p.comAfinidade = !p.comAfinidade;
      if (p.comAfinidade && !sheet.elementoAfinidade && p.elemento && p.elemento !== 'Medo') {
        sheet.elementoAfinidade = p.elemento;
      }
      ctx.saveAndRender();
    };
  });

  syncPromptDeProgressao(ctx);
}
