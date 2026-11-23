// Card do jogador na mesa online (`?sala=<id>&vista=card`): cabe no painel de 360 px ao lado do mapa.
// Só desenha. As rolagens usam os ganchos que a ficha já tem (`data-roll`, `data-expression`,
// `data-original-roll-attr`, `data-roll-skill`), então saem com os mesmos dados 3D e o mesmo `ficha.rolagem`.
// Os recursos usam `data-cartao-recurso="<chave>:<delta>"`, tratado no app.js (com limite no máximo).

const RECURSOS_ORDEM2 = [
  { chave: 'pv', max: s => s.maxPv, rotulo: 'PV', nome: 'Vida', cor: 'vida' },
  { chave: 'pd', max: s => s.maxPd, rotulo: 'PD', nome: 'Determinação', cor: 'mente' },
];

function recursosOriginais(s, calc) {
  const lista = [{ chave: 'pv', max: calc.pv, rotulo: 'PV', nome: 'Vida', cor: 'vida' }];
  if (s.usaPD) lista.push({ chave: 'pe', max: calc.pe, rotulo: 'PD', nome: 'Determinação', cor: 'mente' });
  else {
    lista.push({ chave: 'san', max: calc.san, rotulo: 'SAN', nome: 'Sanidade', cor: 'mente' });
    if (calc.pe(s) > 0) lista.push({ chave: 'pe', max: calc.pe, rotulo: 'PE', nome: 'Esforço', cor: 'esforco' });
  }
  return lista;
}

function barra(s, r, safe) {
  const max = Math.max(0, Math.round(Number(r.max(s)) || 0));
  const atual = Math.max(0, Math.round(Number(s[r.chave]) || 0));
  const temp = Math.max(0, Math.round(Number(s[`${r.chave}Temp`]) || 0));
  const fracao = max > 0 ? Math.min(1, atual / max) : 0;
  const nivel = fracao <= 0.25 ? 'critico' : fracao <= 0.5 ? 'baixo' : '';
  return `<div class="cj-recurso cj-${r.cor} ${nivel}" data-resource-key="${r.chave}">
    <div class="cj-recurso-topo"><span class="cj-recurso-rotulo">${r.rotulo}</span><span class="cj-recurso-nome">${safe(r.nome)}</span>
      <span class="cj-recurso-num"><b>${atual}</b><small>/ ${max}</small>${temp ? `<em>+${temp}</em>` : ''}</span></div>
    <div class="cj-recurso-linha">
      <button type="button" class="cj-passo" data-cartao-recurso="${r.chave}:-1" aria-label="Menos 1 ${r.rotulo}">−</button>
      <div class="cj-barra" role="meter" aria-label="${safe(r.nome)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${atual}"><i style="width:${(fracao * 100).toFixed(1)}%"></i></div>
      <button type="button" class="cj-passo" data-cartao-recurso="${r.chave}:1" aria-label="Mais 1 ${r.rotulo}">+</button>
    </div></div>`;
}

function acoes(ctx) {
  const lista = [];
  for (const schema of ['items', 'abilities']) for (const card of ctx.visibleCards(schema)) for (const a of card.actions || []) {
    if (!a?.expression) continue;
    const lados = (String(a.expression).match(/d(4|6|8|10|12|20)/i) || [])[1] || 20;
    lista.push(`<button type="button" class="cj-acao" data-expression="${ctx.safe(a.expression)}" data-roll-title="${ctx.safe(a.name || card.title)}" data-card-id="${ctx.safe(card.id)}" data-action-id="${ctx.safe(a.id)}">
      ${ctx.die(lados, 'cj-dado-mini', true)}<span><b>${ctx.safe(a.name || card.title)}</b><small>${ctx.safe(card.title)} · ${ctx.safe(a.expression)}</small></span></button>`);
  }
  return lista;
}

function periciasOrdem2(s, ctx) {
  const linha = sk => {
    const attrDie = s.attributes?.[sk.attribute] || 4, treinada = sk.skillDie > 4, extra = Number(sk.extra) || 0;
    return `<button type="button" class="cj-pericia ${treinada ? 'treinada' : ''}" data-roll="${ctx.safe(sk.name)}|${sk.skillDie},${attrDie}|${extra}" data-roll-labels="PERÍCIA|${ctx.safe(String(sk.attribute || '').toUpperCase())}">
      <span class="cj-pericia-nome">${ctx.safe(sk.name)}</span>
      <span class="cj-pericia-dados">${ctx.die(sk.skillDie, 'cj-dado-mini', treinada)}<i>+</i>${ctx.die(attrDie, 'cj-dado-mini', treinada)}${extra ? `<em>${extra > 0 ? '+' : ''}${extra}</em>` : ''}</span></button>`;
  };
  const skills = Array.isArray(s.skills) ? s.skills : [];
  return { treinadas: skills.filter(sk => sk.skillDie > 4).map(linha), outras: skills.filter(sk => !(sk.skillDie > 4)).map(linha) };
}

function periciasOriginais(s, ctx) {
  const linha = p => {
    const st = s.pericias?.[p.id] || { treino: 0, extra: 0 };
    const bonus = (Number(st.treino) || 0) + (Number(st.extra) || 0);
    return `<button type="button" class="cj-pericia ${st.treino > 0 ? 'treinada' : ''}" data-roll-skill="${ctx.safe(p.id)}">
      <span class="cj-pericia-nome">${ctx.safe(p.nome)}</span>
      <span class="cj-pericia-dados"><small>${ctx.safe(String(p.atributo || '').toUpperCase())}</small>${bonus ? `<em>${bonus > 0 ? '+' : ''}${bonus}</em>` : ''}</span></button>`;
  };
  const lista = ctx.ORIGINAL_PERICIAS || [];
  return { treinadas: lista.filter(p => (s.pericias?.[p.id]?.treino || 0) > 0).map(linha), outras: lista.filter(p => !((s.pericias?.[p.id]?.treino || 0) > 0)).map(linha) };
}

/** O card inteiro. `ctx`: { safe, safeUrl, die, visibleCards, accent, fichas, rollLogCount, ORIGINAL_ATRIBUTOS, ORIGINAL_PERICIAS, calc: { pv, pe, san }, classeNome?, nivelOriginal? }. */
export function renderCartaoJogador(s, ctx) {
  const original = s.systemMode === 'original';
  const { safe, safeUrl } = ctx;
  const retrato = s.tokenImage ? `<img src="${safeUrl(s.tokenImage)}" alt="" draggable="false">` : `<span>${safe((s.name || '?').trim().slice(0, 1).toUpperCase())}</span>`;
  const sub = original
    ? [ctx.classeNome, ctx.nivelOriginal].filter(Boolean)
    : [s.profile, s.occupation, s.level != null ? `Nível ${s.level}` : null].filter(Boolean);
  const recursos = (original ? recursosOriginais(s, ctx.calc) : RECURSOS_ORDEM2).map(r => barra(s, r, safe)).join('');
  const atributos = original
    ? (ctx.ORIGINAL_ATRIBUTOS || []).map(a => `<button type="button" class="cj-atributo" data-original-roll-attr="${safe(a.id)}" title="Rolar ${safe(a.nome)}"><b>${Number(s.atributos?.[a.id] ?? 1)}</b><span>${safe(a.abrev || a.nome)}</span></button>`).join('')
    : Object.entries(s.attributes || {}).map(([nome, valor]) => `<button type="button" class="cj-atributo" data-roll="${safe(nome)}|${valor}" data-roll-labels="${safe(nome.toUpperCase())}" title="Rolar ${safe(nome)} (d${valor})">${ctx.die(valor, 'cj-dado', true)}<span>${safe(nome)}</span></button>`).join('');
  const { treinadas, outras } = original ? periciasOriginais(s, ctx) : periciasOrdem2(s, ctx);
  const listaAcoes = acoes(ctx);
  const outrasFichas = (ctx.fichas || []).filter(f => f.id !== s.id && f.systemMode !== 'threat');
  return `<main class="cartao-jogador" style="--cj-acento:${safe(ctx.accent)}">
  <header class="cj-topo">
    <div class="cj-retrato">${retrato}</div>
    <div class="cj-ident"><h1>${safe(s.name || 'Sem nome')}</h1>${sub.length ? `<p>${sub.map(safe).join(' · ')}</p>` : ''}</div>
    <button type="button" class="cj-icone" data-open-roll-log title="Histórico de rolagens">${ctx.rollLogCount ? `<i>${ctx.rollLogCount}</i>` : ''}<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg></button>
  </header>
  ${outrasFichas.length ? `<nav class="cj-fichas" aria-label="Minhas fichas"><span class="ativa">${safe(s.name || 'Sem nome')}</span>${outrasFichas.map(f => `<button type="button" data-cartao-ficha="${safe(f.id)}">${safe(f.name || 'Sem nome')}</button>`).join('')}</nav>` : ''}
  <section class="cj-recursos">${recursos}</section>
  <section class="cj-bloco"><h2>Atributos</h2><div class="cj-atributos ${original ? 'originais' : ''}">${atributos}</div></section>
  ${listaAcoes.length ? `<section class="cj-bloco"><h2>Ações</h2><div class="cj-acoes">${listaAcoes.join('')}</div></section>` : ''}
  <section class="cj-bloco"><h2>Perícias${treinadas.length ? '' : ' <small>(nenhuma treinada)</small>'}</h2>
    <div class="cj-pericias">${treinadas.join('')}</div>
    ${outras.length ? `<details class="cj-outras"><summary>Outras perícias <small>${outras.length}</small></summary><div class="cj-pericias">${outras.join('')}</div></details>` : ''}
  </section>
  <footer class="cj-rodape"><button type="button" class="cj-completa" data-cartao-completa>Ficha completa</button></footer>
</main>`;
}
