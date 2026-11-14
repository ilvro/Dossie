import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from '../../Atlas/node_modules/fake-indexeddb/build/esm/index.js';
import { iniciarMesa, recursosDaFicha, ehPersonagem, ehAmeaca, ehPublicavel, tipoDaEntidade, refDaFicha } from '../src/mesa.js';
import { abrirRepositorioCampanha, criarBarramento } from '../vendor/mesa-core/index.js';

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
async function cenario(sheets, ganchos = {}) {
  const idb = new IDBFactory(), emissor = await abrirRepositorioCampanha({ app: 'mesa', idb });
  const campanha = await emissor.criarCampanha({ nome: 'A Ilha' });
  const guardado = new Map([['mesa:campanha-ativa', campanha.id], ...(ganchos.semHistorico ? [] : [['mesa:ficha-conhecidas', '[]']])]);
  globalThis.localStorage = { getItem: k => guardado.get(k) ?? null, setItem: (k, v) => { guardado.set(k, String(v)); }, removeItem: k => { guardado.delete(k); } };
  const canais = new Set();
  const criarCanal = () => {
    const c = {
      onmessage: null,
      postMessage(m) {
        for (const outro of canais) {
          if (outro !== c && outro.onmessage) outro.onmessage({ data: m });
        }
      },
      close() { canais.delete(c); }
    };
    canais.add(c);
    return c;
  };
  const eventos = [];
  const canalFicha = criarCanal();
  const postOriginal = canalFicha.postMessage.bind(canalFicha);
  canalFicha.postMessage = m => {
    eventos.push(m);
    postOriginal(m);
  };
  const { semHistorico: _s, ...resto } = ganchos;
  const mesa = await iniciarMesa({ fichas: () => sheets, aberta: () => sheets[0] ?? null, abrir() {}, ...resto }, { BroadcastChannel: class {}, criarCanal: () => canalFicha, indexedDB: idb });
  const entidades = async () => (await emissor.listarEntidades(campanha.id)).map(e => ({ nome: e.nome, tipo: e.tipo, criadaPor: e.criadaPor, ficha: e.refs.find(r => r.app === 'ficha')?.id }));
  return { mesa, emissor, campanha, eventos, guardado, entidades, criarCanal };
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

test('ficha.ajustar-recursos: delta e valor absoluto para personagem (ordem2 e original) e limites [0, max]', async () => {
  const atualizadas = [];
  const sheets = [
    { id: 'p1', name: 'Muirenn', systemMode: 'ordem2', pv: 8, maxPv: 10, pd: 3, maxPd: 6 },
    { id: 'p2', name: 'Artur', systemMode: 'original', pv: 5, maxPv: 9, san: 7, maxSan: 12 },
    { id: 'p3', name: 'Kaiser', systemMode: 'original', usaPD: true, pv: 5, maxPv: 9, pe: 2, maxPe: 4, san: 7, maxSan: 12 }
  ];
  const { mesa, campanha, criarCanal } = await cenario(sheets, {
    atualizar: sheet => atualizadas.push({ ...sheet })
  });

  const cliente = criarBarramento({ app: 'atlas', campanhaId: campanha.id, criarCanal });

  try {
    // 1. Delta PV e PD normais (Ordem 2)
    const r1 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('p1'),
      deltaPv: -3,
      deltaPd: 2
    });
    assert.equal(r1.ok, true);
    assert.deepEqual(r1.resposta, { ok: true, pv: 5, pvMax: 10, pd: 5, pdMax: 6 });
    assert.equal(sheets[0].pv, 5);
    assert.equal(sheets[0].pd, 5);
    assert.equal(atualizadas.length, 1);
    assert.equal(atualizadas[0].id, 'p1');

    // 2. Limite inferior [0, max] com deltas negativos grandes
    const r2 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('p1'),
      deltaPv: -100,
      deltaPd: -100
    });
    assert.equal(r2.ok, true);
    assert.deepEqual(r2.resposta, { ok: true, pv: 0, pvMax: 10, pd: 0, pdMax: 6 });
    assert.equal(sheets[0].pv, 0);
    assert.equal(sheets[0].pd, 0);

    // 3. Valor absoluto e limite superior [0, max]
    const r3 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('p1'),
      pv: 999,
      pd: 999
    });
    assert.equal(r3.ok, true);
    assert.deepEqual(r3.resposta, { ok: true, pv: 10, pvMax: 10, pd: 6, pdMax: 6 });
    assert.equal(sheets[0].pv, 10);
    assert.equal(sheets[0].pd, 6);

    // 4. Sistema Original com Sanidade (usa san e maxSan)
    const r4 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('p2'),
      deltaPv: 2,
      deltaPd: -3
    });
    assert.equal(r4.ok, true);
    assert.deepEqual(r4.resposta, { ok: true, pv: 7, pvMax: 9, pd: 4, pdMax: 12 });
    assert.equal(sheets[1].pv, 7);
    assert.equal(sheets[1].san, 4);

    // 5. Sistema Original com PE (usaPD: true usa pe e maxPe)
    const r5 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('p3'),
      deltaPd: 1
    });
    assert.equal(r5.ok, true);
    assert.deepEqual(r5.resposta, { ok: true, pv: 5, pvMax: 9, pd: 3, pdMax: 4 });
    assert.equal(sheets[2].pe, 3);

    // 6. Ficha inexistente devolve erro
    const r6 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('inexistente'),
      deltaPv: -1
    });
    assert.deepEqual(r6, { ok: false, motivo: 'recusado', detalhe: 'Esta ficha não existe aqui.' });
  } finally {
    mesa.parar();
    cliente.fechar();
  }
});

test('ficha.ajustar-recursos: ameaça tem apenas PV ajustado (PD permanece zero e intocado) e respeita [0, pvMax]', async () => {
  const sheets = [
    { id: 't1', name: 'Zumbi de Sangue', systemMode: 'threat', pv: 45, pvMax: 45 }
  ];
  const { mesa, campanha, criarCanal } = await cenario(sheets);
  const cliente = criarBarramento({ app: 'atlas', campanhaId: campanha.id, criarCanal });

  try {
    // 1. Dano em ameaça com deltaPv negativo
    const r1 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('t1'),
      deltaPv: -15,
      deltaPd: -5 // Ameaça não tem PD, deltaPd deve ser ignorado
    });
    assert.equal(r1.ok, true);
    assert.deepEqual(r1.resposta, { ok: true, pv: 30, pvMax: 45, pd: 0, pdMax: 0 });
    assert.equal(sheets[0].pv, 30);
    assert.equal(sheets[0].pd, undefined);

    // 2. Limite inferior em 0
    const r2 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('t1'),
      deltaPv: -50
    });
    assert.equal(r2.ok, true);
    assert.deepEqual(r2.resposta, { ok: true, pv: 0, pvMax: 45, pd: 0, pdMax: 0 });
    assert.equal(sheets[0].pv, 0);

    // 3. Valor absoluto respeitando o teto pvMax
    const r3 = await cliente.pedir('ficha.ajustar-recursos', {
      ficha: refDaFicha('t1'),
      pv: 100
    });
    assert.equal(r3.ok, true);
    assert.deepEqual(r3.resposta, { ok: true, pv: 45, pvMax: 45, pd: 0, pdMax: 0 });
    assert.equal(sheets[0].pv, 45);
  } finally {
    mesa.parar();
    cliente.fechar();
  }
});

test('campanha: personagens antigos não entram sozinhos; ameaças entram todas com etiqueta; levar e tirar; a limpeza única tira só personagens sem uso', async () => {
  const sheets = [{ id: 'p1', name: 'Alan', systemMode: 'ordem2' }, { id: 't1', name: 'Zumbi', systemMode: 'threat', pv: 5, pvMax: 5 }];
  const { mesa, campanha, guardado, emissor } = await cenario(sheets, { semHistorico: true });
  const ver = async () => (await emissor.listarEntidades(campanha.id)).map(e => `${e.nome}:${e.tags.join(',')}`).sort();
  try {
    // Primeira vez: o personagem antigo não entra; a ameaça entra como bestiário.
    await mesa.sincronizar();
    assert.deepEqual(await ver(), ['Zumbi:bestiário']);
    assert.deepEqual(JSON.parse(guardado.get('mesa:ficha-conhecidas')).sort(), ['p1', 't1']);

    // Criadas com a campanha ativa: o personagem entra; a ameaça nova é desta campanha.
    sheets.push({ id: 'p2', name: 'Brenna', systemMode: 'ordem2' }, { id: 't2', name: 'Cria', systemMode: 'threat', pv: 10, pvMax: 10 });
    await mesa.sincronizar();
    assert.deepEqual(await ver(), ['Brenna:', 'Cria:da-campanha', 'Zumbi:bestiário']);
    assert.equal(mesa.naCampanha('p2'), true); assert.equal(mesa.naCampanha('p1'), false);
    assert.equal(mesa.naCampanha('t2'), true); assert.equal(mesa.naCampanha('t1'), false);
    await mesa.sincronizar();
    assert.deepEqual(await ver(), ['Brenna:', 'Cria:da-campanha', 'Zumbi:bestiário'], 'a etiqueta de nova não some na sincronização seguinte');

    // Levar e tirar: personagem entra e sai; ameaça só troca de etiqueta.
    await mesa.levarParaCampanha('p1'); await mesa.levarParaCampanha('t1');
    assert.deepEqual(await ver(), ['Alan:', 'Brenna:', 'Cria:da-campanha', 'Zumbi:da-campanha']);
    await mesa.tirarDaCampanha('p1'); await mesa.tirarDaCampanha('t1');
    assert.deepEqual(await ver(), ['Brenna:', 'Cria:da-campanha', 'Zumbi:bestiário']);

    // Criada sem campanha ativa: o personagem não entra depois.
    guardado.delete('mesa:campanha-ativa');
    sheets.push({ id: 'p3', name: 'Solta', systemMode: 'ordem2' });
    await mesa.sincronizar();
    guardado.set('mesa:campanha-ativa', campanha.id);
    await mesa.sincronizar();
    assert.ok(!(await ver()).some(x => x.startsWith('Solta')));
  } finally { mesa.parar(); }

  // Limpeza: numa campanha poluída pela regra antiga, o personagem sem uso sai; ameaça usada vira da campanha; as outras, bestiário.
  const sheets2 = [{ id: 'a', name: 'No elenco', systemMode: 'ordem2' }, { id: 'e', name: 'Sobra', systemMode: 'ordem2' }, { id: 'b', name: 'Em cena', systemMode: 'threat', pv: 1, pvMax: 1 }, { id: 'c', name: 'No roteiro', systemMode: 'threat', pv: 1, pvMax: 1 }, { id: 'd', name: 'Solta', systemMode: 'threat', pv: 1, pvMax: 1 }];
  const { emissor: e2, campanha: c2, mesa: m2, guardado: g2 } = await cenario(sheets2, { semHistorico: true });
  const ver2 = async () => (await e2.listarEntidades(c2.id)).filter(x => x.criadaPor === 'ficha').map(x => `${x.nome}:${x.tags.join(',')}`).sort();
  try {
    // Simula a publicação em massa antiga: tudo entra (conhecidas vazio = tudo novo), e depois a Ficha esquece que eram novas.
    g2.set('mesa:ficha-conhecidas', '[]'); g2.set(`mesa:ficha-limpeza-v1:${c2.id}`, '1');
    await m2.sincronizar();
    g2.delete(`mesa:ficha-levadas:${c2.id}`);
    const todas = await e2.listarEntidades(c2.id), por = n => todas.find(x => x.nome === n);
    const cena = await e2.criarEntidade({ campanhaId: c2.id, tipo: 'cena', nome: 'Cena' });
    await e2.ligar({ campanhaId: c2.id, de: { app: 'ficha', tipo: 'ficha', id: 'b' }, para: { app: 'mesa', tipo: 'entidade', id: cena.id }, tipo: 'aparece-em' });
    await e2.salvarSessao({ id: 's1', campanhaId: c2.id, nome: 'S', data: 1, roteiro: [{ app: 'ficha', tipo: 'ficha', id: 'c' }], registro: '', criadaEm: 1, atualizadaEm: 1 });
    const camp = await e2.obterCampanha(c2.id); await e2.salvarCampanha({ ...camp, elenco: [por('No elenco').id] });
    g2.delete(`mesa:ficha-limpeza-v1:${c2.id}`);
    await m2.sincronizar();
    assert.deepEqual(await ver2(), ['Em cena:da-campanha', 'No elenco:', 'No roteiro:da-campanha', 'Solta:bestiário']);
    assert.ok(g2.get(`mesa:ficha-limpeza-v1:${c2.id}`), 'a limpeza roda uma vez só');
  } finally { m2.parar(); }
});
