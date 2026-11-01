/**
 * Modelo de dados, migração e operações CRUD de Pastas
 * Sistema de Organização de Fichas (Personagens, Ameaças e Pastas Personalizadas)
 */

export const FOLDERS_STORAGE_KEY = 'ordem-ii-folders-v1';

export const DEFAULT_FOLDERS = [
  {
    id: 'folder-characters',
    name: 'Personagens',
    kind: 'characters',
    parentId: null,
    color: '#e0150d',
    icon: 'user',
    collapsed: false,
    order: 0,
    system: true
  },
  {
    id: 'folder-vigilia',
    name: 'Personagens Vigília',
    kind: 'characters',
    parentId: null,
    color: '#34d399',
    icon: 'shield',
    collapsed: false,
    order: 1,
    system: true
  },
  {
    id: 'folder-threats',
    name: 'Ameaças',
    kind: 'threats',
    parentId: null,
    color: '#993ce8',
    icon: 'skull',
    collapsed: false,
    order: 2,
    system: true
  }
];

export function makeFolderId() {
  return `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Normaliza um objeto de pasta garantindo tipos e campos obrigatórios.
 */
export function normalizeFolder(raw = {}, index = 0) {
  const isSys = raw.id === 'folder-characters' || raw.id === 'folder-vigilia' || raw.id === 'folder-threats' || raw.system === true;
  let defName = 'Nova Pasta';
  if (raw.id === 'folder-threats') defName = 'Ameaças';
  else if (raw.id === 'folder-vigilia') defName = 'Personagens Vigília';
  else if (raw.id === 'folder-characters') defName = 'Personagens';
  return {
    id: String(raw.id || makeFolderId()),
    name: String(raw.name || (isSys ? defName : 'Nova Pasta')).trim(),
    kind: ['characters', 'threats', 'custom'].includes(raw.kind) ? raw.kind : (isSys ? (raw.id === 'folder-threats' ? 'threats' : 'characters') : 'custom'),
    parentId: raw.parentId ? String(raw.parentId) : null,
    color: String(raw.color || (raw.id === 'folder-threats' ? '#993ce8' : (raw.id === 'folder-vigilia' ? '#34d399' : (raw.id === 'folder-characters' ? '#e0150d' : '#3187ff')))),
    icon: String(raw.icon || (raw.id === 'folder-threats' ? 'skull' : (raw.id === 'folder-vigilia' ? 'shield' : (raw.id === 'folder-characters' ? 'user' : 'folder')))),
    collapsed: Boolean(raw.collapsed),
    order: typeof raw.order === 'number' ? raw.order : index,
    system: isSys
  };
}

/**
 * Garante que a lista de pastas contenha as pastas padrão de sistema
 * e estejam ordenadas e normalizadas.
 */
export function normalizeFolders(rawList = []) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return clone(DEFAULT_FOLDERS);
  }

  const existingMap = new Map();
  rawList.forEach((item, idx) => {
    if (item && item.id) {
      existingMap.set(String(item.id), normalizeFolder(item, idx));
    }
  });

  // Garante a existência das pastas padrão do sistema
  if (!existingMap.has('folder-characters')) {
    existingMap.set('folder-characters', clone(DEFAULT_FOLDERS[0]));
  }
  if (!existingMap.has('folder-vigilia')) {
    existingMap.set('folder-vigilia', clone(DEFAULT_FOLDERS[1]));
  }
  if (!existingMap.has('folder-threats')) {
    existingMap.set('folder-threats', clone(DEFAULT_FOLDERS[2]));
  }

  const normalized = Array.from(existingMap.values());
  normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return normalized;
}

/**
 * Migra fichas existentes para que todas possuam `folderId` válido e `favorite`.
 * Fichas do sistema 'threat' vão para 'folder-threats', as demais para 'folder-characters'.
 */
export function migrateSheetsFolders(sheetsList = []) {
  if (!Array.isArray(sheetsList)) return [];

  return sheetsList.map(sheet => {
    if (!sheet) return sheet;
    const isThreat = sheet.systemMode === 'threat';
    const fallbackFolder = isThreat ? 'folder-threats' : 'folder-characters';

    if (!sheet.folderId) {
      sheet.folderId = fallbackFolder;
    }
    if (sheet.favorite === undefined) {
      sheet.favorite = false;
    }
    return sheet;
  });
}

/**
 * Cria uma nova pasta personalizada.
 */
export function createFolder(folders = [], { name = 'Nova Pasta', parentId = null, color = '#3187ff', icon = 'folder' } = {}) {
  const list = normalizeFolders(folders);
  const maxOrder = list.reduce((acc, f) => Math.max(acc, f.order || 0), 0);
  const newFolder = normalizeFolder({
    id: makeFolderId(),
    name,
    kind: 'custom',
    parentId: parentId || null,
    color,
    icon,
    collapsed: false,
    order: maxOrder + 1,
    system: false
  });
  list.push(newFolder);
  return { folders: list, folder: newFolder };
}

/**
 * Atualiza propriedades de uma pasta existente.
 */
export function updateFolder(folders = [], id, patch = {}) {
  const list = normalizeFolders(folders);
  const target = list.find(f => f.id === id);
  if (!target) return list;

  // Pastas de sistema não podem ter 'system' ou 'kind' alterados
  if (target.system) {
    delete patch.system;
    delete patch.kind;
    delete patch.parentId; // Mantêm-se como raiz
  }

  Object.assign(target, patch);
  return list;
}

/**
 * Exclui uma pasta personalizada.
 * Se a pasta contiver subpastas ou fichas, elas são reatribuídas para a pasta pai (ou pasta de sistema padrão).
 */
export function deleteFolder(folders = [], sheets = [], id) {
  let fList = normalizeFolders(folders);
  let sList = Array.isArray(sheets) ? sheets : [];

  const target = fList.find(f => f.id === id);
  if (!target || target.system) {
    return { folders: fList, sheets: sList, deleted: false };
  }

  const targetParentId = target.parentId || null;

  // Reatribui subpastas
  fList = fList.filter(f => f.id !== id).map(f => {
    if (f.parentId === id) {
      return { ...f, parentId: targetParentId };
    }
    return f;
  });

  // Reatribui fichas pertencentes à pasta excluída
  sList = sList.map(s => {
    if (s.folderId === id) {
      const fallback = s.systemMode === 'threat' ? 'folder-threats' : 'folder-characters';
      return { ...s, folderId: targetParentId || fallback };
    }
    return s;
  });

  return { folders: fList, sheets: sList, deleted: true };
}

/**
 * Reordena ou move uma pasta para dentro de outro parentId.
 */
export function moveFolder(folders = [], id, targetParentId = null, targetOrder = null) {
  const list = normalizeFolders(folders);
  const target = list.find(f => f.id === id);
  if (!target || target.system) return list;

  // Evita aninhar pasta dentro dela mesma ou de seus descendentes
  if (targetParentId === id || isDescendantOf(list, targetParentId, id)) {
    return list;
  }

  target.parentId = targetParentId;
  if (typeof targetOrder === 'number') {
    target.order = targetOrder;
  }
  return list;
}

function isDescendantOf(folders, childId, potentialAncestorId) {
  if (!childId) return false;
  let curr = folders.find(f => f.id === childId);
  while (curr && curr.parentId) {
    if (curr.parentId === potentialAncestorId) return true;
    curr = folders.find(f => f.id === curr.parentId);
  }
  return false;
}

/**
 * Carrega pastas do armazenamento (API local dev -> IndexedDB -> localStorage -> Padrão).
 */
export async function loadFoldersFromStorage({ idbGet } = {}) {
  let loaded = null;

  // 1. Tenta API local do servidor (/api/folders)
  try {
    const res = await fetch('./api/folders', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        loaded = data;
      }
    }
  } catch {}

  // 2. Fallback: IndexedDB
  if (!loaded && typeof idbGet === 'function') {
    try {
      const idbData = await idbGet('folders');
      if (Array.isArray(idbData) && idbData.length > 0) {
        loaded = idbData;
      }
    } catch {}
  }

  // 3. Fallback: localStorage
  if (!loaded && typeof localStorage !== 'undefined') {
    try {
      const localData = JSON.parse(localStorage.getItem(FOLDERS_STORAGE_KEY) || '[]');
      if (Array.isArray(localData) && localData.length > 0) {
        loaded = localData;
      }
    } catch {}
  }

  return normalizeFolders(loaded || DEFAULT_FOLDERS);
}

/**
 * Persiste pastas nas camadas de armazenamento disponíveis.
 */
export async function persistFoldersToStorage(folders = [], { idbSet } = {}) {
  const list = normalizeFolders(folders);

  // 1. Envia para a API local em dev
  try {
    fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    }).catch(() => {});
  } catch {}

  // 2. Grava no IndexedDB
  if (typeof idbSet === 'function') {
    try {
      idbSet('folders', list);
    } catch {}
  }

  // 3. Grava no localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  return list;
}

