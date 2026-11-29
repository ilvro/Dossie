// Ponto de entrada: `?modo=seletor` monta só a galeria de fichas do Saguão; qualquer outra URL carrega o Dossiê inteiro.
const params = new URLSearchParams(location.search);
if (params.get('modo') === 'seletor') {
  import('./seletor-saguao.js').then(m => m.montarSeletor());
} else {
  import('./app.js');
}
