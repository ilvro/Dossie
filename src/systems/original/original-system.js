import { ATRIBUTOS, PERICIAS, ORIGENS, PODERES_GERAIS, CLASSES, PODERES_PARANORMAIS, RITUAIS, CONDICOES } from '../../data/original-data.js';

export { ATRIBUTOS, PERICIAS, ORIGENS, PODERES_GERAIS, CLASSES, PODERES_PARANORMAIS, RITUAIS, CONDICOES };

export const TREINOS_ORIGINAL = [
  { valor: 0, nome: 'Destreinado', icone: './icons/original/untrained.svg' },
  { valor: 5, nome: 'Treinado', icone: './icons/original/trained.svg' },
  { valor: 10, nome: 'Veterano', icone: './icons/original/veteran.svg' },
  { valor: 15, nome: 'Expert', icone: './icons/original/expert.svg' },
];

export const TIERS_TRILHA = [10, 25, 40, 65, 99];

// NEX em que a tabela de classe concede "Aumento de atributo".
export const NEX_AUMENTO_ATRIBUTO = [20, 45, 80, 95];

export const ICONES_RECURSO = {
  pv: {
    full: './icons/original/pv-full.svg',
    half: './icons/original/pv-half.svg',
    low: './icons/original/pv-low.svg',
    empty: './icons/original/pv-empty.svg',
  },
  san: {
    full: './icons/original/sanity-full.svg',
    half: './icons/original/sanity-half.svg',
    low: './icons/original/sanity-low.svg',
    empty: './icons/original/sanity-empty.svg',
  },
  pe: {
    full: './icons/original/effort-full.svg',
    half: './icons/original/effort-half.svg',
    empty: './icons/original/effort-empty.svg',
  },
};

export const DEFAULT_ORIGINAL_SHEET = {
  systemMode: 'original',
  name: 'NOVO AGENTE',
  jogador: '',
  origemId: 'acadêmico',
  classeId: 'combatente',
  trilhaId: 'aniquilador',
  trilhaSecundariaId: '',
  trilhaTerciariaId: '',
  nivelTrilhaTerciaria: 1,
  versatilidadeRecusada: {},
  usaPD: false,
  aumentosAtributo: {},
  elementoAfinidade: '',
  escolhasDePoderes: {},
  periciasTreinadasPorPoder: {},
  ignorarPendencias: {},
  veioDeSobrevivente: false,
  teveIniciado: false,
  nex: 5,
  atributos: { for: 2, agi: 2, vig: 2, int: 1, pre: 1 },
  pv: 22,
  maxPv: 22,
  pvTemp: 0,
  pvMarcas: 0,
  pe: 3,
  maxPe: 3,
  peTemp: 0,
  san: 15,
  maxSan: 15,
  sanTemp: 0,
  sanMarcas: 0,
  defesaOutros: 0,
  deslocamento: '9m (6q)',
  pericias: {},
  skills: [],
  cards: [],
  ataques: [],
  poderesEscolhidos: [],
  poderesCustomizados: [],
  poderesParanormais: [],
  rituaisConhecidos: [],
  inventario: [],
  condicoesAtivas: [],
  history: '',
  tokenImage: '',
  backgroundImage: '',
  backgroundBlur: 0,
  backgroundZoom: 100,
  diceColor: '',
  themeColor: '',
  viewMode: 'cinematic',
  cinematicTokenX: 50,
  cinematicTokenY: 52,
  cinematicTokenScale: 100,
  cinematicOutlineSide: 'left',
  cinematicOutlineIntensity: 0.5,
  cinematicOutlineWidth: 1.8,
  cinematicOutlineFade: 1.5,
  cinematicCollapsed: { abilities: false, items: true, history: true }
};

export function classeAtual(sheet) {
  return CLASSES[sheet.classeId] || CLASSES.combatente;
}

export function classeEhMundana(classeObj) {
  return !!(classeObj && classeObj.mundano);
}

// NEX só existe em passos de 5% (0, 5, ..., 95) e no teto de 99%.
export function snapNex(value) {
  const n = Math.max(0, Math.min(100, Number(value) || 0));
  return n > 95 ? 99 : Math.round(n / 5) * 5;
}

// Sobreviventes não têm NEX: evoluem em estágios (1 a 5). Internamente o
// estágio N é guardado como nex = (N - 1) * 5, alinhado à tabelaNex da classe.
export const ESTAGIO_MAX = 5;

export function nexDoEstagio(estagio) {
  return (Math.max(1, Math.min(ESTAGIO_MAX, Math.round(Number(estagio) || 1))) - 1) * 5;
}

// Mantém o NEX dentro da faixa da classe: estágios 1–5 para sobreviventes,
// NEX 5%–99% para as demais (quem deixa de ser sobrevivente vira NEX 5%).
export function ajustarNexDaClasse(sheet) {
  const c = classeAtual(sheet);
  const nex = Number(sheet.nex) || 0;
  if (classeEhMundana(c)) sheet.nex = nexDoEstagio(Math.floor(nex / 5) + 1);
  else sheet.nex = Math.max(5, snapNex(nex));
  // Recusas de Versatilidade em NEX que a ficha deixou de ter voltam a valer
  // como pergunta quando o personagem subir de novo.
  if (sheet.versatilidadeRecusada) {
    Object.keys(sheet.versatilidadeRecusada).forEach(t => { if (Number(t) > sheet.nex) delete sheet.versatilidadeRecusada[t]; });
  }
  return sheet.nex;
}

// Todos os níveis que a classe percorre, como valores de NEX: estágios 1–5
// (0, 5, …, 20) para sobreviventes; 5%, 10%, …, 95%, 99% para as demais.
export function niveisDaClasse(sheet) {
  if (classeEhMundana(classeAtual(sheet))) return Array.from({ length: ESTAGIO_MAX }, (_, i) => i * 5);
  return [...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99];
}

// "Estágio 3" para sobreviventes, "NEX 40%" para as demais classes.
export function rotuloNivel(sheet, nex = sheet.nex) {
  const n = Number(nex) || 0;
  return classeEhMundana(classeAtual(sheet)) ? `Estágio ${Math.floor(n / 5) + 1}` : `NEX ${n}%`;
}

// A trilha só é escolhida em NEX 10% (sobreviventes: no 2º estágio).
export function trilhaLiberada(sheet) {
  const nex = Number(sheet.nex) || 0;
  return nex >= (classeEhMundana(classeAtual(sheet)) ? nexDoEstagio(2) : TIERS_TRILHA[0]);
}

export function passosNex(sheet) {
  const c = classeAtual(sheet);
  const nexBase = (c && typeof c.nexBase === 'number') ? c.nexBase : 5;
  const nex = sheet.nex ?? 5;
  // NEX 99% é o nível seguinte a 95% (conta como 100 na progressão).
  return Math.max(0, Math.floor(((nex >= 99 ? 100 : nex) - nexBase) / 5));
}

export function estagioAtual(sheet) {
  return Math.floor((sheet.nex ?? 0) / 5) + 1;
}

export function origemAtual(sheet) {
  return ORIGENS.find(o => o.id === sheet.origemId) || ORIGENS[0];
}

export function trilhaAtual(sheet) {
  const c = classeAtual(sheet);
  if (!c || !c.trilhas || !trilhaLiberada(sheet)) return null;
  return c.trilhas.find(t => t.id === sheet.trilhaId) || c.trilhas[0] || null;
}

// Homebrew: Versatilidade é um poder de classe que pode ser escolhido várias
// vezes — cada escolha concede a próxima habilidade de uma segunda trilha.
export function contarVersatilidade(sheet) {
  return Array.isArray(sheet.poderesEscolhidos) ? sheet.poderesEscolhidos.filter(p => p.nome === 'Versatilidade').length : 0;
}

export function temVersatilidade(sheet) {
  return contarVersatilidade(sheet) > 0;
}

export function temAprimoramentoDeOrigem(sheet) {
  return temPoderEscolhido(sheet, 'Aprimoramento de Origem');
}

// Aprimoramento da origem atual, se a ficha tiver o poder de classe.
export function aprimoramentoDeOrigemAtual(sheet) {
  if (!temAprimoramentoDeOrigem(sheet)) return null;
  return origemAtual(sheet)?.aprimoramento || null;
}

// Poderes que o jogador ESCOLHE (de classe + gerais) e que ainda não estão na
// ficha. Habilidades de trilha não entram: são fixas e destravam por NEX.
export function poderesDisponiveis(sheet) {
  const c = classeAtual(sheet);
  const ja = new Set((sheet.poderesEscolhidos || []).map(p => p.nome));
  const daClasse = (c?.poderes || [])
    .filter(p => (p.repetivel || !ja.has(p.nome)) && poderPodeSerEscolhido(p, sheet))
    .map(p => ({ label: p.nome, nome: p.nome, descricao: p.descricao, preRequisito: p.preRequisito, origemTipo: `Poder de ${c.nome}`, bonus: p.bonus || null }));
  const gerais = PODERES_GERAIS
    .filter(p => !ja.has(p.nome))
    .map(p => ({ label: `${p.nome} (Geral)`, nome: p.nome, descricao: p.descricao, preRequisito: p.preRequisito, origemTipo: 'Poder Geral', bonus: p.bonus || null }));
  return [...daClasse, ...gerais];
}

export function temVersatilidadeAmplificada(sheet) {
  return Array.isArray(sheet.poderesParanormais) && sheet.poderesParanormais.some(p => p.nome === 'Versatilidade Amplificada');
}

export function trilhaSecundariaAtual(sheet) {
  const c = classeAtual(sheet);
  if (!c || !c.trilhas || !sheet.trilhaSecundariaId || !temVersatilidade(sheet)) return null;
  if (sheet.trilhaSecundariaId === trilhaAtual(sheet)?.id) return null;
  return c.trilhas.find(t => t.id === sheet.trilhaSecundariaId) || null;
}

export function trilhaTerciariaAtual(sheet) {
  const c = classeAtual(sheet);
  if (!c || !c.trilhas || !sheet.trilhaTerciariaId || !temVersatilidadeAmplificada(sheet)) return null;
  if ([trilhaAtual(sheet)?.id, sheet.trilhaSecundariaId].includes(sheet.trilhaTerciariaId)) return null;
  return c.trilhas.find(t => t.id === sheet.trilhaTerciariaId) || null;
}

// Quantas habilidades das trilhas extras a ficha tem. Cada Versatilidade vale
// um nível; Versatilidade Amplificada vale mais um, que vai para a trilha
// secundária ou abre uma terceira trilha (que pode receber outros níveis).
export function niveisDeTrilhasExtras(sheet) {
  const total = contarVersatilidade(sheet) + (temVersatilidadeAmplificada(sheet) ? 1 : 0);
  let terciaria = 0;
  if (trilhaTerciariaAtual(sheet)) {
    terciaria = Math.max(1, Math.min(Number(sheet.nivelTrilhaTerciaria) || 1, Math.max(1, total - 1)));
  }
  return { total, secundaria: Math.max(0, total - terciaria), terciaria };
}

// Habilidades de trilha que a ficha possui: as da trilha principal destravam
// por NEX; as das trilhas extras somam-se a elas, na ordem, uma por nível.
export function progressaoDeTrilhas(sheet) {
  const nex = Number(sheet.nex) || 0;
  const itens = [];
  const principal = trilhaAtual(sheet);
  if (principal) {
    principal.poderes.filter(p => p.nex <= nex).forEach(poder => itens.push({ tier: poder.nex, alvo: 'principal', trilhaObj: principal, poder }));
  }
  if (classeEhMundana(classeAtual(sheet))) return itens;
  const niveis = niveisDeTrilhasExtras(sheet);
  [['secundaria', trilhaSecundariaAtual(sheet)], ['terciaria', trilhaTerciariaAtual(sheet)]].forEach(([alvo, trilhaObj]) => {
    if (!trilhaObj) return;
    [...trilhaObj.poderes].sort((x, y) => x.nex - y.nex)
      .slice(0, niveis[alvo])
      .filter(p => p.nex <= nex)
      .forEach(poder => itens.push({ tier: poder.nex, alvo, trilhaObj, poder }));
  });
  return itens;
}

// Homebrew: nos NEX em que a trilha avança (25%, 40%, 65%, 99%) o personagem
// também ganha um poder de classe, que pode virar Versatilidade. Devolve o
// primeiro desses NEX em que a ficha ainda não decidiu, ou null.
export function pendenciaDeTrilha(sheet) {
  const c = classeAtual(sheet);
  if (classeEhMundana(c)) return null;
  const principal = trilhaAtual(sheet);
  if (!principal) return null;
  const nex = Number(sheet.nex) || 0;
  const abertos = TIERS_TRILHA.filter(t => t > TIERS_TRILHA[0] && t <= nex && !sheet.versatilidadeRecusada?.[t]);
  const tier = abertos[contarVersatilidade(sheet)];
  if (!tier) return null;
  const ordenar = t => [...t.poderes].sort((x, y) => x.nex - y.nex);
  const secundaria = trilhaSecundariaAtual(sheet);
  return {
    tier,
    principal,
    poderPrincipal: principal.poderes.find(p => p.nex === tier) || null,
    secundaria,
    proximoPoderSecundaria: secundaria ? (ordenar(secundaria)[niveisDeTrilhasExtras(sheet).secundaria] || null) : null,
    opcoes: (c.trilhas || []).filter(t => t.id !== principal.id).map(t => ({ id: t.id, nome: t.nome, primeiroPoder: ordenar(t)[0]?.nome || '' })),
  };
}

// Usa o poder de classe do NEX pendente em Versatilidade.
export function aplicarVersatilidade(sheet, trilhaSecundariaId) {
  const c = classeAtual(sheet);
  const poder = (c.poderes || []).find(p => p.nome === 'Versatilidade');
  if (!poder) return false;
  if (!sheet.trilhaSecundariaId || sheet.trilhaSecundariaId === trilhaAtual(sheet)?.id) {
    if (!trilhaSecundariaId || trilhaSecundariaId === trilhaAtual(sheet)?.id) return false;
    sheet.trilhaSecundariaId = trilhaSecundariaId;
  }
  if (!Array.isArray(sheet.poderesEscolhidos)) sheet.poderesEscolhidos = [];
  sheet.poderesEscolhidos.push({ nome: poder.nome, descricao: poder.descricao, preRequisito: poder.preRequisito, origemTipo: `Poder de ${c.nome}`, bonus: null });
  return true;
}

export function recusarVersatilidade(sheet, tier) {
  if (!sheet.versatilidadeRecusada) sheet.versatilidadeRecusada = {};
  sheet.versatilidadeRecusada[tier] = true;
}

// Homebrew: aumentos de atributo não são retroativos. Se a ficha informa em
// qual NEX cada aumento foi para o atributo, os níveis anteriores usam o valor
// antigo; aumentos não informados contam como se o atributo sempre fosse o atual.
function atributoNoNex(sheet, attr, nexDoNivel) {
  const atual = Number(sheet.atributos?.[attr]) || 0;
  if (classeEhMundana(classeAtual(sheet))) return atual;
  const nex = Number(sheet.nex) || 0;
  const posteriores = NEX_AUMENTO_ATRIBUTO.filter(n => n <= nex && n > nexDoNivel && sheet.aumentosAtributo?.[n] === attr).length;
  return Math.max(0, atual - posteriores);
}

// Soma do atributo ganho em cada nível depois do primeiro.
function somaAtributoPorNivel(sheet, attr) {
  const c = classeAtual(sheet);
  const nexBase = (c && typeof c.nexBase === 'number') ? c.nexBase : 5;
  let soma = 0;
  for (let i = 1; i <= passosNex(sheet); i++) soma += atributoNoNex(sheet, attr, Math.min(99, nexBase + i * 5));
  return soma;
}

function bonusFixoPorNex(sheet, recurso) {
  const nex = Number(sheet.nex) || 0;
  return (classeAtual(sheet).bonusPorNex || []).reduce((acc, b) => acc + (b.nex <= nex ? (Number(b[recurso]) || 0) : 0), 0);
}

function somaPorEstagioAlcancado(mapa, estagioAtualVal) {
  if (!mapa) return 0;
  return Object.keys(mapa).reduce((acc, k) => acc + (parseInt(k, 10) <= estagioAtualVal ? mapa[k] : 0), 0);
}

export function temPoderEscolhido(sheet, nome) {
  return Array.isArray(sheet.poderesEscolhidos) && sheet.poderesEscolhidos.some(p => p.nome === nome);
}

export function temPoderParanormal(sheet, nome) {
  return Array.isArray(sheet.poderesParanormais) && sheet.poderesParanormais.some(p => p.nome === nome);
}

export function temAfinidadeComPoder(sheet, nome) {
  if (!Array.isArray(sheet.poderesParanormais)) return false;
  const p = sheet.poderesParanormais.find(x => x.nome === nome);
  return Boolean(p?.comAfinidade);
}

export function temHabilidadeDeTrilha(sheet, nome) {
  return progressaoDeTrilhas(sheet).some(i => i.poder?.nome === nome);
}

// Quantos níveis de NEX (de 5% em 5%) o personagem possui (99% conta como 20).
function escalasNex5(sheet) {
  const c = classeAtual(sheet);
  if (classeEhMundana(c)) return estagioAtual(sheet);
  const nex = Number(sheet.nex) || 0;
  return Math.max(1, Math.floor((nex >= 99 ? 100 : nex) / 5));
}

// Regra opcional "Jogando sem Sanidade": PE e SAN dão lugar aos Pontos de
// Determinação. Na ficha o PD ocupa o lugar do PE (mesmos campos `pe`/`peTemp`
// e as mesmas mecânicas de gasto e limite por turno) e a Sanidade deixa de existir.
export function usaPD(sheet) {
  return !!sheet?.usaPD;
}

// Poderes marcados com "regra" só valem em uma das regras de recursos.
export function poderValeNaRegra(poder, sheet) {
  return !poder.regra || poder.regra === (usaPD(sheet) ? 'pd' : 'pesan');
}

// Um poder de classe pode ser escolhido se vale na regra da ficha e se ela
// ainda não tem outro poder do mesmo "grupoUnico".
export function poderPodeSerEscolhido(poder, sheet) {
  if (!poderValeNaRegra(poder, sheet)) return false;
  if (!poder.grupoUnico) return true;
  const doGrupo = new Set((classeAtual(sheet).poderes || []).filter(p => p.grupoUnico === poder.grupoUnico).map(p => p.nome));
  return !(sheet.poderesEscolhidos || []).some(p => doGrupo.has(p.nome));
}

// Troca a regra de recursos da ficha. Com PD, Sanidade Aprimorada e Esforço
// Aprimorado viram Determinação Aprimorada; na volta, ela vira Esforço
// Aprimorado (não há como saber qual das duas era). Os pontos recomeçam cheios.
export function definirRegraDeRecursos(sheet, comPD) {
  sheet.usaPD = !!comPD;
  const c = classeAtual(sheet);
  const trocas = sheet.usaPD
    ? { 'Sanidade Aprimorada': 'Determinação Aprimorada', 'Esforço Aprimorado': 'Determinação Aprimorada' }
    : { 'Determinação Aprimorada': 'Esforço Aprimorado' };
  const vistos = new Set();
  sheet.poderesEscolhidos = (sheet.poderesEscolhidos || []).map(p => {
    const novo = (c.poderes || []).find(x => x.nome === trocas[p.nome]);
    return novo ? { ...p, nome: novo.nome, descricao: novo.descricao, preRequisito: novo.preRequisito, bonus: novo.bonus || null } : p;
  }).filter(p => {
    if (!Object.values(trocas).includes(p.nome)) return true;
    if (vistos.has(p.nome)) return false;
    vistos.add(p.nome);
    return true;
  });
  sheet.pv = calcPvMax(sheet);
  sheet.pe = calcPeMax(sheet);
  sheet.peTemp = 0;
  sheet.san = calcSanMax(sheet);
}

export function calcPvMax(sheet) {
  const c = classeAtual(sheet);
  const steps = passosNex(sheet);
  const vig = Number(sheet.atributos?.vig) || 0;
  const nexBase = typeof c.nexBase === 'number' ? c.nexBase : 5;
  const t = trilhaAtual(sheet);
  const estagio = estagioAtual(sheet);
  const n5 = escalasNex5(sheet);

  let progressaoPv = steps * c.pv.porNex + (c.escalaAtributoPorNex === false ? 0 : somaAtributoPorNivel(sheet, 'vig'));
  if (t && t.pvSubstituiProgressao) {
    progressaoPv = somaPorEstagioAlcancado(t.pvSubstituiProgressao, estagio);
  }

  const bonusTrilha = (t && t.pvBonusPorEstagio) ? somaPorEstagioAlcancado(t.pvBonusPorEstagio, estagio) : 0;
  const bonusSaude = temPoderEscolhido(sheet, 'Saúde Aprimorada') ? 5 : 0;
  const bonus = Number(sheet.bonusTransicao?.pv) || 0;

  // Bônus passivos de poderes, origens e trilhas:
  let passivosPv = 0;
  if (temHabilidadeDeTrilha(sheet, 'Casca Grossa')) passivosPv += n5;
  if (temHabilidadeDeTrilha(sheet, 'Primeiros Sintomas')) passivosPv += n5;
  if (temPoderEscolhido(sheet, 'Vitalidade Reforçada')) passivosPv += n5;
  if (temPoderParanormal(sheet, 'Sangue de Ferro')) passivosPv += n5 * 2;
  if (sheet.origemId === 'desgarrado') {
    passivosPv += n5;
    if (aprimoramentoDeOrigemAtual(sheet)?.poder?.nome === 'Vigor Perfeito') passivosPv += n5;
  }
  if (sheet.origemId === 'mergulhador') passivosPv += 5;
  if (temPoderEscolhido(sheet, 'Sobrevivente')) {
    const fortTreino = Number(sheet.pericias?.fortitude?.treino) || 0;
    const fortExtra = Number(sheet.pericias?.fortitude?.extra) || 0;
    passivosPv += fortTreino + fortExtra;
  }
  if (temHabilidadeDeTrilha(sheet, 'Ser Amaldiçoado') && sheet.escolhasDePoderes?.['Ser Amaldiçoado'] === 'Morte') {
    passivosPv += (Number(sheet.atributos?.for) || 0);
  }

  return c.pv.base + (vig ? atributoNoNex(sheet, 'vig', nexBase) : 0) + progressaoPv + bonusTrilha + bonusSaude + bonus + bonusFixoPorNex(sheet, 'pv') + passivosPv;
}

export function calcPeMax(sheet) {
  const c = classeAtual(sheet);
  const steps = passosNex(sheet);
  // Racionalidade Inflexível permite usar Intelecto no lugar de Presença para PE
  const usaIntNoPe = temPoderEscolhido(sheet, 'Racionalidade Inflexível') && (Number(sheet.atributos?.int) || 0) > (Number(sheet.atributos?.pre) || 0);
  const attrPe = usaIntNoPe ? 'int' : 'pre';
  const valAttr = Number(sheet.atributos?.[attrPe]) || 0;
  const nexBase = typeof c.nexBase === 'number' ? c.nexBase : 5;
  const recurso = usaPD(sheet) && c.pd ? c.pd : c.pe;
  const progressaoPe = steps * recurso.porNex + (c.escalaAtributoPorNex === false ? 0 : somaAtributoPorNivel(sheet, attrPe));
  const bonusEsforco = usaPD(sheet)
    ? (temPoderEscolhido(sheet, 'Determinação Aprimorada') ? 3 : 0)
    : (temPoderEscolhido(sheet, 'Esforço Aprimorado') ? 5 : 0);
  const bonus = Number(sheet.bonusTransicao?.pe) || 0;
  const n5 = escalasNex5(sheet);
  const nex = Number(sheet.nex) || 0;

  let passivosPe = 0;
  if (temPoderParanormal(sheet, 'Potencial Aprimorado')) {
    const mult = temAfinidadeComPoder(sheet, 'Potencial Aprimorado') ? 2 : 1;
    passivosPe += n5 * mult;
  }
  if (temPoderEscolhido(sheet, 'Personalidade Esotérica')) passivosPe += 3;
  if (temPoderEscolhido(sheet, 'Vontade Inabalável')) passivosPe += Math.floor((nex >= 99 ? 100 : nex) / 10);
  if (temPoderEscolhido(sheet, 'Mente Forte') && usaPD(sheet)) passivosPe += n5;
  if (sheet.origemId === 'universitário') {
    if (aprimoramentoDeOrigemAtual(sheet)?.poder?.nome === 'Força de Vontade') {
      passivosPe += n5;
    } else {
      passivosPe += contarNexImpar(nex);
    }
  }
  if (temHabilidadeDeTrilha(sheet, 'A Força do Saber')) {
    passivosPe += (Number(sheet.atributos?.int) || 0);
  }
  if (temHabilidadeDeTrilha(sheet, 'Saber Ampliado')) {
    const circulos = 1 + (nex >= 25 ? 1 : 0) + (nex >= 50 ? 1 : 0) + (nex >= 75 ? 1 : 0);
    passivosPe += circulos * 2;
  }

  return recurso.base + (valAttr ? atributoNoNex(sheet, attrPe, nexBase) : 0) + progressaoPe + bonusEsforco + bonus + bonusFixoPorNex(sheet, 'pe') + passivosPe;
}

export function calcSanMax(sheet) {
  if (usaPD(sheet)) return 0;
  const c = classeAtual(sheet);
  const steps = passosNex(sheet);
  const bonusSanidade = temPoderEscolhido(sheet, 'Sanidade Aprimorada') ? 5 : 0;
  const n5 = escalasNex5(sheet);

  // Transcender: cada vez que o personagem escolhe Transcender, deixa de ganhar
  // a Sanidade daquele aumento de NEX (c.san.porNex).
  const qtdTranscender = Array.isArray(sheet.poderesEscolhidos)
    ? sheet.poderesEscolhidos.filter(p => p.nome === 'Transcender').length
    : 0;
  const perdaTranscender = Math.min(steps, qtdTranscender) * c.san.porNex;

  // Origem Cultista Arrependido começa com metade da Sanidade inicial da classe
  const baseSan = sheet.origemId === 'cultista-arrependido' ? Math.floor(c.san.base / 2) : c.san.base;
  const bonusVitima = sheet.origemId === 'vítima' ? n5 : 0;
  const bonusMenteForte = temPoderEscolhido(sheet, 'Mente Forte') ? n5 : 0;

  return Math.max(1, baseSan + steps * c.san.porNex - perdaTranscender + bonusSanidade + bonusVitima + bonusMenteForte);
}

export function calcPePorTurno(sheet) {
  const c = classeAtual(sheet);
  let base = classeEhMundana(c) ? 2 : (2 + passosNex(sheet));
  if (sheet.origemId === 'universitário') base += 1;
  if (temPoderParanormal(sheet, 'Encarar a Morte')) {
    base += temAfinidadeComPoder(sheet, 'Encarar a Morte') ? 3 : 1;
  }
  return base;
}

export function calcDefesa(sheet) {
  const agi = Number(sheet.atributos?.agi) || 0;
  const outros = Number(sheet.defesaOutros) || 0;
  let passivosDef = 0;
  if (temPoderEscolhido(sheet, 'Reflexos Defensivos')) passivosDef += 2;
  if (temPoderParanormal(sheet, 'Precognição')) passivosDef += 5;
  if (temPoderEscolhido(sheet, 'Corpo Calejado')) passivosDef += (Number(sheet.atributos?.vig) || 0);
  if (temPoderEscolhido(sheet, 'Raciocínio Rápido')) passivosDef += (Number(sheet.atributos?.int) || 0);
  if (temPoderParanormal(sheet, 'Mão Espectral') && temAfinidadeComPoder(sheet, 'Mão Espectral')) passivosDef += 2;
  if (sheet.origemId === 'policial') {
    passivosDef += aprimoramentoDeOrigemAtual(sheet)?.poder?.nome === 'Sentinela' ? 5 : 2;
  }
  if (temHabilidadeDeTrilha(sheet, 'Ser Amaldiçoado') && sheet.escolhasDePoderes?.['Ser Amaldiçoado'] === 'Conhecimento') {
    passivosDef += (Number(sheet.atributos?.int) || 0);
  }
  return 10 + agi + outros + passivosDef;
}

export function calcDtRituais(sheet) {
  const c = classeAtual(sheet);
  const peTurnoBase = classeEhMundana(c) ? 2 : (2 + passosNex(sheet) + (sheet.origemId === 'universitário' ? 1 : 0));
  const pre = Number(sheet.atributos?.pre) || 0;
  let extraDt = 0;
  if (temPoderEscolhido(sheet, 'Fortalecimento Ritualístico')) extraDt += (Number(sheet.atributos?.int) || 0);
  if (temHabilidadeDeTrilha(sheet, 'Rituais Eficientes')) extraDt += 5;
  return 10 + peTurnoBase + pre + extraDt;
}

export function calcCargaMax(sheet) {
  const forca = Number(sheet.atributos?.for) || 0;
  const int = Number(sheet.atributos?.int) || 0;
  const attrTotal = temHabilidadeDeTrilha(sheet, 'Inventário Otimizado') ? (forca + int) : forca;
  let base = attrTotal <= 0 ? 2 : attrTotal * 5;
  if (temPoderEscolhido(sheet, 'Inventário Organizado')) base += Math.max(0, int);
  if (temHabilidadeDeTrilha(sheet, 'Mascate')) base += 5;
  return base;
}

export function calcCargaAtual(sheet) {
  if (!Array.isArray(sheet.inventario)) return 0;
  return sheet.inventario.reduce((acc, it) => acc + ((Number(it.espaco) || 1) * (Number(it.qtd) || 1)), 0);
}

export function getPatente(sheet) {
  const nex = Number(sheet.nex) || 0;
  if (nex <= 15) return 'Recruta';
  if (nex <= 35) return 'Operador';
  if (nex <= 60) return 'Agente Especial';
  if (nex <= 80) return 'Oficial de Operações';
  return 'Agente de Elite';
}

export function contarNexImpar(nex) {
  let count = 0;
  for (let n = 5; n <= nex; n += 10) count++;
  return count;
}

export function valorBonusPoder(sheet, bonus) {
  if (!bonus) return 0;
  if (bonus.formula === 'fixo') return Number(bonus.valor) || 0;
  if (bonus.formula === 'porNex5') return Math.floor((Number(sheet.nex) || 0) / 5) * (Number(bonus.valor) || 0);
  if (bonus.formula === 'porNexImpar') return contarNexImpar(Number(sheet.nex) || 0) * (Number(bonus.valor) || 0);
  return 0;
}

export function bonusLabel(sheet, bonus) {
  if (!bonus) return '';
  if (typeof bonus === 'string') return bonus;
  if (bonus.pericia) {
    const per = PERICIAS.find(p => p.id === bonus.pericia);
    const nomePer = per ? per.nome : bonus.pericia;
    if (bonus.formula === 'fixo') return `+${bonus.valor} em ${nomePer}`;
    return `+${valorBonusPoder(sheet, bonus)} em ${nomePer} (escala com NEX)`;
  }
  return '';
}

export const PODERES_TREINO_OU_MAIS_2 = {
  'Acrobático': 'acrobacia',
  'Atlético': 'atletismo',
  'Dedos Ágeis': 'crime',
  'Detector de Mentiras': 'intuicao',
  'Especialista em Emergências': 'medicina',
  'Informado': 'atualidades',
  'Interrogador': 'intimidacao',
  'Mentiroso Nato': 'enganacao',
  'Observador': 'investigacao',
  'Pai de Pet': 'adestramento',
  'Palavras de Devoção': 'religiao',
  'Pensamento Tático': 'tatica',
  'Personalidade Esotérica': 'ocultismo',
  'Persuasivo': 'diplomacia',
  'Pesquisador Científico': 'ciencias',
  'Proativo': 'iniciativa',
  'Rato de Computador': 'tecnologia',
  'Resposta Rápida': 'reflexos',
  'Sentidos Aguçados': 'percepcao',
  'Sobrevivencialista': 'sobrevivencia',
  'Sorrateiro': 'furtividade',
  'Talentoso': 'artes',
  'Teimosia Obstinada': 'vontade',
  'Tenacidade': 'fortitude',
  'Ás do Volante': 'pilotagem',
  // Habilidades de trilha com a mesma mecânica
  'Rastrear o Paranormal': 'sobrevivencia',
  'Ser Amaldiçoado': 'ocultismo',
};

export function atributoEfetivoDaPericia(sheet, periciaObj) {
  if (!periciaObj) return 'agi';
  if (sheet?.escolhasDePoderes?.['A Força do Saber'] === periciaObj.id) {
    return 'int';
  }
  return periciaObj.atributo;
}

export function bonusPoderesPorPericia(sheet) {
  const soma = {};
  const add = (periciaId, val) => {
    if (!periciaId || !val) return;
    soma[periciaId] = (soma[periciaId] || 0) + val;
  };

  function considerar(fonte) {
    if (!fonte || !fonte.bonus || !fonte.bonus.pericia) return;
    const v = valorBonusPoder(sheet, fonte.bonus);
    if (v) add(fonte.bonus.pericia, v);
  }
  const o = origemAtual(sheet);
  if (o) considerar(o.poder);
  const apOrig = aprimoramentoDeOrigemAtual(sheet);
  if (apOrig) considerar(apOrig.poder);

  if (Array.isArray(sheet.poderesEscolhidos)) sheet.poderesEscolhidos.forEach(considerar);
  if (Array.isArray(sheet.poderesParanormais)) sheet.poderesParanormais.forEach(considerar);
  if (Array.isArray(sheet.poderesCustomizados)) sheet.poderesCustomizados.forEach(considerar);
  progressaoDeTrilhas(sheet).forEach(item => considerar(item.poder));

  // Poderes e habilidades de trilha "treina em X ou, se já for treinado, recebe +2"
  const treinadasPorPoder = sheet.periciasTreinadasPorPoder || {};
  Object.entries(PODERES_TREINO_OU_MAIS_2).forEach(([nomePoder, periciaId]) => {
    const tem = temPoderEscolhido(sheet, nomePoder) || temHabilidadeDeTrilha(sheet, nomePoder);
    if (!tem) return;
    const treinoAtual = Number(sheet.pericias?.[periciaId]?.treino || 0);
    const foiTreinadaPorEstePoder = Array.isArray(treinadasPorPoder[nomePoder])
      && treinadasPorPoder[nomePoder].includes(periciaId);
    if (treinoAtual >= 5 && !foiTreinadaPorEstePoder) {
      add(periciaId, 2);
    }
  });

  // Sub-escolhas de poderes/origens/trilhas
  const escolhas = sheet.escolhasDePoderes || {};
  if (escolhas['Companheiro Animal']) add(escolhas['Companheiro Animal'], 2);
  if (escolhas['Mutação']) add(escolhas['Mutação'], 2);
  if (Array.isArray(escolhas['Pai de Pet']) && temPoderEscolhido(sheet, 'Pai de Pet')) {
    escolhas['Pai de Pet'].forEach(pId => add(pId, 2));
  }
  if (escolhas['Carteirada'] && temHabilidadeDeTrilha(sheet, 'Carteirada')) {
    const pId = escolhas['Carteirada'];
    const foiTreinada = Array.isArray(treinadasPorPoder['Carteirada']) && treinadasPorPoder['Carteirada'].includes(pId);
    if (Number(sheet.pericias?.[pId]?.treino || 0) >= 5 && !foiTreinada) {
      add(pId, 2);
    }
  }
  if (escolhas['Laboratório de Campo'] && temHabilidadeDeTrilha(sheet, 'Laboratório de Campo')) {
    const foiTreinada = Array.isArray(treinadasPorPoder['Laboratório de Campo']) && treinadasPorPoder['Laboratório de Campo'].includes('profissao');
    if (Number(sheet.pericias?.profissao?.treino || 0) >= 5 && !foiTreinada) {
      add('profissao', 5);
    }
  }

  // Bônus passivos de habilidades de trilha e origens
  if (temHabilidadeDeTrilha(sheet, 'Iniciativa Aprimorada')) add('iniciativa', 5);
  if (temHabilidadeDeTrilha(sheet, 'Gatuno')) {
    add('atletismo', 5);
    add('crime', 5);
  }
  if (temHabilidadeDeTrilha(sheet, 'O Sorriso')) {
    add('diplomacia', 2);
    add('enganacao', 2);
  }
  if (o?.poder?.nome === 'Hacker') add('tecnologia', 5);

  // Poderes de Sobrevivente (trilhas)
  if (temHabilidadeDeTrilha(sheet, 'Vitalidade Reforçada')) add('fortitude', 2);
  if (temHabilidadeDeTrilha(sheet, 'Vontade Inabalável')) add('vontade', 2);

  // Bônus passivos de Poderes Paranormais
  if (temPoderParanormal(sheet, 'Espreitar da Besta')) {
    add('furtividade', temAfinidadeComPoder(sheet, 'Espreitar da Besta') ? 10 : 5);
  }
  if (temPoderParanormal(sheet, 'Sensitivo')) {
    add('diplomacia', 5);
    add('intimidacao', 5);
    add('intuicao', 5);
  }
  if (temPoderParanormal(sheet, 'Visão do Oculto')) {
    add('percepcao', 5);
  }
  if (temAfinidadeComPoder(sheet, 'Sangue de Ferro')) {
    add('fortitude', 5);
  }
  if (temAfinidadeComPoder(sheet, 'Precognição')) {
    add('iniciativa', 5);
  }
  if (temAfinidadeComPoder(sheet, 'Mão Espectral')) {
    add('percepcao', 2);
  }

  return soma;
}

export function periciasTreinadasDaOrigem(sheet) {
  const o = origemAtual(sheet);
  if (!o) return [];
  const lista = [...(o.pericias || [])];
  const extra = aprimoramentoDeOrigemAtual(sheet)?.pericia || sheet.escolhasDePoderes?.['Aprimoramento de Origem'];
  if (extra && !lista.includes(extra)) lista.push(extra);
  return lista;
}

export function normalizeOriginalSheet(raw = {}) {
  const sheet = { ...DEFAULT_ORIGINAL_SHEET, ...raw };
  sheet.id = raw.id || `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  sheet.systemMode = 'original';
  sheet.folderId = raw.folderId || 'folder-characters';
  sheet.favorite = Boolean(raw.favorite);

  sheet.atributos = {
    for: Number(raw.atributos?.for ?? 2),
    agi: Number(raw.atributos?.agi ?? 2),
    vig: Number(raw.atributos?.vig ?? 2),
    int: Number(raw.atributos?.int ?? 1),
    pre: Number(raw.atributos?.pre ?? 1),
  };

  const pericias = {};
  PERICIAS.forEach(p => {
    const existing = raw.pericias?.[p.id];
    pericias[p.id] = {
      treino: Number(existing?.treino ?? 0),
      extra: Number(existing?.extra ?? 0),
    };
  });
  sheet.pericias = pericias;

  sheet.origemId = raw.origemId || ORIGENS[0].id;
  sheet.classeId = raw.classeId || 'combatente';
  sheet.trilhaId = raw.trilhaId || CLASSES[sheet.classeId]?.trilhas?.[0]?.id || '';
  sheet.trilhaSecundariaId = raw.trilhaSecundariaId || '';
  sheet.trilhaTerciariaId = raw.trilhaTerciariaId || '';
  sheet.nivelTrilhaTerciaria = Math.max(1, Number(raw.nivelTrilhaTerciaria) || 1);
  sheet.aumentosAtributo = (raw.aumentosAtributo && typeof raw.aumentosAtributo === 'object') ? { ...raw.aumentosAtributo } : {};
  sheet.elementoAfinidade = typeof raw.elementoAfinidade === 'string' ? raw.elementoAfinidade : '';
  sheet.escolhasDePoderes = (raw.escolhasDePoderes && typeof raw.escolhasDePoderes === 'object') ? { ...raw.escolhasDePoderes } : {};
  sheet.periciasTreinadasPorPoder = (raw.periciasTreinadasPorPoder && typeof raw.periciasTreinadasPorPoder === 'object') ? { ...raw.periciasTreinadasPorPoder } : {};
  sheet.ignorarPendencias = (raw.ignorarPendencias && typeof raw.ignorarPendencias === 'object') ? { ...raw.ignorarPendencias } : {};
  sheet.veioDeSobrevivente = Boolean(raw.veioDeSobrevivente);
  sheet.teveIniciado = Boolean(raw.teveIniciado);
  delete sheet.trilhaTierAtribuicoes;
  sheet.usaPD = !!raw.usaPD;
  // Fichas antigas não são questionadas sobre os NEX que já passaram.
  sheet.versatilidadeRecusada = (raw.versatilidadeRecusada && typeof raw.versatilidadeRecusada === 'object')
    ? { ...raw.versatilidadeRecusada }
    : Object.fromEntries(TIERS_TRILHA.filter(t => t <= (Number(raw.nex) || 0)).map(t => [t, true]));
  sheet.nex = Math.max(0, Math.min(99, Number(raw.nex ?? 5)));
  ajustarNexDaClasse(sheet);

  sheet.skills = Array.isArray(raw.skills) ? raw.skills : [];
  sheet.cards = Array.isArray(raw.cards) ? raw.cards : [];
  sheet.ataques = Array.isArray(raw.ataques) ? raw.ataques : [];
  sheet.poderesEscolhidos = Array.isArray(raw.poderesEscolhidos) ? raw.poderesEscolhidos : [];
  sheet.poderesParanormais = Array.isArray(raw.poderesParanormais) ? raw.poderesParanormais : [];
  sheet.poderesCustomizados = Array.isArray(raw.poderesCustomizados) ? raw.poderesCustomizados : [];
  sheet.rituaisConhecidos = Array.isArray(raw.rituaisConhecidos)
    ? raw.rituaisConhecidos.map(id => id === 'amaldicoar-arma' ? 'amaldicoar-arma-conhecimento' : id)
    : [];
  sheet.inventario = Array.isArray(raw.inventario) ? raw.inventario : [];
  sheet.condicoesAtivas = Array.isArray(raw.condicoesAtivas) ? raw.condicoesAtivas : [];

  sheet.maxPv = calcPvMax(sheet);
  sheet.pv = raw.pv !== undefined ? Number(raw.pv) : sheet.maxPv;
  sheet.pvTemp = Number(raw.pvTemp) || 0;
  sheet.pvMarcas = Number(raw.pvMarcas) || 0;

  sheet.maxPe = calcPeMax(sheet);
  sheet.pe = raw.pe !== undefined ? Number(raw.pe) : sheet.maxPe;
  sheet.peTemp = Number(raw.peTemp) || 0;

  sheet.maxSan = calcSanMax(sheet);
  sheet.san = raw.san !== undefined ? Number(raw.san) : sheet.maxSan;
  sheet.sanTemp = Number(raw.sanTemp) || 0;
  sheet.sanMarcas = Number(raw.sanMarcas) || 0;

  sheet.defesaOutros = Number(raw.defesaOutros) || 0;
  sheet.deslocamento = raw.deslocamento || '9m (6q)';

  sheet.diceColor = typeof raw.diceColor === 'string' ? raw.diceColor : '';
  sheet.themeColor = typeof raw.themeColor === 'string' ? raw.themeColor : '';
  sheet.viewMode = raw.viewMode === 'traditional' ? 'traditional' : 'cinematic';
  sheet.cinematicTokenX = Math.max(0, Math.min(100, Number(raw.cinematicTokenX ?? 50)));
  sheet.cinematicTokenY = Math.max(0, Math.min(100, Number(raw.cinematicTokenY ?? 52)));
  sheet.cinematicTokenScale = Math.max(45, Math.min(220, Number(raw.cinematicTokenScale ?? 100)));
  sheet.cinematicOutlineSide = ['left', 'right', 'both', 'none'].includes(raw.cinematicOutlineSide) ? raw.cinematicOutlineSide : 'left';
  sheet.cinematicOutlineIntensity = Math.max(0, Math.min(1, Number(raw.cinematicOutlineIntensity ?? 0.5)));
  sheet.cinematicOutlineWidth = Math.max(0, Math.min(10, Number(raw.cinematicOutlineWidth ?? 1.8)));
  sheet.cinematicOutlineFade = Math.max(0, Math.min(10, Number(raw.cinematicOutlineFade ?? 1.5)));
  sheet.backgroundBlur = Math.max(0, Math.min(50, Number(raw.backgroundBlur ?? 0)));
  sheet.backgroundZoom = Math.max(20, Math.min(300, Number(raw.backgroundZoom ?? 100)));
  sheet.cinematicCollapsed = { abilities: false, combat: false, rituals: false, items: true, history: true, ...(raw.cinematicCollapsed || {}) };

  return sheet;
}

export function getIconeRecurso(tipo, atual, max) {
  const icons = ICONES_RECURSO[tipo];
  if (!icons) return '';
  if (atual <= 0) return icons.empty || icons.low || icons.full;
  const pct = max > 0 ? (atual / max) : 0;
  if (tipo === 'pe') {
    return pct > 0.5 ? icons.full : (pct > 0 ? icons.half : icons.empty);
  }
  return pct > 0.5 ? icons.full : (pct >= 0.25 ? icons.half : icons.low);
}

