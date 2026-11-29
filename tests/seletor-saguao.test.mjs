import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fichasDePersonagem, fichaCombinaBusca, subtituloDaFicha, resumoDeRecursos } from '../src/seletor-saguao.js';

test('só personagens, ordenados por nome', () => {
  const r = fichasDePersonagem([{ id: 'b', name: 'Zeca' }, { id: 't', name: 'Monstro', systemMode: 'threat' }, { id: 'a', name: 'Ana' }, null, { name: 'sem id' }]);
  assert.deepEqual(r.map(f => f.id), ['a', 'b']);
});
test('busca ignora acento e caixa e olha perfil e ocupação', () => {
  const f = { name: 'João', profile: 'Executor', occupation: 'Médico' };
  assert.equal(fichaCombinaBusca(f, 'joao'), true);
  assert.equal(fichaCombinaBusca(f, 'EXEC'), true);
  assert.equal(fichaCombinaBusca(f, 'medico'), true);
  assert.equal(fichaCombinaBusca(f, 'xyz'), false);
  assert.equal(fichaCombinaBusca(f, ''), true);
});
test('subtítulo e recursos', () => {
  assert.equal(subtituloDaFicha({ profile: 'Executor', occupation: 'Médico', level: 3 }), 'Executor · Médico · Nível 3');
  assert.deepEqual(resumoDeRecursos({ systemMode: 'ordem2', pv: 5, maxPv: 10, pd: 2, maxPd: 8 }).map(r => r.rotulo), ['PV', 'PD']);
  assert.deepEqual(resumoDeRecursos({ systemMode: 'original', pv: 5, maxPv: 10, san: 4, maxSan: 8 }).map(r => r.rotulo), ['PV', 'SAN']);
  assert.deepEqual(resumoDeRecursos({ systemMode: 'original', usaPD: true, pv: 5, maxPv: 10, pe: 4, maxPe: 8 }).map(r => r.rotulo), ['PV', 'PD']);
});
