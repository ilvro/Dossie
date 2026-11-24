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
export function armazenamentoSala({ barramento, salaId = null, localStorage: ls = null, agendar = (f, ms) => setTimeout(f, ms), cancelar = t => clearTimeout(t), prazoCargaMs = PRAZO_CARGA_MS, espera = ESPERA_SALVAR_MS, silencioso = false } = {}) {
  const storage = () => { try { return ls || globalThis.localStorage || null; } catch { return null; } };
  const enviadas = new Map();   // id → JSON da última versão que a sala já tem (carregada, gravada ou recebida)
  const revs = new Map();       // id → rev mais recente que conhecemos
  const pendentes = new Map();  // id → { ficha, timer }
  let eu = null;
  let carga = null;             // a última resposta ok de `sala.fichas` (o mestre lê nome, donos, membros…); `null` se a última falhou

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
      if (!r.ok) { carga = null; if (!silencioso) console.warn('Dossiê: a sala não respondeu ao pedido de fichas', r.motivo); return { fichas: [], ativaId: null }; }
      const d = r.resposta ?? {};
      carga = d;
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
        // Ficha que a sala ainda não tem (sem versão enviada nem `rev` conhecido): grava na hora, para a primeira rolagem não ser recusada.
        if (!p && !enviadas.has(ficha.id) && !revs.has(ficha.id)) { enviar(ficha); continue; }
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
        const { ficha, rev, conflito, dono } = evento.dados ?? {};
        if (!ficha || typeof ficha.id !== 'string') return;
        if (Number.isFinite(rev)) revs.set(ficha.id, rev);
        const autor = evento.autor ?? null;
        const propria = !!autor && !!eu && autor.discordId === eu.discordId;
        if (!propria) enviadas.set(ficha.id, JSON.stringify(ficha));
        f({ ficha, rev, conflito: conflito === true, autor, propria, dono: typeof dono === 'string' ? dono : null });
      });
    },

    /** A sala tirou uma ficha deste jogador (foi entregue a outro): `f(id)`. Esquece a ficha aqui para não regravá-la. */
    aoRemovida(f) {
      return barramento.ouvir('sala.ficha-removida', evento => {
        const id = evento.dados?.id;
        if (typeof id !== 'string') return;
        const p = pendentes.get(id);
        if (p) { cancelar(p.timer); pendentes.delete(id); }
        enviadas.delete(id); revs.delete(id);
        f(id);
      });
    },

    /** A última resposta de `sala.fichas` (com o que mais a casca mandou), ou `null` se a sala não respondeu. */
    carga: () => carga,
    /** Esta ficha já está na sala com este conteúdo (acabou de ser entregue): a próxima gravação só vale se mudar. */
    marcarEnviada(ficha) { enviadas.set(ficha.id, JSON.stringify(ficha)); },
    /** Para o app saber de quem é o aviso. */
    eu: () => eu,
    /** Grava o que estiver esperando o debounce (ao sair da página). */
    descarregarTudo() { for (const id of [...pendentes.keys()]) descarregar(id); }
  };
}


// ---------------------------------------------------------------------------------------------------------------------
// Armazenamento do mestre (R13): as fichas locais de sempre + as da sala, quando a Mesa online do mestre está conectada.
// A Mesa atende `sala.fichas`, `sala.salvar-ficha` e `sala.entregar-ficha` no `mesa:eventos` e avisa com `sala.conexao` quando a sala
// abre ou cai. A carga local não espera a sala: `carregar()` devolve só as locais, e `conectar()` (chamada de novo a cada `sala.conexao`)
// traz as da sala. `salvar` separa pelo id: uma ficha da sala grava só na sala; as outras, só no local.
// ---------------------------------------------------------------------------------------------------------------------

/** A pasta virtual das fichas da sala (não é gravada nas pastas do Dossiê). */
export const PASTA_SALA = 'folder-sala';
/** Quanto o mestre espera a Mesa responder: se não há Mesa online aberta, ninguém responde. */
export const PRAZO_CONEXAO_MS = 1500;

/** A ficha como a sala a guarda: sem a pasta virtual (que só existe no Dossiê do mestre). */
export function fichaParaSala(ficha) {
  if (!ficha || ficha.folderId !== PASTA_SALA) return ficha;
  const { folderId, ...resto } = ficha;
  return resto;
}

export function armazenamentoCombinado({ local, barramento, prazoEntregaMs = 5000, ...opcoes } = {}) {
  const sala = armazenamentoSala({ barramento, silencioso: true, prazoCargaMs: PRAZO_CONEXAO_MS, ...opcoes });
  const daSala = new Set();
  let info = null;

  return {
    idbGet: local.idbGet,
    idbSet: local.idbSet,
    carregar: () => local.carregar(),

    /** Pergunta à Mesa pelas fichas da sala. `null` se a sala não está conectada (ou não há Mesa online aberta). */
    async conectar() {
      const { fichas } = await sala.carregar();
      const c = sala.carga();
      daSala.clear();
      if (!c) { info = null; return null; }
      for (const f of fichas) daSala.add(f.id);
      info = {
        nome: typeof c.nome === 'string' && c.nome ? c.nome : 'Sala',
        eu: c.eu ?? null,
        donos: c.donos && typeof c.donos === 'object' ? c.donos : {},
        membros: Array.isArray(c.membros) ? c.membros : [],
        nomes: c.nomes && typeof c.nomes === 'object' ? c.nomes : {},
      };
      return { ...info, fichas };
    },
    /** Pede de novo a lista de quem está na sala (o menu "Entregar" a lê). Sem resposta, fica a que já havia. */
    async atualizarMembros() {
      if (!info) return;
      const r = await barramento.pedir('sala.fichas', {}, { prazoMs: PRAZO_CONEXAO_MS });
      const c = r.ok ? r.resposta : null;
      if (!c) return;
      if (Array.isArray(c.membros)) info.membros = c.membros;
      if (c.nomes && typeof c.nomes === 'object') info.nomes = { ...info.nomes, ...c.nomes };
      if (c.donos && typeof c.donos === 'object') info.donos = { ...info.donos, ...c.donos };
    },
    /** A sala caiu: as fichas dela voltam a não ser de ninguém aqui. Devolve os ids que eram dela. */
    desconectar() { const ids = [...daSala]; daSala.clear(); info = null; return ids; },
    conectada: () => info !== null,
    info: () => info,
    ehDaSala: id => daSala.has(id),
    /**
     * A ficha (já normalizada pelo app) é da sala daqui para a frente e esta é a versão que a sala tem: só grava de novo se mudar.
     * Sem isto, a primeira gravação de qualquer ficha regravaria todas as da sala (a normalização muda o JSON).
     */
    registrar(ficha) { daSala.add(ficha.id); sala.marcarEnviada(fichaParaSala(ficha)); },

    salvar(fichas, opcoes2 = {}) {
      const noLocal = [], naSala = [];
      for (const f of fichas) (f && daSala.has(f.id) ? naSala : noLocal).push(f);
      local.salvar(noLocal, opcoes2);
      if (naSala.length) sala.salvar(naSala.map(fichaParaSala), opcoes2);
    },
    salvarAtiva: id => local.salvarAtiva(id),

    aoMudarFora: f => sala.aoMudarFora(f),
    /** A Mesa conectou ou perdeu a sala: `f({ conectada, nome })`. */
    aoConexao(f) {
      return barramento.ouvir('sala.conexao', evento => f({ conectada: evento.dados?.conectada === true, nome: evento.dados?.nome ?? null }));
    },

    /**
     * Entrega a ficha a um jogador (`dono` é o `discordId`): grava na sala com o mesmo id e passa o dono. Depois, a ficha é da sala:
     * deixa de ser gravada no local. Devolve `{ ok }` ou `{ ok: false, motivo }`.
     */
    async entregar(ficha, dono) {
      const r1 = await barramento.pedir('sala.salvar-ficha', { ficha: fichaParaSala(ficha), rev: 0 }, { prazoMs: prazoEntregaMs });
      if (!r1.ok) return { ok: false, motivo: r1.detalhe ?? 'A Mesa online não respondeu.' };
      const r2 = await barramento.pedir('sala.entregar-ficha', { fichaId: ficha.id, dono }, { prazoMs: prazoEntregaMs });
      if (!r2.ok) return { ok: false, motivo: r2.detalhe ?? 'A Mesa online não respondeu.' };
      this.registrar(ficha);
      return { ok: true };
    },

    eu: () => sala.eu(),
    descarregarTudo: () => sala.descarregarTudo(),
  };
}
