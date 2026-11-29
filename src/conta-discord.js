// Conta Discord no site do Dossiê: login opcional (OAuth2 web, o mesmo da Mesa) e sincronia das fichas com o cofre da conta
// no Worker da Mesa. A sessão fica em `mesa:online-sessao`, a mesma chave da Mesa: entrar em um app vale para o outro (mesma origem).
import { fichasParaEnviar, assinaturaDaFicha } from './cofre-fichas.js';

export const DISCORD_CLIENT_ID = '1573405277389197415';
export const CHAVE_SESSAO = 'mesa:online-sessao';
const CHAVE_STATE = 'dossie:discord-state';
const CHAVE_SINC = 'dossie:cofre:sincronizadas';
const CHAVE_URL_SALA = 'mesa:sala-url';
export const REDIRECT_PAGES = 'https://ilvro.github.io/Dossie/';
export const REDIRECT_DEV = 'http://127.0.0.1:5100/Dossie/';
export const URL_SALA_PRODUCAO = 'https://mesa-sala.ilvro-ermes.workers.dev';
export const URL_SALA_LOCAL = 'http://127.0.0.1:8787';
const URL_AUTORIZACAO = 'https://discord.com/oauth2/authorize';

const guardar = (nome, f) => { try { return f(globalThis[nome]); } catch { return undefined; } };

/** O `redirect_uri` deste site: o do Pages, ou o do dev local (o Worker só aceita estes). */
export const redirectUri = (hostname = globalThis.location?.hostname) => (hostname === 'ilvro.github.io' ? REDIRECT_PAGES : REDIRECT_DEV);

/** A base do Worker: a escolhida na Mesa (`mesa:sala-url`), senão local em localhost, senão produção. */
export function urlDaSala(hostname = globalThis.location?.hostname, armazem = globalThis.localStorage) {
  const guardada = guardar('localStorage', () => armazem?.getItem(CHAVE_URL_SALA));
  if (guardada) return String(guardada).replace(/\/+$/, '');
  return hostname === '127.0.0.1' || hostname === 'localhost' ? URL_SALA_LOCAL : URL_SALA_PRODUCAO;
}

/** O vencimento (ms) dentro do token `base64url(json).assinatura`, ou `null`. */
export function expDaSessao(token) {
  try {
    const b64 = String(token).split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), c => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(bytes));
    return typeof d.exp === 'number' ? d.exp : null;
  } catch { return null; }
}

/** A sessão guardada (`{ sessao, eu }`), ou `null` (e apaga) se venceu ou está estragada. */
export function lerSessao(armazem = globalThis.localStorage, agora = Date.now()) {
  try {
    const s = JSON.parse(armazem?.getItem(CHAVE_SESSAO) || 'null');
    if (!s || typeof s.sessao !== 'string' || !s.eu || typeof s.eu.discordId !== 'string') return null;
    const exp = expDaSessao(s.sessao);
    if (exp === null || exp <= agora) { armazem?.removeItem(CHAVE_SESSAO); return null; }
    return s;
  } catch { return null; }
}

export function sairDaConta(armazem = globalThis.localStorage) { try { armazem?.removeItem(CHAVE_SESSAO); } catch { /* ignora */ } }

export function novoState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, '0')).join('');
}

/** Guarda um `state` novo na aba e devolve a URL de autorização do Discord. */
export function iniciarLogin({ aba = globalThis.sessionStorage, redirect = redirectUri(), state = novoState() } = {}) {
  try { aba?.setItem(CHAVE_STATE, state); } catch { /* sem sessionStorage o retorno falha na conferência */ }
  const p = new URLSearchParams({ client_id: DISCORD_CLIENT_ID, response_type: 'code', scope: 'identify guilds', redirect_uri: redirect, state });
  return `${URL_AUTORIZACAO}?${p}`;
}

/** Query sem `code`, `state` e os erros do Discord. */
export function queryLimpa(search) {
  const p = new URLSearchParams(search);
  for (const k of ['code', 'state', 'error', 'error_description']) p.delete(k);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Na volta do Discord: confere o `state` e troca o `code` por uma sessão. `'sem-codigo' | 'ok' | 'state-invalido' | 'recusado' | 'erro'`. */
export async function concluirLogin({ search, fetch: f = globalThis.fetch, armazem = globalThis.localStorage, aba = globalThis.sessionStorage, urlSala = urlDaSala(), redirect = redirectUri() } = {}) {
  const p = new URLSearchParams(search);
  const code = p.get('code');
  if (!code) return p.get('error') ? 'recusado' : 'sem-codigo';
  let esperado = null;
  try { esperado = aba?.getItem(CHAVE_STATE) ?? null; aba?.removeItem(CHAVE_STATE); } catch { /* ignora */ }
  const state = p.get('state');
  if (!esperado || !state || state !== esperado) return 'state-invalido';
  try {
    const r = await f(`${urlSala}/sala/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri: redirect }) });
    if (!r.ok) return 'erro';
    const d = await r.json();
    if (typeof d.sessao !== 'string' || !d.eu) return 'erro';
    try { armazem?.setItem(CHAVE_SESSAO, JSON.stringify({ sessao: d.sessao, eu: d.eu })); } catch { /* a sessão vale só nesta aba */ }
    return 'ok';
  } catch { return 'erro'; }
}

/**
 * Envolve o armazenamento: depois de cada `salvar`, com sessão do Discord, envia ao cofre as fichas de personagem novas ou
 * alteradas (com espera, em segundo plano). Sem sessão, não faz nada. Falhas nunca atrapalham o salvamento local.
 * Limite: fichas apagadas no Dossiê continuam no cofre.
 */
export function comSincroniaDiscord(armazenamento, { esperaMs = 2500, fetch: f = globalThis.fetch, armazem = globalThis.localStorage, agendar = setTimeout, cancelar = clearTimeout, urlSala = urlDaSala } = {}) {
  let timer = null, ultimas = [];
  const enviar = async () => {
    timer = null;
    const conta = lerSessao(armazem);
    if (!conta) return;
    let sinc = {};
    try { sinc = JSON.parse(armazem?.getItem(CHAVE_SINC) || '{}') || {}; } catch { /* nada enviado */ }
    const base = `${urlSala()}/sala`;
    for (const ficha of fichasParaEnviar(ultimas, sinc)) {
      try {
        const r = await f(`${base}/minhas-fichas/${encodeURIComponent(ficha.id)}`, { method: 'PUT', headers: { Authorization: `Bearer ${conta.sessao}`, 'Content-Type': 'application/json' }, body: JSON.stringify(ficha) });
        if (r.ok) sinc[ficha.id] = assinaturaDaFicha(ficha);
        else if (r.status === 401) { sairDaConta(armazem); break; }
      } catch { /* tenta no próximo salvamento */ }
    }
    try { armazem?.setItem(CHAVE_SINC, JSON.stringify(sinc)); } catch { /* sem armazenamento */ }
  };
  const agendarEnvio = fichas => {
    ultimas = (Array.isArray(fichas) ? fichas : []).filter(x => x && typeof x.id === 'string' && x.folderId !== 'folder-sala' && x._sinteticaSala !== true);
    if (timer !== null) cancelar(timer);
    timer = agendar(enviar, esperaMs);
  };
  const salvarOriginal = armazenamento.salvar?.bind(armazenamento);
  return Object.assign(Object.create(armazenamento), armazenamento, {
    salvar(fichas, opcoes) { const r = salvarOriginal?.(fichas, opcoes); try { agendarEnvio(fichas); } catch { /* ignora */ } return r; },
    /** Envia já as fichas dadas (ao entrar na conta ou abrir o Dossiê). */
    sincronizarAgora(fichas) { agendarEnvio(fichas); if (timer !== null) { cancelar(timer); timer = null; } return enviar(); },
  });
}
