// A ligação da Ficha com a mesa (contrato v1, ver Atlas/docs/PLATAFORMA.md): publica as personagens na campanha ativa (com o retrato),
// avisa as rolagens e os recursos (PV/PD) de quem está aberta, e abre uma ficha quando outro aplicativo pede.
// Sem BroadcastChannel ou IndexedDB, ou sem campanha ativa, nada muda. As fichas de ameaça (`systemMode: 'threat'`, os monstros) entram na campanha
// como entidades `ameaca`, separadas dos `personagem`.
// Personagens: entra numa campanha a ficha criada com ela ativa e a que o mestre leva pelo menu ("Levar para a campanha"); as que já
// estão lá seguem atualizadas (nome, retrato) e saem quando a ficha é apagada. As outras não entram sozinhas.
// Ameaças: todas entram em toda campanha (o bestiário fica à mão), com a etiqueta `da-campanha` se a ameaça é desta campanha (criada
// com ela ativa, levada pelo menu ou usada: ligada a algo ou num roteiro) e `bestiário` se não é. O filtro de etiquetas da Mesa separa as duas.
// Na primeira vez que a Ficha vê uma campanha com esta regra, tira dela os personagens que a própria Ficha publicou em massa e que ninguém
// usa (fora do elenco, sem ligação e fora de todo roteiro).
import { abrirRepositorioCampanha, criarBarramento, criarRef } from '../vendor/mesa-core/index.js';

const CHAVE_CAMPANHA_ATIVA = 'mesa:campanha-ativa';
/** Ids de todas as fichas que esta Ficha já viu. Uma ficha fora daqui é nova: entra na campanha ativa. */
const CHAVE_CONHECIDAS = 'mesa:ficha-conhecidas';
/** Fichas que o mestre levou para a campanha pelo menu. */
const chaveDasLevadas = campanhaId => `mesa:ficha-levadas:${campanhaId}`;
/** Marca de que a limpeza única da publicação em massa já rodou nesta campanha. */
const chaveDaLimpeza = campanhaId => `mesa:ficha-limpeza-v1:${campanhaId}`;
const chaveDaRef = r => `${r.app}/${r.tipo}/${r.id}`;
/** Etiquetas das ameaças: desta campanha ou só do bestiário. */
export const TAG_DA_CAMPANHA = 'da-campanha';
export const TAG_BESTIARIO = 'bestiário';
const ehTagNossa = t => t === TAG_DA_CAMPANHA || t === TAG_BESTIARIO;
const LIMITE_RETRATO = 512 * 1024;
const LADO_RETRATO = 256;

export const refDaFicha = id => criarRef('ficha', 'ficha', String(id));

/** Ficha de personagem (de jogador). */
export const ehPersonagem = sheet => !!sheet && sheet.systemMode !== 'threat' && !!sheet.id;
/** Ficha de ameaça (monstro). */
export const ehAmeaca = sheet => !!sheet && sheet.systemMode === 'threat' && !!sheet.id;
/** O que vai para a campanha: personagens e ameaças. */
export const ehPublicavel = sheet => ehPersonagem(sheet) || ehAmeaca(sheet);
export const tipoDaEntidade = sheet => (ehAmeaca(sheet) ? 'ameaca' : 'personagem');

/** PV e PD da ficha, conforme o modo: Ordem 1 usa Sanidade (ou PE na regra opcional); Ordem 2, PD; ameaça, só PV (PD zero). `null` se não há de onde tirar. */
export function recursosDaFicha(sheet) {
    const n = v => Math.max(0, Math.round(Number(v) || 0));
    // Ameaça: só PV (o `pvMax`; `maxPv` é um resto do modelo de personagem), sem PD. Sem vida máxima, não há o que mostrar.
    if (ehAmeaca(sheet)) { const max = n(sheet.pvMax) > 0 ? n(sheet.pvMax) : n(sheet.maxPv); return max > 0 ? { pv: n(sheet.pv), pvMax: max, pd: 0, pdMax: 0 } : null; }
    if (!ehPersonagem(sheet)) return null;
    const original = sheet.systemMode === 'original';
    const pd = original ? (sheet.usaPD ? sheet.pe : sheet.san) : sheet.pd;
    const pdMax = original ? (sheet.usaPD ? sheet.maxPe : sheet.maxSan) : sheet.maxPd;
    return { pv: n(sheet.pv), pvMax: n(sheet.maxPv), pd: n(pd), pdMax: n(pdMax) };
}

const campanhaAtiva = () => {
    try { return localStorage.getItem(CHAVE_CAMPANHA_ATIVA) || null; } catch { return null; }
};

/** O retrato como imagem pequena (até 512 KB; reduz para 256 px se precisar). `undefined` se não há imagem ou não deu para ler. */
export async function retratoDaFicha(sheet) {
    let url = sheet?.tokenImage;
    if (typeof url === 'string' && url.startsWith('/assets/')) url = `.${url}`;      // como o resto da Ficha: os assets ficam junto do aplicativo, não na raiz do servidor
    if (!url || typeof url !== 'string' || !/^(data:image\/|blob:|https?:|\/|\.\/)/i.test(url)) return undefined;
    try {
        const blob = await (await fetch(url)).blob();
        if (!blob.type.startsWith('image/')) return undefined;
        if (blob.size <= LIMITE_RETRATO) return blob;
        const bitmap = await createImageBitmap(blob);
        const escala = Math.min(1, LADO_RETRATO / Math.max(bitmap.width, bitmap.height));
        const tela = new OffscreenCanvas(Math.max(1, Math.round(bitmap.width * escala)), Math.max(1, Math.round(bitmap.height * escala)));
        tela.getContext('2d').drawImage(bitmap, 0, 0, tela.width, tela.height);
        bitmap.close?.();
        const menor = await tela.convertToBlob({ type: 'image/webp', quality: 0.85 });
        return menor.size <= LIMITE_RETRATO ? menor : undefined;
    } catch { return undefined; }
}

/**
 * Liga a Ficha à mesa. `ficha` entrega o que o aplicativo sabe: `fichas()` (todas), `aberta()` (a ficha na tela) e `abrir(id)`.
 * Devolve `{ publicarRolagem, publicarRecursos, sincronizar, parar }` — todos seguros de chamar mesmo sem plataforma.
 */
export async function iniciarMesa(ficha, ambiente = {}) {
    const semMesa = { publicarRolagem() {}, publicarRecursos() {}, async sincronizar() {}, agendar() {}, async levarParaCampanha() { return { ok: false, motivo: 'Sem a plataforma da mesa.' }; }, async tirarDaCampanha() { return { ok: false, motivo: 'Sem a plataforma da mesa.' }; }, naCampanha: () => false, temCampanha: () => false, parar() {} };
    const BC = ambiente.BroadcastChannel ?? globalThis.BroadcastChannel, idb = ambiente.indexedDB ?? globalThis.indexedDB;
    if (typeof BC === 'undefined' || typeof idb === 'undefined') return semMesa;
    let repositorio, barramento;
    try {
        repositorio = await abrirRepositorioCampanha({ app: 'ficha', ...(ambiente.indexedDB ? { idb: ambiente.indexedDB } : {}) });
        barramento = criarBarramento({ app: 'ficha', campanhaId: campanhaAtiva(), ...(ambiente.criarCanal ? { criarCanal: ambiente.criarCanal } : {}) });
    } catch (erro) {
        console.warn('Ficha: sem a plataforma da mesa', erro);
        return semMesa;
    }

    let sincronizando = false, denovo = false, temporizador = null;
    const armazenamento = ambiente.localStorage ?? globalThis.localStorage;
    const assinaturas = new Map(); // id da ficha → `nome|tokenImage`, para só regravar (e só reler o retrato) quando mudar
    const chaveDasAssinaturas = campanhaId => `mesa:ficha-assinaturas:${campanhaId}`;
    /** As assinaturas ficam no navegador, por campanha: sem isso, cada vez que a Ficha abre ela releria e regravaria o retrato de todas as fichas. */
    function lerAssinaturas(campanhaId) {
        assinaturas.clear();
        try { for (const [id, a] of Object.entries(JSON.parse(armazenamento?.getItem(chaveDasAssinaturas(campanhaId)) ?? '{}'))) if (typeof a === 'string') assinaturas.set(id, a); } catch { /* sem armazenamento: vale só nesta sessão */ }
    }
    function gravarAssinaturas(campanhaId) {
        try { armazenamento?.setItem(chaveDasAssinaturas(campanhaId), JSON.stringify(Object.fromEntries(assinaturas))); } catch { /* ignora */ }
    }
    const respirar = () => new Promise(resolve => setTimeout(resolve, 0));
    function lerConjunto(chave) {
        try { const v = armazenamento?.getItem(chave); if (v == null) return null; const lista = JSON.parse(v); return Array.isArray(lista) ? new Set(lista.map(String)) : null; } catch { return null; }
    }
    function gravarConjunto(chave, conjunto) {
        try { armazenamento?.setItem(chave, JSON.stringify([...conjunto])); } catch { /* ignora */ }
    }
    /** Fichas com entidade na campanha ativa (o menu da ficha lê isto sem esperar o banco). */
    let presentes = new Set(), campanhaDasPresentes = null;

    /** O que a campanha usa: ids no elenco e refs em ligações e roteiros. `usada(e)` diz se a entidade aparece em algum desses. */
    async function lerUso(campanhaId) {
        const campanha = await repositorio.obterCampanha(campanhaId);
        const porId = new Set(campanha?.elenco ?? []), porRef = new Set();
        for (const l of await repositorio.listarLigacoes(campanhaId)) { porRef.add(chaveDaRef(l.de)); porRef.add(chaveDaRef(l.para)); }
        for (const s of await repositorio.listarSessoes(campanhaId)) for (const r of s.roteiro ?? []) porRef.add(chaveDaRef(r));
        return e => porId.has(e.id) || porRef.has(`mesa/entidade/${e.id}`) || e.refs.some(x => porRef.has(chaveDaRef(x)));
    }

    /** Tira da campanha os personagens que a Ficha publicou e que nada usa. Ameaças ficam (viram bestiário). */
    async function limparNaoUsadas(campanhaId) {
        const usada = await lerUso(campanhaId);
        const levadas = lerConjunto(chaveDasLevadas(campanhaId)) ?? new Set();
        let removidas = 0;
        for (const e of await repositorio.listarEntidades(campanhaId)) {
            if (e.criadaPor !== 'ficha' || e.tipo === 'ameaca') continue;
            const r = e.refs.find(x => x.app === 'ficha' && x.tipo === 'ficha');
            if (!usada(e) && !(r && levadas.has(r.id))) { await repositorio.removerEntidade(e.id); removidas++; }
        }
        return removidas;
    }

    async function sincronizar() {
        if (sincronizando) { denovo = true; return; }
        sincronizando = true;
        const todas = ficha.fichas(), publicaveis = todas.filter(ehPublicavel);
        // Lista vazia pode ser a Ficha ainda carregando: não conta como "já vi tudo".
        let conhecidas = lerConjunto(CHAVE_CONHECIDAS);
        if (!conhecidas && todas.length) { conhecidas = new Set(todas.map(x => String(x.id))); gravarConjunto(CHAVE_CONHECIDAS, conhecidas); }
        const novas = new Set(conhecidas ? publicaveis.filter(x => !conhecidas.has(String(x.id))).map(x => String(x.id)) : []);
        const marcarConhecidas = () => { if (!todas.length) return; const c = conhecidas ?? new Set(); for (const x of todas) c.add(String(x.id)); gravarConjunto(CHAVE_CONHECIDAS, c); };
        const campanhaId = campanhaAtiva();
        try {
            if (!campanhaId || !(await repositorio.obterCampanha(campanhaId))) { presentes = new Set(); campanhaDasPresentes = null; marcarConhecidas(); return; }
            barramento.campanhaId = campanhaId;
            if (todas.length && !armazenamento?.getItem(chaveDaLimpeza(campanhaId))) {
                await limparNaoUsadas(campanhaId);
                try { armazenamento?.setItem(chaveDaLimpeza(campanhaId), String(Date.now())); } catch { /* ignora */ }
            }
            lerAssinaturas(campanhaId);
            const levadas = lerConjunto(chaveDasLevadas(campanhaId)) ?? new Set();
            // Nova com a campanha ativa: fica desta campanha de vez.
            let mudouLevadas = false;
            for (const id of novas) if (!levadas.has(id)) { levadas.add(id); mudouLevadas = true; }
            if (mudouLevadas) gravarConjunto(chaveDasLevadas(campanhaId), levadas);
            const usada = await lerUso(campanhaId);
            let lidas = 0;
            for (const sheet of publicaveis) {
                const ref = refDaFicha(sheet.id), nome = String(sheet.name || 'Sem nome').trim() || 'Sem nome', tipo = tipoDaEntidade(sheet);
                const existente = await repositorio.entidadeDaRef(campanhaId, ref);
                const ameaca = tipo === 'ameaca';
                if (!existente && !ameaca && !levadas.has(String(sheet.id))) continue;
                if (existente && existente.criadaPor !== 'ficha') continue;
                const daCampanha = levadas.has(String(sheet.id)) || (existente ? usada(existente) : false);
                const tags = ameaca
                    ? [...(existente?.tags ?? []).filter(t => !ehTagNossa(t)), daCampanha ? TAG_DA_CAMPANHA : TAG_BESTIARIO]
                    : (existente?.tags ?? []);
                const mesmasTags = !!existente && existente.tags.length === tags.length && existente.tags.every((t, i) => t === tags[i]);
                const assinatura = `${nome}|${sheet.tokenImage ?? ''}`;
                if (existente && mesmasTags && assinaturas.get(sheet.id) === assinatura) continue;
                if (existente && mesmasTags === false && assinaturas.get(sheet.id) === assinatura && existente.nome === nome) {
                    await repositorio.salvarEntidade({ ...existente, tags });
                    continue;
                }
                const retrato = await retratoDaFicha(sheet);
                if (!existente) await repositorio.criarEntidade({ campanhaId, tipo, nome, refs: [ref], tags, ...(retrato ? { retrato } : {}) });
                else {
                    const { retrato: _antigo, ...resto } = existente;
                    await repositorio.salvarEntidade({ ...resto, nome, tags, ...(retrato ? { retrato } : (_antigo && !sheet.tokenImage ? {} : _antigo ? { retrato: _antigo } : {})) });
                }
                assinaturas.set(sheet.id, assinatura);
                if (++lidas % 6 === 0) await respirar();      // dezenas de fichas com retrato: não prende a tela
            }
            // Ficha apagada na Ficha: a entidade que ela publicou sai da campanha (só as que a Ficha criou). Lista vazia não apaga nada: pode ser a Ficha ainda carregando.
            if (todas.length) {
                const vivas = new Set(todas.map(x => x.id));
                for (const e of await repositorio.listarEntidades(campanhaId)) {
                    const r = e.refs.find(x => x.app === 'ficha' && x.tipo === 'ficha');
                    if (e.criadaPor === 'ficha' && r && !vivas.has(r.id)) { await repositorio.removerEntidade(e.id); assinaturas.delete(r.id); ultimosRecursos.delete(r.id); }
                }
            }
            gravarAssinaturas(campanhaId);
            marcarConhecidas();
            // No menu, "na campanha" é: personagem com entidade aqui; ameaça com a etiqueta desta campanha.
            const agora = new Set();
            for (const e of await repositorio.listarEntidades(campanhaId)) {
                if (e.tipo === 'ameaca' && !e.tags.includes(TAG_DA_CAMPANHA)) continue;
                for (const r of e.refs) if (r.app === 'ficha' && r.tipo === 'ficha') agora.add(r.id);
            }
            presentes = agora; campanhaDasPresentes = campanhaId;
            for (const sheet of publicaveis) if (presentes.has(sheet.id)) publicarRecursos(sheet);
        } catch (erro) {
            console.warn('Ficha: não consegui publicar as fichas na campanha', erro);
        } finally {
            sincronizando = false;
            if (denovo) { denovo = false; agendar(); }
        }
    }
    function agendar() { clearTimeout(temporizador); temporizador = setTimeout(() => { void sincronizar(); }, 400); }

    /** Leva uma ficha que já existia para a campanha ativa (o menu da ficha). */
    async function levarParaCampanha(id) {
        const campanhaId = campanhaAtiva(), sheet = ficha.fichas().find(x => String(x.id) === String(id));
        if (!campanhaId) return { ok: false, motivo: 'Nenhuma campanha ativa na Mesa.' };
        if (!sheet || !ehPublicavel(sheet)) return { ok: false, motivo: 'Esta ficha não existe aqui.' };
        const levadas = lerConjunto(chaveDasLevadas(campanhaId)) ?? new Set();
        levadas.add(String(sheet.id)); gravarConjunto(chaveDasLevadas(campanhaId), levadas);
        await sincronizar();
        return { ok: true };
    }
    /** Tira a ficha da campanha ativa: o personagem sai; a ameaça volta a ser só do bestiário (se nada a usa). A ficha continua aqui. */
    async function tirarDaCampanha(id) {
        const campanhaId = campanhaAtiva();
        if (!campanhaId) return { ok: false, motivo: 'Nenhuma campanha ativa na Mesa.' };
        const levadas = lerConjunto(chaveDasLevadas(campanhaId)) ?? new Set();
        levadas.delete(String(id)); gravarConjunto(chaveDasLevadas(campanhaId), levadas);
        const existente = await repositorio.entidadeDaRef(campanhaId, refDaFicha(id));
        if (existente && existente.criadaPor !== 'ficha') return { ok: false, motivo: 'Outro aplicativo pôs esta ficha na campanha; tire por lá.' };
        if (existente && existente.tipo !== 'ameaca') await repositorio.removerEntidade(existente.id);
        presentes.delete(String(id));
        await sincronizar();
        return { ok: true };
    }
    const naCampanha = id => campanhaDasPresentes !== null && campanhaDasPresentes === campanhaAtiva() && presentes.has(String(id));
    const temCampanha = () => !!campanhaAtiva();

    const ultimosRecursos = new Map();
    function publicarRecursos(sheet = ficha.aberta()) {
        const r = recursosDaFicha(sheet); if (!r || !campanhaAtiva()) return;
        const chave = JSON.stringify(r); if (ultimosRecursos.get(sheet.id) === chave) return; ultimosRecursos.set(sheet.id, chave);
        barramento.campanhaId = campanhaAtiva();
        try { barramento.emitir('ficha.recursos', { ficha: refDaFicha(sheet.id), ...r }); } catch (erro) { console.warn('Ficha: recursos não enviados', erro); }
    }
    function publicarRolagem(sheet, { titulo, total, modificador }) {
        if (!ehPublicavel(sheet) || !campanhaAtiva() || !Number.isFinite(Number(total))) return;
        barramento.campanhaId = campanhaAtiva();
        try { barramento.emitir('ficha.rolagem', { ficha: refDaFicha(sheet.id), titulo: String(titulo || 'Rolagem'), total: Number(total), ...(Number.isFinite(Number(modificador)) ? { modificador: Number(modificador) } : {}) }); }
        catch (erro) { console.warn('Ficha: rolagem não enviada', erro); }
    }

    barramento.atender('ficha.abrir', dados => {
        const ref = dados?.ref;
        if (ref?.app !== 'ficha' || ref.tipo !== 'ficha') return { ok: false, motivo: 'A Ficha só abre fichas suas.' };
        if (!ficha.fichas().some(s => s.id === ref.id)) return { ok: false, motivo: 'Esta ficha não existe aqui.' };
        ficha.abrir(ref.id);
        return { ok: true };
    });

    barramento.atender('ficha.ajustar-recursos', dados => {
        const ref = dados?.ficha;
        if (ref?.app !== 'ficha' || ref.tipo !== 'ficha') return { ok: false, motivo: 'A Ficha só ajusta recursos de fichas suas.' };
        const sheet = ficha.fichas().find(s => s.id === ref.id);
        if (!sheet) return { ok: false, motivo: 'Esta ficha não existe aqui.' };

        const n = v => Math.max(0, Math.round(Number(v) || 0));
        const maxPv = ehAmeaca(sheet) ? (n(sheet.pvMax) > 0 ? n(sheet.pvMax) : n(sheet.maxPv)) : n(sheet.maxPv);
        const atualPv = n(sheet.pv);

        if (dados.pv !== undefined || dados.deltaPv !== undefined) {
            let novoPv = atualPv;
            if (dados.pv !== undefined) {
                novoPv = Math.round(Number(dados.pv) || 0);
            } else if (dados.deltaPv !== undefined) {
                novoPv = Math.round(atualPv + Number(dados.deltaPv));
            }
            novoPv = Math.min(maxPv, Math.max(0, novoPv));
            sheet.pv = novoPv;
        }

        if (ehPersonagem(sheet)) {
            const original = sheet.systemMode === 'original';
            const campoPd = original ? (sheet.usaPD ? 'pe' : 'san') : 'pd';
            const campoMaxPd = original ? (sheet.usaPD ? 'maxPe' : 'maxSan') : 'maxPd';
            const maxPd = n(sheet[campoMaxPd]);
            const atualPd = n(sheet[campoPd]);

            if (dados.pd !== undefined || dados.deltaPd !== undefined) {
                let novoPd = atualPd;
                if (dados.pd !== undefined) {
                    novoPd = Math.round(Number(dados.pd) || 0);
                } else if (dados.deltaPd !== undefined) {
                    novoPd = Math.round(atualPd + Number(dados.deltaPd));
                }
                novoPd = Math.min(maxPd, Math.max(0, novoPd));
                sheet[campoPd] = novoPd;
            }
        }

        ficha.atualizar?.(sheet);
        publicarRecursos(sheet);
        return { ok: true, ...(recursosDaFicha(sheet) ?? {}) };
    });
    const aoMudarCampanha = event => { if (event.key === CHAVE_CAMPANHA_ATIVA) agendar(); };
    globalThis.addEventListener?.('storage', aoMudarCampanha);
    agendar();
    return {
        publicarRolagem, publicarRecursos, sincronizar, agendar, levarParaCampanha, tirarDaCampanha, naCampanha, temCampanha,
        parar() { clearTimeout(temporizador); globalThis.removeEventListener?.('storage', aoMudarCampanha); barramento.fechar(); },
    };
}
