/**
 * Renderizador Oficial 1:1 do Layout "A Vigília" (Ordem Paranormal II • Playtest Beta)
 * Réplica exata em cores, posições, ornamentos celtas e tipografia do PDF oficial.
 */

import { icon } from '../../icons.js';
import { die } from '../../dice-icon.js';

let currentVigiliaSide = 'front'; // 'front' | 'back'

export function setVigiliaSide(side) {
  if (side === 'front' || side === 'back') {
    currentVigiliaSide = side;
  }
}

export function getVigiliaSide() {
  return currentVigiliaSide;
}

function safe(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Retorna o dado formatado no estilo de Vigília (▲4, ■6, ◆8, ⬟10, ⬢12)
 */
function renderVigiliaDie(sides, isAttribute = false) {
  const s = Number(sides) || 4;
  return `
    <span class="vigilia-die-badge die-${s} ${isAttribute ? 'attr-die' : 'skill-die'}" data-sides="${s}">
      <i></i><b>${s}</b>
    </span>
  `;
}

/**
 * Renderiza a grade de 2 fileiras de paralelogramos inclinados para PV/PD
 */
function renderVigiliaPips(current, max, key, temp = 0) {
  const topCount = Math.ceil(max / 2);
  const bottomCount = Math.floor(max / 2);

  const renderRow = (startIdx, count) => {
    let html = '<div class="vigilia-pips-row">';
    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const filled = idx < current;
      html += `
        <button type="button" 
          class="vigilia-pip ${filled ? 'filled' : ''}" 
          data-set-resource="${key}:${idx + 1}" 
          title="${key.toUpperCase()} ${idx + 1}/${max}" 
          aria-label="${idx + 1}">
        </button>
      `;
    }
    html += '</div>';
    return html;
  };

  const tempHtml = temp > 0 ? `
    <div class="vigilia-pips-row temp-row">
      ${Array.from({ length: temp }, (_, i) => `
        <button type="button" 
          class="vigilia-pip temp-pip filled" 
          data-consume-temp="${key}:${i + 1}" 
          title="${key.toUpperCase()} temporário ${i + 1}/${temp}">
        </button>
      `).join('')}
    </div>
  ` : '';

  return `
    <div class="vigilia-pips-grid">
      ${renderRow(0, topCount)}
      ${renderRow(topCount, bottomCount)}
      ${tempHtml}
    </div>
  `;
}

/**
 * Renderiza o slot de marcadores concêntricos de Relações (◉ ○ ○)
 */
function renderRelationPips(degree = 0, targetName = '') {
  return `
    <div class="vigilia-relation-pips" data-relation-target="${safe(targetName)}">
      ${[1, 2, 3].map(lvl => `
        <button type="button" 
          class="relation-pip-btn ${lvl <= degree ? 'active' : ''}" 
          data-set-relation="${safe(targetName)}:${lvl <= degree && lvl === degree ? lvl - 1 : lvl}" 
          title="Grau ${lvl} de Relação">
          <span class="pip-outer">
            <span class="pip-inner"></span>
          </span>
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Renderiza a Frente da Ficha de A Vigília
 */
function renderVigiliaFront(sheet, editMode, options) {
  const { safeUrl } = options;

  // Nome dividido (Primeiro nome grande, Sobrenome/Título menor)
  let firstName = sheet.firstName || '';
  let lastName = sheet.lastName || '';
  if (!firstName && sheet.name) {
    const parts = sheet.name.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  const profile = (sheet.profile || 'Analista').toUpperCase();
  const occupation = (sheet.occupation || 'Ferreira').toUpperCase();
  const level = sheet.level || 3;

  // Atributos
  const attrs = sheet.attributes || { Físico: 6, Mente: 6, Emoção: 6 };

  // Perícias (garante lista com 20 perícias)
  const skills = Array.isArray(sheet.skills) ? sheet.skills : [];

  // Cards de habilidades e equipamentos
  const cards = Array.isArray(sheet.cards) ? sheet.cards : [];
  const abilities = cards.filter(c => c.schema !== 'items');
  const items = cards.filter(c => c.schema === 'items');

  // Encontra marcadores de ímpeto e análise se presentes
  const impetoCard = cards.find(c => c.id === 'impeto' || c.title?.toUpperCase().includes('ÍMPETO'));
  const impetoMarker = impetoCard?.markers?.find(m => m.id === 'impeto-m') || impetoCard?.markers?.[0];
  const impetoCurrent = impetoMarker?.current ?? 0;

  const analiseCard = cards.find(c => c.id === 'analise' || c.title?.toUpperCase().includes('ANÁLISE'));
  const analiseMarker = analiseCard?.markers?.find(m => m.id === 'analise-m') || analiseCard?.markers?.[0];
  const analiseCurrent = analiseMarker?.current ?? 0;

  return `
    <div class="vigilia-front-content">
      <!-- CABEÇALHO -->
      <header class="vigilia-header">
        <div class="vigilia-name-block">
          ${editMode ? `
            <div class="vigilia-name-edit">
              <input data-field="name" value="${safe(sheet.name)}" placeholder="Nome do Personagem">
            </div>
          ` : `
            <h1 class="vigilia-title-name">
              <span class="first-name">${safe(firstName)}</span>
              ${lastName ? `<span class="last-name">${safe(lastName)}</span>` : ''}
            </h1>
          `}
        </div>

        <div class="vigilia-identity-badge">
          <div class="profile-banner-wrap">
            <img src="./assets/vigilia/banner-profile.png" alt="" class="profile-banner-img" draggable="false">
            <span class="profile-text">${safe(profile)}</span>
          </div>
          <span class="id-dot">•</span>
          <span class="occupation-text">${safe(occupation)}</span>
          <span class="id-dot">•</span>
          <span class="level-label">NÍVEL</span>
          <div class="level-badge-wrap">
            <img src="./assets/vigilia/badge-level.png" alt="" class="level-badge-img" draggable="false">
            <span class="level-num">${level}</span>
          </div>
        </div>
      </header>

      <div class="vigilia-header-divider"></div>

      <!-- SEÇÃO SUPERIOR: ATRIBUTOS À ESQUERDA, PV/PD À DIREITA -->
      <div class="vigilia-top-row">
        <!-- Bloco Atributos com Raio Refletido em Espelho -->
        <div class="vigilia-attributes-block">
          <div class="banner-atributos-wrap">
            <img src="./assets/vigilia/banner-atributos.png" alt="ATRIBUTOS" class="banner-atributos-img" draggable="false">
            <span class="banner-text">ATRIBUTOS</span>
          </div>

          <svg class="atributos-chevron-ray" viewBox="0 0 28 110" fill="none" aria-hidden="true">
            <polyline points="24,8 4,55 24,102" stroke="#abb6af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>

          <div class="vigilia-attributes-list">
            <div class="vigilia-attr-row attr-fisico" data-roll="Físico|${attrs.Físico || 6}">
              <span class="attr-name">FÍSICO</span>
              ${renderVigiliaDie(attrs.Físico || 6, true)}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Físico:-2">−</button>
                  <button type="button" data-attribute-step="Físico:2">+</button>
                </div>
              ` : ''}
            </div>

            <div class="vigilia-attr-row attr-mente" data-roll="Mente|${attrs.Mente || 6}">
              <span class="attr-name">MENTE</span>
              ${renderVigiliaDie(attrs.Mente || 6, true)}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Mente:-2">−</button>
                  <button type="button" data-attribute-step="Mente:2">+</button>
                </div>
              ` : ''}
            </div>

            <div class="vigilia-attr-row attr-emocao" data-roll="Emoção|${attrs.Emoção || 6}">
              <span class="attr-name">EMOÇÃO</span>
              ${renderVigiliaDie(attrs.Emoção || 6, true)}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Emoção:-2">−</button>
                  <button type="button" data-attribute-step="Emoção:2">+</button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Monitores de PV e PD alinhados horizontalmente com os atributos -->
        <div class="vigilia-resources-bar">
          <!-- PV -->
          <div class="vigilia-resource-block resource-pv" data-resource-key="pv">
            <div class="resource-badge-group" title="Clique para definir PV atual">
              <img src="./assets/vigilia/badge-pv.png" alt="PV" class="badge-res-img" draggable="false">
              <span class="res-tag">PV</span>
              <span class="res-num">${sheet.pv}</span>
            </div>
            <div class="resource-track-group">
              ${renderVigiliaPips(sheet.pv, sheet.maxPv, 'pv', sheet.pvTemp)}
            </div>
            ${editMode ? `
              <div class="res-edit-controls">
                <button type="button" data-resource-adjust="maxPv:-1">−</button>
                <small>MÁX ${sheet.maxPv}</small>
                <button type="button" data-resource-adjust="maxPv:1">+</button>
              </div>
            ` : ''}
          </div>

          <!-- PD -->
          <div class="vigilia-resource-block resource-pd" data-resource-key="pd">
            <div class="resource-badge-group" title="Clique para definir PD atual">
              <img src="./assets/vigilia/badge-pd.png" alt="PD" class="badge-res-img" draggable="false">
              <span class="res-tag">PD</span>
              <span class="res-num">${sheet.pd}</span>
            </div>
            <div class="resource-track-group">
              ${renderVigiliaPips(sheet.pd, sheet.maxPd, 'pd', sheet.pdTemp)}
            </div>
            ${editMode ? `
              <div class="res-edit-controls">
                <button type="button" data-resource-adjust="maxPd:-1">−</button>
                <small>MÁX ${sheet.maxPd}</small>
                <button type="button" data-resource-adjust="maxPd:1">+</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- CORPO PRINCIPAL EM 3 COLUNAS: PERÍCIAS À ESQUERDA, HABILIDADES NO CENTRO, RETRATO À DIREITA -->
      <div class="vigilia-body-columns">
        
        <!-- COLUNA 1: PERÍCIAS (20 perícias ocupando verticalmente a altura) -->
        <div class="vigilia-col-skills">
          <div class="banner-pericias-wrap">
            <img src="./assets/vigilia/banner-pericias.png" alt="PERÍCIAS" class="banner-pericias-img" draggable="false">
            <span class="banner-text">PERÍCIAS</span>
          </div>

          <div class="vigilia-skills-table">
            ${skills.map((sk) => {
              const attrDie = attrs[sk.attribute] || 4;
              const rollStr = `${sk.name}|${sk.skillDie},${attrDie}|${sk.extra || 0}`;
              return `
                <div class="vigilia-skill-row ${sk.skillDie > 4 ? 'is-trained' : ''}" 
                     data-roll="${safe(rollStr)}" 
                     title="Rolar ${safe(sk.name)} (d${sk.skillDie} + d${attrDie}${sk.extra ? `+${sk.extra}` : ''})">
                  <span class="skill-name">${safe(sk.name)}</span>
                  <span class="skill-die-col">${renderVigiliaDie(sk.skillDie, false)}</span>
                  <span class="skill-plus-col">+</span>
                  <span class="skill-attr-die-col">${renderVigiliaDie(attrDie, true)}</span>
                  <span class="skill-attr-name">${safe(sk.attribute.toUpperCase())}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- COLUNA 2: HABILIDADES E EQUIPAMENTO -->
        <div class="vigilia-col-powers">
          <!-- Cards de Habilidades -->
          <div class="vigilia-abilities-list">
            ${abilities.map(card => {
              const isImpeto = card.id === 'impeto' || card.title?.toUpperCase().includes('ÍMPETO');
              const isAnalise = card.id === 'analise' || card.title?.toUpperCase().includes('ANÁLISE');
              const isProntidao = card.id === 'prontidao' || card.title?.toUpperCase().includes('PRONTIDÃO');

              let extraBannerControl = '';
              if (isImpeto && impetoCard) {
                // 5 paralelogramos de ímpeto exibidos ao lado do título
                extraBannerControl = `
                  <div class="impeto-slots-row" role="group" aria-label="Espaços de Ímpeto">
                    ${[1, 2, 3, 4, 5].map(i => `
                      <button type="button" 
                        class="impeto-slot-pip ${i <= impetoCurrent ? 'filled' : ''}" 
                        data-vigilia-slot="impeto:${i}" 
                        title="Espaço de Ímpeto ${i} (${i <= impetoCurrent ? 'Preenchido - clique para desmarcar' : 'Vazio - clique para marcar'})">
                      </button>
                    `).join('')}
                  </div>
                `;
              } else if (isAnalise && analiseCard) {
                extraBannerControl = `
                  <div class="analise-slots-row" role="group" aria-label="Marcadores de Análise">
                    ${[1, 2, 3, 4].map(i => `
                      <button type="button" 
                        class="analise-slot-pip ${i <= analiseCurrent ? 'filled' : ''}" 
                        data-vigilia-slot="analise:${i}" 
                        title="Marcador de Análise ${i} (${i <= analiseCurrent ? 'Preenchido - clique para desmarcar' : 'Vazio - clique para marcar'})">
                      </button>
                    `).join('')}
                  </div>
                `;
              } else if (isProntidao) {
                extraBannerControl = `
                  <button type="button" class="btn-vigilia-prontidao" data-spend-prontidao title="Gastar 2 PD para Rerrolar">
                    2 PD (RERROLAR)
                  </button>
                `;
              }

              return `
                <article class="vigilia-power-card">
                  <div class="power-banner-wrap">
                    <img src="./assets/vigilia/banner-power.png" alt="" class="power-banner-img" draggable="false">
                    <span class="power-title">${safe(card.title)}</span>
                    ${extraBannerControl}
                  </div>
                  <div class="power-content">
                    ${safe(card.content)
                      .replace(/\n\n/g, '<br><br>')
                      .replace(/\n• /g, '<br>• ')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                  </div>
                  ${Array.isArray(card.actions) && card.actions.length > 0 ? `
                    <div class="power-actions-bar">
                      ${card.actions.map(act => `
                        <button type="button" class="vigilia-action-btn" 
                          data-expression="${safe(act.expression)}" 
                          data-roll-title="${safe(act.name)}">
                          ${icon('d20', 13)} ${safe(act.name)}
                        </button>
                      `).join('')}
                    </div>
                  ` : ''}
                </article>
              `;
            }).join('')}

            <!-- Bloco de Equipamento -->
            <div class="vigilia-equipment-section">
              <div class="power-banner-wrap">
                <img src="./assets/vigilia/banner-power.png" alt="" class="power-banner-img" draggable="false">
                <span class="power-title">EQUIPAMENTO</span>
              </div>
              <div class="equipment-content">
                ${items.map(it => `
                  <p><strong>${safe(it.title)}:</strong> ${safe(it.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                  ${Array.isArray(it.actions) && it.actions.length > 0 ? `
                    <div class="item-actions-bar">
                      ${it.actions.map(act => `
                        <button type="button" class="vigilia-action-btn" 
                          data-expression="${safe(act.expression)}" 
                          data-roll-title="${safe(act.name)}">
                          ${icon('dice', 13)} ${safe(act.name)}
                        </button>
                      `).join('')}
                    </div>
                  ` : ''}
                `).join('')}
              </div>
            </div>

          </div>

        </div>

        <!-- COLUNA 3: RETRATO RECORTADO DO PERSONAGEM -->
        <div class="vigilia-col-right">
          <div class="vigilia-portrait-container">
            ${sheet.tokenImage ? `
              <img src="${safeUrl(sheet.tokenImage)}" 
                   alt="${safe(sheet.name)}" 
                   class="vigilia-character-portrait" 
                   draggable="false">
            ` : `
              <div class="vigilia-portrait-placeholder">
                ${icon('user', 64)}
                <span>RETRATO</span>
              </div>
            `}
          </div>
        </div>

      </div>
    </div>
  `;
}

/**
 * Renderiza o Verso da Ficha de A Vigília (História & Relações)
 */
function renderVigiliaBack(sheet, editMode, options) {
  let firstName = sheet.firstName || '';
  let lastName = sheet.lastName || '';
  if (!firstName && sheet.name) {
    const parts = sheet.name.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  const shortBio = sheet.shortBio || `${sheet.occupation || 'Aventureiro'}, Nível ${sheet.level || 3}.`;
  const historyText = sheet.history || 'Sem histórico registrado.';
  const relations = Array.isArray(sheet.relations) ? sheet.relations : [];

  return `
    <div class="vigilia-back-content">
      <!-- CABEÇALHO DO VERSO -->
      <header class="vigilia-back-header">
        <div class="back-name-block">
          <span class="back-first-name">${safe(firstName)}</span>
          ${lastName ? `<span class="back-last-name">${safe(lastName)}</span>` : ''}
        </div>
        <div class="back-bio-summary">
          ${editMode ? `
            <textarea data-field="shortBio" rows="2">${safe(shortBio)}</textarea>
          ` : `
            <p>${safe(shortBio).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          `}
        </div>
      </header>

      <div class="vigilia-back-divider">
        <img src="./assets/vigilia/divider-celtic.png" alt="" draggable="false">
      </div>

      <!-- TEXTO DA HISTÓRIA / BIOGRAFIA -->
      <div class="vigilia-history-block">
        ${editMode ? `
          <textarea data-field="history" rows="9" class="vigilia-history-edit">${safe(historyText)}</textarea>
        ` : `
          <div class="vigilia-history-paragraphs">
            ${historyText.split('\n\n').map(p => `<p>${safe(p)}</p>`).join('')}
          </div>
        `}
      </div>

      <!-- SEÇÃO DE RELAÇÕES -->
      <div class="vigilia-relations-section">
        <div class="banner-relacoes-wrap">
          <img src="./assets/vigilia/banner-relacoes.png" alt="RELAÇÕES" class="banner-relacoes-img" draggable="false">
          <span class="banner-relacoes-title">RELAÇÕES</span>
        </div>

        <div class="vigilia-relations-list">
          ${relations.map(rel => {
            const degree = Number(rel.degree) || 0;
            return `
              <div class="vigilia-relation-row" data-target="${safe(rel.target)}">
                <span class="relation-target-name">${safe(rel.target)}</span>
                ${renderRelationPips(degree, rel.target)}
                <div class="relation-desc-block">
                  <strong class="relation-feeling">${safe(rel.feeling)}.</strong>
                  <span class="relation-note">${safe(rel.note)}</span>
                </div>
                ${degree > 0 ? `
                  <button type="button" class="btn-invoke-relation" 
                    data-invoke-relation="${safe(rel.target)}:${degree}" 
                    title="Invocar Relação na Missão (Grau ${degree})">
                    INVOCAR (+1d${degree === 1 ? 6 : degree === 2 ? 8 : 12})
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Função Principal: Renderiza a Ficha no Modo "A Vigília"
 */
export function renderVigiliaSheet(sheet, editMode, options = {}) {
  const isBack = currentVigiliaSide === 'back';

  return `
    <main class="vigilia-page ${isBack ? 'view-back' : 'view-front'}">
      <!-- FUNDO E MOLDURA CELTA OFICIAL -->
      <div class="vigilia-bg-layer" style="background-image: url('./assets/vigilia/vigilia-bg.png');"></div>
      <div class="vigilia-frame-layer">
        <img src="./assets/vigilia/vigilia-frame.png" alt="" class="vigilia-frame-img" draggable="false">
      </div>

      <!-- BARRA DE CONTROLE SUPERIOR (FLIP ENTRE FRENTE E VERSO) -->
      <div class="vigilia-toolbar">
        <div class="vigilia-side-switch">
          <button type="button" class="side-btn ${!isBack ? 'active' : ''}" data-vigilia-side="front">
            ${icon('sheet', 14)} FRENTE (MECÂNICAS)
          </button>
          <button type="button" class="side-btn ${isBack ? 'active' : ''}" data-vigilia-side="back">
            ${icon('book', 14)} VERSO (HISTÓRIA & RELAÇÕES)
          </button>
        </div>
      </div>

      <!-- CONTAINER COM PROPORÇÃO 1624:1211 -->
      <div class="vigilia-content-viewport">
        ${isBack ? renderVigiliaBack(sheet, editMode, options) : renderVigiliaFront(sheet, editMode, options)}
      </div>
    </main>
  `;
}
