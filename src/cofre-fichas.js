// Cofre de fichas da conta Discord (Worker da Mesa): sincroniza as fichas locais e lê as da conta, para o seletor do Saguão
// funcionar também dentro da Activity (outra origem, sem o IndexedDB do site). Funções puras e `fetch` injetável.

const CHAVE_SINC = 'dossie:cofre:sincronizadas';

/** Assinatura barata do conteúdo da ficha (FNV-1a de 32 bits sobre o JSON). */
export function assinaturaDaFicha(ficha) {
  const texto = JSON.stringify(ficha) ?? '';
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return `${texto.length}:${h.toString(16)}`;
}

/** As fichas locais ainda não enviadas, ou alteradas desde o último envio (`sincronizadas`: `{ id: assinatura }`). */
export function fichasParaEnviar(locais, sincronizadas = {}) {
  return (locais || []).filter(f => f?.id && f.systemMode !== 'threat' && sincronizadas[f.id] !== assinaturaDaFicha(f));
}

/**
 * Junta as fichas locais com as do cofre, sem duplicar por `id`. Fica a de maior `updatedAt` da própria ficha;
 * sem carimbo nos dois lados (ou empate), vale a local, que é a que o jogador edita.
 */
export function mesclarFichas(locais, remotas) {
  const porId = new Map();
  for (const f of locais || []) if (f?.id) porId.set(f.id, f);
  for (const r of remotas || []) {
    const f = r?.ficha;
    if (!f || typeof f !== 'object' || !r.id) continue;
    const atual = porId.get(r.id);
    if (!atual || (Number(f.updatedAt) || 0) > (Number(atual.updatedAt) || 0)) porId.set(r.id, { ...f, id: r.id });
  }
  return [...porId.values()];
}

const cabecalhos = sessao => ({ Authorization: `Bearer ${sessao}` });
const base = b => String(b || '').replace(/\/+$/, '');

export async function lerCofre({ sessao, baseSala, fetch: f = globalThis.fetch }) {
  const r = await f(`${base(baseSala)}/minhas-fichas`, { headers: cabecalhos(sessao) });
  if (!r.ok) throw new Error(`cofre ${r.status}`);
  const corpo = await r.json();
  return Array.isArray(corpo?.fichas) ? corpo.fichas : [];
}

export async function enviarParaCofre({ sessao, baseSala, ficha, fetch: f = globalThis.fetch }) {
  const r = await f(`${base(baseSala)}/minhas-fichas/${encodeURIComponent(ficha.id)}`, {
    method: 'PUT', headers: { ...cabecalhos(sessao), 'Content-Type': 'application/json' }, body: JSON.stringify(ficha),
  });
  return r.ok;
}

/** Envia as fichas locais novas ou alteradas e devolve as do cofre. Falhas de rede viram `{ remotas: [], enviadas: 0 }`. */
export async function sincronizarComCofre({ sessao, baseSala, locais, fetch: f = globalThis.fetch, armazenamentoLocal = globalThis.localStorage }) {
  let sinc = {};
  try { sinc = JSON.parse(armazenamentoLocal?.getItem(CHAVE_SINC) || '{}') || {}; } catch { /* nada sincronizado */ }
  let enviadas = 0;
  for (const ficha of fichasParaEnviar(locais, sinc)) {
    try { if (await enviarParaCofre({ sessao, baseSala, ficha, fetch: f })) { sinc[ficha.id] = assinaturaDaFicha(ficha); enviadas++; } } catch { /* tenta na próxima */ }
  }
  try { armazenamentoLocal?.setItem(CHAVE_SINC, JSON.stringify(sinc)); } catch { /* sem armazenamento */ }
  let remotas = [];
  try { remotas = await lerCofre({ sessao, baseSala, fetch: f }); } catch { /* sem cofre agora */ }
  return { remotas, enviadas };
}
