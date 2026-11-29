// Ponto de entrada: `?modo=seletor` monta só a galeria de fichas do Saguão; qualquer outra URL carrega o Dossiê inteiro.
// Na volta do login do Discord (`?code=&state=`), conclui o login e limpa a URL antes de abrir o Dossiê.
const params = new URLSearchParams(location.search);
if (params.get('modo') === 'seletor') {
  import('./seletor-saguao.js').then(m => m.montarSeletor());
} else {
  (async () => {
    if (params.has('code') || params.has('error')) {
      try {
        const conta = await import('./conta-discord.js');
        const resultado = await conta.concluirLogin({ search: location.search });
        history.replaceState(null, '', `${location.pathname}${conta.queryLimpa(location.search)}${location.hash}`);
        if (resultado !== 'ok' && resultado !== 'sem-codigo') sessionStorage.setItem('dossie:discord-aviso', resultado);
      } catch { /* abre o Dossiê mesmo assim */ }
    }
    import('./app.js');
  })();
}
