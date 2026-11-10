/**
 * Wizard de Criação Rápida de Ameaças (Ordem Paranormal RPG)
 * Conduz o mestre passo a passo na criação de criaturas paranormais ou ameaças mundanas,
 * integrando cálculo automático de estatísticas equilibradas por Valor de Desafio (VD).
 */

import {
  THREAT_ELEMENTS,
  THREAT_SIZES,
  CREATURE_TYPES_PARANORMAL,
  CREATURE_TYPES_MUNDANE
} from './threat-data.js';
import { getBalance, ELEMENT_VULNERABILITY_HINTS } from './threat-balance.js';
import { normalizeThreatSheet } from './threat-system.js';
import { icon } from '../../icons.js';
import {
  fichaTemConteudo,
  estadoRecalInicial,
  renderEscolha,
  renderRecalibrar,
  renderRecalPreview,
  aplicarRecal
} from './threat-recalibrate.js';

const PASSOS = [
  'Categoria & Elemento',
  'Identidade & Desafio',
  'Arquétipo & Estatísticas',
  'Defesas & Fraquezas',
  'Presença & Enigma',
  'Ações de Combate',
  'Revisão Final'
];

const VDS_POPULARES = [20, 40, 60, 80, 100, 140, 180, 240, 320, 400];

export const ARQUETIPOS = [
  {
    id: 'tank',
    nome: 'Tank',
    icone: 'shield',
    desc: 'Foco em absorção de dano e resistência massiva. Muito PV, teste de Fortitude altíssimo, golpes devastadores corpo a corpo.',
    atributos: { for: 4, agi: 1, int: 1, pre: 2, vig: 4 },
    salvaguardas: { forte: 'fortitude', media: 'reflexos', fraca: 'vontade' },
    modPv: 1.15,
    modDef: -2,
    ataqueNome: 'Golpe Esmagador',
    ataqueTipo: 'Impacto'
  },
  {
    id: 'predador',
    nome: 'Predador',
    icone: 'zap',
    desc: 'Rápido, furtivo e letal. Alta Defesa e Reflexos, deslocamento ampliado e múltiplos ataques precisos.',
    atributos: { for: 2, agi: 4, int: 2, pre: 2, vig: 2 },
    salvaguardas: { forte: 'reflexos', media: 'fortitude', fraca: 'vontade' },
    modPv: 0.9,
    modDef: +3,
    ataqueNome: 'Garras Dilacerantes',
    ataqueTipo: 'Corte'
  },
  {
    id: 'mental',
    nome: 'Mental',
    icone: 'eye',
    desc: 'Manipula a mente e distorce a percepção dos alvos. Alta Presença e Intelecto, DT elevada e efeitos perturbadores.',
    atributos: { for: 1, agi: 2, int: 4, pre: 4, vig: 2 },
    salvaguardas: { forte: 'vontade', media: 'reflexos', fraca: 'fortitude' },
    modPv: 0.85,
    modDef: 0,
    ataqueNome: 'Toque Espectral',
    ataqueTipo: 'Mental'
  },
  {
    id: 'boss',
    nome: 'Boss',
    icone: 'star',
    desc: 'Ameaça de encontro culminante. Estatísticas sólidas e completas, pronto para desafiar uma equipe inteira sozinho.',
    atributos: { for: 3, agi: 3, int: 2, pre: 3, vig: 3 },
    salvaguardas: { forte: 'fortitude', media: 'vontade', fraca: 'reflexos' },
    modPv: 1.05,
    modDef: +1,
    ataqueNome: 'Açoite Brutal',
    ataqueTipo: 'Perfuração'
  }
];

const ELEMENT_THEMES = {
  sangue: {
    nome: 'SANGUE',
    cor: '#e0150d',
    corClara: '#fca5a5',
    bg: 'rgba(224, 21, 13, 0.12)',
    glow: 'rgba(224, 21, 13, 0.45)',
    desc: 'Sentimento, dor, ferocidade e intensidade orgânica.'
  },
  morte: {
    nome: 'MORTE',
    cor: '#181922',
    corClara: '#ffffff',
    bg: 'rgba(24, 25, 34, 0.6)',
    glow: 'rgba(30, 32, 42, 0.7)',
    desc: 'Tempo, entropia, silêncio e lodo decadente.'
  },
  energia: {
    nome: 'ENERGIA',
    cor: '#9333ea',
    corClara: '#d8b4fe',
    bg: 'rgba(147, 51, 234, 0.14)',
    glow: 'rgba(147, 51, 234, 0.45)',
    desc: 'Caos, transformação, calor, luz e eletricidade.'
  },
  conhecimento: {
    nome: 'CONHECIMENTO',
    cor: '#c9a227',
    corClara: '#ffffff',
    bg: 'rgba(201, 162, 39, 0.16)',
    glow: 'rgba(201, 162, 39, 0.45)',
    desc: 'Razão, consciência, palavras e sigilos misteriosos.'
  },
  medo: {
    nome: 'MEDO',
    cor: '#e2e8f0',
    corClara: '#ffffff',
    bg: 'rgba(226, 232, 240, 0.12)',
    glow: 'rgba(255, 255, 255, 0.35)',
    desc: 'O desconhecido infinito; transcende todas as barreiras.'
  }
};

const HABILIDADES_ELEMENTARES = {
  sangue: {
    nome: 'Frenesi Sangrento',
    tipoAcao: 'reacao',
    gatilho: 'Quando machucada',
    ativaQuando: 'machucado',
    texto: 'Quando fica machucada, a criatura entra em frenesi incontrolável: recebe +5 em testes de ataque e pode realizar um ataque corpo a corpo adicional por rodada como ação livre.'
  },
  morte: {
    nome: 'Lodo Temporal',
    tipoAcao: 'movimento',
    gatilho: '1 vez por rodada',
    ativaQuando: null,
    texto: 'A criatura expele uma poça de lodo espiral em raio de 3m. Inimigos na área ficam com deslocamento reduzido pela metade e sofrem -2 em testes de Defesa e Reflexos até o fim de seus próximos turnos.'
  },
  energia: {
    nome: 'Descarga Caótica',
    tipoAcao: 'padrao',
    gatilho: 'Recarga 1 rodada',
    ativaQuando: null,
    texto: 'Arcos elétricos saltam da criatura em direção a até 3 alvos a alcance curto. Cada alvo sofre dano de Eletricidade igual à metade do dano médio do ataque principal (Reflexos reduz à metade).'
  },
  conhecimento: {
    nome: 'Sussurros da Ruína',
    tipoAcao: 'padrao',
    gatilho: '',
    ativaQuando: null,
    texto: 'Sussurros incompreensíveis ecoam na mente de todos os alvos a alcance curto. Cada criatura deve passar em um teste de Vontade contra a DT da criatura ou fica Fascinada por 1 rodada.'
  },
  medo: {
    nome: 'Aura Aterradora',
    tipoAcao: 'passiva',
    gatilho: 'Constante',
    ativaQuando: null,
    texto: 'A simples proximidade com a criatura distorce a realidade. Inimigos a alcance curto sofrem desvantagem em testes de resistência mental e perdem 1 Sanidade / PD no início de cada um de seus turnos.'
  }
};

let atual = null;
const DURACAO_SAIDA = 180;

function safe(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fecharThreatWizard(animado = false) {
  if (!atual) return;
  const { el } = atual;
  atual = null;
  if (!animado) {
    el.remove();
    return;
  }
  el.classList.add('closing');
  setTimeout(() => el.remove(), DURACAO_SAIDA);
}

/**
 * Aplica as escolhas do wizard sobre o objeto da ficha
 */
export function aplicarEscolhas(sheet, d) {
  const bal = getBalance(d.vd, d.preset);
  const arq = ARQUETIPOS.find(a => a.id === d.arquetipo) || ARQUETIPOS[0];

  sheet.categoria = d.categoria;
  sheet.name = d.nome.trim() || (d.categoria === 'mundana' ? 'Inimigo Mundano' : 'Criatura do Outro Lado');
  sheet.subtitulo = d.subtitulo.trim() || (d.categoria === 'mundana' ? 'REALIDADE' : (THREAT_ELEMENTS[d.elementoPrincipal]?.nome.toUpperCase() || 'SANGUE'));
  sheet.vd = Number(d.vd) || 60;
  sheet.balanco = { vd: sheet.vd, preset: d.preset || 'equilibrada', slider: 0 };
  sheet.tipo = d.tipo;
  sheet.tamanho = d.tamanho;
  sheet.elementos = d.categoria === 'mundana' ? [] : [d.elementoPrincipal, ...(d.elementosComplementares || [])];
  sheet.elementoDestaque = d.categoria === 'mundana' ? 'mundana' : d.elementoPrincipal;
  if (d.categoria === 'mundana') {
    sheet.themeColor = '#ffffff';
    sheet.hasIntro = true;
    sheet.introSide = 'top';
    if (!sheet.introText) {
      sheet.introText = (d.nome || '').toLowerCase().includes('lobo')
        ? 'Hábeis caçadores em grupo. Ao ouvir seu uivo, saiba que ele nunca estará sozinho.'
        : 'Inimigo perigoso e implacável em seu território natural.';
    }
  }

  // PV e Defesa ajustados pelo arquétipo
  const pvFinal = Math.round(bal.pv * (arq.modPv || 1));
  sheet.pv = pvFinal;
  sheet.pvMax = pvFinal;
  sheet.pvTemp = 0;
  sheet.defesa = Math.max(10, bal.defesa + (arq.modDef || 0));

  // Atributos do arquétipo
  sheet.atributos = { ...arq.atributos };

  // Salvaguardas organizadas por forte/média/fraca do arquétipo
  const resMap = {
    [arq.salvaguardas.forte]: bal.resForte,
    [arq.salvaguardas.media]: bal.resMedia,
    [arq.salvaguardas.fraca]: bal.resFraca
  };

  sheet.salvaguardas = {
    fortitude: { dados: resMap.fortitude?.dados ?? 3, bonus: resMap.fortitude?.bonus ?? 10 },
    reflexos: { dados: resMap.reflexos?.dados ?? 2, bonus: resMap.reflexos?.bonus ?? 5 },
    vontade: { dados: resMap.vontade?.dados ?? 2, bonus: resMap.vontade?.bonus ?? 0 }
  };

  // Sentidos proporcionais
  sheet.sentidos = {
    percepcao: { dados: sheet.atributos.pre || 2, bonus: resMap.media?.bonus || 5 },
    iniciativa: { dados: sheet.atributos.agi || 2, bonus: resMap.media?.bonus || 5 },
    extra: d.categoria === 'paranormal' ? 'Percepção às cegas' : 'Visão normal'
  };

  sheet.deslocamento = {
    metros: d.arquetipo === 'predador' ? 15 : (d.tamanho === 'Enorme' || d.tamanho === 'Colossal' ? 15 : 12),
    extras: []
  };

  // Defesas & Fraquezas
  sheet.resistencias = [];
  sheet.vulnerabilidades = [];
  sheet.imunidades = [];

  if (d.categoria === 'paranormal') {
    // Resistências padrão do outro lado
    const rdBal = Math.max(5, Math.min(25, Math.round(sheet.vd / 20) * 5));
    if (d.resistenciasPadrao) {
      sheet.resistencias = [
        { tipo: 'Balístico', valor: rdBal },
        { tipo: 'Impacto', valor: rdBal },
        { tipo: 'Perfuração', valor: rdBal }
      ];
    }

    if (d.incluirVulnerabilidade && ELEMENT_VULNERABILITY_HINTS[d.elementoPrincipal]) {
      const hint = ELEMENT_VULNERABILITY_HINTS[d.elementoPrincipal];
      sheet.vulnerabilidades.push(hint.fraqueza);
    }

    if (d.elementoPrincipal === 'morte') {
      sheet.imunidades.push('Frio', 'Efeitos de Idade');
    } else if (d.elementoPrincipal === 'sangue') {
      sheet.imunidades.push('Condições de Hemorragia');
    } else if (d.elementoPrincipal === 'medo') {
      sheet.imunidades.push('Dano Mental', 'Condições de Medo');
    }
  }

  // Presença Perturbadora
  if (d.categoria === 'paranormal' && d.presencaAtiva) {
    sheet.presenca = {
      ativa: true,
      dt: bal.dt,
      dano: bal.presenca ? `${bal.presenca.dados}d${bal.presenca.faces}` : '3d6',
      tipoDano: 'mental',
      imuneNex: bal.imuneNex,
      texto: ''
    };
  } else {
    sheet.presenca = {
      ativa: false,
      dt: 15,
      dano: '2d6',
      tipoDano: 'mental',
      imuneNex: 0,
      texto: ''
    };
  }

  // Ações
  sheet.acoes = [];
  const atk = d.ataquePadrao || {};
  const danoSugerido = atk.dano || bal.sugestoesDano?.[0] || '2d8+6';
  const atkBonus = atk.bonus !== undefined ? Number(atk.bonus) : bal.ataque.bonus;
  const atkDados = Math.max(1, Number(atk.dados) || sheet.atributos.for || bal.ataque.dados);

  sheet.acoes.push({
    id: `act-wizard-1`,
    tipoAcao: atk.tipoAcao || 'padrao',
    nome: atk.nomeAcao || 'Agredir',
    gatilho: '',
    custo: '',
    usos: null,
    ataques: [
      {
        id: `atk-wizard-1`,
        nome: atk.nomeAtaque || arq.ataqueNome || 'Ataque Padrão',
        alcance: atk.alcance || 'corpo',
        multiplicador: Math.max(1, Number(atk.multiplicador) || 1),
        teste: { dados: atkDados, bonus: atkBonus },
        dano: danoSugerido,
        tipoDano: atk.tipoDano || arq.ataqueTipo || 'Impacto',
        critico: atk.critico || '20/x2'
      }
    ],
    texto: '',
    coluna: 'direita',
    ativaQuando: null,
    fase: null
  });

  // Ações adicionais configuradas no Wizard
  if (Array.isArray(d.acoesExtras) && d.acoesExtras.length > 0) {
    d.acoesExtras.forEach((act, idx) => {
      sheet.acoes.push({
        id: `act-wiz-extra-${idx + 1}-${Date.now()}`,
        tipoAcao: act.tipoAcao || 'movimento',
        nome: act.nome || `Ação ${idx + 2}`,
        gatilho: act.gatilho || '',
        custo: '',
        usos: null,
        ataques: [],
        texto: act.texto || '',
        coluna: 'direita',
        ativaQuando: null,
        fase: null
      });
    });
  }

  // Habilidade Elementar Opcional
  if (d.categoria === 'paranormal' && d.adicionarHabilidadeElementar && HABILIDADES_ELEMENTARES[d.elementoPrincipal]) {
    const hab = HABILIDADES_ELEMENTARES[d.elementoPrincipal];
    sheet.acoes.push({
      id: `act-wizard-elemental`,
      tipoAcao: hab.tipoAcao,
      nome: hab.nome,
      gatilho: hab.gatilho,
      custo: '',
      usos: null,
      ataques: [],
      texto: hab.texto,
      coluna: 'direita',
      ativaQuando: hab.ativaQuando,
      fase: null
    });
  }

  // Seções livres / Enigma de Medo
  sheet.secoes = [];
  if (d.adicionarEnigma) {
    sheet.secoes.push({
      id: `sec-enigma-${Date.now()}`,
      titulo: 'ENIGMA DE MEDO',
      estilo: 'enigma',
      corpo: `O enigma desta criatura protege sua existência mundana. Enquanto o enigma não for resolvido, a criatura é imune a todo tipo de dano e tem sua Defesa aumentada em +10.\n\nComo resolver: Os investigadores precisam encontrar um item pessoal significativo da criatura e purificá-lo com um ritual ou ação simbólica específica. Uma vez resolvido, ela perde suas imunidades e fica vulnerável por 2 rodadas.`,
      coluna: 'esquerda'
    });
  }
}

function renderPasso1(d) {
  const isParanormal = d.categoria === 'paranormal';
  return `
    <p class="wiz-lead">Defina a natureza da ameaça. Criaturas do Outro Lado canalizam os Elementos, enquanto ameaças Mundanas seguem as leis da física e da biologia.</p>
    
    <div class="wiz-options" style="margin-bottom:20px;">
      <button type="button" class="wiz-option ${isParanormal ? 'selected' : ''}" data-twiz-categoria="paranormal">
        <b>CRIATURA PARANORMAL</b>
        <em class="wiz-option-tag" style="background:#8b1b1b;color:#fff;">OUTRO LADO</em>
        <span>Monstros formados pela membrana, portadores de elementos paranormais, enigmas de medo e presença perturbadora.</span>
      </button>

      <button type="button" class="wiz-option ${!isParanormal ? 'selected' : ''}" data-twiz-categoria="mundana">
        <b>AMEAÇA MUNDANA</b>
        <em class="wiz-option-tag" style="background:#3d4157;color:#fff;">REALIDADE</em>
        <span>Cultistas humanos, mercenários, animais selvagens, veículos e ameaças físicas da própria realidade.</span>
      </button>
    </div>

    ${isParanormal ? `
      <h3 style="font:700 13px Georgia,serif;color:var(--threat-elem-light, #cfd3eb);letter-spacing:.05em;margin:0 0 10px;text-transform:uppercase;">Selecione o Elemento Principal</h3>
      <div class="threat-wiz-elements-grid">
        ${Object.values(THREAT_ELEMENTS).filter(el => el.id !== 'mundana').map(el => {
          const isSelected = d.elementoPrincipal === el.id;
          const theme = ELEMENT_THEMES[el.id] || { cor: el.cor, corClara: '#cfd3eb', desc: '', bg: 'rgba(255,255,255,0.05)', glow: 'rgba(0,0,0,0.4)' };
          return `
            <button type="button" class="threat-wiz-elem-card ${isSelected ? 'selected' : ''}" 
              data-twiz-elem="${el.id}" style="--elem-border:${theme.cor}; --elem-bg:${theme.bg}; --elem-glow:${theme.glow};">
              <div class="elem-card-icon">
                <img src="./assets/elements/${el.id}.png" alt="${el.nome}" draggable="false">
              </div>
              <strong style="color:${theme.cor};">${el.nome.toUpperCase()}</strong>
              <small style="color:${theme.corClara};">${theme.desc}</small>
            </button>
          `;
        }).join('')}
      </div>

      <div style="margin-top:20px;">
        <label style="font:800 10.5px 'Hanken Grotesk',sans-serif;color:#8a8da3;letter-spacing:.08em;display:block;margin-bottom:8px;">
          ELEMENTOS COMPLEMENTARES (OPCIONAL):
        </label>
        <div class="threat-comp-pills-row">
          ${Object.values(THREAT_ELEMENTS).filter(e => e.id !== 'mundana' && e.id !== d.elementoPrincipal).map(e => {
            const isCompSelected = (d.elementosComplementares || []).includes(e.id);
            const eTheme = ELEMENT_THEMES[e.id] || { cor: e.cor };
            return `
              <button type="button" class="threat-comp-pill ${isCompSelected ? 'selected' : ''}" data-twiz-elem-comp="${e.id}" style="--elem-pill-color:${eTheme.cor};">
                <img src="./assets/elements/${e.id}.png" alt="" draggable="false">
                <span>${e.nome.toUpperCase()}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : `
      <div class="wiz-detail" style="border:1px dashed #2b2e45;padding:16px;border-radius:6px;background:#151726;">
        <h4 style="margin:0 0 6px 0;color:#e1e4f5;">Ameaça da Realidade</h4>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#9aa0bc;">
          Ameaças mundanas não sofrem das fraquezas do paranormal e não impõem Presença Perturbadora por padrão. Podem ser combatentes treinados, assassinos da máfia, agentes corrompidos ou bestas ferozes.
        </p>
      </div>
    `}
  `;
}

function renderPasso2(d) {
  const isParanormal = d.categoria === 'paranormal';
  const tipos = isParanormal ? CREATURE_TYPES_PARANORMAL : CREATURE_TYPES_MUNDANE;

  return `
    <p class="wiz-lead">Defina a identidade da criatura e o <b>Valor de Desafio (VD)</b>. O VD calibra todas as fórmulas estatísticas e parâmetros matemáticos da ficha.</p>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="threat-form-group">
        <label>NOME DA AMEAÇA</label>
        <input type="text" data-twiz-input="nome" value="${safe(d.nome)}" placeholder="Ex: Zumbi de Sangue, O Carrasco, Succubus...">
      </div>
      <div class="threat-form-group">
        <label>SUBTÍTULO / EPÍTETO (OPCIONAL)</label>
        <input type="text" data-twiz-input="subtitulo" value="${safe(d.subtitulo)}" placeholder="Ex: SANGUE, ENERGIA E MEDO, O CEIFADOR...">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
      <div class="threat-form-group">
        <label>TIPO DE AMEAÇA</label>
        <select data-twiz-input="tipo" class="threat-book-select">
          ${tipos.map(t => `<option value="${t}" ${d.tipo === t ? 'selected' : ''}>${t.toUpperCase()}</option>`).join('')}
        </select>
      </div>
      <div class="threat-form-group">
        <label>TAMANHO</label>
        <select data-twiz-input="tamanho" class="threat-book-select">
          ${THREAT_SIZES.map(s => `<option value="${s}" ${d.tamanho === s ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="threat-form-group" style="background:#151726;padding:14px;border:1px solid #2b304f;border-radius:6px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <label style="margin:0;font-size:12px;color:#cfd3eb;">VALOR DE DESAFIO (VD): <b id="threat-wiz-vd-val" style="font-size:16px;color:var(--threat-elem-color, var(--red, #e0150d));">${d.vd}</b></label>
        <span id="threat-wiz-team-est" style="font-size:11px;color:#8a8da3;">Estimativa de equipe: 4 agentes NEX ${Math.max(5, Math.round(d.vd / 4))}%</span>
      </div>

      <!-- Chips de VD Rápido -->
      <div class="threat-vd-chips-row">
        ${VDS_POPULARES.map(val => `
          <button type="button" class="threat-vd-chip ${d.vd === val ? 'selected' : ''}" data-twiz-vd-chip="${val}">
            VD ${val}
          </button>
        `).join('')}
      </div>

      <div style="margin-top:12px;display:flex;align-items:center;gap:10px;">
        <input type="range" min="10" max="400" step="5" data-twiz-vd-slider value="${d.vd}" style="flex:1;">
        <input type="number" min="10" max="400" data-twiz-vd-number value="${d.vd}" style="width:70px;background:#1a1c2e;border:1px solid #333959;color:#fff;padding:4px 8px;border-radius:4px;font-weight:700;text-align:center;">
      </div>
    </div>
  `;
}

function renderPasso3(d) {
  const bal = getBalance(d.vd, d.preset);

  return `
    <p class="wiz-lead">Escolha o <b>Arquétipo de Combate</b>. Ele orientará como os pontos de atributos, pontos de vida, defesas e testes de resistência são distribuídos em torno do seu VD ${d.vd}.</p>
    
    <div class="threat-archetypes-grid">
      ${ARQUETIPOS.map(arq => {
        const isSelected = d.arquetipo === arq.id;
        const estPv = Math.round(bal.pv * (arq.modPv || 1));
        const estDef = bal.defesa + (arq.modDef || 0);

        return `
          <button type="button" class="threat-archetype-card ${isSelected ? 'selected' : ''}" data-twiz-arquetipo="${arq.id}">
            <div class="archetype-top">
              <span class="archetype-icon">${icon(arq.icone, 20)}</span>
              <b>${arq.nome}</b>
            </div>
            <p class="archetype-desc">${arq.desc}</p>
            <div class="archetype-stats-preview">
              <span><b>PV:</b> ~${estPv}</span>
              <span><b>Defesa:</b> ${estDef}</span>
              <span><b>Res. Forte:</b> +${bal.resForte.bonus} (${arq.salvaguardas.forte.toUpperCase()})</span>
            </div>
          </button>
        `;
      }).join('')}
    </div>

    <!-- Seletor de Perfil de Balanceamento -->
    <div style="margin-top:18px;background:#151726;padding:12px 14px;border:1px solid #2b304f;border-radius:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div>
        <label style="font:800 10.5px 'Hanken Grotesk',sans-serif;color:#cfd3eb;letter-spacing:.08em;margin-bottom:2px;display:block;">BALANCEAMENTO</label>
        <span style="font-size:11px;color:#8a8da3;">Como a matemática da ameaça responde aos agentes</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button type="button" class="threat-vd-chip ${d.preset === 'leve' ? 'selected' : ''}" data-twiz-preset="leve">Fácil (Narrativo)</button>
        <button type="button" class="threat-vd-chip ${d.preset === 'equilibrada' ? 'selected' : ''}" data-twiz-preset="equilibrada">Equilibrado (Recomendado)</button>
        <button type="button" class="threat-vd-chip ${d.preset === 'editora' ? 'selected' : ''}" data-twiz-preset="editora">Difícil (Tabela Oficial de Balanceamento da Jambô)</button>
      </div>
    </div>
  `;
}

function renderPasso4(d) {
  const isParanormal = d.categoria === 'paranormal';
  const hint = isParanormal ? ELEMENT_VULNERABILITY_HINTS[d.elementoPrincipal] : null;
  const rdBal = Math.max(5, Math.min(25, Math.round(d.vd / 20) * 5));

  return `
    <p class="wiz-lead">Defina as resistências a dano, blindagens e vulnerabilidades exploráveis pelos investigadores durante o combate.</p>

    <div style="display:flex;flex-direction:column;gap:16px;">
      
      <!-- Resistências Automáticas -->
      <div class="threat-form-group" style="background:#151726;padding:14px;border:1px solid #2b304f;border-radius:6px;">
        <label style="font-size:12px;color:#cfd3eb;margin-bottom:6px;">RESISTÊNCIAS A DANO RECOMENDADAS PARA VD ${d.vd}</label>
        <p style="font-size:12px;color:#9aa0bc;margin:0 0 10px 0;">
          ${isParanormal 
            ? `Criaturas do Outro Lado costumam ter Resistência a Dano Físico (Balístico, Impacto e Perfuração) equivalente a <b>${rdBal}</b>.` 
            : `Ameaças mundanas usam coletes ou armaduras pesadas conferindo Resistência a Balístico <b>${Math.min(10, rdBal)}</b>.`}
        </p>
        <div style="display:flex;gap:10px;align-items:center;">
          <input type="checkbox" id="twiz-chk-rd" data-twiz-chk="resistenciasPadrao" ${d.resistenciasPadrao ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--threat-elem-color, #e0150d);">
          <label for="twiz-chk-rd" style="margin:0;cursor:pointer;color:#e1e4f5;font-weight:700;font-size:13px;">
            Aplicar Resistência a Dano recomendada (${isParanormal ? `Balístico ${rdBal}, Impacto ${rdBal}, Perfuração ${rdBal}` : `Balístico ${Math.min(10, rdBal)}`})
          </label>
        </div>
      </div>

      <!-- Vulnerabilidade Elemental -->
      ${hint ? `
        <div class="threat-form-group" style="background:#17192a;padding:14px;border:1px solid #2b304f;border-radius:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="twiz-chk-vuln" data-twiz-chk="incluirVulnerabilidade" ${d.incluirVulnerabilidade ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--threat-elem-color, #e0150d);">
            <label for="twiz-chk-vuln" style="margin:0;cursor:pointer;color:#e1e4f5;font-weight:700;font-size:13px;">
              Adicionar Vulnerabilidade natural a <b>${hint.fraqueza}</b> (Recebe o dobro de dano)
            </label>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}

function renderPasso5(d) {
  const isParanormal = d.categoria === 'paranormal';
  const bal = getBalance(d.vd, d.preset);

  return `
    <p class="wiz-lead">A presença do paranormal corrompe a mente e a alma. Configure o choque de Presença Perturbadora e Enigmas de Medo.</p>

    <div style="display:flex;flex-direction:column;gap:16px;">
      
      <!-- Presença Perturbadora -->
      ${isParanormal ? `
        <div class="threat-form-group" style="background:#151726;padding:14px;border:1px solid #2b304f;border-radius:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label style="margin:0;font-size:13px;color:#cfd3eb;font-weight:700;">PRESENÇA PERTURBADORA (VD ${d.vd})</label>
            <input type="checkbox" data-twiz-chk="presencaAtiva" ${d.presencaAtiva ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--threat-elem-color, #e0150d);">
          </div>
          
          <div id="threat-wiz-presenca-details" style="display:${d.presencaAtiva ? 'block' : 'none'};">
            <p style="font-size:12px;color:#9aa0bc;margin:0 0 12px 0;">
              Investigadores que entram na presença da criatura devem passar em um teste de Vontade ou sofrem dano mental.
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div style="background:#1a1c30;padding:8px 10px;border-radius:4px;border:1px solid #2f3454;">
                <small style="color:#7f84a3;display:block;font-size:10px;">DIFICULDADE (DT)</small>
                <b style="font-size:16px;color:#fff;">DT ${bal.dt}</b>
              </div>
              <div style="background:#1a1c30;padding:8px 10px;border-radius:4px;border:1px solid #2f3454;">
                <small style="color:#7f84a3;display:block;font-size:10px;">DANO MENTAL</small>
                <b style="font-size:16px;color:#a855f7;">${bal.presenca ? `${bal.presenca.dados}d${bal.presenca.faces}` : '3d6'}</b>
              </div>
              <div style="background:#1a1c30;padding:8px 10px;border-radius:4px;border:1px solid #2f3454;">
                <small style="color:#7f84a3;display:block;font-size:10px;">IMUNIDADE NEX</small>
                <b style="font-size:16px;color:#38bdf8;">NEX ${bal.imuneNex}%</b>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="wiz-detail" style="border:1px solid #2b304f;padding:12px;border-radius:6px;background:#151726;">
          <p style="margin:0;font-size:12px;color:#8a8da3;">Ameaças mundanas não possuem Presença Perturbadora por padrão.</p>
        </div>
      `}

      <!-- Enigma de Medo -->
      <div class="threat-form-group" style="background:#191824;padding:14px;border:1px solid #3d354b;border-radius:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-flex;">${icon('book', 16)}</span>
            <label style="margin:0;font-size:13px;color:#e8d1a7;font-weight:700;">ENIGMA DE MEDO (INVESTIGAÇÃO)</label>
          </div>
          <input type="checkbox" data-twiz-chk="adicionarEnigma" ${d.adicionarEnigma ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--threat-elem-color, #e0150d);">
        </div>
        <p style="font-size:12px;color:#9aa0bc;margin:0;">
          Gera uma seção especial de Enigma de Medo na ficha (estilo livro envelhecido). Essencial para criaturas invulneráveis que exigem investigação prévia para serem derrotadas.
        </p>
      </div>

    </div>
  `;
}

function renderPasso6(d) {
  const bal = getBalance(d.vd, d.preset);
  const arq = ARQUETIPOS.find(a => a.id === d.arquetipo) || ARQUETIPOS[0];
  const hab = HABILIDADES_ELEMENTARES[d.elementoPrincipal];

  if (!d.ataquePadrao) {
    d.ataquePadrao = {
      nomeAcao: 'Agredir',
      tipoAcao: 'padrao',
      nomeAtaque: arq.ataqueNome || 'Ataque Padrão',
      alcance: 'corpo',
      multiplicador: 1,
      dados: Math.max(1, arq.atributos.for || bal.ataque.dados),
      bonus: bal.ataque.bonus,
      dano: bal.sugestoesDano?.[0] || '2d8+6',
      tipoDano: arq.ataqueTipo || 'Impacto',
      critico: '20/x2'
    };
  }
  if (!Array.isArray(d.acoesExtras)) {
    d.acoesExtras = [];
  }

  const atk = d.ataquePadrao;

  return `
    <p class="wiz-lead">Configure as ações de combate e habilidades especiais da ameaça. Você pode editar o ataque principal e adicionar ações extras.</p>

    <div style="display:flex;flex-direction:column;gap:16px;">
      
      <!-- Ação Principal de Ataque (Editável) -->
      <div style="background:#151726;padding:14px;border:1px solid #2b304f;border-radius:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <b style="font-size:13px;color:#cfd3eb;">◆ AÇÃO PRINCIPAL DE ATAQUE</b>
          <span style="font-size:11px;color:#8a8da3;">Dano alvo: ~${bal.danoMedio}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">NOME DA AÇÃO</label>
            <input type="text" data-twiz-atk="nomeAcao" value="${safe(atk.nomeAcao || 'Agredir')}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">TIPO DE AÇÃO</label>
            <select data-twiz-atk="tipoAcao" style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
              <option value="padrao" ${atk.tipoAcao === 'padrao' ? 'selected' : ''}>Padrão</option>
              <option value="completa" ${atk.tipoAcao === 'completa' ? 'selected' : ''}>Completa</option>
              <option value="movimento" ${atk.tipoAcao === 'movimento' ? 'selected' : ''}>Movimento</option>
              <option value="livre" ${atk.tipoAcao === 'livre' ? 'selected' : ''}>Livre</option>
              <option value="reacao" ${atk.tipoAcao === 'reacao' ? 'selected' : ''}>Reação</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1.2fr 1fr 0.8fr;gap:10px;margin-bottom:10px;">
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">NOME DO ATAQUE</label>
            <input type="text" data-twiz-atk="nomeAtaque" value="${safe(atk.nomeAtaque || arq.ataqueNome)}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">ALCANCE</label>
            <select data-twiz-atk="alcance" style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
              <option value="corpo" ${atk.alcance === 'corpo' ? 'selected' : ''}>Corpo a corpo</option>
              <option value="curto" ${atk.alcance === 'curto' ? 'selected' : ''}>Curto</option>
              <option value="medio" ${atk.alcance === 'medio' ? 'selected' : ''}>Médio</option>
              <option value="longo" ${atk.alcance === 'longo' ? 'selected' : ''}>Longo</option>
              <option value="extremo" ${atk.alcance === 'extremo' ? 'selected' : ''}>Extremo</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">QTD (X)</label>
            <input type="number" min="1" max="10" data-twiz-atk="multiplicador" value="${atk.multiplicador || 1}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;font-size:12px;">
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">TESTE (D20)</label>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" min="1" max="10" data-twiz-atk="dados" value="${atk.dados}" 
                style="width:45px;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px;border-radius:4px;font-size:12px;text-align:center;">
              <span style="color:#787e9c;">d20+</span>
              <input type="number" data-twiz-atk="bonus" value="${atk.bonus}" 
                style="width:50px;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px;border-radius:4px;font-size:12px;text-align:center;">
            </div>
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">DANO</label>
            <input type="text" data-twiz-atk="dano" value="${safe(atk.dano)}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:var(--threat-elem-color, #e0150d);font-weight:700;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">TIPO DANO</label>
            <input type="text" data-twiz-atk="tipoDano" value="${safe(atk.tipoDano)}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#8a8da3;margin-bottom:4px;">CRÍTICO</label>
            <input type="text" data-twiz-atk="critico" value="${safe(atk.critico || '20/x2')}" 
              style="width:100%;background:#191c30;border:1px solid #2f3454;color:#fff;padding:6px 10px;border-radius:4px;font-size:12px;">
          </div>
        </div>
      </div>

      <!-- Ações Extras Adicionais -->
      <div style="background:#151726;padding:14px;border:1px solid #2b304f;border-radius:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <b style="font-size:13px;color:#cfd3eb;">◆ AÇÕES ADICIONAIS & HABILIDADES</b>
          <button type="button" data-twiz-add-action style="background:#222538;border:1px solid #3d4368;color:#cfd3eb;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;">
            + ADICIONAR AÇÃO
          </button>
        </div>

        ${d.acoesExtras.length === 0 ? `
          <p style="font-size:12px;color:#787e9c;margin:0;font-style:italic;">Nenhuma ação adicional configurada. Clique em "+ ADICIONAR AÇÃO" para incluir ações de movimento, completas, reações ou habilidades personalizadas.</p>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${d.acoesExtras.map((extra, idx) => `
              <div style="background:#191c30;border:1px solid #2f3454;border-radius:5px;padding:10px;">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                  <select data-twiz-extra-idx="${idx}" data-twiz-extra-field="tipoAcao" 
                    style="background:#131524;border:1px solid #363c5e;color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">
                    <option value="padrao" ${extra.tipoAcao === 'padrao' ? 'selected' : ''}>PADRÃO</option>
                    <option value="movimento" ${extra.tipoAcao === 'movimento' ? 'selected' : ''}>MOVIMENTO</option>
                    <option value="completa" ${extra.tipoAcao === 'completa' ? 'selected' : ''}>COMPLETA</option>
                    <option value="reacao" ${extra.tipoAcao === 'reacao' ? 'selected' : ''}>REAÇÃO</option>
                    <option value="livre" ${extra.tipoAcao === 'livre' ? 'selected' : ''}>LIVRE</option>
                    <option value="passiva" ${extra.tipoAcao === 'passiva' ? 'selected' : ''}>PASSIVA</option>
                  </select>
                  <input type="text" data-twiz-extra-idx="${idx}" data-twiz-extra-field="nome" value="${safe(extra.nome || '')}" placeholder="Nome da ação/habilidade" 
                    style="flex:1;background:#131524;border:1px solid #363c5e;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;">
                  <input type="text" data-twiz-extra-idx="${idx}" data-twiz-extra-field="gatilho" value="${safe(extra.gatilho || '')}" placeholder="Gatilho / Condição (opcional)" 
                    style="width:140px;background:#131524;border:1px solid #363c5e;color:#8a8da3;padding:4px 8px;border-radius:4px;font-size:11px;">
                  <button type="button" data-twiz-del-action="${idx}" style="background:transparent;border:none;color:#f87171;font-size:16px;cursor:pointer;padding:0 4px;" title="Remover ação">×</button>
                </div>
                <textarea data-twiz-extra-idx="${idx}" data-twiz-extra-field="texto" rows="2" placeholder="Descrição do efeito, regras ou dano..." 
                  style="width:100%;background:#131524;border:1px solid #363c5e;color:#cfd3eb;padding:6px 8px;border-radius:4px;font-size:12px;font-family:inherit;resize:vertical;">${safe(extra.texto || '')}</textarea>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Habilidade Elementar Opcional -->
      ${(d.categoria === 'paranormal' && hab) ? `
        <div style="background:#1b1928;padding:14px;border:1px solid #3f2f4e;border-radius:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="display:inline-flex;">${icon('zap', 14)}</span>
              <b style="font-size:13px;color:#e1e4f5;">HABILIDADE CARACTERÍSTICA: ${hab.nome.toUpperCase()}</b>
            </div>
            <input type="checkbox" data-twiz-chk="adicionarHabilidadeElementar" ${d.adicionarHabilidadeElementar ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--threat-elem-color, #e0150d);">
          </div>
          <p style="font-size:12px;color:#9aa0bc;margin:0 0 6px 0;">
            ${hab.texto}
          </p>
        </div>
      ` : ''}

    </div>
  `;
}

function renderPasso7(d) {
  const bal = getBalance(d.vd, d.preset);
  const arq = ARQUETIPOS.find(a => a.id === d.arquetipo) || ARQUETIPOS[0];
  const isParanormal = d.categoria === 'paranormal';
  const pvFinal = Math.round(bal.pv * (arq.modPv || 1));
  const defFinal = Math.max(10, bal.defesa + (arq.modDef || 0));
  const atk = d.ataquePadrao || {};

  return `
    <p class="wiz-lead">Revise o resumo da ameaça gerada antes de salvar e abrir a ficha no modo livro.</p>

    <div class="threat-review-card">
      <header class="threat-review-header">
        <div style="display:flex;align-items:center;gap:12px;">
          ${isParanormal ? `
            <img src="./assets/elements/${d.elementoPrincipal}.png" style="width:42px;height:42px;object-fit:contain;" alt="">
          ` : icon('shield', 36)}
          <div>
            <h3 style="margin:0;font:700 20px Georgia,serif;color:#fff;">${safe(d.nome || 'Nova Ameaça')}</h3>
            <span style="font-size:11px;color:#a9adc4;letter-spacing:.1em;text-transform:uppercase;">
              ${safe(d.subtitulo || (isParanormal ? d.elementoPrincipal : 'REALIDADE'))} • ${safe(d.tipo)} • ${safe(d.tamanho)}
            </span>
          </div>
        </div>
        <div class="threat-review-vd">
          <small>VD</small>
          <strong>${d.vd}</strong>
        </div>
      </header>

      <div class="threat-review-body">
        <div class="review-stat-col">
          <span class="label">PONTOS DE VIDA</span>
          <b class="val-pv">${pvFinal} PV</b>
          <small>Machucado: ${Math.floor(pvFinal / 2)}</small>
        </div>
        <div class="review-stat-col">
          <span class="label">DEFESA</span>
          <b class="val-def">${defFinal}</b>
          <small>Arquétipo: ${arq.nome}</small>
        </div>
        <div class="review-stat-col">
          <span class="label">RESISTÊNCIAS</span>
          <b>Fort +${bal.resForte.bonus} | Ref +${bal.resMedia.bonus} | Von +${bal.resFraca.bonus}</b>
        </div>
        <div class="review-stat-col">
          <span class="label">ATAQUE PRINCIPAL</span>
          <b>${atk.nomeAtaque || arq.ataqueNome}</b>
          <small>Dano: ${atk.dano || bal.sugestoesDano?.[0] || '2d8+6'} (${atk.tipoDano || arq.ataqueTipo})</small>
        </div>
      </div>
    </div>
  `;
}

/** Tela de escolha e tela de recalibração para fichas que já têm conteúdo */
function desenharModoExistente(section, d) {
  const recalibrando = d.modo === 'recalibrar';
  section.innerHTML = `
    <header class="wiz-head">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <small style="color:var(--threat-elem-color, #e0150d);letter-spacing:.2em;font-weight:800;">WIZARD DE AMEAÇA · ${recalibrando ? 'RECALIBRAR' : 'FICHA EXISTENTE'}</small>
        <button type="button" class="threat-modal-close-btn" data-twiz-fechar title="Fechar (Esc)">${icon('close', 14)}</button>
      </div>
      <h2>${recalibrando ? 'Recalibrar ficha' : 'O que deseja fazer?'}</h2>
    </header>
    <div class="wiz-body fx-next">
      ${recalibrando ? renderRecalibrar(atual.sheet, d.recal) : renderEscolha()}
    </div>
    <footer class="wiz-foot">
      <button type="button" class="wiz-skip" data-twiz-pular>Cancelar</button>
      <span></span>
      ${recalibrando ? `
        <button type="button" class="wiz-back" data-twiz-modo="escolha">VOLTAR</button>
        <button type="button" class="wiz-next" data-twiz-recal-aplicar style="background:var(--threat-elem-color, var(--red, #e0150d));">APLICAR RECALIBRAÇÃO</button>
      ` : ''}
    </footer>
  `;
}

function atualizarPreviewRecal() {
  if (!atual || atual.d.modo !== 'recalibrar') return;
  const box = atual.el.querySelector('#recal-preview');
  if (box) box.innerHTML = renderRecalPreview(atual.sheet, atual.d.recal);
}

function desenhar() {
  if (!atual) return;
  const { el, d } = atual;
  const section = el.querySelector('section');
  if (!section) return;

  if (d.modo === 'escolha' || d.modo === 'recalibrar') {
    desenharModoExistente(section, d);
    return;
  }

  const passoAtual = d.passo;
  const isUltimo = passoAtual === PASSOS.length - 1;

  // Atualiza as variáveis visuais de tema no elemento pai para estilizar dinamicamente o modal
  const elemTheme = (d.categoria === 'paranormal' && ELEMENT_THEMES[d.elementoPrincipal]) 
    ? ELEMENT_THEMES[d.elementoPrincipal] 
    : { cor: '#e0150d', corClara: '#fca5a5', glow: 'rgba(224, 21, 13, 0.45)', bg: 'rgba(224, 21, 13, 0.12)' };

  el.style.setProperty('--threat-elem-color', elemTheme.cor);
  el.style.setProperty('--threat-elem-glow', elemTheme.glow);
  el.style.setProperty('--threat-elem-bg', elemTheme.bg);
  el.style.setProperty('--threat-elem-light', elemTheme.corClara);

  section.innerHTML = `
    <header class="wiz-head">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <small style="color:var(--threat-elem-color, #e0150d);letter-spacing:.2em;font-weight:800;transition:color 0.2s ease;">WIZARD DE CRIAÇÃO DE AMEAÇA • FASE 4</small>
        <button type="button" class="threat-modal-close-btn" data-twiz-fechar title="Fechar (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <h2>${PASSOS[passoAtual]}</h2>
      
      <ol class="wiz-steps">
        ${PASSOS.map((nome, i) => {
          const isDone = i < passoAtual;
          const isCurrent = i === passoAtual;
          return `
            <li class="${isCurrent ? 'current' : (isDone ? 'done' : '')}">
              <button type="button" data-twiz-ir="${i}" ${i > passoAtual ? 'disabled' : ''}>
                <i>${isDone ? '✓' : (i + 1)}</i>
                <span>${nome}</span>
              </button>
            </li>
          `;
        }).join('')}
      </ol>
    </header>

    <div class="wiz-body fx-next">
      ${passoAtual === 0 ? renderPasso1(d) : ''}
      ${passoAtual === 1 ? renderPasso2(d) : ''}
      ${passoAtual === 2 ? renderPasso3(d) : ''}
      ${passoAtual === 3 ? renderPasso4(d) : ''}
      ${passoAtual === 4 ? renderPasso5(d) : ''}
      ${passoAtual === 5 ? renderPasso6(d) : ''}
      ${passoAtual === 6 ? renderPasso7(d) : ''}
    </div>

    <footer class="wiz-foot">
      <button type="button" class="wiz-skip" data-twiz-pular>Pular wizard</button>
      <span></span>
      ${passoAtual > 0 ? `
        <button type="button" class="wiz-back" data-twiz-voltar>ANTERIOR</button>
      ` : ''}
      <button type="button" class="wiz-next" data-twiz-avancar style="background:var(--threat-elem-color, var(--red, #e0150d));">
        ${isUltimo ? 'CONCLUIR E ABRIR FICHA' : 'PRÓXIMO'}
      </button>
    </footer>
  `;
}

function aoClicar(e) {
  if (!atual) return;
  const { d, sheet, onFinish, onSkip } = atual;
  const alvo = sel => e.target.closest(sel);
  let b;

  if (alvo('[data-twiz-fechar]') || alvo('[data-twiz-pular]')) {
    fecharThreatWizard(true);
    (onSkip || onFinish)?.();
    return;
  }

  // Fichas existentes: escolha do modo e controles da recalibração
  if ((b = alvo('[data-twiz-modo]'))) {
    d.modo = b.dataset.twizModo;
    if (d.modo === 'recalibrar') d.recal = estadoRecalInicial(sheet);
    desenhar();
    return;
  }
  if ((b = alvo('[data-twiz-recal-vd-chip]'))) {
    d.recal.destino.vd = Number(b.dataset.twizRecalVdChip) || d.recal.destino.vd;
    desenhar();
    return;
  }
  if ((b = alvo('[data-twiz-recal-preset]'))) {
    d.recal.destino.preset = b.dataset.twizRecalPreset;
    desenhar();
    return;
  }
  if ((b = alvo('[data-twiz-recal-from-preset]'))) {
    d.recal.origem.preset = b.dataset.twizRecalFromPreset;
    desenhar();
    return;
  }
  if (alvo('[data-twiz-recal-aplicar]')) {
    aplicarRecal(sheet, d.recal);
    fecharThreatWizard(true);
    onFinish?.();
    return;
  }

  // Ignora cliques que caem sobre campos de formulário para preservar o foco e não re-renderizar
  if (e.target.matches('input, textarea, select') || e.target.closest('label')) {
    return;
  }

  if ((b = alvo('[data-twiz-categoria]'))) {
    d.categoria = b.dataset.twizCategoria;
    if (d.categoria === 'mundana') {
      d.tipo = 'Animal';
      d.presencaAtiva = false;
      d.elementoPrincipal = 'mundana';
      d.elementosComplementares = [];
    } else {
      d.tipo = 'Criatura';
      d.presencaAtiva = true;
      if (d.elementoPrincipal === 'mundana') d.elementoPrincipal = 'sangue';
    }
  } else if ((b = alvo('[data-twiz-elem]'))) {
    d.elementoPrincipal = b.dataset.twizElem;
    d.elementosComplementares = (d.elementosComplementares || []).filter(id => id !== d.elementoPrincipal);
  } else if ((b = alvo('[data-twiz-elem-comp]'))) {
    const compId = b.dataset.twizElemComp;
    if (!Array.isArray(d.elementosComplementares)) d.elementosComplementares = [];
    if (d.elementosComplementares.includes(compId)) {
      d.elementosComplementares = d.elementosComplementares.filter(id => id !== compId);
    } else {
      d.elementosComplementares.push(compId);
    }
  } else if ((b = alvo('[data-twiz-vd-chip]'))) {
    d.vd = Number(b.dataset.twizVdChip) || 60;
  } else if ((b = alvo('[data-twiz-arquetipo]'))) {
    d.arquetipo = b.dataset.twizArquetipo;
    const newArq = ARQUETIPOS.find(a => a.id === d.arquetipo) || ARQUETIPOS[0];
    const bal = getBalance(d.vd, d.preset);
    if (d.ataquePadrao && !d.ataquePadraoCustomizado) {
      d.ataquePadrao.nomeAtaque = newArq.ataqueNome || 'Ataque';
      d.ataquePadrao.tipoDano = newArq.ataqueTipo || 'Impacto';
      d.ataquePadrao.dados = Math.max(1, newArq.atributos.for || bal.ataque.dados);
      d.ataquePadrao.bonus = bal.ataque.bonus;
      d.ataquePadrao.dano = bal.sugestoesDano?.[0] || '2d8+6';
    }
  } else if ((b = alvo('[data-twiz-preset]'))) {
    d.preset = b.dataset.twizPreset;
  } else if (alvo('[data-twiz-add-action]')) {
    if (!Array.isArray(d.acoesExtras)) d.acoesExtras = [];
    d.acoesExtras.push({
      tipoAcao: 'movimento',
      nome: '',
      gatilho: '',
      texto: ''
    });
  } else if ((b = alvo('[data-twiz-del-action]'))) {
    const delIdx = Number(b.dataset.twizDelAction);
    if (Array.isArray(d.acoesExtras)) {
      d.acoesExtras.splice(delIdx, 1);
    }
  } else if ((b = alvo('[data-twiz-ir]'))) {
    d.passo = Number(b.dataset.twizIr);
  } else if (alvo('[data-twiz-voltar]')) {
    d.passo = Math.max(0, d.passo - 1);
  } else if (alvo('[data-twiz-avancar]')) {
    if (d.passo === PASSOS.length - 1) {
      aplicarEscolhas(sheet, d);
      fecharThreatWizard(true);
      onFinish?.();
      return;
    }
    d.passo += 1;
  } else {
    // Se nenhum botão do wizard foi clicado, não re-renderiza nada
    return;
  }

  desenhar();
}

function aoAlterarInput(e) {
  if (!atual) return;
  const { d, el } = atual;
  const target = e.target;

  if (target.dataset.twizRecalVd !== undefined) {
    const v = Math.max(10, Math.min(400, Number(target.value) || 10));
    d.recal.destino.vd = v;
    el.querySelectorAll('[data-twiz-recal-vd]').forEach(i => { if (i !== target) i.value = v; });
    const out = el.querySelector('#recal-vd-val');
    if (out) out.textContent = v;
    el.querySelectorAll('[data-twiz-recal-vd-chip]').forEach(c => c.classList.toggle('selected', Number(c.dataset.twizRecalVdChip) === v));
    atualizarPreviewRecal();
    return;
  }
  if (target.dataset.twizRecalSlider !== undefined) {
    d.recal.destino.slider = Number(target.value) || 0;
    const out = el.querySelector('#recal-slider-val');
    if (out) out.textContent = `${d.recal.destino.slider > 0 ? '+' : ''}${d.recal.destino.slider}%`;
    atualizarPreviewRecal();
    return;
  }
  if (target.dataset.twizRecalChk) {
    d.recal[target.dataset.twizRecalChk] = target.checked;
    atualizarPreviewRecal();
    return;
  }

  if (target.dataset.twizAtk) {
    if (!d.ataquePadrao) d.ataquePadrao = {};
    d.ataquePadraoCustomizado = true;
    d.ataquePadrao[target.dataset.twizAtk] = target.value;
  } else if (target.dataset.twizExtraIdx !== undefined) {
    const idx = Number(target.dataset.twizExtraIdx);
    const field = target.dataset.twizExtraField;
    if (Array.isArray(d.acoesExtras) && d.acoesExtras[idx] && field) {
      d.acoesExtras[idx][field] = target.value;
    }
  } else if (target.dataset.twizInput) {
    d[target.dataset.twizInput] = target.value;
  } else if (target.dataset.twizVdSlider || target.dataset.twizVdNumber) {
    const newVd = Math.max(10, Math.min(400, Number(target.value) || 10));
    d.vd = newVd;

    const slider = el.querySelector('[data-twiz-vd-slider]');
    const numInput = el.querySelector('[data-twiz-vd-number]');
    const vdText = el.querySelector('#threat-wiz-vd-val');
    const teamText = el.querySelector('#threat-wiz-team-est');

    if (slider && slider !== target) slider.value = newVd;
    if (numInput && numInput !== target) numInput.value = newVd;
    if (vdText) vdText.textContent = newVd;
    if (teamText) teamText.textContent = `Estimativa de equipe: 4 agentes NEX ${Math.max(5, Math.round(newVd / 4))}%`;

    el.querySelectorAll('[data-twiz-vd-chip]').forEach(chip => {
      chip.classList.toggle('selected', Number(chip.dataset.twizVdChip) === newVd);
    });
  } else if (target.dataset.twizChk) {
    d[target.dataset.twizChk] = target.checked;
    if (target.dataset.twizChk === 'presencaAtiva') {
      const details = el.querySelector('#threat-wiz-presenca-details');
      if (details) {
        details.style.display = target.checked ? 'block' : 'none';
      }
    }
  }
}

/**
 * Abre o Wizard de Criação de Ameaça para a ficha fornecida
 */
export function abrirThreatWizard(sheet, { onFinish, onSkip, modoInicial } = {}) {
  fecharThreatWizard();

  const isMundane = sheet.categoria === 'mundana';
  const elemDestaque = isMundane ? 'mundana' : (sheet.elementoDestaque || (sheet.elementos || [])[0] || 'sangue');

  const defaultVd = Number(sheet.vd) || 60;
  const defaultPreset = 'equilibrada';
  const arqDefault = ARQUETIPOS[0];
  const balDefault = getBalance(defaultVd, defaultPreset);

  const d = {
    modo: modoInicial === 'criar' ? 'criar' : (fichaTemConteudo(sheet) ? 'escolha' : 'criar'),
    recal: estadoRecalInicial(sheet),
    passo: 0,
    categoria: sheet.categoria || 'paranormal',
    elementoPrincipal: elemDestaque,
    elementosComplementares: (sheet.elementos || []).slice(1),
    nome: sheet.name || 'Nova Ameaça',
    subtitulo: sheet.subtitulo || '',
    vd: defaultVd,
    tipo: sheet.tipo || (isMundane ? 'Humano' : 'Criatura'),
    tamanho: sheet.tamanho || 'Médio',
    arquetipo: 'tank',
    preset: defaultPreset,
    resistenciasPadrao: true,
    incluirVulnerabilidade: true,
    presencaAtiva: !isMundane,
    adicionarEnigma: false,
    adicionarHabilidadeElementar: true,
    ataquePadraoCustomizado: false,
    ataquePadrao: {
      nomeAcao: 'Agredir',
      tipoAcao: 'padrao',
      nomeAtaque: arqDefault.ataqueNome || 'Ataque Padrão',
      alcance: 'corpo',
      multiplicador: 1,
      dados: Math.max(1, arqDefault.atributos.for || balDefault.ataque.dados),
      bonus: balDefault.ataque.bonus,
      dano: balDefault.sugestoesDano?.[0] || '2d8+6',
      tipoDano: arqDefault.ataqueTipo || 'Impacto',
      critico: '20/x2'
    },
    acoesExtras: []
  };

  const el = document.createElement('div');
  el.className = 'modal open wizard-modal threat-wizard-modal';
  el.id = 'threat-creation-wizard';
  el.innerHTML = '<div class="backdrop" data-twiz-fechar></div><section role="dialog" aria-modal="true" aria-label="Wizard de Criação de Ameaça"></section>';
  document.body.appendChild(el);

  atual = { el, sheet, onFinish, onSkip, d };

  el.addEventListener('click', aoClicar);
  el.addEventListener('input', aoAlterarInput);
  el.addEventListener('change', aoAlterarInput);

  desenhar();
}
