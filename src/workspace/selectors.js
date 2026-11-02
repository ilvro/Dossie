/**
 * Seletores puros e utilitários de consulta para Fichas e Pastas
 */

export function isCharacterSheet(sheet) {
  return !!sheet && sheet.systemMode !== 'threat';
}

export function isThreatSheet(sheet) {
  return !!sheet && sheet.systemMode === 'threat';
}

export function getFolderById(folders = [], id) {
  return folders.find(f => f.id === id) || null;
}

export function getRootFolders(folders = []) {
  return folders.filter(f => !f.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getSubfolders(folders = [], parentId) {
  return folders.filter(f => f.parentId === parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getSheetsInFolder(sheets = [], folderId) {
  if (!folderId) return [];
  return sheets.filter(s => s && s.folderId === folderId);
}

/**
 * Retorna todos os IDs de pastas descendentes de uma dada pasta pai.
 */
export function getAllDescendantFolderIds(folders = [], parentId) {
  const ids = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const curr = queue.shift();
    const children = folders.filter(f => f.parentId === curr);
    children.forEach(c => {
      ids.push(c.id);
      queue.push(c.id);
    });
  }
  return ids;
}

/**
 * Filtra e ordena as fichas de acordo com o escopo, busca e opções fornecidas.
 */
export function visibleSheets(sheets = [], folders = [], options = {}) {
  let list = Array.isArray(sheets) ? [...sheets] : [];

  // 1. Filtro estrito: apenas personagens (usado pelo Modo Apresentação)
  if (options.apenasPersonagens) {
    list = list.filter(isCharacterSheet);
  } else if (options.apenasAmeacas) {
    list = list.filter(isThreatSheet);
  }

  // 2. Filtro por sistema
  if (options.systemMode && options.systemMode !== 'all') {
    list = list.filter(s => s.systemMode === options.systemMode);
  }

  // 3. Filtro por escopo de pasta
  const scope = options.scope || options.escopo;
  if (scope && scope !== 'all') {
    if (scope === 'characters' || scope === 'personagens' || scope === 'folder-characters') {
      const charFolderIds = ['folder-characters', ...getAllDescendantFolderIds(folders, 'folder-characters')];
      list = list.filter(s => isCharacterSheet(s) || charFolderIds.includes(s.folderId));
    } else if (scope === 'threats' || scope === 'ameacas' || scope === 'folder-threats') {
      const threatFolderIds = ['folder-threats', ...getAllDescendantFolderIds(folders, 'folder-threats')];
      list = list.filter(s => isThreatSheet(s) || threatFolderIds.includes(s.folderId));
    } else {
      // Escopo de uma pasta específica ou suas subpastas
      const folderIds = [scope, ...(options.includeSubfolders !== false ? getAllDescendantFolderIds(folders, scope) : [])];
      list = list.filter(s => folderIds.includes(s.folderId));
    }
  }

  // 4. Filtro por pastas ativas/visíveis (se especificado conjunto)
  if (Array.isArray(options.visibleFolderIds) && options.visibleFolderIds.length > 0) {
    list = list.filter(s => options.visibleFolderIds.includes(s.folderId));
  }

  // 5. Favoritas apenas
  if (options.favoriteOnly) {
    list = list.filter(s => !!s.favorite);
  }

  // 5b. Filtro por elemento de ameaça
  if (options.threatElement && options.threatElement !== 'all') {
    const elTarget = String(options.threatElement).toLowerCase();
    list = list.filter(s => {
      if (!isThreatSheet(s)) return true;
      if (elTarget === 'mundana' || elTarget === 'realidade') {
        return s.categoria === 'mundana' || s.elementoDestaque === 'mundana' || (!s.elementos || s.elementos.length === 0);
      }
      const elems = Array.isArray(s.elementos) ? s.elementos.map(e => String(e).toLowerCase()) : [];
      const destaque = String(s.elementoDestaque || '').toLowerCase();
      return elems.includes(elTarget) || destaque === elTarget;
    });
  }

  // 5c. Filtro por categoria de ameaça (paranormal / mundana)
  if (options.threatCategory && options.threatCategory !== 'all') {
    const catTarget = String(options.threatCategory).toLowerCase();
    list = list.filter(s => {
      if (!isThreatSheet(s)) return true;
      const cat = String(s.categoria || (s.elementos?.length ? 'paranormal' : 'mundana')).toLowerCase();
      return cat === catTarget;
    });
  }

  // 5d. Filtro por faixa de VD
  if (options.threatVdRange && options.threatVdRange !== 'all') {
    list = list.filter(s => {
      if (!isThreatSheet(s)) return true;
      const vd = Number(s.vd) || 0;
      switch (options.threatVdRange) {
        case '1-20': return vd >= 1 && vd <= 20;
        case '21-60': return vd >= 21 && vd <= 60;
        case '61-140': return vd >= 61 && vd <= 140;
        case '141-260': return vd >= 141 && vd <= 260;
        case '280+': return vd >= 280;
        default: return true;
      }
    });
  }

  // 5e. Filtro por VD mínimo/máximo customizado
  const minVd = options.threatVdMin !== undefined && options.threatVdMin !== '' && options.threatVdMin !== null ? Number(options.threatVdMin) : NaN;
  const maxVd = options.threatVdMax !== undefined && options.threatVdMax !== '' && options.threatVdMax !== null ? Number(options.threatVdMax) : NaN;
  if (!isNaN(minVd)) {
    list = list.filter(s => !isThreatSheet(s) || (Number(s.vd) || 0) >= minVd);
  }
  if (!isNaN(maxVd)) {
    list = list.filter(s => !isThreatSheet(s) || (Number(s.vd) || 0) <= maxVd);
  }

  // 6. Busca textual instantânea (nome, elemento, tipo, ocupação, classe, VD)
  if (options.search && typeof options.search === 'string') {
    const q = options.search.trim().toLowerCase();
    if (q) {
      list = list.filter(s => {
        const name = (s.name || '').toLowerCase();
        const occ = (s.occupation || '').toLowerCase();
        const profile = (s.profile || '').toLowerCase();
        const classe = (s.classeId || '').toLowerCase();
        const subtitulo = (s.subtitulo || '').toLowerCase();
        const vd = String(s.vd || '');
        const elem = Array.isArray(s.elementos) ? s.elementos.join(' ').toLowerCase() : '';
        const tipo = (s.tipo || '').toLowerCase();

        return (
          name.includes(q) ||
          occ.includes(q) ||
          profile.includes(q) ||
          classe.includes(q) ||
          subtitulo.includes(q) ||
          vd.includes(q) ||
          elem.includes(q) ||
          tipo.includes(q)
        );
      });
    }
  }

  // 7. Ordenação
  if (options.sort === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
  } else if (options.sort === 'vd' || options.sort === 'vd-desc') {
    list.sort((a, b) => {
      const vdB = isThreatSheet(b) ? (Number(b.vd) || 0) : -1;
      const vdA = isThreatSheet(a) ? (Number(a.vd) || 0) : -1;
      if (vdB !== vdA) return vdB - vdA;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
    });
  } else if (options.sort === 'vd-asc') {
    list.sort((a, b) => {
      const vdA = isThreatSheet(a) ? (Number(a.vd) || 0) : 99999;
      const vdB = isThreatSheet(b) ? (Number(b.vd) || 0) : 99999;
      if (vdA !== vdB) return vdA - vdB;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
    });
  } else if (options.sort === 'recent') {
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  // Se 'manual', preserva a ordem nativa do array `sheets`

  return list;
}

/**
 * Retorna o elemento primário de uma ficha de ameaça ('sangue', 'morte', etc.)
 */
export function getThreatElement(sheet) {
  if (!sheet || sheet.systemMode !== 'threat') return '';
  if (sheet.categoria === 'mundana' || sheet.elementoDestaque === 'mundana') {
    return 'mundana';
  }
  if (Array.isArray(sheet.elementos) && sheet.elementos.length > 0) {
    return String(sheet.elementos[0]).toLowerCase();
  }
  if (sheet.elementoDestaque) {
    return String(sheet.elementoDestaque).toLowerCase();
  }
  return 'mundana';
}

/**
 * Retorna todos os elementos de uma ficha de ameaça
 */
export function getThreatAllElements(sheet) {
  if (!sheet || sheet.systemMode !== 'threat') return [];
  if (sheet.categoria === 'mundana' || sheet.elementoDestaque === 'mundana') {
    return ['mundana'];
  }
  const elems = Array.isArray(sheet.elementos) ? sheet.elementos.map(e => String(e).toLowerCase()) : [];
  if (elems.length === 0 && sheet.elementoDestaque) {
    elems.push(String(sheet.elementoDestaque).toLowerCase());
  }
  return elems.length > 0 ? elems : ['mundana'];
}

/**
 * Determina a faixa de VD de uma criatura
 */
export function getThreatVdTier(vd) {
  const num = Number(vd) || 0;
  if (num <= 20) return '1-20';
  if (num <= 60) return '21-60';
  if (num <= 140) return '61-140';
  if (num <= 260) return '141-260';
  return '280+';
}

export const THREAT_VD_TIERS = [
  { id: '1-20', label: 'VD 1–20', subtitle: 'Iniciante & Mundana', min: 1, max: 20 },
  { id: '21-60', label: 'VD 21–60', subtitle: 'Veterano', min: 21, max: 60 },
  { id: '61-140', label: 'VD 61–140', subtitle: 'Especialista', min: 61, max: 140 },
  { id: '141-260', label: 'VD 141–260', subtitle: 'Elite', min: 141, max: 260 },
  { id: '280+', label: 'VD 280+', subtitle: 'Lendário & Relíquias', min: 280, max: 9999 }
];

/**
 * Conta ameaças por elemento
 */
export function countThreatsByElement(sheets = []) {
  const threats = sheets.filter(isThreatSheet);
  const counts = {
    all: threats.length,
    sangue: 0,
    morte: 0,
    energia: 0,
    conhecimento: 0,
    medo: 0,
    mundana: 0
  };

  threats.forEach(t => {
    const elems = getThreatAllElements(t);
    elems.forEach(el => {
      if (counts[el] !== undefined) {
        counts[el]++;
      }
    });
  });

  return counts;
}

/**
 * Conta ameaças por faixa de VD
 */
export function countThreatsByVdRange(sheets = []) {
  const threats = sheets.filter(isThreatSheet);
  const counts = {
    all: threats.length,
    '1-20': 0,
    '21-60': 0,
    '61-140': 0,
    '141-260': 0,
    '280+': 0
  };

  threats.forEach(t => {
    const tier = getThreatVdTier(t.vd);
    if (counts[tier] !== undefined) {
      counts[tier]++;
    }
  });

  return counts;
}

/**
 * Constrói a estrutura em árvore das pastas com suas fichas e contadores.
 */
export function buildFolderTree(folders = [], sheets = [], options = {}) {
  const fList = normalizeFoldersTree(folders);
  let sList = Array.isArray(sheets) ? sheets : [];

  // Se options tiver filtros específicos para aplicar dentro das pastas
  if (options.threatElement || options.threatVdRange || options.threatVdMin || options.threatVdMax || options.threatCategory) {
    sList = visibleSheets(sList, folders, {
      ...options,
      scope: 'all',
      visibleFolderIds: undefined
    });
  }

  function buildNode(folder) {
    const directSheets = sList.filter(s => s && s.folderId === folder.id);
    const childrenFolders = fList.filter(f => f.parentId === folder.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const childrenNodes = childrenFolders.map(buildNode);

    const totalSheets = directSheets.length + childrenNodes.reduce((acc, c) => acc + c.totalSheets, 0);

    return {
      folder,
      sheets: directSheets,
      children: childrenNodes,
      totalSheets
    };
  }

  const rootFolders = fList.filter(f => !f.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const nodes = rootFolders.map(buildNode);

  // Garante que fichas sem pasta (ou com folderId órfão) apareçam em uma pasta válida
  const allFolderIds = new Set(fList.map(f => f.id));
  const orphanSheets = sList.filter(s => s && (!s.folderId || !allFolderIds.has(s.folderId)));
  if (orphanSheets.length > 0) {
    orphanSheets.forEach(sheet => {
      const isThreat = sheet.systemMode === 'threat';
      const targetId = isThreat ? 'folder-threats' : (sheet.viewMode === 'vigilia' ? 'folder-vigilia' : 'fld-mvxb7120-5p5gg');
      const targetNode = nodes.find(n => n.folder.id === targetId) || nodes[0];
      if (targetNode) {
        targetNode.sheets.push(sheet);
        targetNode.totalSheets++;
      }
    });
  }

  return nodes;
}

function normalizeFoldersTree(folders) {
  if (!Array.isArray(folders)) return [];
  return folders.map(f => ({ ...f }));
}
