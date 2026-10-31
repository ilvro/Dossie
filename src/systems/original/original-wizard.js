// Tutorial de criação de ficha (Ordem Paranormal 1). Toda ficha nova começa
// como Sobrevivente no Estágio 1; o tutorial conduz as escolhas iniciais em
// cinco passos e só grava na ficha ao concluir. Depois disso tudo continua
// editável pela ficha normalmente.
import { ATRIBUTOS, PERICIAS, ORIGENS, PODERES_GERAIS, CLASSES } from '../../data/original-data.js';
import { calcPvMax, calcPeMax, calcSanMax, definirRegraDeRecursos, poderValeNaRegra, PODERES_TREINO_OU_MAIS_2 } from './original-system.js';
import { aplicarTreinoDePoder } from './original-progression.js';
import { safe, rich } from './original-text.js';

// O primeiro passo (regra de recursos) é perguntado em toda ficha nova; os
// demais formam o tutorial e só aparecem quando ele está ligado.
const PASSOS = ['Recursos', 'Aprimoramento', 'Origem', 'Atributos', 'Perícias', 'Poder geral'];
const totalDePassos = () => (atual.soRecursos ? 1 : PASSOS.length);
const ATRIBUTO_INICIAL = 1;
const ATRIBUTO_MAX_CRIACAO = 3;
// Todos em 1, mais 3 pontos; zerar um atributo devolve 1 ponto. As duas regras
// juntas equivalem a: a soma dos cinco atributos é sempre 8.
const SOMA_ATRIBUTOS = ATRIBUTOS.length * ATRIBUTO_INICIAL + 3;
const PERICIAS_BASE = 2;
const TREINADO = 5;

let atual = null;

const DURACAO_SAIDA = 180;

// `animado`: deixa a janela sair com a animação de fechamento antes de removê-la.
export function fecharTutorial(animado = false) {
  if (!atual) return;
  const { el } = atual;
  atual = null;
  if (!animado) { el.remove(); return; }
  el.classList.add('closing');
  setTimeout(() => el.remove(), DURACAO_SAIDA);
}

// Os aprimoramentos dependem da regra: com PD, Sanidade e Esforço Aprimorado
// dão lugar a Determinação Aprimorada.
const aprimoramentos = d => CLASSES.sobrevivente.poderes.filter(p => poderValeNaRegra(p, { usaPD: !!d.usaPD }));
const origemDe = d => ORIGENS.find(o => o.id === d.origemId) || null;
const pericia = id => PERICIAS.find(p => p.id === id);
const pontosRestantes = d => SOMA_ATRIBUTOS - ATRIBUTOS.reduce((acc, a) => acc + d.atributos[a.id], 0);

// Perícias da origem: as que são ids entram treinadas; as descritas em texto
// ("Vontade ou Iniciativa") viram escolhas livres a mais.
function periciasDaOrigem(d) {
  const lista = origemDe(d)?.pericias || [];
  return { fixas: lista.filter(pericia), livres: lista.filter(p => !pericia(p)) };
}

function totalDeEscolhas(d) {
  const int = d.atributos.int;
  const treinamento = d.aprimoramento === 'Treinamento Aprimorado' ? int : 0;
  return Math.max(0, PERICIAS_BASE + int + treinamento) + periciasDaOrigem(d).livres.length;
}

// Tira da seleção o que deixou de valer (origem trocada, Intelecto reduzido).
function ajustarPericias(d) {
  const { fixas } = periciasDaOrigem(d);
  d.pericias = d.pericias.filter(id => !fixas.includes(id)).slice(0, totalDeEscolhas(d));
}

function passoValido(d, passo) {
  if (passo === 0) return d.usaPD !== null;
  if (passo === 1) return !!d.aprimoramento;
  if (passo === 2) return !!origemDe(d);
  if (passo === 3) return pontosRestantes(d) === 0;
  if (passo === 4) return d.pericias.length === totalDeEscolhas(d);
  return !!d.poderGeral;
}

function previa(d) {
  const ficha = {
    classeId: 'sobrevivente',
    nex: 0,
    trilhaId: '',
    atributos: d.atributos,
    usaPD: !!d.usaPD,
    poderesEscolhidos: d.aprimoramento ? [{ nome: d.aprimoramento }] : [],
  };
  return { pv: calcPvMax(ficha), pe: calcPeMax(ficha), san: calcSanMax(ficha) };
}

function renderRecursos(d) {
  const opcao = (valor, titulo, selo, texto) => `
    <button type="button" class="wiz-option ${d.usaPD === valor ? 'selected' : ''}" data-wiz-recursos="${valor ? 'pd' : 'pesan'}">
      <b>${titulo}</b>
      <em class="wiz-option-tag">${selo}</em>
      <span>${texto}</span>
    </button>`;
  return `
    <p class="wiz-lead">Como esta ficha acompanha o esforço e a mente do personagem? Dá para trocar depois, no modo edição.</p>
    <div class="wiz-options">
      ${opcao(false, 'PE e Sanidade', 'REGRA PADRÃO', 'Pontos de Esforço pagam habilidades e rituais; a Sanidade absorve o dano mental. Dois recursos separados.')}
      ${opcao(true, 'Pontos de Determinação', 'REGRA OPCIONAL', 'PE e Sanidade viram um recurso só. O PD paga habilidades e rituais e também absorve o dano mental — o medo custa mais caro.')}
    </div>`;
}

function renderAprimoramento(d) {
  return `
    <p class="wiz-lead">Todo personagem começa como uma pessoa comum, um <b>Sobrevivente</b> no Estágio 1. Escolha o que o diferencia.</p>
    <div class="wiz-options">
      ${aprimoramentos(d).map(p => `
        <button type="button" class="wiz-option ${d.aprimoramento === p.nome ? 'selected' : ''}" data-wiz-aprimoramento="${safe(p.nome)}">
          <b>${safe(p.nome)}</b>
          <span>${rich(p.descricao.replace(/^Habilidade inicial[^.]*\.\s*/, ''))}</span>
        </button>`).join('')}
    </div>`;
}

function renderOrigem(d) {
  const termo = d.buscaOrigem.trim().toLowerCase();
  const lista = ORIGENS.filter(o => !termo || o.nome.toLowerCase().includes(termo));
  const o = origemDe(d);
  return `
    <p class="wiz-lead">O que seu personagem fazia antes de encontrar o paranormal. A origem dá duas perícias treinadas e um poder.</p>
    <div class="wiz-split">
      <div class="wiz-list-col">
        <input type="text" class="wiz-search" data-wiz-busca="buscaOrigem" value="${safe(d.buscaOrigem)}" placeholder="BUSCAR ORIGEM…" aria-label="Buscar origem">
        <div class="wiz-list">
          ${lista.map(x => `<button type="button" class="wiz-row ${x.id === d.origemId ? 'selected' : ''}" data-wiz-origem="${safe(x.id)}">${safe(x.nome)}</button>`).join('') || '<p class="wiz-empty">Nenhuma origem encontrada.</p>'}
        </div>
      </div>
      <div class="wiz-detail">
        ${o ? `
          <h4>${safe(o.nome)}</h4>
          <div class="wiz-tags">${(o.pericias || []).map(p => `<span>${safe(pericia(p)?.nome || p)}</span>`).join('')}</div>
          <p>${safe(o.descricao || '')}</p>
          ${[o.poder, ...(o.poderesExtras || [])].filter(Boolean).map(p => `
            <div class="wiz-power">
              <b>${safe(p.nome)}</b>${p.alternativa ? '<em>alternativa — escolha um dos dois</em>' : ''}
              <span>${rich(p.descricao)}</span>
            </div>`).join('')}
        ` : '<p class="wiz-empty">Escolha uma origem na lista.</p>'}
      </div>
    </div>`;
}

function renderAtributos(d) {
  const resto = pontosRestantes(d);
  const temZero = ATRIBUTOS.some(a => d.atributos[a.id] === 0);
  const p = previa(d);
  return `
    <p class="wiz-lead">Todos os atributos começam em 1 e você tem <b>3 pontos</b> para distribuir (máximo ${ATRIBUTO_MAX_CRIACAO}). Você pode reduzir <b>um</b> atributo para 0 e ganhar 1 ponto a mais.</p>
    <div class="wiz-points ${resto === 0 ? 'done' : ''}">${resto === 0 ? 'Todos os pontos distribuídos' : `<b>${resto}</b> ${resto === 1 ? 'ponto restante' : 'pontos restantes'}`}</div>
    <div class="wiz-attrs">
      ${ATRIBUTOS.map(a => {
        const v = d.atributos[a.id];
        const podeDescer = v > 0 && (v > 1 || !temZero);
        const podeSubir = v < ATRIBUTO_MAX_CRIACAO && resto > 0;
        return `
          <div class="wiz-attr" data-attr="${a.id}">
            <small>${safe(a.abrev)}</small>
            <span>${safe(a.nome)}</span>
            <div class="wiz-attr-step">
              <button type="button" data-wiz-attr="${a.id}:-1" aria-label="Diminuir ${safe(a.nome)}" ${podeDescer ? '' : 'disabled'}>−</button>
              <b>${v}</b>
              <button type="button" data-wiz-attr="${a.id}:1" aria-label="Aumentar ${safe(a.nome)}" ${podeSubir ? '' : 'disabled'}>+</button>
            </div>
          </div>`;
      }).join('')}
    </div>
    <div class="wiz-preview"><span>PV <b>${p.pv}</b></span>${d.usaPD ? `<span>PD <b>${p.pe}</b></span>` : `<span>PE <b>${p.pe}</b></span><span>SAN <b>${p.san}</b></span>`}</div>`;
}

function renderPericias(d) {
  const { fixas, livres } = periciasDaOrigem(d);
  const total = totalDeEscolhas(d);
  const cheio = d.pericias.length >= total;
  const int = d.atributos.int;
  const partes = [`${PERICIAS_BASE} + Intelecto (${int})`];
  if (d.aprimoramento === 'Treinamento Aprimorado') partes.push(`${int} de Treinamento Aprimorado`);
  if (livres.length) partes.push(`${livres.length} da origem (${livres.join('; ')})`);
  return `
    <p class="wiz-lead">Escolha <b>${total}</b> ${total === 1 ? 'perícia' : 'perícias'} para treinar: ${safe(partes.join(' + '))}. As perícias da sua origem já vêm treinadas.</p>
    <div class="wiz-points ${cheio ? 'done' : ''}"><b>${d.pericias.length}</b> / ${total} escolhidas</div>
    <div class="wiz-skills">
      ${PERICIAS.map(p => {
        const daOrigem = fixas.includes(p.id);
        const marcada = d.pericias.includes(p.id);
        return `<button type="button" class="wiz-skill ${daOrigem ? 'origem' : ''} ${marcada ? 'selected' : ''}" data-wiz-pericia="${p.id}" ${daOrigem || (cheio && !marcada) ? 'disabled' : ''}>
          <span>${safe(p.nome)}</span><small>${daOrigem ? 'ORIGEM' : safe(p.atributo.toUpperCase())}</small>
        </button>`;
      }).join('')}
    </div>`;
}

function renderPoderGeral(d) {
  const termo = d.buscaPoder.trim().toLowerCase();
  const lista = PODERES_GERAIS.filter(p => !termo || p.nome.toLowerCase().includes(termo));
  const p = PODERES_GERAIS.find(x => x.nome === d.poderGeral);
  return `
    <p class="wiz-lead">Todo Sobrevivente começa com um <b>poder geral</b>. Confira o pré-requisito antes de escolher.</p>
    <div class="wiz-split">
      <div class="wiz-list-col">
        <input type="text" class="wiz-search" data-wiz-busca="buscaPoder" value="${safe(d.buscaPoder)}" placeholder="BUSCAR PODER…" aria-label="Buscar poder geral">
        <div class="wiz-list">
          ${lista.map(x => `<button type="button" class="wiz-row ${x.nome === d.poderGeral ? 'selected' : ''}" data-wiz-poder="${safe(x.nome)}">${safe(x.nome)}${x.preRequisito ? `<small>${safe(x.preRequisito)}</small>` : ''}</button>`).join('') || '<p class="wiz-empty">Nenhum poder encontrado.</p>'}
        </div>
      </div>
      <div class="wiz-detail">
        ${p ? `
          <h4>${safe(p.nome)}</h4>
          ${p.preRequisito ? `<div class="wiz-tags"><span>Pré-requisito: ${safe(p.preRequisito)}</span></div>` : ''}
          <p>${rich(p.descricao)}</p>
        ` : '<p class="wiz-empty">Escolha um poder na lista.</p>'}
      </div>
    </div>`;
}

const RENDER = [renderRecursos, renderAprimoramento, renderOrigem, renderAtributos, renderPericias, renderPoderGeral];

// O conteúdo é redesenhado a cada interação, então as animações são aplicadas
// só ao que acabou de mudar: a troca de passo (com direção) e o item tocado.
function desenhar() {
  const { el, d } = atual;
  const total = totalDePassos();
  const ultimo = d.passo === total - 1;
  const anterior = atual.passoDesenhado;
  const mudouPasso = anterior !== d.passo;
  const { fx } = atual;
  atual.passoDesenhado = d.passo;
  atual.fx = null;
  // Preserva o campo de busca e a rolagem das listas entre os redesenhos.
  const foco = el.querySelector('[data-wiz-busca]:focus');
  const cursor = foco ? foco.selectionStart : null;
  const rolagem = el.querySelector('.wiz-list')?.scrollTop || 0;
  el.querySelector('section').innerHTML = `
    <header class="wiz-head ${mudouPasso ? 'fx-step' : ''}">
      <small>NOVA FICHA${total > 1 ? ` · PASSO ${d.passo + 1} DE ${total}` : ''}</small>
      <h2>${safe(PASSOS[d.passo])}</h2>
      <ol class="wiz-steps" ${total > 1 ? '' : 'hidden'}>
        ${PASSOS.slice(0, total).map((nome, i) => `<li class="${i === d.passo ? 'current' : ''} ${i < d.passo ? 'done' : ''}"><button type="button" data-wiz-ir="${i}" ${i <= d.passo ? '' : 'disabled'} title="${safe(nome)}"><i>${i + 1}</i><span>${safe(nome)}</span></button></li>`).join('')}
      </ol>
    </header>
    <div class="wiz-body ${mudouPasso && anterior !== undefined ? (d.passo > anterior ? 'fx-next' : 'fx-prev') : ''}">${RENDER[d.passo](d)}</div>
    <footer class="wiz-foot">
      ${total > 1 ? '<button type="button" class="wiz-skip" data-wiz-pular>Pular tutorial</button>' : ''}
      <span></span>
      ${d.passo > 0 ? '<button type="button" class="wiz-back" data-wiz-voltar>VOLTAR</button>' : ''}
      <button type="button" class="wiz-next" data-wiz-avancar ${passoValido(d, d.passo) ? '' : 'disabled'}>${!ultimo ? 'CONTINUAR' : (total > 1 ? 'CRIAR PERSONAGEM' : 'CRIAR FICHA')}</button>
    </footer>`;
  const lista = el.querySelector('.wiz-list');
  if (lista && !mudouPasso) lista.scrollTop = rolagem;
  (fx || []).forEach(seletor => el.querySelectorAll(seletor).forEach(alvo => alvo.classList.add('fx-pick')));
  if (foco) {
    const novo = el.querySelector(`[data-wiz-busca="${foco.dataset.wizBusca}"]`);
    if (novo) { novo.focus(); novo.setSelectionRange(cursor, cursor); }
  }
}

// Grava a regra de recursos e deixa os pontos atuais cheios nessa regra.
function aplicarRecursos(sheet, d) {
  definirRegraDeRecursos(sheet, !!d.usaPD);
}

function concluir() {
  const { d, sheet, onFinish } = atual;
  if (atual.soRecursos) {
    aplicarRecursos(sheet, d);
    fecharTutorial(true);
    onFinish?.();
    return;
  }
  const { fixas } = periciasDaOrigem(d);
  sheet.classeId = 'sobrevivente';
  sheet.veioDeSobrevivente = true;
  sheet.nex = 0;
  sheet.origemId = d.origemId;
  sheet.atributos = { ...d.atributos };
  [...fixas, ...d.pericias].forEach(id => { if (sheet.pericias?.[id]) sheet.pericias[id].treino = Math.max(TREINADO, sheet.pericias[id].treino || 0); });
  const aprimoramento = aprimoramentos(d).find(p => p.nome === d.aprimoramento);
  const geral = PODERES_GERAIS.find(p => p.nome === d.poderGeral);
  sheet.poderesEscolhidos = [
    { nome: aprimoramento.nome, descricao: aprimoramento.descricao, preRequisito: aprimoramento.preRequisito, origemTipo: `Poder de ${CLASSES.sobrevivente.nome}`, bonus: aprimoramento.bonus || null },
    { nome: geral.nome, descricao: geral.descricao, preRequisito: geral.preRequisito, origemTipo: 'Poder Geral', bonus: geral.bonus || null },
  ];
  if (geral && PODERES_TREINO_OU_MAIS_2[geral.nome]) {
    aplicarTreinoDePoder(sheet, geral.nome, PODERES_TREINO_OU_MAIS_2[geral.nome]);
  }
  aplicarRecursos(sheet, d);
  fecharTutorial(true);
  onFinish?.();
}

function aoClicar(e) {
  const { d } = atual;
  const alvo = sel => e.target.closest(sel);
  let b;
  if ((b = alvo('[data-wiz-recursos]'))) {
    d.usaPD = b.dataset.wizRecursos === 'pd';
    // O aprimoramento já escolhido pode não existir na outra regra.
    if (!aprimoramentos(d).some(p => p.nome === d.aprimoramento)) d.aprimoramento = '';
    ajustarPericias(d);
    atual.fx = ['.wiz-option.selected'];
  }
  else if ((b = alvo('[data-wiz-aprimoramento]'))) { d.aprimoramento = b.dataset.wizAprimoramento; ajustarPericias(d); atual.fx = ['.wiz-option.selected']; }
  else if ((b = alvo('[data-wiz-origem]'))) { d.origemId = b.dataset.wizOrigem; ajustarPericias(d); atual.fx = ['.wiz-detail']; }
  else if ((b = alvo('[data-wiz-attr]'))) {
    const [id, delta] = b.dataset.wizAttr.split(':');
    d.atributos[id] = Math.max(0, Math.min(ATRIBUTO_MAX_CRIACAO, d.atributos[id] + Number(delta)));
    ajustarPericias(d);
    atual.fx = [`.wiz-attr[data-attr="${id}"] .wiz-attr-step b`, '.wiz-points', '.wiz-preview'];
  }
  else if ((b = alvo('[data-wiz-pericia]'))) {
    const id = b.dataset.wizPericia;
    if (d.pericias.includes(id)) d.pericias = d.pericias.filter(x => x !== id);
    else if (d.pericias.length < totalDeEscolhas(d)) d.pericias.push(id);
    atual.fx = [`.wiz-skill.selected[data-wiz-pericia="${id}"]`, '.wiz-points'];
  }
  else if ((b = alvo('[data-wiz-poder]'))) { d.poderGeral = b.dataset.wizPoder; atual.fx = ['.wiz-detail']; }
  else if ((b = alvo('[data-wiz-ir]'))) d.passo = Number(b.dataset.wizIr);
  else if (alvo('[data-wiz-voltar]')) d.passo = Math.max(0, d.passo - 1);
  else if (alvo('[data-wiz-avancar]')) {
    if (!passoValido(d, d.passo)) return;
    if (d.passo === totalDePassos() - 1) { concluir(); return; }
    d.passo += 1;
  }
  else if (alvo('[data-wiz-pular]')) { const { onSkip, onFinish, sheet } = atual; if (d.usaPD !== null) aplicarRecursos(sheet, d); fecharTutorial(true); (onSkip || onFinish)?.(); return; }
  else return;
  desenhar();
}

// Abre o tutorial para uma ficha recém-criada. `onFinish` é chamado depois de
// a ficha ser preenchida; `onSkip`, se o jogador pular.
// `soRecursos`: pergunta apenas a regra de recursos (tutorial desligado).
export function abrirTutorial(sheet, { onFinish, onSkip, soRecursos = false } = {}) {
  fecharTutorial();
  const el = document.createElement('div');
  el.className = 'modal open wizard-modal';
  el.id = 'original-wizard';
  el.innerHTML = '<div class="backdrop"></div><section role="dialog" aria-modal="true" aria-label="Criação de personagem"></section>';
  document.body.appendChild(el);
  atual = {
    el,
    sheet,
    onFinish,
    onSkip,
    soRecursos,
    d: {
      passo: 0,
      usaPD: null,
      aprimoramento: '',
      origemId: '',
      atributos: Object.fromEntries(ATRIBUTOS.map(a => [a.id, ATRIBUTO_INICIAL])),
      pericias: [],
      poderGeral: '',
      buscaOrigem: '',
      buscaPoder: '',
    },
  };
  el.addEventListener('click', aoClicar);
  el.addEventListener('input', e => {
    const campo = e.target.closest('[data-wiz-busca]');
    if (!campo) return;
    atual.d[campo.dataset.wizBusca] = campo.value;
    desenhar();
  });
  desenhar();
}
