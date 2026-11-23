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

// ---------------------------------------------------------------------------------------------------------------------
// Armazenamento da sala (mesa online, modo jogador). As fichas moram na sala; a casca da Mesa faz a ponte, atendendo os
// pedidos `sala.fichas` e `sala.salvar-ficha` no canal local `sala:<id>:mesa:eventos` e emitindo `sala.ficha-atualizada`
// (com o `autor` que a sala carimbou) quando uma ficha muda. Ver Atlas/docs/plano/mesa-online.md (R11).
// ---------------------------------------------------------------------------------------------------------------------

export const ESPERA_SALVAR_MS = 800;
/** A casca pode demorar até a sala entregar o `bem-vindo`; o pedido de carga espera mais que o padrão do barramento. */
export const PRAZO_CARGA_MS = 20000;
export const chaveDaAtivaNaSala = salaId => `dossie:sala:${salaId}:ficha-ativa`;

/**
 * `barramento` já está no canal da sala. `salaId` só serve para guardar a ficha ativa no localStorage (chave própria da sala).
 * `aoMudarFora(f)` chama `f({ ficha, rev, conflito, autor, propria })`; `propria` é verdade quando o `autor` é o próprio jogador
 * (o eco da gravação dele), e então o app não precisa redesenhar nada.
 */
export function armazenamentoSala({ barramento, salaId = null, localStorage: ls = null, agendar = (f, ms) => setTimeout(f, ms), cancelar = t => clearTimeout(t), prazoCargaMs = PRAZO_CARGA_MS, espera = ESPERA_SALVAR_MS } = {}) {
  const storage = () => { try { return ls || globalThis.localStorage || null; } catch { return null; } };
  const enviadas = new Map();   // id → JSON da última versão que a sala já tem (carregada, gravada ou recebida)
  const revs = new Map();       // id → rev mais recente que conhecemos
  const pendentes = new Map();  // id → { ficha, timer }
  let eu = null;

  function enviar(ficha) {
    const json = JSON.stringify(ficha);
    enviadas.set(ficha.id, json);
    const rev = revs.get(ficha.id) ?? 0;
    const tentar = (restantes) => {
      barramento.pedir('sala.salvar-ficha', { ficha, rev }).then(r => {
        if (r.ok) { if (Number.isFinite(r.resposta?.rev)) revs.set(ficha.id, r.resposta.rev); return; }
        // Sem resposta da casca (ou recusa): esquece que foi enviada, para a próxima gravação tentar de novo.
        if (restantes > 0 && enviadas.get(ficha.id) === json) { agendar(() => tentar(restantes - 1), 2000); return; }
        if (enviadas.get(ficha.id) === json) enviadas.delete(ficha.id);
      }, () => { if (enviadas.get(ficha.id) === json) enviadas.delete(ficha.id); });
    };
    tentar(1);
  }
  function descarregar(id) {
    const p = pendentes.get(id);
    if (!p) return;
    cancelar(p.timer);
    pendentes.delete(id);
    enviar(p.ficha);
  }

  return {
    async carregar() {
      const r = await barramento.pedir('sala.fichas', {}, { prazoMs: prazoCargaMs });
      if (!r.ok) { console.warn('Dossiê: a sala não respondeu ao pedido de fichas', r.motivo); return { fichas: [], ativaId: null }; }
      const d = r.resposta ?? {};
      const fichas = Array.isArray(d.fichas) ? d.fichas.filter(f => f && typeof f === 'object' && typeof f.id === 'string') : [];
      for (const f of fichas) enviadas.set(f.id, JSON.stringify(f));
      for (const [id, rev] of Object.entries(d.revs ?? {})) if (Number.isFinite(rev)) revs.set(id, rev);
      if (d.eu && typeof d.eu.discordId === 'string') eu = d.eu;
      let ativaId = typeof d.ativaId === 'string' ? d.ativaId : null;
      if (!ativaId && salaId) { try { ativaId = storage()?.getItem(chaveDaAtivaNaSala(salaId)) || null; } catch {} }
      return { fichas, ativaId };
    },

    // Só as fichas que mudaram desde a última versão que a sala tem; cada uma com o seu debounce. `forcar` (a página vai fechar) grava já.
    salvar(fichas, { forcar = false } = {}) {
      for (const ficha of fichas) {
        if (!ficha || typeof ficha.id !== 'string') continue;
        const json = JSON.stringify(ficha);
        const p = pendentes.get(ficha.id);
        if (p) { cancelar(p.timer); pendentes.delete(ficha.id); }
        else if (enviadas.get(ficha.id) === json) continue;
        pendentes.set(ficha.id, { ficha, timer: agendar(() => descarregar(ficha.id), espera) });
      }
      if (forcar) for (const id of [...pendentes.keys()]) descarregar(id);
    },

    salvarAtiva(id) {
      if (!salaId) return;
      try { storage()?.setItem(chaveDaAtivaNaSala(salaId), String(id)); } catch {}
    },

    aoMudarFora(f) {
      return barramento.ouvir('sala.ficha-atualizada', evento => {
        const { ficha, rev, conflito } = evento.dados ?? {};
        if (!ficha || typeof ficha.id !== 'string') return;
        if (Number.isFinite(rev)) revs.set(ficha.id, rev);
        const autor = evento.autor ?? null;
        const propria = !!autor && !!eu && autor.discordId === eu.discordId;
        if (!propria) enviadas.set(ficha.id, JSON.stringify(ficha));
        f({ ficha, rev, conflito: conflito === true, autor, propria });
      });
    },

    /** Para o app saber de quem é o aviso. */
    eu: () => eu,
    /** Grava o que estiver esperando o debounce (ao sair da página). */
    descarregarTudo() { for (const id of [...pendentes.keys()]) descarregar(id); }
  };
}
