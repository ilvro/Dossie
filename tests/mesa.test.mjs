import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from '../../Atlas/node_modules/fake-indexeddb/build/esm/index.js';
import { iniciarMesa, recursosDaFicha, ehPersonagem, refDaFicha } from '../src/mesa.js';

test('PV e PD por modo; ameaças não têm recursos', () => {
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'ordem2', pv: 8, maxPv: 10, pd: 3, maxPd: 6 }), { pv: 8, pvMax: 10, pd: 3, pdMax: 6 });
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'original', pv: 5, maxPv: 9, san: 7, maxSan: 12 }), { pv: 5, pvMax: 9, pd: 7, pdMax: 12 });
  assert.deepEqual(recursosDaFicha({ id: 'a', systemMode: 'original', usaPD: true, pv: 5, maxPv: 9, pe: 2, maxPe: 4, san: 7, maxSan: 12 }), { pv: 5, pvMax: 9, pd: 2, pdMax: 4 });
  assert.equal(recursosDaFicha({ id: 't', systemMode: 'threat', pv: 50 }), null);
  assert.equal(ehPersonagem({ id: 't', systemMode: 'threat' }), false);
  assert.deepEqual(refDaFicha('x'), { app: 'ficha', tipo: 'ficha', id: 'x' });
});

test('sem plataforma, iniciarMesa devolve ganchos inofensivos', async () => {
  const m = await iniciarMesa({ fichas: () => [], aberta: () => null, abrir() {} }, { BroadcastChannel: undefined, indexedDB: undefined });
  m.publicarRolagem({ id: 'a' }, { titulo: 'x', total: 1 }); m.publicarRecursos({ id: 'a' }); await m.sincronizar(); m.parar();
});
