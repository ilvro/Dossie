import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comSincroniaDiscord, concluirLogin, expDaSessao, iniciarLogin, lerSessao, queryLimpa, redirectUri, urlDaSala, CHAVE_SESSAO } from '../src/conta-discord.js';

const memoria = (ini = {}) => { const m = new Map(Object.entries(ini)); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
const token = exp => `${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.assinatura`;
const eu = { discordId: '1', nome: 'Ana' };

test('redirect e base da sala seguem o lugar', () => {
  assert.equal(redirectUri('ilvro.github.io'), 'https://ilvro.github.io/Dossie/');
  assert.equal(redirectUri('127.0.0.1'), 'http://127.0.0.1:5100/Dossie/');
  assert.equal(urlDaSala('ilvro.github.io', memoria()), 'https://mesa-sala.ilvro-ermes.workers.dev');
  assert.equal(urlDaSala('127.0.0.1', memoria()), 'http://127.0.0.1:8787');
  assert.equal(urlDaSala('x', memoria({ 'mesa:sala-url': 'http://w/' })), 'http://w');
});

test('sessão: lê a válida, apaga a vencida ou estragada', () => {
  assert.equal(expDaSessao(token(123)), 123);
  assert.equal(expDaSessao('lixo'), null);
  assert.equal(lerSessao(memoria({ [CHAVE_SESSAO]: JSON.stringify({ sessao: token(1000), eu }) }), 500)?.eu.nome, 'Ana');
  const vencida = memoria({ [CHAVE_SESSAO]: JSON.stringify({ sessao: token(1000), eu }) });
  assert.equal(lerSessao(vencida, 2000), null);
  assert.equal(vencida.getItem(CHAVE_SESSAO), null);
  assert.equal(lerSessao(memoria({ [CHAVE_SESSAO]: 'xx' })), null);
});

test('login: URL com o state e o redirect do Dossiê', () => {
  const aba = memoria();
  const u = new URL(iniciarLogin({ aba, redirect: 'https://ilvro.github.io/Dossie/', state: 'abc' }));
  assert.equal(u.searchParams.get('state'), 'abc');
  assert.equal(u.searchParams.get('redirect_uri'), 'https://ilvro.github.io/Dossie/');
  assert.equal(u.searchParams.get('scope'), 'identify guilds');
  assert.equal(aba.getItem('dossie:discord-state'), 'abc');
});

test('retorno do login: confere o state, troca o code e guarda a sessão', async () => {
  const aba = memoria({ 'dossie:discord-state': 'abc' }), armazem = memoria();
  let corpo;
  const fetch = async (url, init) => { corpo = [url, JSON.parse(init.body)]; return { ok: true, json: async () => ({ sessao: token(9e12), eu }) }; };
  assert.equal(await concluirLogin({ search: '?code=C&state=abc', fetch, armazem, aba, urlSala: 'http://w', redirect: 'R' }), 'ok');
  assert.deepEqual(corpo, ['http://w/sala/token', { code: 'C', redirectUri: 'R' }]);
  assert.equal(lerSessao(armazem)?.eu.nome, 'Ana');
  assert.equal(aba.getItem('dossie:discord-state'), null, 'o state é de uso único');
});

test('retorno do login: state errado, recusa e sem código', async () => {
  const fetch = async () => { throw new Error('não devia chamar'); };
  assert.equal(await concluirLogin({ search: '?code=C&state=x', fetch, aba: memoria({ 'dossie:discord-state': 'abc' }), armazem: memoria() }), 'state-invalido');
  assert.equal(await concluirLogin({ search: '?code=C&state=x', fetch, aba: memoria(), armazem: memoria() }), 'state-invalido');
  assert.equal(await concluirLogin({ search: '?error=access_denied', fetch }), 'recusado');
  assert.equal(await concluirLogin({ search: '?a=1', fetch }), 'sem-codigo');
  assert.equal(queryLimpa('?code=C&state=s&a=1'), '?a=1');
  assert.equal(queryLimpa('?code=C&state=s'), '');
});

test('sincronia: só envia depois do salvamento, com sessão, e só o que mudou', async () => {
  const armazem = memoria({ [CHAVE_SESSAO]: JSON.stringify({ sessao: token(9e12), eu }) });
  const chamadas = []; let tarefa = null;
  const fetch = async (url, init) => { chamadas.push([init.method, url, init.headers.Authorization]); return { ok: true }; };
  const base = { salvou: 0, salvar() { this.salvou++; } };
  const a = comSincroniaDiscord(base, { fetch, armazem, agendar: f => { tarefa = f; return 1; }, cancelar: () => { tarefa = null; }, urlSala: () => 'http://w' });
  a.salvar([{ id: 'a', name: 'A' }, { id: 's', folderId: 'folder-sala' }]);
  assert.equal(base.salvou, 1, 'o salvamento local continua');
  assert.equal(chamadas.length, 0, 'espera o debounce');
  await tarefa();
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0][1], 'http://w/sala/minhas-fichas/a');
  a.salvar([{ id: 'a', name: 'A' }]); await tarefa();
  assert.equal(chamadas.length, 1, 'ficha igual não reenvia');
  a.salvar([{ id: 'a', name: 'A2' }]); await tarefa();
  assert.equal(chamadas.length, 2);
});

test('sincronia: sem sessão não envia e 401 encerra a sessão', async () => {
  let n = 0; let tarefa;
  const fetch = async () => { n++; return { ok: false, status: 401 }; };
  const sem = comSincroniaDiscord({ salvar() {} }, { fetch, armazem: memoria(), agendar: f => { tarefa = f; }, cancelar() {}, urlSala: () => 'http://w' });
  sem.salvar([{ id: 'a' }]); await tarefa(); assert.equal(n, 0);
  const armazem = memoria({ [CHAVE_SESSAO]: JSON.stringify({ sessao: token(9e12), eu }) });
  const com = comSincroniaDiscord({ salvar() {} }, { fetch, armazem, agendar: f => { tarefa = f; }, cancelar() {}, urlSala: () => 'http://w' });
  com.salvar([{ id: 'a' }]); await tarefa();
  assert.equal(armazem.getItem(CHAVE_SESSAO), null);
});
