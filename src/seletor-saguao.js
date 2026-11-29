// Seletor de fichas do Saguão da Mesa (`?modo=seletor`): galeria visual dentro de um iframe da casca.
// Lê as fichas de personagem do armazenamento local, e devolve a escolhida por `postMessage` à casca (mesma origem).
import { armazenamentoLocal, fichaParaSala } from './armazenamento.js';
import { sincronizarComCofre, mesclarFichas } from './cofre-fichas.js';
import { DEFAULT_FOLDERS, normalizeFolders, loadFoldersFromStorage } from './workspace/folders.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COR_PERFIL = { Executor: '#e0150d', Analista: '#2162ff', Vigilante: '#2d863f' };
const COR_CLASSE = { combatente: '#e0150d', especialista: '#2162ff', ocultista: '#a230ed', mundano: '#808080' };
/** Mesma regra do Dossiê (`getSheetAccent`): cor tema da ficha, senão a da classe (Ordem) ou do perfil. */
export function corDaFicha(f) {
  if (/^#[0-9a-f]{6}$/i.test(f?.themeColor || '')) return f.themeColor;
  if (f?.systemMode === 'original') return COR_CLASSE[f.classeId] || '#e0150d';
  return COR_PERFIL[f?.profile] || COR_PERFIL.Executor;
}
const imagemSegura = u => (/^(data:image\/|blob:|https?:\/\/|\.?\/?[\w./%-]+$)/i.test(String(u || '').trim()) ? String(u).trim() : '');

/** Só personagens (ameaças ficam de fora), com nome para busca, ordenadas pelo nome. */
export function fichasDePersonagem(lista) {
  return (Array.isArray(lista) ? lista : [])
    .filter(f => f && typeof f === 'object' && f.id && f.systemMode !== 'threat')
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
}

/** O texto do filtro bate com nome, perfil/classe ou ocupação? Sem acentos nem maiúsculas. */
export function fichaCombinaBusca(f, busca) {
  const norm = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(busca).trim();
  if (!q) return true;
  return [f.name, f.profile, f.classeId, f.occupation, f.ocupacao, f.origem].some(v => norm(v).includes(q));
}

/** Perfil/classe e ocupação/nível para o subtítulo do cartão. */
export function subtituloDaFicha(f) {
  const perfil = f.profile || f.classeId || '';
  const ocupacao = f.occupation || f.ocupacao || f.origem || '';
  const nivel = Number(f.level) > 0 ? `Nível ${Number(f.level)}` : '';
  return [perfil, ocupacao, nivel].filter(Boolean).join(' · ');
}

/** PV e PD (ou SAN/PE na Ordem 1) para o resumo do cartão. */
export function resumoDeRecursos(f) {
  const par = (rotulo, atual, max) => (Number(max) > 0 ? { rotulo, atual: Math.max(0, Number(atual) || 0), max: Number(max) } : null);
  const original = f.systemMode === 'original';
  const mental = original ? (f.usaPD ? par('PD', f.pe, f.maxPe) : par('SAN', f.san, f.maxSan)) : par('PD', f.pd, f.maxPd);
  return [par('PV', f.pv, f.maxPv), mental].filter(Boolean);
}

export async function montarSeletor(raiz = document.querySelector('#app') || document.body, deps = {}) {
  const armazenamento = deps.armazenamento || armazenamentoLocal();
  const pai = deps.pai ?? (window.parent !== window ? window.parent : null);
  const enviar = msg => { try { pai?.postMessage(msg, location.origin); } catch { /* sem casca */ } };
  document.body.dataset.modoSeletor = '1';
  const fundo = document.createElement('div');
  fundo.className = 'sel-fundo';
  fundo.innerHTML = '<i class="sel-fundo-retrato"></i><i class="sel-fundo-brilho"></i><i class="sel-fundo-neblina"></i><i class="sel-fundo-brasas"></i><i class="sel-fundo-vinheta"></i>';
  document.body.prepend(fundo);
  const pintarFundo = f => {
    fundo.style.setProperty('--sel-acento', f ? corDaFicha(f) : '#b00f2e');
    const img = f ? imagemSegura(f.tokenImage) : '';
    fundo.firstElementChild.style.backgroundImage = img ? `url('${img.replace(/'/g, '%27')}')` : 'none';
  };

  let locais = [], fichas = [], pastas = normalizeFolders(DEFAULT_FOLDERS), busca = '', pasta = 'todas', indice = 0, direcao = 0, confirmando = false;
  const estado = { carregando: true };
  let atuais = [];
  const carrossel = lista => {
    const n = lista.length, i = ((indice % n) + n) % n, mais = n > 1;
    const ant = lista[(i - 1 + n) % n], cur = lista[i], prox = lista[(i + 1) % n];
    const cor = corDaFicha;
    const topo = (f, rotulo) => `<div class="cp-card-topbar"><span class="cp-card-tag">${rotulo}</span><span class="cp-card-profile">${esc(f.systemMode === 'original' ? 'Ordem RPG' : (f.profile || f.classeId || 'Ficha'))}</span></div>`;
    const thumb = f => { const img = imagemSegura(f.tokenImage); return `<div class="cp-card-thumb">${img ? `<img src="${esc(img)}" alt="${esc(f.name)}" draggable="false">` : `<div class="cp-avatar-ph">${esc(String(f.name || '?').trim().charAt(0).toUpperCase())}</div>`}${confirmando ? '<div class="pcard-lockin-overlay"><div class="pcard-lockin-stamp"><strong>✓ RECEPTÁCULO CONFIRMADO</strong><small>SINCRONIZANDO FICHA...</small></div></div>' : ''}</div>`; };
    const lateral = (f, k, rotulo) => `<article class="cp-card card-side card-${k}" data-sel-ir="${k === 'prev' ? -1 : 1}" style="--agent-accent:${cor(f)}" title="Ver ${esc(f.name)}">${topo(f, rotulo)}${thumb(f)}<div class="cp-card-summary"><strong>${esc(f.name || 'Sem nome')}</strong><small>${esc(subtituloDaFicha(f))}</small></div></article>`;
    const pilulas = resumoDeRecursos(cur).map((r, k) => `<span class="cp-res-pill ${k === 0 ? 'pv' : 'pd'}">${r.rotulo} ${r.atual}/${r.max}</span>`).join('');
    return `<section class="sel-recept" style="--agent-accent:${cor(cur)}"><header class="cp-dock-top"><span class="cp-dock-badge">SELEÇÃO DE RECEPTÁCULO</span><span class="cp-dock-hint"><kbd>←</kbd> <kbd>→</kbd> Navegar · <b>Duplo clique</b> para Confirmar</span><span class="cp-dock-counter">${i + 1} / ${n}</span></header>
      <div class="cp-dock-carousel ${direcao === 1 ? 'dir-next' : direcao === -1 ? 'dir-prev' : ''}" style="--agent-accent:${cor(cur)}">
      ${mais ? `<button type="button" class="cp-arrow prev" data-sel-ir="-1" title="Receptáculo anterior (←)">‹</button>${lateral(ant, 'prev', 'ANTERIOR')}` : ''}
      <article class="cp-card card-curr ${confirmando ? 'locking-in' : ''}" data-sel-atual="${esc(cur.id)}" style="--agent-accent:${cor(cur)}">${topo(cur, 'DUPLO CLIQUE PARA CONFIRMAR')}${thumb(cur)}
        <div class="cp-card-summary"><div class="cp-summary-header"><strong>${esc(cur.name || 'Sem nome')}</strong><span class="cp-level-badge">${Number(cur.level) > 0 ? `NV ${Number(cur.level)}` : ''}</span></div><small>${esc(subtituloDaFicha(cur))}</small><div class="cp-pill-row">${pilulas}</div>
        <button type="button" class="btn-select-cp-agent" data-sel-confirmar="${esc(cur.id)}" title="Confirmar receptáculo (Duplo clique ou Enter)"><span>CONFIRMAR RECEPTÁCULO</span></button></div></article>
      ${mais ? `${lateral(prox, 'next', 'PRÓXIMO')}<button type="button" class="cp-arrow next" data-sel-ir="1" title="Próximo receptáculo (→)">›</button>` : ''}</div></section>`;
  };
  const ir = d => { if (confirmando || atuais.length < 2) return; direcao = d; indice = ((indice + d) % atuais.length + atuais.length) % atuais.length; desenhar(); };
  const confirmar = id => {
    const f = fichas.find(x => x.id === id);
    if (!f || confirmando) return;
    confirmando = true; desenhar();
    setTimeout(() => enviar({ tipo: 'dossie.seletor-escolheu', ficha: fichaParaSala(f) }), deps.atraso ?? 540);
  };
  const desenhar = () => {
    const visiveis = fichas.filter(f => fichaCombinaBusca(f, busca) && (pasta === 'todas' || f.folderId === pasta));
    atuais = visiveis;
    pintarFundo(visiveis.length ? visiveis[((indice % visiveis.length) + visiveis.length) % visiveis.length] : null);
    const usadas = pastas.filter(p => fichas.some(f => f.folderId === p.id));
    raiz.innerHTML = `<main class="sel">
      <header class="sel-topo"><h1>Escolher personagem</h1>
        <div class="sel-acoes"><button type="button" class="sel-btn destaque" data-sel-nova>Criar nova ficha</button>
        ${fichas.length === 0 && !estado.carregando ? '<button type="button" class="sel-btn discreto" data-sel-json>Importar JSON</button>' : ''}</div></header>
      ${fichas.length ? `<div class="sel-filtros"><input type="search" class="sel-busca" placeholder="Buscar por nome, perfil ou ocupação" value="${esc(busca)}" data-sel-busca autocomplete="off">
        ${usadas.length > 1 ? `<select class="sel-pasta" data-sel-pasta><option value="todas">Todas as pastas</option>${usadas.map(p => `<option value="${esc(p.id)}" ${p.id === pasta ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>` : ''}</div>` : ''}
      ${estado.carregando ? '<p class="sel-vazio">Carregando fichas…</p>'
        : !fichas.length ? '<p class="sel-vazio">Nenhuma ficha de personagem neste navegador. Crie uma nova ou importe um JSON.</p>'
        : !visiveis.length ? '<p class="sel-vazio">Nenhuma ficha encontrada.</p>'
        : carrossel(visiveis)}
    </main>`;
    raiz.querySelector('[data-sel-nova]')?.addEventListener('click', () => enviar({ tipo: 'dossie.seletor-nova' }));
    raiz.querySelector('[data-sel-json]')?.addEventListener('click', () => enviar({ tipo: 'dossie.seletor-importar-json' }));
    const campo = raiz.querySelector('[data-sel-busca]');
    campo?.addEventListener('input', () => { busca = campo.value; indice = 0; direcao = 0; const pos = campo.selectionStart; desenhar(); const novo = raiz.querySelector('[data-sel-busca]'); novo?.focus(); novo?.setSelectionRange(pos, pos); });
    raiz.querySelector('[data-sel-pasta]')?.addEventListener('change', e => { pasta = e.target.value; indice = 0; direcao = 0; desenhar(); });
    raiz.querySelectorAll('[data-sel-ir]').forEach(b => b.addEventListener('click', () => ir(Number(b.dataset.selIr))));
    raiz.querySelector('[data-sel-confirmar]')?.addEventListener('click', e => confirmar(e.currentTarget.dataset.selConfirmar));
    raiz.querySelector('[data-sel-atual]')?.addEventListener('dblclick', e => confirmar(e.currentTarget.dataset.selAtual));
  };

  desenhar();
  try {
    const { fichas: salvas } = await armazenamento.carregar();
    locais = fichasDePersonagem(salvas);
    fichas = locais;
    try { pastas = normalizeFolders(await loadFoldersFromStorage({ idbGet: armazenamento.idbGet })); } catch { /* pastas padrão */ }
  } catch (e) { console.warn('Seletor: sem fichas locais', e); }
  estado.carregando = false;
  desenhar();
  // A casca manda a sessão do Discord (nunca na URL): o seletor envia as fichas locais ao cofre da conta e lista as de lá também.
  const aoMensagem = async ev => {
    if (!pai || ev.source !== pai || ev.origin !== location.origin) return;
    const d = ev.data;
    if (!d || d.tipo !== 'mesa.seletor-sessao' || typeof d.sessao !== 'string' || typeof d.baseSala !== 'string') return;
    const { remotas } = await (deps.sincronizar || sincronizarComCofre)({ sessao: d.sessao, baseSala: d.baseSala, locais });
    fichas = fichasDePersonagem(mesclarFichas(locais, remotas));
    desenhar();
  };
  addEventListener('message', aoMensagem);
  addEventListener('keydown', e => {
    if (e.target?.matches?.('input, select')) return;
    if (e.key === 'ArrowLeft') ir(-1);
    else if (e.key === 'ArrowRight') ir(1);
    else if (e.key === 'Enter' && atuais.length) confirmar(atuais[((indice % atuais.length) + atuais.length) % atuais.length].id);
  });
  enviar({ tipo: 'dossie.seletor-pronto' });
  return { recarregar: async () => { fichas = fichasDePersonagem((await armazenamento.carregar()).fichas); desenhar(); }, fichas: () => fichas };
}
