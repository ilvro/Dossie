/**
 * Navegador de Pastas e Workspace Sidebar (Fase 2)
 * Componentes de interface e gerenciamento de navegação hierárquica de fichas
 */

import { icon } from '../icons.js';
import {
  visibleSheets,
  buildFolderTree,
  isCharacterSheet,
  isThreatSheet,
  countThreatsByElement,
  countThreatsByVdRange,
  getThreatElement,
  getThreatAllElements,
  getThreatVdTier,
  THREAT_VD_TIERS
} from './selectors.js';
import { THREAT_ELEMENTS } from '../systems/threat/threat-data.js';
import { isBestiaryUnlocked, isOfficialThreat } from '../services/bestiary-license.js';
import { renderLicenseStatusPill, renderNavigatorLockBanner } from '../systems/threat/threat-license-ui.js';

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
 * Renderiza os botões compactos de filtro de escopo no topo do Rail lateral
 */
export function renderRailScopePills(activeScope = 'all', sheets = []) {
  const charsCount = sheets.filter(isCharacterSheet).length;
  const threatsCount = sheets.filter(isThreatSheet).length;
  const totalCount = sheets.length;
  const bestiaryUnlocked = isBestiaryUnlocked();

  return `
    <div class="rail-scope-pills" role="tablist" aria-label="Escopo de fichas">
      <button type="button" 
        class="rail-scope-btn scope-all ${activeScope === 'all' ? 'active' : ''}" 
        data-sidebar-scope="all" 
        title="Ver todas as fichas (${totalCount})"
        aria-label="Todas as fichas">
        ${icon('globe', 15)}
        <span class="rail-scope-badge">${totalCount}</span>
      </button>
      <button type="button" 
        class="rail-scope-btn scope-characters ${activeScope === 'characters' ? 'active' : ''}" 
        data-sidebar-scope="characters" 
        title="Apenas Personagens (${charsCount})"
        aria-label="Personagens">
        ${icon('user', 15)}
        <span class="rail-scope-badge">${charsCount}</span>
      </button>
      <button type="button" 
        class="rail-scope-btn scope-threats ${activeScope === 'threats' ? 'active' : ''} ${!bestiaryUnlocked ? 'is-locked' : ''}" 
        data-sidebar-scope="threats" 
        title="${!bestiaryUnlocked ? 'Ameaças (Bestiário Protegido — Valide seu PDF oficial)' : 'Apenas Ameaças (' + threatsCount + ')'}"
        aria-label="Ameaças">
        ${icon(!bestiaryUnlocked ? 'lock' : 'skull', 15)}
        <span class="rail-scope-badge">${threatsCount}</span>
        ${!bestiaryUnlocked ? `<span class="rail-threat-lock-badge" title="Conteúdo oficial protegido">${icon('lock', 8)}</span>` : ''}
      </button>
    </div>
  `;
}

/**
 * Renderiza a lista de avatares no Switcher vertical do Rail
 */
export function renderRailSwitcher(sheets = [], folders = [], activeSheetId = '', options = {}) {
  const {
    scope = 'all',
    visibleFolderIds = [],
    threatElement = 'all',
    threatVdRange = 'all',
    threatVdMin = '',
    threatVdMax = '',
    threatCategory = 'all',
    threatSort = 'vd-desc',
    safeUrl = s => s
  } = options;

  const isThreatScope = scope === 'threats';
  const hasActiveThreatFilter = isThreatScope && (
    threatElement !== 'all' ||
    threatVdRange !== 'all' ||
    (threatVdMin !== '' && !isNaN(Number(threatVdMin))) ||
    (threatVdMax !== '' && !isNaN(Number(threatVdMax))) ||
    threatCategory !== 'all'
  );

  const filtered = visibleSheets(sheets, folders, {
    scope,
    visibleFolderIds: Array.isArray(visibleFolderIds) && visibleFolderIds.length > 0 ? visibleFolderIds : undefined,
    threatElement,
    threatVdRange,
    threatVdMin,
    threatVdMax,
    threatCategory,
    sort: isThreatScope ? threatSort : undefined
  });

  let filterPill = '';
  if (hasActiveThreatFilter) {
    let filterLabel = 'Filtro';
    if (threatElement !== 'all') {
      filterLabel = THREAT_ELEMENTS[threatElement]?.nome || threatElement.toUpperCase();
    } else if (threatVdRange !== 'all') {
      filterLabel = `VD ${threatVdRange}`;
    } else if (threatVdMin || threatVdMax) {
      filterLabel = `VD ${threatVdMin || 0}-${threatVdMax || '+'}`;
    }
    filterPill = `
      <button type="button" 
        class="rail-threat-filter-pill" 
        data-clear-threat-filters 
        title="Filtro ativo: ${filterLabel} (${filtered.length} exibidas). Clique para limpar filtros.">
        <span class="rail-filter-dot"></span>
        <span class="rail-filter-count">${filtered.length}</span>
        <span class="rail-filter-x">✕</span>
      </button>
    `;
  }

  function renderSheetAvatar(sheet) {
    const isActive = sheet.id === activeSheetId;
    const isThreat = sheet.systemMode === 'threat';
    const isOriginal = sheet.systemMode === 'original';

    let elemColor = '';
    let vdBadge = '';
    let avatarClass = `sheet-avatar ${isActive ? 'active' : ''}`;
    let tooltipTitle = `${safe(sheet.name)} (${isOriginal ? 'Ordem RPG' : 'Ordem II'})`;

    if (isThreat) {
      const elem = (sheet.elementos || [])[0] || (sheet.categoria === 'mundana' ? 'mundana' : 'sangue');
      elemColor = THREAT_ELEMENTS[elem]?.cor || '#993ce8';
      avatarClass += ' threat-avatar';
      vdBadge = `<span class="threat-vd-pill" style="border-color:${elemColor};color:${elem === 'morte' ? '#bbb' : elemColor};">VD ${sheet.vd || 60}</span>`;
      tooltipTitle = `${safe(sheet.name)} (Ameaça · VD ${sheet.vd || 60})`;
    }

    const favStar = sheet.favorite ? `<span class="avatar-fav-star" title="Favorita">★</span>` : '';

    const avatarContent = sheet.tokenImage
      ? `<img src="${safeUrl(sheet.tokenImage)}" alt="${safe(sheet.name)}" draggable="false">`
      : safe((sheet.name || '?').slice(0, 1).toUpperCase());

    const inlineStyle = elemColor ? `style="--threat-elem-color:${elemColor};border-color:${elemColor};"` : '';

    return `
      <button type="button" 
        class="${avatarClass}" 
        data-sheet-id="${sheet.id}" 
        draggable="true" 
        title="${tooltipTitle}" 
        aria-label="${tooltipTitle}"
        ${inlineStyle}>
        ${avatarContent}
        ${vdBadge}
        ${favStar}
      </button>
    `;
  }

  // Agrupamento por pastas colapsáveis no Rail lateral
  const tree = buildFolderTree(folders, filtered);
  let folderSectionsHtml = '';

  tree.forEach(node => {
    const { folder, sheets: folderSheets } = node;
    // Se o escopo for incompatível ou não houver fichas neste escopo, pula
    if (scope === 'characters' && folder.kind === 'threats') return;
    if (scope === 'threats' && folder.kind === 'characters') return;
    if (!folderSheets || folderSheets.length === 0) return;

    const isCollapsed = Boolean(folder.collapsed);
    const hasActive = folderSheets.some(s => s.id === activeSheetId);
    const folderIconName = folder.icon || (folder.id === 'folder-threats' ? 'skull' : (folder.id === 'folder-vigilia' ? 'shield' : 'folder'));

    folderSectionsHtml += `
      <div class="rail-folder-section ${isCollapsed ? 'collapsed' : 'expanded'}" 
        data-rail-folder-id="${folder.id}"
        style="--folder-color:${safe(folder.color || '#3187ff')};">
        <button type="button" 
          class="rail-folder-btn ${isCollapsed ? 'collapsed' : 'expanded'} ${hasActive ? 'active-folder' : ''}" 
          data-toggle-folder-id="${folder.id}" 
          title="${safe(folder.name)} (${folderSheets.length} fichas · Clique para ${isCollapsed ? 'expandir' : 'recolher'})"
          aria-label="${safe(folder.name)}">
          <span class="rail-folder-icon" style="color:${safe(folder.color || '#3187ff')};">
            ${icon(folderIconName, 13)}
          </span>
          <span class="rail-folder-badge">${folderSheets.length}</span>
          <span class="rail-folder-chevron">${icon('chevron-right', 8)}</span>
        </button>
        ${!isCollapsed ? `
          <div class="rail-folder-sheets">
            ${folderSheets.map(renderSheetAvatar).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  return `
    <div class="sheet-switcher">
      ${filterPill}
      ${folderSectionsHtml}
      <button class="nav-btn dashed" data-new-sheet title="Adicionar ficha (+)">
        ${icon('plus')}
      </button>
    </div>
  `;
}

/**
 * Renderiza o painel de filtros e organização de ameaças
 */
export function renderThreatFilterPanel(sheets = [], options = {}) {
  const {
    threatElement = 'all',
    threatVdRange = 'all',
    threatVdMin = '',
    threatVdMax = '',
    threatCategory = 'all',
    threatSort = 'vd-desc',
    threatGroupBy = 'folders',
    threatFiltersOpen = true
  } = options;

  const threats = sheets.filter(isThreatSheet);
  const totalThreats = threats.length;
  const elemCounts = countThreatsByElement(threats);
  const vdCounts = countThreatsByVdRange(threats);

  const matchingThreats = visibleSheets(threats, [], {
    scope: 'threats',
    threatElement,
    threatVdRange,
    threatVdMin,
    threatVdMax,
    threatCategory
  });
  const matchingCount = matchingThreats.length;

  const hasActiveFilters = threatElement !== 'all' ||
    threatVdRange !== 'all' ||
    (threatVdMin !== '' && !isNaN(Number(threatVdMin))) ||
    (threatVdMax !== '' && !isNaN(Number(threatVdMax))) ||
    threatCategory !== 'all';

  return `
    <div class="nav-threat-filter-panel ${threatFiltersOpen ? 'open' : 'collapsed'}" id="nav-threat-filter-panel">
      <div class="nav-threat-filter-header" data-toggle-threat-filters-panel title="${threatFiltersOpen ? 'Clique para recolher filtros' : 'Clique para expandir filtros'}">
        <div class="nav-threat-header-left">
          ${icon('filter', 13)}
          <span class="nav-threat-filter-title">FILTRAR AMEAÇAS</span>
          ${renderLicenseStatusPill()}
          ${hasActiveFilters 
            ? `<span class="nav-threat-active-badge">${matchingCount}/${totalThreats}</span>` 
            : `<span class="nav-threat-total-badge">${totalThreats}</span>`}
        </div>
        <div class="nav-threat-header-right">
          <button type="button" class="nav-threat-clear-btn" data-clear-threat-filters title="Limpar todos os filtros" style="display:${hasActiveFilters ? 'inline-flex' : 'none'};">✕ LIMPAR</button>
          <button type="button" class="nav-threat-panel-chevron" aria-label="Expandir/recolher painel de filtros">
            ${icon(threatFiltersOpen ? 'chevron' : 'chevron-right', 12)}
          </button>
        </div>
      </div>

      ${threatFiltersOpen ? `
        <div class="nav-threat-filter-body">
          <!-- Linha 1: Elementos -->
          <div class="nav-threat-filter-section">
            <div class="nav-threat-section-label">
              <span>ELEMENTO</span>
              ${threatElement !== 'all' ? `<button type="button" class="nav-threat-section-reset" data-filter-threat-element="all">Mostrar todos</button>` : ''}
            </div>
            <div class="nav-threat-chips-row nav-threat-elements-row">
              <button type="button" 
                class="nav-threat-chip chip-elem chip-all ${threatElement === 'all' ? 'active' : ''}" 
                data-filter-threat-element="all">
                <span>TODOS</span>
                <span class="chip-count">${elemCounts.all}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-sangue ${threatElement === 'sangue' ? 'active' : ''}" 
                data-filter-threat-element="sangue" 
                title="Elemento Sangue (${elemCounts.sangue})">
                <img src="./assets/elements/sangue.png" class="nav-chip-elem-icon" alt="" draggable="false">
                <span>SANGUE</span>
                <span class="chip-count">${elemCounts.sangue}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-morte ${threatElement === 'morte' ? 'active' : ''}" 
                data-filter-threat-element="morte" 
                title="Elemento Morte (${elemCounts.morte})">
                <img src="./assets/elements/morte.png" class="nav-chip-elem-icon" alt="" draggable="false">
                <span>MORTE</span>
                <span class="chip-count">${elemCounts.morte}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-energia ${threatElement === 'energia' ? 'active' : ''}" 
                data-filter-threat-element="energia" 
                title="Elemento Energia (${elemCounts.energia})">
                <img src="./assets/elements/energia.png" class="nav-chip-elem-icon" alt="" draggable="false">
                <span>ENERGIA</span>
                <span class="chip-count">${elemCounts.energia}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-conhecimento ${threatElement === 'conhecimento' ? 'active' : ''}" 
                data-filter-threat-element="conhecimento" 
                title="Elemento Conhecimento (${elemCounts.conhecimento})">
                <img src="./assets/elements/conhecimento.png" class="nav-chip-elem-icon" alt="" draggable="false">
                <span>CONHEC.</span>
                <span class="chip-count">${elemCounts.conhecimento}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-medo ${threatElement === 'medo' ? 'active' : ''}" 
                data-filter-threat-element="medo" 
                title="Elemento Medo (${elemCounts.medo})">
                <img src="./assets/elements/medo.png" class="nav-chip-elem-icon" alt="" draggable="false">
                <span>MEDO</span>
                <span class="chip-count">${elemCounts.medo}</span>
              </button>
              <button type="button" 
                class="nav-threat-chip chip-elem chip-mundana ${threatElement === 'mundana' ? 'active' : ''}" 
                data-filter-threat-element="mundana" 
                title="Ameaças Mundanas / Realidade (${elemCounts.mundana})">
                <span class="elem-chip-dot" style="background:#ffffff;"></span>
                <span>MUNDANA</span>
                <span class="chip-count">${elemCounts.mundana}</span>
              </button>
            </div>
          </div>

          <!-- Linha 2: Faixa de VD -->
          <div class="nav-threat-filter-section">
            <div class="nav-threat-section-label">
              <span>VALOR DE DESAFIO (VD)</span>
              ${(threatVdRange !== 'all' || threatVdMin || threatVdMax) ? `<button type="button" class="nav-threat-section-reset" data-filter-threat-vd="all">Mostrar todos</button>` : ''}
            </div>
            <div class="nav-threat-chips-row nav-threat-vd-row">
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === 'all' && !threatVdMin && !threatVdMax ? 'active' : ''}" data-filter-threat-vd="all">
                <span>TODOS</span>
              </button>
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === '1-20' ? 'active' : ''}" data-filter-threat-vd="1-20" title="VD 1 a 20 (Iniciante / Mundanas)">
                <span>VD 1–20</span>
                <span class="chip-count">${vdCounts['1-20']}</span>
              </button>
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === '21-60' ? 'active' : ''}" data-filter-threat-vd="21-60" title="VD 21 a 60 (Veterano)">
                <span>VD 21–60</span>
                <span class="chip-count">${vdCounts['21-60']}</span>
              </button>
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === '61-140' ? 'active' : ''}" data-filter-threat-vd="61-140" title="VD 61 a 140 (Especialista)">
                <span>VD 61–140</span>
                <span class="chip-count">${vdCounts['61-140']}</span>
              </button>
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === '141-260' ? 'active' : ''}" data-filter-threat-vd="141-260" title="VD 141 a 260 (Elite)">
                <span>VD 141–260</span>
                <span class="chip-count">${vdCounts['141-260']}</span>
              </button>
              <button type="button" class="nav-threat-chip chip-vd ${threatVdRange === '280+' ? 'active' : ''}" data-filter-threat-vd="280+" title="VD 280+ (Lendário / Relíquias)">
                <span>VD 280+</span>
                <span class="chip-count">${vdCounts['280+']}</span>
              </button>
            </div>
            <div class="nav-threat-custom-vd">
              <span class="custom-vd-label">Faixa exata:</span>
              <div class="custom-vd-inputs">
                <input type="number" min="0" max="999" placeholder="Mín" value="${safe(threatVdMin)}" data-threat-vd-min aria-label="VD Mínimo">
                <span class="custom-vd-sep">a</span>
                <input type="number" min="0" max="999" placeholder="Máx" value="${safe(threatVdMax)}" data-threat-vd-max aria-label="VD Máximo">
                <button type="button" class="nav-threat-mini-clear" data-clear-custom-vd title="Limpar VD exato" style="display:${(threatVdMin || threatVdMax) ? 'grid' : 'none'};">✕</button>
              </div>
            </div>
          </div>

          <!-- Linha 3: Agrupamento e Ordenação -->
          <div class="nav-threat-controls-grid">
            <div class="nav-threat-control-item">
              <label class="nav-threat-control-label">AGRUPAR</label>
              <select class="nav-threat-select" data-threat-group-select>
                <option value="folders" ${threatGroupBy === 'folders' ? 'selected' : ''}>Pastas</option>
                <option value="element" ${threatGroupBy === 'element' ? 'selected' : ''}>Elemento</option>
                <option value="vd" ${threatGroupBy === 'vd' ? 'selected' : ''}>Faixa de VD</option>
                <option value="flat" ${threatGroupBy === 'flat' ? 'selected' : ''}>Lista Simples</option>
              </select>
            </div>
            <div class="nav-threat-control-item">
              <label class="nav-threat-control-label">ORDENAR</label>
              <select class="nav-threat-select" data-threat-sort-select>
                <option value="vd-desc" ${threatSort === 'vd-desc' ? 'selected' : ''}>VD (Maior > Menor)</option>
                <option value="vd-asc" ${threatSort === 'vd-asc' ? 'selected' : ''}>VD (Menor > Maior)</option>
                <option value="name" ${threatSort === 'name' ? 'selected' : ''}>Nome (A-Z)</option>
                <option value="recent" ${threatSort === 'recent' ? 'selected' : ''}>Mais Recentes</option>
              </select>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Renderiza o painel expandido do Navegador de Fichas e Pastas
 */
export function renderWorkspaceNavigator(folders = [], sheets = [], activeSheetId = '', options = {}) {
  const {
    open = false,
    pinned = false,
    searchQuery = '',
    scope = 'all',
    visibleFolderIds = [],
    recentSheetIds = [],
    threatElement = 'all',
    threatVdRange = 'all',
    threatVdMin = '',
    threatVdMax = '',
    threatCategory = 'all',
    threatSort = 'vd-desc',
    threatGroupBy = 'folders',
    threatFiltersOpen = true,
    virtualGroupsCollapsed = {},
    safeUrl = s => s
  } = options;

  if (!open && !pinned) {
    return `<aside class="workspace-navigator" id="workspace-navigator" aria-label="Navegador de fichas e pastas" aria-hidden="true"></aside>`;
  }

  const totalSheets = sheets.length;
  const charsCount = sheets.filter(isCharacterSheet).length;
  const threatsCount = sheets.filter(isThreatSheet).length;

  return `
    ${open && !pinned ? `<div class="workspace-navigator-backdrop" data-close-navigator></div>` : ''}
    <aside class="workspace-navigator ${open ? 'open' : ''} ${pinned ? 'pinned' : ''}" id="workspace-navigator" aria-label="Navegador de fichas e pastas">
      <header class="nav-panel-header">
        <div class="nav-panel-title-wrap">
          ${icon('folder', 18)}
          <h2 class="nav-panel-title">NAVEGADOR</h2>
        </div>
        <div class="nav-panel-actions">
          <button type="button" class="nav-panel-icon-btn ${pinned ? 'active' : ''}" data-nav-pin title="${pinned ? 'Desafixar painel' : 'Fixar painel no layout'}">
            ${icon('pin', 14)}
          </button>
          <button type="button" class="nav-panel-icon-btn" data-close-navigator title="Fechar navegador (Esc)">
            ${icon('close', 14)}
          </button>
        </div>
      </header>

      <div class="nav-search-wrap">
        <div class="nav-search-box">
          ${icon('search', 14)}
          <input type="text" 
            placeholder="Buscar fichas, elementos, VD..." 
            value="${safe(searchQuery)}" 
            data-nav-search-input 
            aria-label="Buscar fichas"
            autocomplete="off">
          ${searchQuery ? `<button type="button" class="nav-panel-icon-btn" data-nav-clear-search title="Limpar busca">${icon('close', 12)}</button>` : `<kbd class="nav-search-kbd" data-open-quick-switcher title="Atalho global">Ctrl+K</kbd>`}
        </div>
      </div>

      <nav class="nav-scope-tabs">
        <button type="button" class="nav-scope-tab tab-all ${scope === 'all' ? 'active' : ''}" data-nav-scope-tab="all">
          <span>TODAS</span>
          <span class="nav-scope-count">(${totalSheets})</span>
        </button>
        <button type="button" class="nav-scope-tab tab-characters ${scope === 'characters' ? 'active' : ''}" data-nav-scope-tab="characters">
          <span>PERSONAGENS</span>
          <span class="nav-scope-count">(${charsCount})</span>
        </button>
        <button type="button" class="nav-scope-tab tab-threats ${scope === 'threats' ? 'active' : ''}" data-nav-scope-tab="threats">
          <span>AMEAÇAS</span>
          ${!isBestiaryUnlocked() ? `<span class="nav-scope-lock" title="Conteúdo oficial protegido">${icon('lock', 10)}</span>` : ''}
          <span class="nav-scope-count">(${threatsCount})</span>
        </button>
      </nav>

      ${scope === 'threats' && !isBestiaryUnlocked() ? renderNavigatorLockBanner() : ''}
      ${scope === 'threats' ? renderThreatFilterPanel(sheets, options) : ''}

      <div class="nav-toolbar">
        <button type="button" class="nav-toolbar-btn" data-nav-create-folder title="Criar nova pasta personalizada">
          ${icon('folder-plus', 13)}
          <span>NOVA PASTA</span>
        </button>
        <div style="display:flex;gap:4px;">
          <button type="button" class="nav-toolbar-btn" data-nav-collapse-all title="Recolher todas as pastas">
            <span>RECOLHER</span>
          </button>
          <button type="button" class="nav-toolbar-btn" data-nav-expand-all title="Expandir todas as pastas">
            <span>EXPANDIR</span>
          </button>
        </div>
      </div>

      <div class="nav-tree-scroll">
        ${renderNavigatorTreeContent(folders, sheets, activeSheetId, {
          searchQuery,
          scope,
          visibleFolderIds,
          recentSheetIds,
          threatElement,
          threatVdRange,
          threatVdMin,
          threatVdMax,
          threatCategory,
          threatSort,
          threatGroupBy,
          virtualGroupsCollapsed,
          safeUrl
        })}
      </div>
    </aside>
  `;
}

/**
 * Renderiza o conteúdo da árvore do navegador (pastas, favoritos, recentes ou busca)
 */
export function renderNavigatorTreeContent(folders = [], sheets = [], activeSheetId = '', options = {}) {
  const {
    searchQuery = '',
    scope = 'all',
    visibleFolderIds = [],
    recentSheetIds = [],
    threatElement = 'all',
    threatVdRange = 'all',
    threatVdMin = '',
    threatVdMax = '',
    threatCategory = 'all',
    threatSort = 'vd-desc',
    threatGroupBy = 'folders',
    virtualGroupsCollapsed = {},
    safeUrl = s => s
  } = options;

  const isThreatScope = scope === 'threats';

  const isSearching = Boolean(searchQuery && searchQuery.trim());

  if (isSearching) {
    return renderSearchResults(sheets, folders, searchQuery, activeSheetId, safeUrl, options);
  }

  // Agrupamentos inteligentes exclusivos para o escopo de Ameaças
  if (isThreatScope) {
    const filteredThreats = visibleSheets(sheets, folders, {
      scope: 'threats',
      threatElement,
      threatVdRange,
      threatVdMin,
      threatVdMax,
      threatCategory,
      sort: threatSort
    });

    if (threatGroupBy === 'element') {
      return renderElementGroupedThreats(filteredThreats, activeSheetId, safeUrl, virtualGroupsCollapsed);
    }
    if (threatGroupBy === 'vd') {
      return renderVdGroupedThreats(filteredThreats, activeSheetId, safeUrl, virtualGroupsCollapsed);
    }
    if (threatGroupBy === 'flat') {
      return renderFlatThreats(filteredThreats, activeSheetId, safeUrl);
    }
  }

  // Visualização padrão por Pastas
  const tree = buildFolderTree(folders, sheets, isThreatScope ? {
    threatElement,
    threatVdRange,
    threatVdMin,
    threatVdMax,
    threatCategory,
    sort: threatSort
  } : {});

  const favorites = sheets.filter(s => s && s.favorite && (!isThreatScope || isThreatSheet(s)));
  const recents = (recentSheetIds || [])
    .map(id => sheets.find(s => s.id === id))
    .filter(Boolean)
    .filter(s => !isThreatScope || isThreatSheet(s))
    .slice(0, 6);

  let html = '';
  if (favorites.length > 0) html += renderSpecialSection('FAVORITAS', favorites, activeSheetId, 'star', safeUrl);
  if (recents.length > 0) html += renderSpecialSection('RECENTES', recents, activeSheetId, 'clock', safeUrl);
  html += renderTreeNodes(tree, activeSheetId, visibleFolderIds, scope, safeUrl);
  return html;
}

/**
 * Renderiza ameaças agrupadas por Elemento
 */
function renderElementGroupedThreats(threats = [], activeSheetId = '', safeUrl = s => s, collapsedMap = {}) {
  const elements = [
    { id: 'sangue', nome: 'Sangue', cor: '#e0150d' },
    { id: 'morte', nome: 'Morte', cor: '#181922', textCor: '#d1d5db', borderCor: '#6b7280' },
    { id: 'energia', nome: 'Energia', cor: '#993ce8' },
    { id: 'conhecimento', nome: 'Conhecimento', cor: '#c9a227' },
    { id: 'medo', nome: 'Medo', cor: '#d5d7e0', textCor: '#ffffff' },
    { id: 'mundana', nome: 'Realidade / Mundana', cor: '#ffffff' }
  ];

  if (threats.length === 0) {
    return `
      <div style="text-align:center;padding:28px 14px;color:#6d728e;">
        ${icon('filter', 24)}
        <p style="margin:8px 0 0 0;font-size:11px;font-weight:700;">Nenhuma criatura corresponde aos filtros</p>
        <small style="font-size:10px;">Clique em "Limpar" para ver todas as ameaças</small>
      </div>
    `;
  }

  return elements.map(el => {
    const matching = threats.filter(t => getThreatAllElements(t).includes(el.id));
    if (matching.length === 0) return '';

    const groupId = `elem-${el.id}`;
    const isCollapsed = Boolean(collapsedMap[groupId]);

    return `
      <div class="nav-folder-item nav-virtual-group" data-virtual-group-id="${groupId}">
        <div class="nav-folder-header" data-toggle-virtual-group="${groupId}" title="${el.nome} (${matching.length} criaturas)">
          <div class="nav-folder-info">
            <button type="button" class="nav-folder-toggle ${!isCollapsed ? 'expanded' : ''}" data-toggle-virtual-group="${groupId}" aria-label="Expandir/recolher">
              ${icon('chevron-right', 11)}
            </button>
            ${el.id !== 'mundana' ? `<img src="./assets/elements/${el.id}.png" class="nav-group-elem-icon" alt="" draggable="false">` : `<span class="nav-elem-dot" style="background:${el.cor};"></span>`}
            <span class="nav-folder-name" style="color:${el.id === 'mundana' ? '#fff' : (el.textCor || el.cor)};font-weight:800;">${el.nome.toUpperCase()}</span>
            <span class="nav-folder-count">(${matching.length})</span>
          </div>
        </div>
        ${!isCollapsed ? `
          <div class="nav-folder-contents">
            ${matching.map(sheet => renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Renderiza ameaças agrupadas por Faixa de VD
 */
function renderVdGroupedThreats(threats = [], activeSheetId = '', safeUrl = s => s, collapsedMap = {}) {
  const tiers = THREAT_VD_TIERS;

  if (threats.length === 0) {
    return `
      <div style="text-align:center;padding:28px 14px;color:#6d728e;">
        ${icon('filter', 24)}
        <p style="margin:8px 0 0 0;font-size:11px;font-weight:700;">Nenhuma criatura corresponde aos filtros</p>
        <small style="font-size:10px;">Clique em "Limpar" para ver todas as ameaças</small>
      </div>
    `;
  }

  return tiers.map(tier => {
    const matching = threats.filter(t => getThreatVdTier(t.vd) === tier.id);
    if (matching.length === 0) return '';

    const groupId = `vd-${tier.id}`;
    const isCollapsed = Boolean(collapsedMap[groupId]);

    return `
      <div class="nav-folder-item nav-virtual-group" data-virtual-group-id="${groupId}">
        <div class="nav-folder-header" data-toggle-virtual-group="${groupId}" title="${tier.label} · ${tier.subtitle} (${matching.length} criaturas)">
          <div class="nav-folder-info">
            <button type="button" class="nav-folder-toggle ${!isCollapsed ? 'expanded' : ''}" data-toggle-virtual-group="${groupId}" aria-label="Expandir/recolher">
              ${icon('chevron-right', 11)}
            </button>
            <span class="nav-vd-tier-badge">${tier.label}</span>
            <span class="nav-folder-name" style="font-size:11px;color:#b1b6d1;">${tier.subtitle}</span>
            <span class="nav-folder-count">(${matching.length})</span>
          </div>
        </div>
        ${!isCollapsed ? `
          <div class="nav-folder-contents">
            ${matching.map(sheet => renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Renderiza lista plana direta de ameaças
 */
function renderFlatThreats(threats = [], activeSheetId = '', safeUrl = s => s) {
  if (threats.length === 0) {
    return `
      <div style="text-align:center;padding:28px 14px;color:#6d728e;">
        ${icon('filter', 24)}
        <p style="margin:8px 0 0 0;font-size:11px;font-weight:700;">Nenhuma criatura encontrada</p>
        <small style="font-size:10px;">Ajuste os filtros de elemento ou VD</small>
      </div>
    `;
  }

  return `
    <div class="nav-flat-threats-list">
      <div style="padding:4px 8px 8px 8px;display:flex;justify-content:space-between;align-items:center;color:#6d728e;font-size:9.5px;font-weight:800;letter-spacing:0.06em;">
        <span>CRIATURAS (${threats.length})</span>
      </div>
      ${threats.map(sheet => renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl)).join('')}
    </div>
  `;
}

/**
 * Renderiza uma seção especial de favoritos ou recentes
 */
function renderSpecialSection(title, sheetList, activeSheetId, iconName, safeUrl) {
  return `
    <section class="nav-special-section">
      <div class="nav-special-header">
        <span style="display:flex;align-items:center;gap:4px;">
          ${icon(iconName === 'star' ? 'star-filled' : 'clock', 12)}
          <b>${title}</b>
        </span>
        <small>(${sheetList.length})</small>
      </div>
      <div class="nav-special-list">
        ${sheetList.map(sheet => renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl)).join('')}
      </div>
    </section>
  `;
}

/**
 * Renderiza nós de árvore recursivamente
 */
function renderTreeNodes(nodes = [], activeSheetId = '', visibleFolderIds = [], scope = 'all', safeUrl) {
  return nodes.map(node => {
    const { folder, sheets: nodeSheets, children, totalSheets } = node;

    // Filtra o nó se o escopo for incompatível
    if (scope === 'characters' && folder.kind === 'threats') return '';
    if (scope === 'threats' && folder.kind === 'characters') return '';

    const isCollapsed = Boolean(folder.collapsed);
    const isVisibleInRail = visibleFolderIds.length === 0 || visibleFolderIds.includes(folder.id);
    const folderIconName = folder.icon || (folder.id === 'folder-threats' ? 'skull' : (folder.id === 'folder-characters' ? 'user' : 'folder'));

    return `
      <div class="nav-folder-item" data-folder-item-id="${folder.id}">
        <div class="nav-folder-header" 
          data-folder-header-id="${folder.id}" 
          title="${safe(folder.name)} (${totalSheets} fichas)"
          draggable="${!folder.system}">
          <div class="nav-folder-info" data-folder-click-toggle="${folder.id}">
            <button type="button" class="nav-folder-toggle ${!isCollapsed ? 'expanded' : ''}" data-toggle-folder-id="${folder.id}" aria-label="Expandir/recolher">
              ${icon('chevron-right', 11)}
            </button>
            <span class="nav-folder-icon" style="color:${safe(folder.color || '#3187ff')};">
              ${icon(folderIconName, 14)}
            </span>
            <span class="nav-folder-name">${safe(folder.name)}</span>
            <span class="nav-folder-count">(${totalSheets})</span>
          </div>
          <div class="nav-folder-actions">
            <button type="button" 
              class="nav-folder-action-btn ${!isVisibleInRail ? 'visibility-hidden' : ''}" 
              data-toggle-visibility-folder="${folder.id}" 
              title="${isVisibleInRail ? 'Visível no rail lateral (Clique para ocultar)' : 'Oculto no rail (Clique para exibir)'}">
              ${icon(isVisibleInRail ? 'eye' : 'eye-off', 12)}
            </button>
            <button type="button" class="nav-folder-action-btn" data-folder-menu-btn="${folder.id}" title="Mais opções da pasta">
              ${icon('more-vertical', 12)}
            </button>
          </div>
        </div>

        ${!isCollapsed ? `
          <div class="nav-folder-contents" data-folder-drop-zone="${folder.id}">
            ${children.length > 0 ? renderTreeNodes(children, activeSheetId, visibleFolderIds, scope, safeUrl) : ''}
            ${nodeSheets.map(sheet => renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl)).join('')}
            ${nodeSheets.length === 0 && children.length === 0 ? `<small style="display:block;padding:4px 8px;color:#5a5f7d;font-size:10px;">Pasta vazia</small>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Renderiza uma linha individual de ficha na lista ou árvore
 */
function renderSheetRow(sheet, isActive, safeUrl, folderBreadcrumb = '') {
  if (!sheet) return '';
  const isThreat = sheet.systemMode === 'threat';
  const isOriginal = sheet.systemMode === 'original';
  const isOfficial = isOfficialThreat(sheet);
  const isLocked = isThreat && isOfficial && !isBestiaryUnlocked();

  let badge = '<span class="nav-sheet-badge badge-ordem2">ORDEM II</span>';
  if (isOriginal) {
    badge = '<span class="nav-sheet-badge badge-original">ORDEM RPG</span>';
  } else if (isThreat) {
    const elemId = (sheet.elementos || [])[0] || (sheet.categoria === 'mundana' ? 'mundana' : 'sangue');
    const elemData = THREAT_ELEMENTS[elemId] || THREAT_ELEMENTS.mundana;
    const elemColor = elemData?.cor || '#993ce8';
    const elemLabel = elemData?.nome || 'Mundana';

    badge = `
      <div class="nav-sheet-threat-meta">
        ${isLocked ? `<span class="nav-sheet-lock-tag" title="Criatura oficial protegida (valide seu PDF para desbloquear)">${icon('lock', 9)}</span>` : ''}
        <span class="nav-sheet-elem-tag" style="border-color:${elemColor};color:${elemId === 'morte' ? '#abb0cb' : elemColor};">${elemId !== 'mundana' ? `<img src="./assets/elements/${elemId}.png" class="nav-tag-elem-icon" alt="" draggable="false">` : ''}${elemLabel.toUpperCase()}</span>
        <span class="nav-sheet-badge badge-threat">VD ${sheet.vd || 60}</span>
      </div>
    `;
  }

  const avatar = sheet.tokenImage
    ? `<img src="${safeUrl(sheet.tokenImage)}" alt="${safe(sheet.name)}">`
    : safe((sheet.name || '?').slice(0, 1).toUpperCase());

  return `
    <div class="nav-sheet-item ${isActive ? 'active' : ''} ${isThreat ? 'threat-sheet-item' : ''} ${isLocked ? 'is-locked-threat' : ''}" 
      data-nav-sheet-row="${sheet.id}" 
      draggable="true" 
      title="${isLocked ? safe(sheet.name) + ' (Oficial - Requer Validação do PDF)' : safe(sheet.name)}">
      <div class="nav-sheet-main" data-select-sheet-id="${sheet.id}">
        <div class="nav-sheet-avatar">
          ${avatar}
        </div>
        <div style="min-width:0;flex:1;">
          <span class="nav-sheet-name">${safe(sheet.name || 'Sem nome')}</span>
          ${folderBreadcrumb ? `<div class="nav-search-breadcrumb">${safe(folderBreadcrumb)}</div>` : ''}
        </div>
        ${badge}
      </div>
      <div class="nav-sheet-actions">
        <button type="button" 
          class="nav-sheet-fav-btn ${sheet.favorite ? 'is-fav' : ''}" 
          data-toggle-fav-sheet="${sheet.id}" 
          title="${sheet.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
          ${icon(sheet.favorite ? 'star-filled' : 'star', 12)}
        </button>
        <button type="button" 
          class="nav-folder-action-btn" 
          data-sheet-menu-btn="${sheet.id}" 
          title="Opções da ficha">
          ${icon('more-vertical', 12)}
        </button>
      </div>
    </div>
  `;
}

/**
 * Renderiza resultados de busca instantânea planos com breadcrumb de pasta
 */
function renderSearchResults(sheets = [], folders = [], query = '', activeSheetId = '', safeUrl, options = {}) {
  const q = query.trim().toLowerCase();
  const folderMap = new Map(folders.map(f => [f.id, f.name]));

  const results = visibleSheets(sheets, folders, {
    search: q,
    scope: options.scope,
    threatElement: options.threatElement,
    threatVdRange: options.threatVdRange,
    threatVdMin: options.threatVdMin,
    threatVdMax: options.threatVdMax,
    threatCategory: options.threatCategory,
    sort: options.threatSort
  });

  if (results.length === 0) {
    return `
      <div style="text-align:center;padding:32px 16px;color:#6d728e;">
        ${icon('search', 28)}
        <p style="margin:8px 0 0 0;font-size:12px;font-weight:700;">Nenhuma ficha encontrada</p>
        <small style="font-size:10px;">Tente buscar por outro termo ou nome</small>
      </div>
    `;
  }

  return `
    <div class="nav-search-results">
      <small style="display:block;padding:4px 8px;color:#7e839e;font-size:10px;font-weight:800;letter-spacing:0.06em;">
        ${results.length} ${results.length === 1 ? 'RESULTADO ENCONTRADO' : 'RESULTADOS ENCONTRADOS'}
      </small>
      ${results.map(sheet => {
        const folderName = folderMap.get(sheet.folderId) || 'Personagens';
        return renderSheetRow(sheet, sheet.id === activeSheetId, safeUrl, folderName);
      }).join('')}
    </div>
  `;
}

/**
 * Renderiza apenas os itens de resultado do Quick Switcher
 */
export function renderQuickSwitcherResults(sheets = [], folders = [], query = '', selectedIndex = 0, safeUrl = s => s) {
  const folderMap = new Map(folders.map(f => [f.id, f.name]));
  const q = (query || '').trim().toLowerCase();

  const results = q ? visibleSheets(sheets, folders, { search: q }) : sheets.slice(0, 8);

  const items = results.map((sheet, index) => {
    const isSelected = index === selectedIndex;
    const isThreat = sheet.systemMode === 'threat';
    const isOriginal = sheet.systemMode === 'original';
    const folderName = folderMap.get(sheet.folderId) || (isThreat ? 'Ameaças' : 'Personagens');

    let tag = isOriginal ? 'Ordem RPG' : (isThreat ? `Ameaça · VD ${sheet.vd || 60}` : 'Ordem II');

    const avatar = sheet.tokenImage
      ? `<img src="${safeUrl(sheet.tokenImage)}" alt="${safe(sheet.name)}">`
      : safe((sheet.name || '?').slice(0, 1).toUpperCase());

    return `
      <div class="quick-switcher-item ${isSelected ? 'selected' : ''}" data-qs-pick-index="${index}" data-qs-sheet-id="${sheet.id}">
        <div class="quick-switcher-item-main">
          <div class="quick-switcher-avatar">${avatar}</div>
          <div class="quick-switcher-item-info">
            <div class="quick-switcher-item-name">${safe(sheet.name || 'Sem nome')}</div>
            <div class="quick-switcher-item-sub">${safe(folderName)} · ${safe(tag)}</div>
          </div>
        </div>
        <kbd class="nav-search-kbd">Enter</kbd>
      </div>
    `;
  }).join('');

  return {
    count: results.length,
    results,
    html: items || `<p style="text-align:center;color:#6b708e;padding:20px;font-size:12px;">Nenhuma ficha corresponde à busca.</p>`
  };
}

/**
 * Renderiza o Quick Switcher / Paleta de Comandos (Ctrl+K)
 */
export function renderQuickSwitcherModal(sheets = [], folders = [], query = '', selectedIndex = 0, safeUrl = s => s) {
  const { count, html } = renderQuickSwitcherResults(sheets, folders, query, selectedIndex, safeUrl);

  return `
    <div class="quick-switcher-modal" id="quick-switcher-modal">
      <div class="quick-switcher-backdrop" data-close-quick-switcher></div>
      <div class="quick-switcher-card">
        <div class="quick-switcher-header">
          ${icon('search', 16)}
          <input type="text" 
            placeholder="Digite para buscar qualquer ficha ou pasta..." 
            value="${safe(query)}" 
            data-qs-input 
            autofocus 
            autocomplete="off">
          <button type="button" class="nav-panel-icon-btn" data-close-quick-switcher>${icon('close', 14)}</button>
        </div>
        <div class="quick-switcher-results">
          ${html}
        </div>
        <div class="quick-switcher-footer">
          <div class="quick-switcher-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
            <span><kbd>↵</kbd> Abrir</span>
            <span><kbd>Esc</kbd> Fechar</span>
          </div>
          <span class="quick-switcher-count" style="font-weight:700;">${count} fichas</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza o Drawer Mobile atualizado com Árvore de Pastas
 */
export function renderMobileSheetDrawer(sheets = [], folders = [], activeSheetId = '', options = {}) {
  const { open = false, searchQuery = '', rollLogCount = 0, safeUrl = s => s } = options;
  if (!open) return '';

  const isSearching = Boolean(searchQuery && searchQuery.trim());
  const tree = buildFolderTree(folders, sheets);

  return `
    <div class="sheet-drawer-backdrop" data-close-drawer></div>
    <aside class="sheet-drawer">
      <div class="sheet-drawer-header">
        <span style="display:flex;align-items:center;gap:6px;">
          ${icon('folder', 16)}
          <b>FICHAS & PASTAS</b>
        </span>
        <button data-close-drawer>${icon('close', 16)}</button>
      </div>

      <div class="nav-search-wrap" style="background:#131524;">
        <div class="nav-search-box">
          ${icon('search', 14)}
          <input type="text" placeholder="Buscar fichas..." value="${safe(searchQuery)}" data-mobile-search-input>
          ${searchQuery ? `<button type="button" class="nav-panel-icon-btn" data-mobile-clear-search>${icon('close', 12)}</button>` : ''}
        </div>
      </div>

      <div class="sheet-drawer-list" style="padding:10px;">
        ${isSearching 
          ? renderSearchResults(sheets, folders, searchQuery, activeSheetId, safeUrl)
          : renderTreeNodes(tree, activeSheetId, [], 'all', safeUrl)
        }
      </div>

      <div class="sheet-drawer-footer">
        <button type="button" data-new-sheet class="primary" style="grid-column:span 2;background:var(--red);color:#fff;font-weight:800;">
          ${icon('plus', 15)} NOVA FICHA
        </button>
        <button type="button" data-open-presentation>${icon('presentation', 15)} APRESENTAÇÃO</button>
        <button type="button" data-open-roll-log>${icon('history', 15)} LOG (${rollLogCount})</button>
        <button type="button" data-export-cinematic-image>${icon('camera', 15)} FOTO HD</button>
        <button type="button" data-save-sheet>${icon('save', 15)} SALVAR</button>
      </div>
    </aside>
  `;
}
