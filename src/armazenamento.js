// Onde as fichas moram. O app.js só conversa com a interface abaixo:
//
//   carregar(): Promise<{ fichas, ativaId }>   fichas brutas (sem normalizar; [] se não há nada salvo)
//   salvar(fichas, { forcar })                 grava a lista inteira de fichas
//   salvarAtiva(id)                            grava o id da ficha aberta
//   aoMudarFora(f)                             registra f para mudanças vindas de fora; devolve a função que desfaz
//
// `armazenamentoLocal()` é a implementação de sempre: API local do Vite (só em dev),
// IndexedDB e localStorage, com a mesma ordem de fallback e os mesmos limites.

export const DB_NAME = 'ordem-ii-db';
export const DB_STORE = 'sheets-store';
export const SHEETS_KEY = 'ordem-ii-sheets-v1';
export const ACTIVE_KEY = 'ordem-ii-active-sheet';
export const LIMITE_LOCALSTORAGE = 4500000;
const LIMITE_IMAGEM = 20000;

function abrirDb(idb) {
  return new Promise(resolve => {
    if (!idb) return resolve(null);
    const req = idb.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

// Pequeno cliente do IndexedDB (chave/valor). O app.js também o usa para as pastas.
export function criarIdb(getIndexedDB = () => globalThis.indexedDB) {
  async function idbGet(key) {
    try {
      const db = await abrirDb(getIndexedDB());
      if (!db) return null;
      return new Promise(resolve => {
        const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    } catch { return null; }
  }
  async function idbSet(key, value) {
    try {
      const db = await abrirDb(getIndexedDB());
      if (!db) return false;
      return new Promise(resolve => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch { return false; }
  }
  return { idbGet, idbSet };
}

export function armazenamentoLocal(deps = {}) {
  const ls = () => deps.localStorage || globalThis.localStorage;
  const buscar = (...a) => (deps.fetch || globalThis.fetch)(...a);
  const { idbGet, idbSet } = criarIdb(() => deps.indexedDB || globalThis.indexedDB);

  return {
    idbGet,
    idbSet,

    async carregar() {
      let fichas = null;
      // Servidor local (só funciona no dev / self-hosted)
      try {
        const res = await buscar('./api/sheets', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) fichas = data;
        }
      } catch {}
      // Fallback: IndexedDB
      if (!fichas || !fichas.length) {
        try {
          const idb = await idbGet('sheets');
          if (Array.isArray(idb) && idb.length > 0) fichas = idb;
        } catch {}
      }
      // Fallback: localStorage
      if (!fichas || !fichas.length) {
        try {
          const local = JSON.parse(ls().getItem(SHEETS_KEY) || '[]');
          if (Array.isArray(local) && local.length > 0) fichas = local;
        } catch {}
      }
      let ativaId = null;
      try { ativaId = (await idbGet('activeSheetId')) || ls().getItem(ACTIVE_KEY); } catch {}
      return { fichas: fichas || [], ativaId };
    },

    // `forcar` existe na interface para outras implementações; a local grava igual nos dois casos.
    salvar(fichas, { forcar = false } = {}) {
      let json = '';
      try {
        json = JSON.stringify(fichas);
        buscar('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json
        }).catch(() => {});
      } catch {}
      try { idbSet('sheets', fichas); } catch {}
      try {
        if (json && json.length < LIMITE_LOCALSTORAGE) {
          ls().setItem(SHEETS_KEY, json);
        } else {
          const leve = fichas.map(s => ({
            ...s,
            tokenImage: (s.tokenImage && s.tokenImage.length > LIMITE_IMAGEM) ? '' : s.tokenImage,
            backgroundImage: (s.backgroundImage && s.backgroundImage.length > LIMITE_IMAGEM) ? '' : s.backgroundImage
          }));
          const leveJson = JSON.stringify(leve);
          if (leveJson.length < LIMITE_LOCALSTORAGE) ls().setItem(SHEETS_KEY, leveJson);
        }
      } catch {}
    },

    salvarAtiva(id) {
      try { idbSet('activeSheetId', id); } catch {}
      try { ls().setItem(ACTIVE_KEY, id); } catch {}
    },

    // Hoje nada muda as fichas por fora (o evento `storage` só é ouvido pela mesa.js, para a campanha).
    // A função existe para outras implementações (a da sala); aqui só devolve o "desfazer" e nunca chama `f`.
    aoMudarFora(f) {
      return () => {};
    }
  };
}
