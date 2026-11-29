// Seletor de fichas do Saguão da Mesa (`?modo=seletor`): galeria visual dentro de um iframe da casca.
// Lê as fichas de personagem do armazenamento local, e devolve a escolhida por `postMessage` à casca (mesma origem).
import { armazenamentoLocal, fichaParaSala } from './armazenamento.js';
import { sincronizarComCofre, mesclarFichas } from './cofre-fichas.js';
import { DEFAULT_FOLDERS, normalizeFolders, loadFoldersFromStorage } from './workspace/folders.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const corSegura = c => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#b00f2e');
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

  let locais = [], fichas = [], pastas = normalizeFolders(DEFAULT_FOLDERS), busca = '', pasta = 'todas';
  const estado = { carregando: true };
  const desenhar = () => {
    const visiveis = fichas.filter(f => fichaCombinaBusca(f, busca) && (pasta === 'todas' || f.folderId === pasta));
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
        : `<ul class="sel-grade">${visiveis.map(f => {
            const img = imagemSegura(f.tokenImage), cor = corSegura(f.themeColor);
            const rec = resumoDeRecursos(f).map(r => `<span class="sel-rec"><b>${r.rotulo}</b> ${r.atual}/${r.max}</span>`).join('');
            return `<li><button type="button" class="sel-cartao" style="--sel-cor:${cor}" data-sel-escolher="${esc(f.id)}">
              <span class="sel-retrato" ${img ? `style="background-image:url('${esc(img)}')"` : ''}>${img ? '' : esc(String(f.name || '?').trim().charAt(0).toUpperCase())}</span>
              <span class="sel-nome">${esc(f.name || 'Sem nome')}</span><span class="sel-sub">${esc(subtituloDaFicha(f))}</span><span class="sel-recursos">${rec}</span></button></li>`;
          }).join('')}</ul>`}
    </main>`;
    raiz.querySelector('[data-sel-nova]')?.addEventListener('click', () => enviar({ tipo: 'dossie.seletor-nova' }));
    raiz.querySelector('[data-sel-json]')?.addEventListener('click', () => enviar({ tipo: 'dossie.seletor-importar-json' }));
    const campo = raiz.querySelector('[data-sel-busca]');
    campo?.addEventListener('input', () => { busca = campo.value; const pos = campo.selectionStart; desenhar(); const novo = raiz.querySelector('[data-sel-busca]'); novo?.focus(); novo?.setSelectionRange(pos, pos); });
    raiz.querySelector('[data-sel-pasta]')?.addEventListener('change', e => { pasta = e.target.value; desenhar(); });
    raiz.querySelectorAll('[data-sel-escolher]').forEach(b => b.addEventListener('click', () => {
      const f = fichas.find(x => x.id === b.dataset.selEscolher);
      if (f) enviar({ tipo: 'dossie.seletor-escolheu', ficha: fichaParaSala(f) });
    }));
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
  enviar({ tipo: 'dossie.seletor-pronto' });
  return { recarregar: async () => { fichas = fichasDePersonagem((await armazenamento.carregar()).fichas); desenhar(); }, fichas: () => fichas };
}
