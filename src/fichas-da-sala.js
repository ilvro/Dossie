// Lógica pura do Dossiê do mestre com a mesa online (R13): rótulo do dono, quem pode receber uma ficha e o que fazer quando
// uma ficha da sala muda por fora. O app.js só liga isto à tela.

/** Nome do dono de uma ficha: o que a Mesa viu na sala (`nomes`, `membros`), ou um resto do id se ele nunca apareceu. */
export function nomeDoDono(info, discordId) {
  if (!discordId) return null;
  const n = info?.nomes?.[discordId] ?? info?.membros?.find(m => m.discordId === discordId)?.nome;
  return n ? String(n) : `jogador ${String(discordId).slice(-4)}`;
}

/** O rótulo sob o nome da ficha na pasta da sala: "Dono: Ana", ou "Dono: você" se a ficha é do próprio mestre. */
export function rotuloDoDono(info, fichaId) {
  const dono = info?.donos?.[fichaId];
  if (!dono) return '';
  if (info.eu && dono === info.eu.discordId) return 'Dono: você';
  return `Dono: ${nomeDoDono(info, dono)}`;
}

/** Os jogadores a quem o mestre pode entregar uma ficha: quem está na sala agora e os donos que já têm ficha nela (mesmo ausentes). */
export function jogadoresParaEntregar(info) {
  const lista = new Map();
  const euId = info?.eu?.discordId;
  for (const m of info?.membros ?? []) if (m.papel === 'jogador' && m.discordId !== euId) lista.set(m.discordId, { discordId: m.discordId, nome: String(m.nome), presente: true });
  for (const id of new Set(Object.values(info?.donos ?? {}))) {
    if (id === euId || lista.has(id)) continue;
    lista.set(id, { discordId: id, nome: nomeDoDono(info, id), presente: false });
  }
  return [...lista.values()].sort((a, b) => Number(b.presente) - Number(a.presente) || a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Uma `sala.ficha-atualizada` chegou. O que o mestre faz?
 *   'ignorar'   é o eco da própria gravação, ou a sala não está conectada;
 *   'aplicar'   troca a ficha (nova, ou sem edição em curso);
 *   'conflito'  o mestre está editando esta ficha: pergunta antes de trocar.
 * `editando`: a ficha tem rascunho (alterações de edição ainda não salvas) ou está aberta em modo de edição.
 */
export function decidirChegada({ propria, conectada = true, existe, editando }) {
  if (propria || !conectada) return 'ignorar';
  if (existe && editando) return 'conflito';
  return 'aplicar';
}

/** O texto do aviso de conflito. */
export const textoDoConflito = nome => `${nome || 'O jogador'} mexeu nesta ficha`;
export const BOTAO_VER_DELE = 'Ver a versão dele';
export const BOTAO_MANTER_MINHA = 'Manter a minha';
