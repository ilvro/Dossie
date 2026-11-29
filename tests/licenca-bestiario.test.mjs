import { test } from 'node:test';
import assert from 'node:assert/strict';

test('observarLicencaEmOutrasJanelas reage à chave da licença vinda de outra janela e ignora as demais', async () => {
  const ouvintes = new Map();
  const armazenamento = new Map();
  globalThis.window = {
    addEventListener: (t, f) => ouvintes.set(t, f),
    removeEventListener: t => ouvintes.delete(t),
    dispatchEvent: () => true,
  };
  globalThis.localStorage = { getItem: k => armazenamento.get(k) ?? null, setItem: (k, v) => armazenamento.set(k, v), removeItem: k => armazenamento.delete(k) };
  const { observarLicencaEmOutrasJanelas, BESTIARY_LICENSE_STORAGE_KEY } = await import('../src/services/bestiary-license.js');

  const vistos = [];
  const parar = observarLicencaEmOutrasJanelas(l => vistos.push(l));
  const aoStorage = ouvintes.get('storage');
  assert.ok(aoStorage);

  aoStorage({ key: 'outra-chave' });
  assert.equal(vistos.length, 0);

  armazenamento.set(BESTIARY_LICENSE_STORAGE_KEY, JSON.stringify({ unlocked: true, buyerName: 'Ana' }));
  aoStorage({ key: BESTIARY_LICENSE_STORAGE_KEY });
  assert.equal(vistos.length, 1);
  assert.equal(vistos[0].buyerName, 'Ana');

  armazenamento.delete(BESTIARY_LICENSE_STORAGE_KEY);
  aoStorage({ key: null });
  assert.equal(vistos[1], null, 'limpar o armazenamento volta a bloquear');

  parar();
  assert.equal(ouvintes.has('storage'), false);
});
