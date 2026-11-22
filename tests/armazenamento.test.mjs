import test from 'node:test';
import assert from 'node:assert/strict';
import { armazenamentoLocal, SHEETS_KEY, ACTIVE_KEY, DB_STORE } from '../src/armazenamento.js';

// IndexedDB falso mínimo: só o que o armazenamento usa (open, objectStore get/put).
function idbFalso() {
  const dados = new Map();
  const req = (fn) => { const r = {}; queueMicrotask(() => { r.result = fn(); r.onsuccess?.(); }); return r; };
  const db = {
    objectStoreNames: { contains: () => true },
    transaction() {
      const tx = {
        objectStore: () => ({
          get: k => req(() => dados.get(k)),
          put: (v, k) => { dados.set(k, structuredClone(v)); queueMicrotask(() => tx.oncomplete?.()); }
        })
      };
      return tx;
    }
  };
  return { dados, open() { const r = {}; queueMicrotask(() => { r.result = db; r.onsuccess?.(); }); return r; } };
}

function lsFalso() {
  const m = new Map();
  return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
}

const semApi = () => Promise.reject(new Error('sem api'));
const esperar = () => new Promise(r => setTimeout(r, 20));

test('vazio: carrega sem fichas', async () => {
  const a = armazenamentoLocal({ indexedDB: idbFalso(), localStorage: lsFalso(), fetch: semApi });
  assert.deepEqual(await a.carregar(), { fichas: [], ativaId: null });
});

test('salva e carrega de novo pelo IndexedDB', async () => {
  const idb = idbFalso(), ls = lsFalso();
  const a = armazenamentoLocal({ indexedDB: idb, localStorage: ls, fetch: semApi });
  const fichas = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  a.salvar(fichas, { forcar: true });
  a.salvarAtiva('b');
  await esperar();
  assert.ok(DB_STORE);
  assert.deepEqual(JSON.parse(ls.m.get(SHEETS_KEY)), fichas);
  assert.equal(ls.m.get(ACTIVE_KEY), 'b');
  const b = armazenamentoLocal({ indexedDB: idb, localStorage: lsFalso(), fetch: semApi });
  assert.deepEqual(await b.carregar(), { fichas, ativaId: 'b' });
});

test('sem IndexedDB cai para o localStorage', async () => {
  const ls = lsFalso();
  const a = armazenamentoLocal({ indexedDB: null, localStorage: ls, fetch: semApi });
  a.salvar([{ id: 'x' }]);
  a.salvarAtiva('x');
  await esperar();
  assert.deepEqual(await a.carregar(), { fichas: [{ id: 'x' }], ativaId: 'x' });
});

test('a API local tem prioridade e o POST leva a lista inteira', async () => {
  const chamadas = [];
  const fetch = async (url, opts) => {
    chamadas.push([url, opts?.method]);
    return { ok: true, json: async () => [{ id: 'api' }] };
  };
  const a = armazenamentoLocal({ indexedDB: idbFalso(), localStorage: lsFalso(), fetch });
  assert.deepEqual((await a.carregar()).fichas, [{ id: 'api' }]);
  a.salvar([{ id: 'z' }]);
  assert.deepEqual(chamadas.at(-1), ['/api/sheets', 'POST']);
});

test('acima de 4,5 MB o localStorage recebe a versão leve, sem imagens grandes', async () => {
  const ls = lsFalso();
  const a = armazenamentoLocal({ indexedDB: null, localStorage: ls, fetch: semApi });
  const grande = 'x'.repeat(4600000);
  a.salvar([{ id: 'g', tokenImage: grande, backgroundImage: grande, name: 'G' }]);
  const salvo = JSON.parse(ls.m.get(SHEETS_KEY));
  assert.equal(salvo[0].tokenImage, '');
  assert.equal(salvo[0].backgroundImage, '');
  assert.equal(salvo[0].name, 'G');
});

test('aoMudarFora devolve um desfazer e não chama o ouvinte', () => {
  const a = armazenamentoLocal({ indexedDB: null, localStorage: lsFalso(), fetch: semApi });
  let n = 0;
  const parar = a.aoMudarFora(() => n++);
  assert.equal(typeof parar, 'function');
  parar();
  assert.equal(n, 0);
});
