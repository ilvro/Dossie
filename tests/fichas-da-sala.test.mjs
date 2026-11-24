import test from 'node:test';
import assert from 'node:assert/strict';
import { nomeDoDono, rotuloDoDono, donoDoPersonagem, jogadoresParaEntregar, decidirChegada, textoDoConflito, BOTAO_VER_DELE, BOTAO_MANTER_MINHA } from '../src/fichas-da-sala.js';

const info = {
  eu: { discordId: '1', nome: 'Mestre' },
  donos: { a: '2', b: '1', c: '3', d: '9' },
  membros: [{ discordId: '1', nome: 'Mestre', papel: 'mestre' }, { discordId: '2', nome: 'Ana', papel: 'jogador' }, { discordId: '4', nome: 'Davi', papel: 'jogador' }],
  nomes: { 3: 'Caio' },
};

test('o rótulo do dono usa o nome da sala; "você" para o mestre; um resto do id para quem nunca apareceu', () => {
  assert.equal(rotuloDoDono(info, 'a'), 'Dono: Ana');
  assert.equal(rotuloDoDono(info, 'b'), 'Dono: você');
  assert.equal(rotuloDoDono(info, 'c'), 'Dono: Caio');
  assert.equal(rotuloDoDono(info, 'd'), 'Dono: jogador 9');
  assert.equal(rotuloDoDono(info, 'nada'), '');
  assert.equal(nomeDoDono(info, null), null);
});

test('donoDoPersonagem devolve nome limpo do jogador (priorizando quem escolheu no saguão e omitindo o mestre)', () => {
  const comEscolha = {
    ...info,
    membros: [
      ...info.membros,
      { discordId: '5', nome: 'Cildum', papel: 'jogador', personagem: 'b' },
    ],
  };
  assert.equal(donoDoPersonagem(info, 'a'), 'Ana');
  assert.equal(donoDoPersonagem(info, 'b'), null);
  assert.equal(donoDoPersonagem(comEscolha, 'b'), 'Cildum');
  assert.equal(donoDoPersonagem(info, 'c'), 'Caio');
  assert.equal(donoDoPersonagem(info, 'nada'), null);
});

test('quem pode receber uma ficha: os jogadores presentes e os donos ausentes, nunca o mestre', () => {
  const l = jogadoresParaEntregar(info);
  assert.deepEqual(l.map(j => `${j.nome}:${j.presente}`), ['Ana:true', 'Davi:true', 'Caio:false', 'jogador 9:false']);
  assert.deepEqual(jogadoresParaEntregar({ membros: [], donos: {} }), []);
  assert.deepEqual(jogadoresParaEntregar(null), []);
});

test('conflito: ficha de fora com o mestre editando pergunta; o eco, a sala caída e a ficha sem edição não', () => {
  assert.equal(decidirChegada({ propria: true, existe: true, editando: true }), 'ignorar', 'o eco da própria gravação');
  assert.equal(decidirChegada({ propria: false, conectada: false, existe: true, editando: false }), 'ignorar');
  assert.equal(decidirChegada({ propria: false, existe: true, editando: true }), 'conflito');
  assert.equal(decidirChegada({ propria: false, existe: true, editando: false }), 'aplicar');
  assert.equal(decidirChegada({ propria: false, existe: false, editando: false }), 'aplicar', 'ficha nova criada pelo jogador');
  assert.equal(decidirChegada({ propria: false, existe: false, editando: true }), 'aplicar');
});

test('os textos do aviso de conflito', () => {
  assert.equal(textoDoConflito('Ana'), 'Ana mexeu nesta ficha');
  assert.equal(textoDoConflito(null), 'O jogador mexeu nesta ficha');
  assert.equal(BOTAO_VER_DELE, 'Ver a versão dele');
  assert.equal(BOTAO_MANTER_MINHA, 'Manter a minha');
});
