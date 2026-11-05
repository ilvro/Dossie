import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from '../../Atlas/node_modules/fake-indexeddb/build/esm/index.js';
import { iniciarMesa, recursosDaFicha, ehPersonagem, ehAmeaca, ehPublicavel, tipoDaEntidade, refDaFicha } from '../src/mesa.js';
import { abrirRepositorioCampanha } from '../vendor/mesa-core/index.js';

test('PV e PD por modo; ameaça só tem PV (PD zero)', () => {
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'ordem2', pv: 8, maxPv: 10, pd: 3, maxPd: 6 }), { pv: 8, pvMax: 10, pd: 3, pdMax: 6 });
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'original', pv: 5, maxPv: 9, san: 7, maxSan: 12 }), { pv: 5, pvMax: 9, pd: 7, pdMax: 12 });
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'original', usaPD: true, pv: 5, maxPv: 9, pe: 2, maxPe: 4, san: 7, maxSan: 12 }), { pv: 5, pvMax: 9, pd: 2, pdMax: 4 });
  assert.deepEqual(recursosDaFicha({ id: 't', systemMode: 'threat', pv: 45, pvMax: 45, maxPv: 120 }), { pv: 45, pvMax: 45, pd: 0, pdMax: 0 }, 'ameaça usa pvMax; maxPv é resto do modelo de personagem');
  assert.deepEqual(recursosDaFicha({ id: 't', systemMode: 'threat', pv: 7, maxPv: 20 }), { pv: 7, pvMax: 20, pd: 0, pdMax: 0 }, 'sem pvMax, cai no maxPv');
  assert.equal(recursosDaFicha({ id: 't', systemMode: 'threat', pv: 50 }), null, 'sem vida máxima não há o que mostrar');
  assert.equal(recursosDaFicha({ systemMode: 'threat', pv: 5, pvMax: 5 }), null, 'sem id não vale');
  assert.equal(ehPersonagem({ id: 't', systemMode: 'threat' }), false);
  assert.equal(ehAmeaca({ id: 't', systemMode: 'threat' }), true); assert.equal(ehAmeaca({ id: 'a', systemMode: 'ordem2' }), false);
  assert.equal(ehPublicavel({ id: 't', systemMode: 'threat' }), true); assert.equal(ehPublicavel({ systemMode: 'ordem2' }), false);
  assert.equal(tipoDaEntidade({ id: 't', systemMode: 'threat' }), 'ameaca'); assert.equal(tipoDaEntidade({ id: 'a', systemMode: 'ordem2' }), 'personagem');
  assert.deepEqual(refDaFicha('x'), { app: 'ficha', tipo: 'ficha', id: 'x' });
});

test('sem plataforma, iniciarMesa devolve ganchos inofensivos', async () => {
  const m = await iniciarMesa({ fichas: () => [], aberta: () => null, abrir() {} }, { BroadcastChannel: undefined, indexedDB: undefined });
  m.publicarRolagem({ id: 'a' }, { titulo: 'x', total: 1 }); m.publicarRecursos({ id: 'a' }); await m.sincronizar(); m.parar();
});

/** Uma Ficha de teste: o banco da campanha é de verdade (fake-indexeddb); as fichas vêm de uma lista que o teste muda, como a Ficha muda a dela. */
async function cenario(sheets) {
  const idb = new IDBFactory(), emissor = await abrirRepositorioCampanha({ app: 'mesa', idb });
  const campanha = await emissor.criarCampanha({ nome: 'A Ilha' });
  const guardado = new Map([['mesa:campanha-ativa', campanha.id]]);
  globalThis.localStorage = { getItem: k => guardado.get(k) ?? null, setItem: (k, v) => { guardado.set(k, String(v)); }, removeItem: k => { guardado.delete(k); } };
  const eventos = [], canal = { postMessage: m => eventos.push(m), onmessage: null, close() {} };
  const mesa = await iniciarMesa({ fichas: () => sheets, aberta: () => sheets[0] ?? null, abrir() {} }, { BroadcastChannel: class {}, criarCanal: () => canal, indexedDB: idb });
  const entidades = async () => (await emissor.listarEntidades(campanha.id)).map(e => ({ nome: e.nome, tipo: e.tipo, criadaPor: e.criadaPor, ficha: e.refs.find(r => r.app === 'ficha')?.id }));
  return { mesa, emissor, campanha, eventos, guardado, entidades };
}

test('sincronizar: personagens e ameaças viram entidades separadas; renomear atualiza; apagar a ficha tira a entidade; lista vazia não apaga nada', async () => {
  const sheets = [{ id: 'p1', name: 'Muirenn', systemMode: 'ordem2', pv: 8, maxPv: 10, pd: 3, maxPd: 6 }, { id: 't1', name: 'Zumbi de Sangue', systemMode: 'threat', pv: 45, pvMax: 45 }, { id: 't2', name: 'Ariranha', systemMode: 'threat', pv: 32, pvMax: 32 }];
  const { mesa, emissor, campanha, eventos, entidades } = await cenario(sheets);
  try {
    await mesa.sincronizar();
    assert.deepEqual((await entidades()).map(e => `${e.tipo}:${e.nome}:${e.criadaPor}`).sort(), ['ameaca:Ariranha:ficha', 'ameaca:Zumbi de Sangue:ficha', 'personagem:Muirenn:ficha']);
    // Os recursos saem para as três, e a ameaça não tem PD.
    const recursos = eventos.filter(e => e.tipo === 'ficha.recursos').map(e => e.dados);
    assert.deepEqual(recursos.find(d => d.ficha.id === 't1'), { ficha: { app: 'ficha', tipo: 'ficha', id: 't1' }, pv: 45, pvMax: 45, pd: 0, pdMax: 0 });
    assert.equal(recursos.find(d => d.ficha.id === 'p1').pdMax, 6);

    // Renomear (e criar uma ficha nova): a próxima sincronização acompanha, sem duplicar.
    sheets[2].name = 'Ariranha Gigante'; sheets.push({ id: 't3', name: 'Cavalo', systemMode: 'threat', pv: 12, pvMax: 12 });
    await mesa.sincronizar();
    assert.deepEqual((await entidades()).map(e => e.nome).sort(), ['Ariranha Gigante', 'Cavalo', 'Muirenn', 'Zumbi de Sangue']);

    // Apagar uma ficha na Ficha: a entidade dela sai da campanha. As outras ficam.
    sheets.splice(1, 1);
    await mesa.sincronizar();
    assert.deepEqual((await entidades()).map(e => e.nome).sort(), ['Ariranha Gigante', 'Cavalo', 'Muirenn']);

    // Uma entidade de outro aplicativo nunca é apagada, e uma lista de fichas vazia (a Ficha ainda carregando) não apaga nada.
    const alheia = await emissor.criarEntidade({ campanhaId: campanha.id, tipo: 'ameaca', nome: 'Do Tabletop', refs: [{ app: 'tabletop', tipo: 'figura', id: 'x' }] });
    sheets.length = 0;
    await mesa.sincronizar();
    assert.equal((await entidades()).length, 4, 'nada foi apagado');
    sheets.push({ id: 'p1', name: 'Muirenn', systemMode: 'ordem2', pv: 8, maxPv: 10, pd: 3, maxPd: 6 });
    await mesa.sincronizar();
    assert.ok((await entidades()).some(e => e.nome === 'Do Tabletop'), `a entidade ${alheia.id} de outro aplicativo ficou`);
    assert.ok(!(await entidades()).some(e => e.nome === 'Cavalo'), 'as que a Ficha criou e já não existem saíram');
  } finally { mesa.parar(); }
});

test('sincronizar: as assinaturas ficam guardadas por campanha (a Ficha não relê todos os retratos a cada abertura)', async () => {
  const sheets = [{ id: 't1', name: 'Zumbi', systemMode: 'threat', pv: 5, pvMax: 5, tokenImage: '' }, { id: 'p1', name: 'Muirenn', systemMode: 'ordem2', pv: 1, maxPv: 2, pd: 1, maxPd: 2 }];
  const { mesa, campanha, guardado } = await cenario(sheets);
  try {
    await mesa.sincronizar();
    const salvo = JSON.parse(guardado.get(`mesa:ficha-assinaturas:${campanha.id}`));
    assert.deepEqual(Object.keys(salvo).sort(), ['p1', 't1']); assert.equal(salvo.t1, 'Zumbi|');
  } finally { mesa.parar(); }
});
