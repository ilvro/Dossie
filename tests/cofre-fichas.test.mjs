import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assinaturaDaFicha, fichasParaEnviar, mesclarFichas, sincronizarComCofre } from '../src/cofre-fichas.js';

test('assinatura muda quando a ficha muda', () => {
  assert.equal(assinaturaDaFicha({ a: 1 }), assinaturaDaFicha({ a: 1 }));
  assert.notEqual(assinaturaDaFicha({ a: 1 }), assinaturaDaFicha({ a: 2 }));
});

test('só envia fichas novas ou alteradas, e nunca ameaças', () => {
  const a = { id: 'a', name: 'A' }, b = { id: 'b', name: 'B' };
  const sinc = { a: assinaturaDaFicha(a) };
  assert.deepEqual(fichasParaEnviar([a, b, { id: 't', systemMode: 'threat' }], sinc).map(f => f.id), ['b']);
  assert.deepEqual(fichasParaEnviar([{ ...a, name: 'A2' }], sinc).map(f => f.id), ['a']);
});

test('mescla sem duplicar: a de maior updatedAt vence, empate fica com a local', () => {
  const locais = [{ id: 'a', name: 'local', updatedAt: 5 }, { id: 'b', name: 'local b' }];
  const remotas = [{ id: 'a', ficha: { id: 'a', name: 'remota', updatedAt: 9 } }, { id: 'b', ficha: { id: 'b', name: 'remota b' } }, { id: 'c', ficha: { id: 'c', name: 'só remota' } }, { id: 'x', ficha: null }];
  const r = mesclarFichas(locais, remotas);
  assert.equal(r.length, 3);
  assert.equal(r.find(f => f.id === 'a').name, 'remota');
  assert.equal(r.find(f => f.id === 'b').name, 'local b');
  assert.equal(r.find(f => f.id === 'c').name, 'só remota');
});

test('sincroniza: envia as pendentes com o token no cabeçalho e lê o cofre', async () => {
  const chamadas = [];
  const fetch = async (url, init = {}) => {
    chamadas.push([init.method || 'GET', url, init.headers?.Authorization]);
    return init.method === 'PUT' ? { ok: true } : { ok: true, json: async () => ({ fichas: [{ id: 'z', ficha: { id: 'z' } }] }) };
  };
  const mem = new Map();
  const armazenamentoLocal = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const args = { sessao: 'tok', baseSala: 'http://w/sala/', locais: [{ id: 'a', name: 'A' }], fetch, armazenamentoLocal };
  const r1 = await sincronizarComCofre(args);
  assert.equal(r1.enviadas, 1);
  assert.deepEqual(r1.remotas.map(f => f.id), ['z']);
  assert.deepEqual(chamadas[0], ['PUT', 'http://w/sala/minhas-fichas/a', 'Bearer tok']);
  const r2 = await sincronizarComCofre(args);
  assert.equal(r2.enviadas, 0, 'sem mudança, não reenvia');
});

test('sem rede, devolve vazio sem estourar', async () => {
  const fetch = async () => { throw new Error('offline'); };
  const r = await sincronizarComCofre({ sessao: 't', baseSala: 'http://w/sala', locais: [{ id: 'a' }], fetch, armazenamentoLocal: null });
  assert.deepEqual(r, { remotas: [], enviadas: 0 });
});
