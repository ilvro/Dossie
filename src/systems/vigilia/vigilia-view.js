/**
 * Renderizador Oficial 1:1 do Layout "A Vigília" (Ordem Paranormal II • Playtest Beta)
 * Réplica exata em cores, posições, ornamentos celtas e tipografia do PDF oficial.
 */

import { icon } from '../../icons.js';
import { die } from '../../dice-icon.js';
import {
  LESOES_TABLE,
  TRAUMAS_TABLE,
  getRelationBenefits,
  getLesaoResult,
  getTraumaResult
} from './vigilia-mechanics.js';

let currentVigiliaSide = 'front'; // 'front' | 'back'

// Graus de dado das perícias (d4 = destreinado ... d12 = grão-mestre)
export const VIGILIA_SKILL_GRADES = [
  [4, 'DESTREINADO'],
  [6, 'TREINADO'],
  [8, 'ESPECIALISTA'],
  [10, 'MESTRE'],
  [12, 'GRÃO MESTRE']
];
const VIGILIA_DIE_OPTIONS = VIGILIA_SKILL_GRADES.map(([v, label]) => ({
  value: v,
  label: `d${v}`,
  triggerLabel: `d${v}`,
  html: `${die(v, 'menu-die', v > 4)}<span>d${v} — ${label}</span>`
}));

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

function formatVigiliaText(str) {
  return safe(str)
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[u\](.+?)\[\/u\]/gis, '<u>$1</u>')
    .replace(/\[color=(#[0-9a-f]{6})\](.+?)\[\/color\]/gis, '<span style="color:$1">$2</span>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n[•\-]\s+/g, '<br><span class="vigilia-diamond">◆</span> ')
    .replace(/\n/g, '<br>');
}

/**
 * Polígonos exatos da fonte PolymathBold do PDF oficial (com o número vazado)
 */
const POLYMATH_DICE = {
  4: { w: 771.5, h: 683.4, d: 'M766.9 632.3 415.4 17.2C402.3 -5.7 369.1 -5.7 356.0 17.2L4.6 632.3C-8.5 655.1 8.0 683.4 34.3 683.4H737.2C763.5 683.4 779.9 655.1 766.9 632.3ZM442.6 497.3V556.2H384.5V497.3H250.2V440.0L380.3 277.0H442.5V449.6H479.3V497.3ZM384.5 449.6V342.6L301.3 449.6Z' },
  6: { w: 615.6, h: 615.7, d: 'M307.8 310.4C292.5 310.4 280.1 314.5 270.8 322.5C261.5 330.6 256.8 341.5 256.8 355.1C259.6 369.1 265.0 380.1 273.2 388.4C281.2 396.6 292.8 400.7 307.8 400.7C323.2 400.7 335.5 396.7 344.8 388.6C354.2 380.5 358.8 369.5 358.8 355.6C358.8 342.2 354.2 331.3 344.8 323.0C335.5 314.6 323.2 310.4 307.8 310.4ZM581.4 0.0H34.2C15.3 0.0 0.0 15.4 0.0 34.3V581.5C0.0 600.4 15.3 615.7 34.2 615.7H581.4C600.3 615.7 615.6 600.4 615.6 581.5V34.2C615.6 15.3 600.3 0.0 581.4 0.0ZM407.3 403.4C398.7 418.0 386.4 429.6 370.3 438.1C354.3 446.6 334.9 450.8 312.0 450.8C288.6 450.8 268.2 446.2 250.7 436.8C233.4 427.5 219.7 413.4 210.0 394.4C200.3 375.5 195.4 352.0 195.4 323.8C195.4 291.8 200.1 263.6 209.6 239.6C219.1 215.5 233.2 196.7 252.0 183.4C270.8 169.9 294.6 163.3 323.2 163.3C341.4 163.3 358.2 166.3 373.6 172.2C389.1 178.3 402.1 187.2 412.7 199.2L393.5 238.9C381.5 229.5 370.3 222.8 359.8 219.1C349.4 215.3 339.1 213.4 329.1 213.4C317.4 213.4 306.1 216.0 295.3 220.9C284.4 226.0 275.5 234.2 268.7 245.6C261.9 257.1 257.9 272.4 256.9 291.6C263.8 283.4 272.9 276.9 284.2 271.9C295.5 266.9 308.3 264.4 322.5 264.4C342.8 264.4 360.4 268.2 375.2 275.7C390.0 283.2 401.2 293.7 408.8 307.2C416.5 320.7 420.3 336.6 420.3 354.7C420.3 372.5 416.0 388.7 407.3 403.4Z' },
  8: { w: 792.5, h: 792.5, d: 'M782.5 372.0 420.4 10.0C407.1 -3.3 385.4 -3.3 372.1 10.0L10.0 372.1C-3.3 385.4 -3.3 407.1 10.0 420.4L372.1 782.5C385.4 795.8 407.1 795.8 420.4 782.5L782.5 420.4C795.8 407.1 795.8 385.4 782.5 372.1ZM495.3 499.1C486.3 511.7 473.5 521.5 456.6 528.6C439.7 535.7 419.6 539.3 396.2 539.3C372.5 539.3 352.4 535.7 335.8 528.6C319.3 521.5 306.4 511.7 297.4 499.1C288.3 486.6 283.8 472.5 283.8 456.9C283.8 441.6 288.0 428.3 296.3 417.1C304.7 406.0 317.5 397.4 334.8 391.2C318.9 385.7 307.1 377.6 299.5 367.2C291.8 356.7 288.0 344.3 288.0 329.8C288.0 314.2 292.4 300.5 301.2 288.8C310.0 277.1 322.5 268.0 338.8 261.4C355.1 254.8 374.2 251.6 396.2 251.6C418.3 251.6 437.3 254.8 453.5 261.4C469.6 268.0 482.2 277.1 491.1 288.8C500.0 300.5 504.5 314.2 504.5 329.8C504.5 344.3 500.6 356.7 492.8 367.2C485.0 377.6 473.2 385.7 457.3 391.2C474.8 397.4 487.8 406.0 496.1 417.1C504.5 428.3 508.7 441.5 508.7 456.9C508.7 472.5 504.2 486.6 495.3 499.1ZM396.6 413.0C380.2 413.0 367.5 416.6 358.6 423.9C349.7 431.1 345.2 440.6 345.2 452.3C345.2 464.0 349.6 473.5 358.4 480.9C367.1 488.3 379.6 492.0 395.8 492.0C412.2 492.0 424.9 488.3 433.8 480.9C442.8 473.5 447.2 464.0 447.2 452.3C447.2 440.6 442.8 431.1 434.1 423.9C425.3 416.6 412.8 413.0 396.6 413.0ZM396.2 369.5C410.4 369.5 421.8 366.5 430.3 360.3C438.8 354.2 443.0 345.6 443.0 334.4C443.0 323.2 438.8 314.5 430.3 308.3C421.8 302.0 410.4 298.8 396.2 298.8C382.0 298.8 370.6 301.9 362.2 308.1C353.6 314.2 349.4 322.8 349.4 334.0C349.4 345.1 353.6 353.8 362.2 360.1C370.6 366.4 382.0 369.5 396.2 369.5Z' },
  10: { w: 810.7, h: 739.1, d: 'M513.8 291.8C505.3 285.4 495.4 282.1 484.0 282.1C472.6 282.1 462.6 285.4 454.1 291.8C445.6 298.2 438.9 308.2 434.0 321.9C429.1 335.5 426.7 353.5 426.7 375.8C426.7 397.5 429.1 415.4 434.0 429.3C438.9 443.2 445.6 453.4 454.1 459.8C462.6 466.2 472.6 469.4 484.0 469.4C495.4 469.4 505.3 466.2 513.8 459.8C522.3 453.4 529.1 443.2 533.9 429.3C538.7 415.4 541.2 397.5 541.2 375.8C541.2 353.8 538.7 335.9 533.9 322.1C529.1 308.3 522.3 298.2 513.8 291.8ZM797.3 292.5 426.1 7.0C413.9 -2.3 396.9 -2.3 384.6 7.0L13.4 292.5C4.9 299.0 0.0 309.1 0.0 319.7V435.9C0.0 446.5 5.0 456.6 13.4 463.0L384.6 732.0C396.9 741.4 413.9 741.4 426.1 732.0L797.3 463.0C805.8 456.6 810.7 446.5 810.7 435.9V319.7C810.7 309.1 805.8 299.0 797.3 292.5ZM322.2 515.4H260.7V299.3L211.8 324.8L191.3 280.5L279.0 236.3H322.1V515.5ZM589.3 450.0C580.4 471.6 567.1 488.6 549.6 501.0C532.0 513.4 510.1 519.6 483.9 519.6C457.7 519.6 435.9 513.4 418.3 501.0C400.7 488.6 387.5 471.6 378.6 450.0C369.7 428.4 365.2 403.7 365.2 375.8C365.2 347.9 369.7 323.2 378.6 301.6C387.5 280.0 400.7 263.0 418.3 250.6C435.8 238.2 457.7 232.0 483.9 232.0C510.2 232.0 532.0 238.2 549.6 250.6C567.1 263.0 580.4 280.0 589.3 301.6C598.2 323.2 602.7 347.9 602.7 375.8C602.7 403.7 598.2 428.4 589.3 450.0Z' },
  12: { w: 752.0, h: 718.5, d: 'M750.3 348.7 685.1 147.8C682.8 140.9 678.5 134.9 672.7 130.7L501.8 6.5C495.9 2.3 488.9 0.0 481.6 0.0H270.4C263.2 0.0 256.1 2.3 250.3 6.5L79.4 130.7C73.5 134.9 69.2 140.9 67.0 147.8L1.7 348.7C-0.6 355.6 -0.6 362.9 1.7 369.8L67.0 570.7C69.2 577.6 73.5 583.6 79.4 587.8L250.3 712.0C256.1 716.3 263.2 718.5 270.4 718.5H481.6C488.9 718.5 495.9 716.3 501.8 712.0L672.7 587.8C678.5 583.6 682.9 577.6 685.1 570.7L750.3 369.8C752.6 362.9 752.6 355.6 750.3 348.7ZM302.9 498.9H241.4V282.8L192.5 308.4L172.0 264.1L259.8 219.8H302.9V499.0ZM346.0 498.9V448.8L457.1 347.2C465.2 340.2 471.2 333.0 475.1 325.4C479.0 317.9 481.0 311.0 481.0 304.6C481.0 296.5 479.1 289.5 475.3 283.7C471.6 277.8 466.5 273.4 460.1 270.3C453.7 267.3 446.0 265.7 437.0 265.7C426.5 265.7 415.8 268.2 405.1 273.0C394.4 277.9 381.5 285.2 366.4 295.0L345.9 251.5C361.5 239.3 376.8 230.2 391.7 224.4C406.6 218.5 422.9 215.6 440.4 215.6C460.8 215.6 478.5 219.1 493.7 226.2C508.9 233.3 520.8 243.5 529.4 256.7C538.0 270.0 542.4 286.0 542.4 304.6C542.4 318.2 538.5 331.5 530.9 344.3C523.2 357.1 510.6 371.3 493.0 386.9L422.8 448.8H546.5V499.0Z' },
  20: { w: 755.5, h: 860.1, d: 'M519.2 346.9C510.7 340.5 500.7 337.3 489.3 337.3C478.0 337.3 467.9 340.5 459.5 346.9C451.0 353.4 444.2 363.4 439.4 377.0C434.5 390.7 432.1 408.6 432.1 430.9C432.1 452.7 434.5 470.5 439.4 484.4C444.2 498.3 451.0 508.5 459.5 515.0C467.9 521.4 477.9 524.6 489.4 524.6C500.8 524.6 510.7 521.4 519.2 515.0C527.7 508.5 534.4 498.3 539.3 484.4C544.1 470.5 546.6 452.7 546.6 430.9C546.6 408.9 544.1 391.0 539.3 377.2C534.4 363.5 527.7 353.3 519.2 346.9ZM735.7 200.5 397.6 5.3C385.3 -1.8 370.2 -1.8 357.9 5.3L19.8 200.5C7.6 207.6 0.0 220.7 0.0 234.8V625.3C0.0 639.4 7.5 652.5 19.8 659.6L357.9 854.8C370.2 861.9 385.3 861.9 397.6 854.8L735.7 659.6C747.9 652.5 755.5 639.4 755.5 625.3V234.8C755.5 220.7 748.0 207.6 735.7 200.5ZM147.4 570.6V520.4L258.5 418.8C266.7 411.9 272.6 404.6 276.5 397.1C280.4 389.6 282.4 382.6 282.4 376.2C282.4 368.1 280.5 361.1 276.8 355.3C273.0 349.5 267.9 345.0 261.5 341.9C255.1 338.9 247.4 337.3 238.5 337.3C227.9 337.3 217.2 339.8 206.5 344.7C195.8 349.5 182.9 356.9 167.8 366.6L147.3 323.2C162.9 310.9 178.2 301.8 193.1 296.0C208.1 290.1 224.3 287.2 241.8 287.2C262.2 287.2 279.9 290.8 295.1 297.9C310.3 304.9 322.2 315.1 330.8 328.3C339.5 341.6 343.8 357.6 343.8 376.2C343.8 389.9 339.9 403.1 332.3 415.9C324.6 428.7 312.0 443.0 294.4 458.5L224.2 520.4H348.0V570.6ZM594.6 505.2C585.7 526.8 572.5 543.8 554.9 556.2C537.4 568.6 515.5 574.8 489.3 574.8C463.1 574.8 441.2 568.6 423.6 556.2C406.1 543.8 392.8 526.8 383.9 505.2C375.0 483.6 370.5 458.9 370.5 431.0C370.5 403.1 375.0 378.4 383.9 356.8C392.8 335.2 406.1 318.2 423.6 305.8C441.2 293.4 463.0 287.2 489.3 287.2C515.6 287.2 537.4 293.4 554.9 305.8C572.5 318.2 585.7 335.2 594.6 356.8C603.5 378.4 608.0 403.1 608.0 431.0C608.0 458.9 603.5 483.6 594.6 505.2Z' },
};

function renderVigiliaDie(sides, kind = 'skill') {
  const s = Number(sides) || 4;
  const g = POLYMATH_DICE[s] || POLYMATH_DICE[6];
  const roleClass = kind === true || kind === 'attr'
    ? 'attr-die'
    : (kind === 'skill-attr' ? 'skill-attr-die' : 'skill-die');
  return `
    <span class="vigilia-poly-die die-${s} ${roleClass}" data-sides="${s}" aria-label="d${s}">
      <svg viewBox="0 0 ${g.w} ${g.h}" fill="currentColor" stroke="none" aria-hidden="true"><path fill="currentColor" stroke="none" fill-rule="evenodd" d="${g.d}"/></svg>
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
function renderVigiliaFront(sheet, editMode, options = {}) {
  const safeUrl = options.safeUrl || (u => u || '');
  const { customSelect, aptidaoOptions = [], renderMarker } = options;
  const armorPoints = sheet.armorPoints ?? (sheet.pontosArmadura ?? 0);

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
  // Mesmo filtro do restante do app: habilidades de perfil só aparecem para o perfil ativo
  const isVisibleCard = c => !c.profileAbility || c.profileAbility === sheet.profile;
  const abilities = cards.filter(c => c.schema !== 'items' && isVisibleCard(c));
  const items = cards.filter(c => c.schema === 'items' && isVisibleCard(c));
  const editCardBtn = card => editMode ? `
    <button type="button" class="vigilia-card-edit-btn" data-edit-card="${safe(card.id)}" title="Editar card">${icon('edit', 12)}</button>
  ` : '';

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
              <input data-vigilia-name="first" value="${safe(firstName)}" placeholder="Nome" class="first-name-input">
              <input data-vigilia-name="last" value="${safe(lastName)}" placeholder="Sobrenome / título" class="last-name-input">
            </div>
          ` : `
            <h1 class="vigilia-title-name">
              <span class="first-name">${safe(firstName)}</span>
              ${lastName ? `<span class="last-name">${safe(lastName)}</span>` : ''}
            </h1>
          `}
        </div>

        <div class="vigilia-identity-badge ${editMode ? 'is-editing' : ''}">
          <div class="profile-banner-wrap">
            <img src="./assets/vigilia/banner-profile.png" alt="" class="profile-banner-img" draggable="false">
            ${editMode && customSelect
              ? customSelect({ value: sheet.profile || 'Analista', options: ['Executor', 'Analista', 'Vigilante'].map(v => ({ value: v, label: v.toUpperCase() })), id: 'profile', className: 'vigilia-profile-select' })
              : `<span class="profile-text">${safe(profile)}</span>`}
          </div>
          <span class="id-dot">•</span>
          ${editMode
            ? `<input class="vigilia-occupation-input" data-field="occupation" value="${safe(sheet.occupation || '')}" placeholder="Ocupação">`
            : `<span class="occupation-text">${safe(occupation)}</span>`}
          <span class="id-dot">•</span>
          <span class="level-label">NÍVEL</span>
          <div class="level-badge-wrap">
            <img src="./assets/vigilia/badge-level.png" alt="" class="level-badge-img" draggable="false">
            ${editMode
              ? `<input class="vigilia-level-input" data-field="level" value="${level}" inputmode="numeric">`
              : `<span class="level-num">${level}</span>`}
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

          <svg class="atributos-chevron-ray" viewBox="0 0 36 174" aria-hidden="true">
            <defs>
              <linearGradient id="vg-chevron-specular" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#76847d" stop-opacity="0.3" />
                <stop offset="25%" stop-color="#c2d1ca" stop-opacity="0.85" />
                <stop offset="48%" stop-color="#ffffff" stop-opacity="1" />
                <stop offset="52%" stop-color="#ffffff" stop-opacity="1" />
                <stop offset="75%" stop-color="#c2d1ca" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#76847d" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path fill="url(#vg-chevron-specular)" d="M27.70,173.73L2.96,85.95L35.07,0.00L0.00,86.40L1.49,86.22L0.04,86.57Z" />
          </svg>

          <div class="vigilia-attributes-list">
            <div class="vigilia-attr-row attr-fisico" data-roll="Físico|${attrs.Físico || 6}">
              <img src="./assets/vigilia/attr-fisico.svg" alt="FÍSICO" class="attr-vector-word word-fisico" draggable="false">
              ${renderVigiliaDie(attrs.Físico || 6, 'attr')}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Físico:-1">−</button>
                  <button type="button" data-attribute-step="Físico:1">+</button>
                </div>
              ` : ''}
            </div>

            <div class="vigilia-attr-row attr-mente" data-roll="Mente|${attrs.Mente || 6}">
              <img src="./assets/vigilia/attr-mente.svg" alt="MENTE" class="attr-vector-word word-mente" draggable="false">
              ${renderVigiliaDie(attrs.Mente || 6, 'attr')}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Mente:-1">−</button>
                  <button type="button" data-attribute-step="Mente:1">+</button>
                </div>
              ` : ''}
            </div>

            <div class="vigilia-attr-row attr-emocao" data-roll="Emoção|${attrs.Emoção || 6}">
              <img src="./assets/vigilia/attr-emocao.svg" alt="EMOÇÃO" class="attr-vector-word word-emocao" draggable="false">
              ${renderVigiliaDie(attrs.Emoção || 6, 'attr')}
              ${editMode ? `
                <div class="attr-step-btns">
                  <button type="button" data-attribute-step="Emoção:-1">−</button>
                  <button type="button" data-attribute-step="Emoção:1">+</button>
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
                <button type="button" data-resource-adjust="pvTemp:-1">−</button>
                <small>TEMP ${sheet.pvTemp || 0}</small>
                <button type="button" data-resource-adjust="pvTemp:1">+</button>
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
                <button type="button" data-resource-adjust="pdTemp:-1">−</button>
                <small>TEMP ${sheet.pdTemp || 0}</small>
                <button type="button" data-resource-adjust="pdTemp:1">+</button>
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

          <div class="vigilia-skills-table ${editMode ? 'is-editing' : ''}">
            ${skills.map((sk, index) => {
              const attrDie = attrs[sk.attribute] || 4;
              const rollStr = `${sk.name}|${sk.skillDie},${attrDie}|${sk.extra || 0}`;
              const isAptidao = String(sk.name || '').startsWith('APTIDÃO');
              const aptidaoField = isAptidao ? (sk.name.match(/\(([^)]+)\)/)?.[1] || '') : '';
              const nameHtml = !editMode
                ? `<span class="skill-name">${safe(sk.name)}</span>`
                : (isAptidao && customSelect && aptidaoOptions.length
                    ? `<span class="skill-name skill-name-aptidao">${customSelect({ value: aptidaoField || 'HUMANAS', options: aptidaoOptions, id: `aptidao-field:${index}`, className: 'vigilia-aptidao-select' })}</span>`
                    : `<input class="skill-name-input" data-vigilia-skill-name="${index}" value="${safe(sk.name)}" placeholder="NOME">`);
              const editHtml = editMode && customSelect ? `
                <div class="vigilia-skill-edit" data-vigilia-stop>
                  ${customSelect({ value: sk.skillDie, options: VIGILIA_DIE_OPTIONS, id: `vigilia-skill-die:${index}`, className: 'vigilia-mini-select' })}
                  ${customSelect({ value: sk.attribute, options: ['Físico', 'Mente', 'Emoção'].map(v => ({ value: v, label: v.toUpperCase() })), id: `skill-attribute:${index}`, className: 'vigilia-mini-select' })}
                  <input data-skill-extra="${index}" type="number" value="${sk.extra || 0}" title="Bônus extra">
                  <button type="button" class="vigilia-skill-remove" data-vigilia-remove-skill="${index}" title="Remover perícia">${icon('trash', 11)}</button>
                </div>
              ` : '';
              return `
                <div class="vigilia-skill-row ${sk.skillDie > 4 ? 'is-trained' : ''} ${editMode ? 'editing' : ''}" 
                     data-roll="${safe(rollStr)}" 
                     title="Rolar ${safe(sk.name)} (d${sk.skillDie} + d${attrDie}${sk.extra ? `+${sk.extra}` : ''})">
                  ${nameHtml}
                  <span class="skill-die-col">${renderVigiliaDie(sk.skillDie, 'skill')}</span>
                  <span class="skill-plus-col">+</span>
                  <span class="skill-attr-die-col">${renderVigiliaDie(attrDie, 'skill-attr')}</span>
                  <span class="skill-attr-name">${safe(String(sk.attribute || '').toUpperCase())}${sk.extra ? ` <b class="skill-extra">${Number(sk.extra) > 0 ? '+' : ''}${sk.extra}</b>` : ''}</span>
                  ${editHtml}
                </div>
              `;
            }).join('')}
          </div>
          ${editMode ? `
            <div class="vigilia-skill-add-bar">
              <button type="button" data-vigilia-add-skill>+ PERÍCIA</button>
              <button type="button" data-add-aptidao>+ APTIDÃO</button>
            </div>
          ` : ''}
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
                // Barra de Ímpeto oficial: cartucho contínuo com 5 compartimentos contíguos
                extraBannerControl = `
                  <div class="impeto-track-bar" role="group" aria-label="Barra de Ímpeto">
                    ${[1, 2, 3, 4, 5].map(i => `
                      <button type="button" 
                        class="impeto-segment ${i <= impetoCurrent ? 'filled' : ''}" 
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
                    ${editCardBtn(card)}
                  </div>
                  <div class="power-content">
                    ${formatVigiliaText(card.content)}
                  </div>
                  ${(!isImpeto && !isAnalise && renderMarker && Array.isArray(card.markers) && card.markers.length > 0) ? `
                    <div class="vigilia-card-markers">
                      ${card.markers.map(m => renderMarker(card, m)).join('')}
                    </div>
                  ` : ''}
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

            ${editMode ? `
              <button type="button" class="vigilia-add-card-btn" data-cinematic-add="abilities">+ HABILIDADE</button>
            ` : ''}

            <!-- Bloco de Equipamento -->
            <div class="vigilia-equipment-section">
              <div class="power-banner-wrap">
                <img src="./assets/vigilia/banner-power.png" alt="" class="power-banner-img" draggable="false">
                <span class="power-title">EQUIPAMENTO</span>
                <div class="equip-armor-pill ${armorPoints > 0 ? 'active' : 'zero'}">
                  <button type="button" class="btn-armor-spend" data-spend-armor title="Gastar 1 Ponto de Armadura (Ação Livre: reduz dano em 10)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <b>${armorPoints}</b> PA
                  </button>
                  <span class="armor-stepper-inline">
                    <button type="button" data-armor-step="-1" title="Diminuir Ponto de Armadura (−1 PA)">−</button>
                    <button type="button" data-armor-step="1" title="Aumentar Ponto de Armadura (+1 PA)">+</button>
                  </span>
                </div>
              </div>
              <div class="equipment-content">
                ${items.map(it => `
                  <p>${editCardBtn(it)}<strong>${safe(it.title)}:</strong> ${formatVigiliaText(it.content)}</p>
                  ${(renderMarker && Array.isArray(it.markers) && it.markers.length > 0) ? `
                    <div class="vigilia-card-markers">
                      ${it.markers.map(m => renderMarker(it, m)).join('')}
                    </div>
                  ` : ''}
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
                ${editMode ? `
                  <button type="button" class="vigilia-add-card-btn" data-cinematic-add="items">+ ITEM</button>
                ` : ''}
              </div>
            </div>

          </div>

        </div>

        <!-- COLUNA 3: RETRATO RECORTADO DO PERSONAGEM -->
        <div class="vigilia-col-right">
          <div class="vigilia-portrait-container" data-vigilia-portrait-area>
            ${sheet.tokenImage ? `
              <img src="${safeUrl(sheet.tokenImage)}" 
                   alt="${safe(sheet.name)}" 
                   class="vigilia-character-portrait ${sheet.vigiliaTokenFlip ? 'is-flipped' : ''}" 
                   data-vigilia-token
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
          <button type="button" class="btn-reset-relations" data-reset-relations title="Reiniciar invocações para uma nova missão">
            NOVA MISSÃO (RESET)
          </button>
        </div>

        <div class="vigilia-relations-list">
          ${relations.map((rel, relIdx) => {
            const degree = Number(rel.degree) || 0;
            const isInvoked = !!rel.invoked;
            if (editMode) {
              return `
                <div class="vigilia-relation-row is-editing" data-target="${safe(rel.target)}">
                  <input class="relation-edit-target" data-vigilia-rel="${relIdx}:target" value="${safe(rel.target)}" placeholder="NOME">
                  ${renderRelationPips(degree, rel.target)}
                  <div class="relation-desc-block relation-edit-block">
                    <input class="relation-edit-feeling" data-vigilia-rel="${relIdx}:feeling" value="${safe(rel.feeling)}" placeholder="SENTIMENTO">
                    <input class="relation-edit-note" data-vigilia-rel="${relIdx}:note" value="${safe(rel.note)}" placeholder="Descrição da relação">
                  </div>
                  <button type="button" class="vigilia-relation-remove" data-vigilia-remove-relation="${relIdx}" title="Remover relação">${icon('trash', 12)}</button>
                </div>
              `;
            }
            return `
              <div class="vigilia-relation-row ${isInvoked ? 'is-invoked' : ''}" data-target="${safe(rel.target)}">
                <span class="relation-target-name">${safe(rel.target)}</span>
                ${renderRelationPips(degree, rel.target)}
                <div class="relation-desc-block">
                  <strong class="relation-feeling">${safe(rel.feeling)}.</strong>
                  <span class="relation-note">${safe(rel.note)}</span>
                </div>
                ${degree > 0 ? `
                  <button type="button" class="btn-invoke-relation ${isInvoked ? 'invoked' : ''}" 
                    data-invoke-relation="${safe(rel.target)}:${degree}" 
                    title="${isInvoked ? 'Relação já invocada nesta missão (Clique para reabrir)' : `Invocar Relação na Missão (Grau ${degree})`}">
                    ${isInvoked ? '✓ INVOCADA' : `INVOCAR (+1d${degree === 1 ? 6 : degree === 2 ? 8 : 12})`}
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
          ${editMode ? `<button type="button" class="vigilia-add-card-btn" data-vigilia-add-relation>+ RELAÇÃO</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza os Modais de Regras Oficiais de A Vigília
 */
function renderVigiliaModals(sheet) {
  const attrs = sheet.attributes || { Físico: 6, Mente: 6, Emoção: 6 };
  const skills = Array.isArray(sheet.skills) ? sheet.skills : [];
  const vigorSkill = skills.find(s => s.name.toUpperCase() === 'VIGOR')?.skillDie || 4;
  const disciplinaSkill = skills.find(s => s.name.toUpperCase() === 'DISCIPLINA')?.skillDie || 4;

  const lesaoDT = 7 + 3 * (sheet.lesoesCountScene || 0);
  const traumaDT = 7 + 3 * (sheet.traumasCountScene || 0);

  return `
    <!-- MODAL DE INVOCAR RELAÇÃO -->
    <div class="vigilia-modal-backdrop" id="vigilia-relation-modal" style="display: none;">
      <div class="vigilia-modal-box">
        <header class="vigilia-modal-head">
          <h2 class="vigilia-modal-title">INVOCAR RELAÇÃO</h2>
          <button type="button" class="vigilia-modal-close" data-close-vigilia-modal>✕</button>
        </header>
        <div class="vigilia-modal-body" id="vigilia-relation-modal-content">
          <!-- Preenchido dinamicamente via JS ao clicar em INVOCAR -->
        </div>
      </div>
    </div>

    <!-- MODAL DE TESTE DE LESÃO (0 PV) -->
    <div class="vigilia-modal-backdrop" id="vigilia-lesao-modal" style="display: none;">
      <div class="vigilia-modal-box">
        <header class="vigilia-modal-head">
          <h2 class="vigilia-modal-title">FERIMENTOS & TESTE DE LESÃO (0 PV)</h2>
          <button type="button" class="vigilia-modal-close" data-close-vigilia-modal>✕</button>
        </header>
        <div class="vigilia-modal-body">
          <p class="vigilia-modal-intro">
            Sempre que for reduzido a 0 PV (ou perder PV já estando com 0), você deve realizar um <strong>Teste de Lesão</strong> (Físico + Vigor contra DT 7, +3 por teste já realizado na cena).
          </p>
          <div class="vigilia-roll-trigger-card">
            <div class="trigger-info">
              <strong>DT ATUAL: ${lesaoDT}</strong>
              <small>Físico (d${attrs.Físico || 6}) + Vigor (d${vigorSkill})</small>
            </div>
            <button type="button" class="btn-vigilia-modal-roll" 
              data-roll-lesao-check="${attrs.Físico || 6},${vigorSkill}|${lesaoDT}">
              ROLAR TESTE DE LESÃO (DT ${lesaoDT})
            </button>
          </div>

          <div class="vigilia-modal-section-title">
            <span>OU ESCOLHA / ROLE NA TABELA DE LESÕES (1d20)</span>
            <button type="button" class="btn-vigilia-table-roll" data-roll-table="lesao">
              ROLAR 1d20 DIGITAL
            </button>
          </div>
          <p class="vigilia-table-hint">
            🎲 <strong>Rolou dados físicos na mesa?</strong> Clique diretamente na linha ou no botão <em>ESCOLHER</em> para aplicar a Lesão à ficha.
          </p>

          <div class="vigilia-table-scroll">
            <table class="vigilia-mechanics-table">
              <thead>
                <tr>
                  <th style="width: 55px;">1d20</th>
                  <th style="width: 170px;">Lesão</th>
                  <th>Efeito & Sequela</th>
                  <th style="width: 90px; text-align: center;">Ação</th>
                </tr>
              </thead>
              <tbody>
                ${LESOES_TABLE.map((row, idx) => `
                  <tr class="vigilia-table-clickable-row" data-select-lesao="${idx}" title="Clique para escolher ${safe(row.name)}">
                    <td class="col-roll"><b>${row.min}${row.max !== row.min ? `–${row.max}` : ''}</b></td>
                    <td class="col-name"><strong>${row.name}</strong></td>
                    <td class="col-desc">${row.desc}</td>
                    <td class="col-action" style="text-align: center;">
                      <button type="button" class="btn-choose-entry" data-select-lesao="${idx}">ESCOLHER</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE TESTE DE TRAUMA (0 PD) -->
    <div class="vigilia-modal-backdrop" id="vigilia-trauma-modal" style="display: none;">
      <div class="vigilia-modal-box">
        <header class="vigilia-modal-head">
          <h2 class="vigilia-modal-title">HORROR & TESTE DE TRAUMA (0 PD)</h2>
          <button type="button" class="vigilia-modal-close" data-close-vigilia-modal>✕</button>
        </header>
        <div class="vigilia-modal-body">
          <p class="vigilia-modal-intro">
            Sempre que for reduzido a 0 PD (ou perder PD já estando com 0), você deve realizar um <strong>Teste de Trauma</strong> (Emoção + Disciplina contra DT 7, +3 por teste já realizado na cena).
          </p>
          <div class="vigilia-roll-trigger-card">
            <div class="trigger-info">
              <strong>DT ATUAL: ${traumaDT}</strong>
              <small>Emoção (d${attrs.Emoção || 6}) + Disciplina (d${disciplinaSkill})</small>
            </div>
            <button type="button" class="btn-vigilia-modal-roll" 
              data-roll-trauma-check="${attrs.Emoção || 6},${disciplinaSkill}|${traumaDT}">
              ROLAR TESTE DE TRAUMA (DT ${traumaDT})
            </button>
          </div>

          <div class="vigilia-modal-section-title">
            <span>OU ESCOLHA / ROLE NA TABELA DE TRAUMAS (1d20)</span>
            <button type="button" class="btn-vigilia-table-roll" data-roll-table="trauma">
              ROLAR 1d20 DIGITAL
            </button>
          </div>
          <p class="vigilia-table-hint">
            🎲 <strong>Rolou dados físicos na mesa?</strong> Clique diretamente na linha ou no botão <em>ESCOLHER</em> para aplicar o Trauma à ficha.
          </p>

          <div class="vigilia-table-scroll">
            <table class="vigilia-mechanics-table">
              <thead>
                <tr>
                  <th style="width: 55px;">1d20</th>
                  <th style="width: 170px;">Trauma</th>
                  <th>Efeito & Sequela</th>
                  <th style="width: 90px; text-align: center;">Ação</th>
                </tr>
              </thead>
              <tbody>
                ${TRAUMAS_TABLE.map((row, idx) => `
                  <tr class="vigilia-table-clickable-row" data-select-trauma="${idx}" title="Clique para escolher ${safe(row.name)}">
                    <td class="col-roll"><b>${row.min}${row.max !== row.min ? `–${row.max}` : ''}</b></td>
                    <td class="col-name"><strong>${row.name}</strong></td>
                    <td class="col-desc">${row.desc}</td>
                    <td class="col-action" style="text-align: center;">
                      <button type="button" class="btn-choose-entry" data-select-trauma="${idx}">ESCOLHER</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
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
  const armorPoints = sheet.armorPoints ?? (sheet.pontosArmadura ?? 0);
  const dadoPavor = sheet.dadoPavor;
  const lesoesCount = sheet.lesoesCountScene || 0;
  const traumasCount = sheet.traumasCountScene || 0;
  const modeJustChanged = options.modeJustChanged;
  const safeUrl = options.safeUrl || (u => u);

  // Personalização visual (fundo, moldura e retrato) — aceita vigiliaBackground ou backgroundImage da ficha
  const rawBg = sheet.vigiliaBackground || (sheet.backgroundImage && !String(sheet.backgroundImage).startsWith('data:video/') ? sheet.backgroundImage : '');
  const customBg = rawBg ? safeUrl(rawBg) : '';
  const bgUrl = customBg || './assets/vigilia/vigilia-bg.png';
  const bgBlur = Number(sheet.vigiliaBgBlur ?? sheet.backgroundBlur) || 0;
  const bgZoom = Number(sheet.vigiliaBgZoom ?? sheet.backgroundZoom) || 100;
  const bgDim = Number(sheet.vigiliaBgDim) || 0;
  const tokenScale = Number(sheet.vigiliaTokenScale) || 100;
  const tokenX = Number(sheet.vigiliaTokenX) || 0;
  const tokenY = Number(sheet.vigiliaTokenY) || 0;
  const frameHidden = !!sheet.vigiliaFrameHidden;
  const pageStyle = [
    `--vg-bg-blur:${bgBlur}px`,
    `--vg-bg-zoom:${bgZoom / 100}`,
    `--vg-bg-dim:${bgDim / 100}`,
    `--vg-token-scale:${tokenScale / 100}`,
    `--vg-token-x:${tokenX}%`,
    `--vg-token-y:${tokenY}%`
  ].join(';');

  const editTools = editMode ? `
    <aside class="vigilia-edit-tools" aria-label="Personalização do layout Vigília">
      <div class="vet-group">
        <span class="vet-title">${icon('user', 13)} RETRATO</span>
        <label class="vet-btn">${icon('image', 13)} TROCAR<input id="token-upload-cinematic" type="file" accept="image/*"></label>
        ${sheet.tokenImage ? `<button type="button" class="vet-btn" data-vigilia-remove-token>REMOVER</button>` : ''}
        <button type="button" class="vet-btn ${sheet.vigiliaTokenFlip ? 'active' : ''}" data-vigilia-toggle="vigiliaTokenFlip">ESPELHAR</button>
        <label class="vet-range" title="Duplo clique para 100%">ESCALA
          <input type="range" min="30" max="250" step="1" value="${tokenScale}" data-vigilia-range="vigiliaTokenScale"><em>${tokenScale}%</em></label>
        <label class="vet-range" title="Duplo clique para zerar">HORIZ.
          <input type="range" min="-60" max="60" step="1" value="${tokenX}" data-vigilia-range="vigiliaTokenX"><em>${tokenX}%</em></label>
        <label class="vet-range" title="Duplo clique para zerar">VERT.
          <input type="range" min="-60" max="60" step="1" value="${tokenY}" data-vigilia-range="vigiliaTokenY"><em>${tokenY}%</em></label>
        <button type="button" class="vet-btn" data-vigilia-reset-token>RECENTRALIZAR</button>
      </div>
      <div class="vet-group">
        <span class="vet-title">${icon('image', 13)} FUNDO</span>
        <label class="vet-btn">${icon('image', 13)} TROCAR<input id="vigilia-bg-upload" type="file" accept="image/*"></label>
        ${customBg ? `<button type="button" class="vet-btn" data-vigilia-reset-bg>FUNDO PADRÃO</button>` : ''}
        <button type="button" class="vet-btn ${frameHidden ? '' : 'active'}" data-vigilia-toggle="vigiliaFrameHidden">MOLDURA</button>
        <label class="vet-range" title="Duplo clique para zerar">BLUR
          <input type="range" min="0" max="30" step="1" value="${bgBlur}" data-vigilia-range="vigiliaBgBlur"><em>${bgBlur}px</em></label>
        <label class="vet-range" title="Duplo clique para 100%">ZOOM
          <input type="range" min="50" max="250" step="5" value="${bgZoom}" data-vigilia-range="vigiliaBgZoom"><em>${bgZoom}%</em></label>
        <label class="vet-range" title="Duplo clique para zerar">ESCURECER
          <input type="range" min="0" max="90" step="5" value="${bgDim}" data-vigilia-range="vigiliaBgDim"><em>${bgDim}%</em></label>
      </div>
      <small class="vet-hint">Arraste o retrato para reposicionar · Duplo clique nos sliders para redefinir</small>
    </aside>
  ` : '';

  return `
    <main class="vigilia-page ${isBack ? 'view-back' : 'view-front'} ${editMode ? 'is-editing' : ''} ${modeJustChanged ? 'mode-enter' : ''}" style="${pageStyle}">
      <!-- FUNDO E MOLDURA CELTA OFICIAL (personalizáveis no modo de edição) -->
      <div class="vigilia-bg-clip">
        <div class="vigilia-bg-layer ${customBg ? 'is-custom' : ''}" style="background-image: url('${bgUrl}');"></div>
        <div class="vigilia-bg-dim"></div>
      </div>
      ${frameHidden ? '' : `
      <div class="vigilia-frame-layer">
        <img src="./assets/vigilia/vigilia-frame.png" alt="" class="vigilia-frame-img" draggable="false">
      </div>`}

      <!-- BARRA DE CONTROLE SUPERIOR (FLIP ENTRE FRENTE E VERSO + MECÂNICAS DA VIGÍLIA) -->
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

      <!-- DOCK FLUTUANTE DISCRETO (FORA DA FOLHA, CANTO INFERIOR) -->
      <aside class="vigilia-floating-dock" aria-label="Ferramentas de Vigília">
        ${dadoPavor ? `
          <div class="dock-pavor-active">
            <span class="pavor-dock-die ${sheet.pavorEmbraced ? 'embraced' : ''}" data-sides="${dadoPavor}">
              ${die(dadoPavor, 'micro', true)}
              <span class="pavor-dock-label">d${dadoPavor}</span>
            </span>
            <button type="button" class="dock-btn-pavor" data-pavor-action="control" title="Controlar Pavor (-1 PD)">−1 PD</button>
            <button type="button" class="dock-btn-pavor" data-pavor-action="embrace" title="Abraçar Pavor (-5 PD)">−5 PD</button>
            <button type="button" class="dock-btn-close" data-pavor-action="clear" title="Remover">✕</button>
          </div>
        ` : `
          <button type="button" class="dock-pill-btn" data-pavor-action="trigger" title="Adicionar Dado de Pavor (+d6)">
            + PAVOR
          </button>
        `}
        <button type="button" class="dock-pill-btn" data-open-vigilia-modal="lesao" title="Testar Lesão (0 PV)">
          LESÕES (${lesoesCount})
        </button>
        <button type="button" class="dock-pill-btn" data-open-vigilia-modal="trauma" title="Testar Trauma (0 PD)">
          TRAUMAS (${traumasCount})
        </button>
      </aside>

      ${editTools}

      <!-- MODAIS DE MECÂNICAS DE A VIGÍLIA -->
      ${renderVigiliaModals(sheet)}
    </main>
  `;
}
