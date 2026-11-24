import test from 'node:test';
import assert from 'node:assert/strict';
import { armazenamentoCombinado, armazenamentoSala, fichaParaSala, PASTA_SALA } from '../src/armazenamento.js';
import { criarBarramentoDoMestre, criarBarramentoDaSala } from '../src/mesa.js';
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
function relogio() {
  let agora = 0, id = 0; const fila = new Map();
  return {
    agendar: (f, ms) => { const i = ++id; fila.set(i, { f, em: agora + ms }); return i; },
    cancelar: i => { fila.delete(i); },
    avancar(ms) { agora += ms; for (const [i, t] of [...fila]) if (t.em <= agora) { fila.delete(i); t.f(); } },
  };
}
const eu = { discordId: '1', nome: 'Mestre' };
const autor = (discordId, nome, papel) => ({ discordId, nome, papel, fichas: [] });
const local1 = { id: 'l1', name: 'LOCAL', folderId: 'folder-characters' };
const salaA = { id: 's1', name: 'ANA', pv: 5, folderId: PASTA_SALA };

/**
 * O Dossiê do mestre (app 'ficha') e a Mesa (app 'mesa') no mesmo `mesa:eventos`. `conectada: false` faz a Mesa recusar (sem sala).
 * O armazenamento local é um espião: guarda o que foi salvo.
 */
function cenario({ fichas = [salaA], donos = { s1: '2' }, conectada = true, locais = [local1] } = {}) {
  const r = rede(), rel = relogio();
  const mesa = criarBarramento({ app: 'mesa', criarCanal: () => r.abrir('mesa:eventos') });
  const dossie = criarBarramentoDoMestre({ criarCanal: () => r.abrir('mesa:eventos') });
  const pedidos = { salvar: [], entregar: [], fichas: 0 };
  const estado = { conectada, fichas, donos };
  mesa.atender('sala.fichas', () => {
    pedidos.fichas++;
    return estado.conectada ? { ok: true, nome: 'A Ilha', eu, fichas: estado.fichas, revs: { s1: 2 }, donos: estado.donos, membros: [{ discordId: '1', nome: 'Mestre', papel: 'mestre' }, { discordId: '2', nome: 'Ana', papel: 'jogador' }], nomes: { 2: 'Ana' } } : { ok: false, motivo: 'A sala não está conectada.' };
  });
  mesa.atender('sala.salvar-ficha', d => { pedidos.salvar.push(d); return { ok: true, rev: (d.rev ?? 0) + 1 }; });
  mesa.atender('sala.entregar-ficha', d => { pedidos.entregar.push(d); return { ok: true }; });
  const gravadas = [];
  const local = { idbGet: () => null, idbSet: () => false, async carregar() { return { fichas: locais, ativaId: null }; }, salvar(f, o) { gravadas.push({ f: f.map(x => x.id), o }); }, salvarAtiva() {}, aoMudarFora: () => () => {} };
  const arm = armazenamentoCombinado({ local, barramento: dossie, prazoEntregaMs: 20, agendar: rel.agendar, cancelar: rel.cancelar });
  const canalDaMesa = r.abrir('mesa:eventos');
  const fato = (tipo, dados, a) => canalDaMesa.postMessage({ contrato: CONTRATO, app: 'mesa', tipo, id: `e${Math.random()}`, em: Date.now(), campanhaId: null, dados, ...(a ? { autor: a } : {}) });
  return { arm, rel, mesa, dossie, pedidos, estado, gravadas, fato };
}
const esperar = () => new Promise(r => setTimeout(r, 5));

test('carregar devolve só as locais, sem esperar a sala; conectar traz as da sala, o nome, os donos e quem sou eu', async () => {
  const c = cenario();
  assert.deepEqual((await c.arm.carregar()).fichas, [local1]);
  assert.equal(c.pedidos.fichas, 0, 'a carga local não pergunta nada à Mesa');
  assert.equal(c.arm.conectada(), false);
  const info = await c.arm.conectar();
  assert.deepEqual(info.fichas, [salaA]);
  assert.equal(info.nome, 'A Ilha');
  assert.deepEqual(info.donos, { s1: '2' });
  assert.deepEqual(info.eu, eu);
  assert.equal(info.nomes['2'], 'Ana');
  assert.equal(c.arm.ehDaSala('s1'), true);
  assert.equal(c.arm.ehDaSala('l1'), false);
});

test('sem a Mesa online conectada, conectar devolve null e nada é da sala', async () => {
  const c = cenario({ conectada: false });
  assert.equal(await c.arm.conectar(), null);
  assert.equal(c.arm.conectada(), false);
  assert.equal(c.arm.ehDaSala('s1'), false);
  const sozinho = armazenamentoCombinado({ local: { idbGet() {}, idbSet() {}, carregar: async () => ({ fichas: [], ativaId: null }), salvar() {}, salvarAtiva() {} }, barramento: criarBarramentoDoMestre({ criarCanal: () => rede().abrir('x') }), prazoCargaMs: 5 });
  assert.equal(await sozinho.conectar(), null, 'ninguém responde: não há Mesa aberta');
});

test('salvar separa pelo id: a ficha da sala grava só na sala (com debounce), a local só no local', async () => {
  const c = cenario();
  await c.arm.conectar();
  const editada = { ...salaA, pv: 1 };
  c.arm.salvar([local1, editada], { forcar: false });
  assert.deepEqual(c.gravadas, [{ f: ['l1'], o: { forcar: false } }], 'a da sala não vai ao local');
  assert.equal(c.pedidos.salvar.length, 0, 'a da sala espera o debounce');
  c.rel.avancar(800);
  await esperar();
  assert.equal(c.pedidos.salvar.length, 1);
  assert.equal(c.pedidos.salvar[0].ficha.pv, 1);
  assert.equal(c.pedidos.salvar[0].ficha.folderId, undefined, 'a pasta virtual não vai para a sala');
  assert.equal(c.pedidos.salvar[0].rev, 2, 'com o rev que a sala deu');
});

test('o que não mudou desde a carga não é regravado na sala (registrar marca a versão que a sala tem)', async () => {
  const c = cenario();
  const info = await c.arm.conectar();
  for (const f of info.fichas) c.arm.registrar({ ...f, extraDoApp: 1 });   // o app normaliza e registra
  c.arm.salvar([local1, { ...salaA, extraDoApp: 1 }]);
  c.rel.avancar(2000); await esperar();
  assert.equal(c.pedidos.salvar.length, 0);
});

test('entregar: grava na sala com o mesmo id, passa o dono e a ficha deixa de ir ao local', async () => {
  const c = cenario({ fichas: [] });
  await c.arm.conectar();
  const r = await c.arm.entregar({ ...local1, pv: 7 }, '2');
  assert.deepEqual(r, { ok: true });
  assert.equal(c.pedidos.salvar.length, 1);
  assert.equal(c.pedidos.salvar[0].ficha.id, 'l1');
  assert.deepEqual(c.pedidos.entregar, [{ fichaId: 'l1', dono: '2' }]);
  assert.equal(c.arm.ehDaSala('l1'), true);
  c.arm.salvar([{ ...local1, pv: 7 }]);
  assert.deepEqual(c.gravadas.at(-1), { f: [], o: {} }, 'a local passa a ser a da sala: sai do armazenamento local');
  c.rel.avancar(2000); await esperar();
  assert.equal(c.pedidos.salvar.length, 1, 'e não é regravada na sala por estar igual');
});

test('entregar sem a Mesa respondendo: não muda nada', async () => {
  const c = cenario();
  c.mesa.fechar();
  const r = await c.arm.entregar(local1, '2');
  assert.equal(r.ok, false);
  assert.equal(c.arm.ehDaSala('l1'), false);
});

test('desconectar solta as fichas da sala; aoConexao avisa quando a Mesa conecta ou cai', async () => {
  const c = cenario();
  const vistas = [];
  c.arm.aoConexao(v => vistas.push(v));
  await c.arm.conectar();
  c.fato('sala.conexao', { conectada: false });
  c.fato('sala.conexao', { conectada: true, nome: 'A Ilha' });
  assert.deepEqual(vistas, [{ conectada: false, nome: null }, { conectada: true, nome: 'A Ilha' }]);
  assert.deepEqual(c.arm.desconectar(), ['s1']);
  assert.equal(c.arm.ehDaSala('s1'), false);
  assert.equal(c.arm.conectada(), false);
});

test('aoMudarFora traz o autor carimbado pela sala, o dono e se foi o eco do próprio mestre', async () => {
  const c = cenario();
  await c.arm.conectar();
  const vistas = [];
  c.arm.aoMudarFora(v => vistas.push(v));
  c.fato('sala.ficha-atualizada', { ficha: { id: 's1', pv: 2 }, rev: 3, dono: '2' }, autor('2', 'Ana', 'jogador'));
  c.fato('sala.ficha-atualizada', { ficha: { id: 's1', pv: 9 }, rev: 4, dono: '2' }, autor('1', 'Mestre', 'mestre'));
  assert.equal(vistas.length, 2);
  assert.equal(vistas[0].propria, false);
  assert.equal(vistas[0].autor.nome, 'Ana');
  assert.equal(vistas[0].dono, '2');
  assert.equal(vistas[1].propria, true, 'o eco da gravação do mestre');
});

test('atualizarMembros relê quem está na sala sem trocar as fichas', async () => {
  const c = cenario();
  await c.arm.conectar();
  c.estado.donos = { s1: '2', s2: '3' };
  await c.arm.atualizarMembros();
  assert.deepEqual(c.arm.info().donos, { s1: '2', s2: '3' });
  assert.equal(c.arm.ehDaSala('s1'), true);
});

test('fichaParaSala tira só a pasta virtual', () => {
  assert.deepEqual(fichaParaSala({ id: 'a', folderId: PASTA_SALA, x: 1 }), { id: 'a', x: 1 });
  assert.deepEqual(fichaParaSala({ id: 'a', folderId: 'folder-characters' }), { id: 'a', folderId: 'folder-characters' });
});

test('modo jogador: aoRemovida esquece a ficha e avisa o app (R13, item 4)', async () => {
  const r = rede(), rel = relogio();
  const casca = criarBarramento({ app: 'mesa', criarCanal: () => r.abrir('sala:s:mesa:eventos') });
  const dossie = criarBarramentoDaSala('s', { criarCanal: () => r.abrir('sala:s:mesa:eventos') });
  casca.atender('sala.fichas', () => ({ ok: true, fichas: [{ id: 'a' }, { id: 'b' }], revs: { a: 1, b: 1 }, eu: { discordId: '2', nome: 'Ana' } }));
  const salvas = [];
  casca.atender('sala.salvar-ficha', d => { salvas.push(d.ficha.id); return { ok: true, rev: 2 }; });
  const arm = armazenamentoSala({ barramento: dossie, salaId: 's', agendar: rel.agendar, cancelar: rel.cancelar });
  await arm.carregar();
  const tiradas = [];
  arm.aoRemovida(id => tiradas.push(id));
  arm.salvar([{ id: 'a', pv: 1 }]);       // pendente (debounce)
  const canal = r.abrir('sala:s:mesa:eventos');
  canal.postMessage({ contrato: CONTRATO, app: 'mesa', tipo: 'sala.ficha-removida', id: 'x1', em: 1, campanhaId: null, dados: { id: 'a' } });
  assert.deepEqual(tiradas, ['a']);
  rel.avancar(2000); await esperar();
  assert.deepEqual(salvas, [], 'a gravação que esperava o debounce foi cancelada');
});
