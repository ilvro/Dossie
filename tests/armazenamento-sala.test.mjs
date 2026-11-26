import test from 'node:test';
import assert from 'node:assert/strict';
import { armazenamentoSala, chaveDaAtivaNaSala } from '../src/armazenamento.js';
import { iniciarMesa, criarBarramentoDaSala, canalDaSala } from '../src/mesa.js';
import { criarBarramento, CONTRATO } from '../vendor/mesa-core/index.js';

/** Um canal "BroadcastChannel" falso: quem posta não recebe, os outros do mesmo nome sim. */
function rede() {
  const canais = new Map();
  const abrir = nome => {
    const c = { nome, onmessage: null, postMessage(m) { for (const o of canais.get(nome) ?? []) if (o !== c && o.onmessage) o.onmessage({ data: structuredClone(m) }); }, close() { canais.set(nome, (canais.get(nome) ?? []).filter(x => x !== c)); } };
    canais.set(nome, [...(canais.get(nome) ?? []), c]);
    return c;
  };
  return { abrir };
}
const lsFalso = () => { const m = new Map(); return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
const esperar = () => new Promise(r => setTimeout(r, 5));
/** Relógio manual: `agendar` guarda, `avancar(ms)` dispara o que venceu. */
function relogio() {
  let agora = 0, id = 0; const fila = new Map();
  return {
    agendar: (f, ms) => { const i = ++id; fila.set(i, { f, em: agora + ms }); return i; },
    cancelar: i => { fila.delete(i); },
    avancar(ms) { agora += ms; for (const [i, t] of [...fila]) if (t.em <= agora) { fila.delete(i); t.f(); } },
    pendentes: () => fila.size
  };
}

const SALA = 'sala1';
const eu = { discordId: '2', nome: 'Ana' };
const autor = (discordId, nome, papel) => ({ discordId, nome, papel, fichas: [] });

/** O Dossiê (app 'ficha') e a "casca" (app 'mesa') no mesmo canal da sala. `salvas` recebe o que a casca viu em `sala.salvar-ficha`. */
function cenario({ fichas = [], revs = {}, ativaId } = {}) {
  const r = rede(), rel = relogio(), ls = lsFalso();
  const casca = criarBarramento({ app: 'mesa', criarCanal: () => r.abrir(canalDaSala(SALA)) });
  const dossie = criarBarramentoDaSala(SALA, { criarCanal: () => r.abrir(canalDaSala(SALA)) });
  const salvas = [];
  casca.atender('sala.fichas', () => ({ ok: true, fichas, revs, eu, ...(ativaId ? { ativaId } : {}) }));
  casca.atender('sala.salvar-ficha', d => { salvas.push(d); return { ok: true, rev: (d.rev ?? 0) + 1 }; });
  const arm = armazenamentoSala({ barramento: dossie, salaId: SALA, localStorage: ls, agendar: rel.agendar, cancelar: rel.cancelar });
  // A casca emite o fato com o `autor` já carimbado, direto no canal (o barramento não tem como pôr `autor`).
  const canalDaCasca = r.abrir(canalDaSala(SALA));
  const atualizada = (ficha, rev, a, extra = {}) => canalDaCasca.postMessage({ contrato: CONTRATO, app: 'mesa', tipo: 'sala.ficha-atualizada', id: `e${Math.random()}`, em: Date.now(), campanhaId: null, dados: { ficha, rev, ...extra }, autor: a });
  return { arm, rel, ls, salvas, atualizada, casca, dossie };
}

test('carregar pede sala.fichas à casca e devolve as fichas e a ativa guardada na sala', async () => {
  const a = { id: 'a', name: 'ANA' }, b = { id: 'b', name: 'BIA' };
  const c = cenario({ fichas: [a, b] });
  c.arm.salvarAtiva('b');
  assert.equal(c.ls.m.get(chaveDaAtivaNaSala(SALA)), 'b', 'a chave é própria da sala');
  const r = await c.arm.carregar();
  assert.deepEqual(r.fichas, [a, b]);
  assert.equal(r.ativaId, 'b');
  assert.deepEqual(c.arm.eu(), eu);
});

test('a ativa da casca vale mais que a do localStorage; sem casca respondendo, volta vazio', async () => {
  const c = cenario({ fichas: [{ id: 'a' }], ativaId: 'a' });
  c.arm.salvarAtiva('z');
  assert.equal((await c.arm.carregar()).ativaId, 'a');
  const sozinho = armazenamentoSala({ barramento: criarBarramentoDaSala(SALA, { criarCanal: () => rede().abrir('x') }), prazoCargaMs: 5 });
  const avisos = []; const antes = console.warn; console.warn = (...x) => avisos.push(x);
  try { assert.deepEqual(await sozinho.carregar(), { fichas: [], ativaId: null }); } finally { console.warn = antes; }
  assert.equal(avisos.length, 1);
});

test('salvar grava com debounce de 800 ms, só as fichas alteradas, com o rev conhecido', async () => {
  const a = { id: 'a', name: 'ANA', pv: 5 }, b = { id: 'b', name: 'BIA' };
  const c = cenario({ fichas: [a, b], revs: { a: 3, b: 7 } });
  await c.arm.carregar();
  c.arm.salvar([a, b]);
  assert.equal(c.rel.pendentes(), 0, 'nada mudou: nada agendado');
  c.arm.salvar([{ ...a, pv: 4 }, b]);
  c.rel.avancar(500);
  c.arm.salvar([{ ...a, pv: 3 }, b]);                 // outra edição da mesma ficha reinicia a espera
  c.rel.avancar(799);
  await esperar();
  assert.equal(c.salvas.length, 0, 'ainda dentro do debounce');
  c.rel.avancar(1);
  await esperar();
  assert.equal(c.salvas.length, 1, 'uma gravação só, e só da ficha alterada');
  assert.equal(c.salvas[0].ficha.pv, 3);
  assert.equal(c.salvas[0].ficha.id, 'a');
  assert.equal(c.salvas[0].rev, 3);
  c.arm.salvar([{ ...a, pv: 3 }, b]);                 // já gravada: não repete
  assert.equal(c.rel.pendentes(), 0);
});

test('uma ficha nova (que a sala não tem) é gravada; forcar grava sem esperar', async () => {
  const c = cenario({ fichas: [] });
  await c.arm.carregar();
  c.arm.salvar([{ id: 'n', name: 'NOVA' }], { forcar: true });
  await esperar();
  assert.equal(c.salvas.length, 1);
  assert.equal(c.salvas[0].ficha.id, 'n');
  assert.equal(c.rel.pendentes(), 0);
});

test('uma ficha nova vai à sala na hora (sem debounce); as edições seguintes esperam', async () => {
  const c = cenario({ fichas: [] });
  await c.arm.carregar();
  c.arm.salvar([{ id: 'n', name: 'NOVA' }]);
  await esperar();
  assert.equal(c.salvas.length, 1, 'gravou sem avançar o relógio');
  assert.equal(c.rel.pendentes(), 0);
  c.arm.salvar([{ id: 'n', name: 'NOVA', pv: 2 }]);
  await esperar();
  assert.equal(c.salvas.length, 1, 'a edição seguinte espera o debounce');
  c.rel.avancar(800); await esperar();
  assert.equal(c.salvas.length, 2);
  assert.equal(c.salvas[1].rev, 1, 'usa o rev devolvido pela primeira gravação');
});

test('o rev da resposta vale para a próxima gravação da mesma ficha', async () => {
  const c = cenario({ fichas: [{ id: 'a', v: 1 }], revs: { a: 1 } });
  await c.arm.carregar();
  c.arm.salvar([{ id: 'a', v: 2 }]); c.rel.avancar(800); await esperar();
  c.arm.salvar([{ id: 'a', v: 3 }]); c.rel.avancar(800); await esperar();
  assert.deepEqual(c.salvas.map(s => s.rev), [1, 2]);
});

test('aoMudarFora: a atualização do mestre chega com o autor; o eco do próprio jogador vem marcado', async () => {
  const c = cenario({ fichas: [{ id: 'a', pv: 5 }], revs: { a: 1 } });
  await c.arm.carregar();
  const vistas = []; const parar = c.arm.aoMudarFora(v => vistas.push(v));
  c.atualizada({ id: 'a', pv: 2 }, 2, autor('1', 'Mestre', 'mestre'));
  c.atualizada({ id: 'a', pv: 1 }, 3, autor('2', 'Ana', 'jogador'), { conflito: true });
  assert.equal(vistas.length, 2);
  assert.equal(vistas[0].propria, false);
  assert.equal(vistas[0].autor.papel, 'mestre');
  assert.equal(vistas[0].ficha.pv, 2);
  assert.equal(vistas[1].propria, true);
  assert.equal(vistas[1].conflito, true);
  // o que o mestre gravou já é o que a sala tem: salvar a mesma ficha não regrava
  c.arm.salvar([{ id: 'a', pv: 2 }]);
  assert.equal(c.rel.pendentes(), 0);
  c.arm.salvar([{ id: 'a', pv: 9 }]); c.rel.avancar(800); await esperar();
  assert.equal(c.salvas[0].rev, 3, 'o rev da última atualização');
  parar();
  c.atualizada({ id: 'a', pv: 0 }, 4, autor('1', 'Mestre', 'mestre'));
  assert.equal(vistas.length, 2, 'depois de desfazer, ninguém ouve');
});

test('iniciarMesa no modo jogador: usa o canal da sala, emite rolagem e recursos e não abre banco nenhum', async () => {
  const r = rede(), vistos = [];
  const escuta = r.abrir(canalDaSala(SALA)); escuta.onmessage = ({ data }) => vistos.push(data);
  const sheet = { id: 'a', name: 'ANA', systemMode: 'ordem2', pv: 5, maxPv: 9, pd: 2, maxPd: 4 };
  let tocouIdb = false;
  const m = await iniciarMesa({ fichas: () => [sheet], aberta: () => sheet, abrir() {} }, { sala: SALA, criarCanal: () => r.abrir(canalDaSala(SALA)), get indexedDB() { tocouIdb = true; return undefined; } });
  m.publicarRolagem(sheet, { titulo: 'Luta', total: 14, modificador: 2 });
  m.publicarRecursos(sheet);
  assert.equal(tocouIdb, false);
  assert.deepEqual(vistos.map(v => v.tipo), ['ficha.rolagem', 'ficha.recursos']);
  assert.equal(vistos[0].campanhaId, null);
  assert.equal(vistos[0].dados.total, 14);
  assert.equal(m.temCampanha(), false);
  assert.equal((await m.levarParaCampanha('a')).ok, false);
  m.parar();
});

test('o id da sala é conferido antes de virar nome de canal', () => {
  assert.throws(() => criarBarramentoDaSala('../x', { criarCanal: () => rede().abrir('x') }));
  assert.equal(canalDaSala('abc'), 'sala:abc:mesa:eventos');
});

test('salvar ignora ficha sintética marcada com _sinteticaSala', async () => {
  const c = cenario({ fichas: [] });
  await c.arm.carregar();
  c.arm.salvar([{ id: 'sint', name: 'AGENTE 1', _sinteticaSala: true }, { id: 'real', name: 'Muirenn' }], { forcar: true });
  await esperar();
  assert.deepEqual(c.salvas.map(s => s.ficha.id), ['real']);
});
