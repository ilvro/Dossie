// A ligação da Ficha com a mesa (contrato v1, ver Atlas/docs/PLATAFORMA.md): publica as personagens na campanha ativa (com o retrato),
// avisa as rolagens e os recursos (PV/PD) de quem está aberta, e abre uma ficha quando outro aplicativo pede.
// Sem BroadcastChannel ou IndexedDB, ou sem campanha ativa, nada muda. Ameaças (`systemMode: 'threat'`) não são personagens e não são publicadas.
import { abrirRepositorioCampanha, criarBarramento, criarRef } from '../vendor/mesa-core/index.js';

const CHAVE_CAMPANHA_ATIVA = 'mesa:campanha-ativa';
const LIMITE_RETRATO = 512 * 1024;
const LADO_RETRATO = 256;

export const refDaFicha = id => criarRef('ficha', 'ficha', String(id));

/** Só as fichas de personagem entram na campanha; as ameaças (monstros) não. */
export const ehPersonagem = sheet => !!sheet && sheet.systemMode !== 'threat' && !!sheet.id;

/** PV e PD da ficha, conforme o modo: Ordem 1 usa Sanidade (ou PE na regra opcional); Ordem 2, PD. `null` para ameaças. */
export function recursosDaFicha(sheet) {
    if (!ehPersonagem(sheet)) return null;
    const n = v => Math.max(0, Math.round(Number(v) || 0));
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
    const semMesa = { publicarRolagem() {}, publicarRecursos() {}, async sincronizar() {}, parar() {} };
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
    const assinaturas = new Map(); // id da ficha → `nome|tokenImage`, para só regravar quando mudar

    async function sincronizar() {
        const campanhaId = campanhaAtiva();
        if (!campanhaId) return;
        if (sincronizando) { denovo = true; return; }
        sincronizando = true;
        try {
            if (!(await repositorio.obterCampanha(campanhaId))) return;
            barramento.campanhaId = campanhaId;
            for (const sheet of ficha.fichas().filter(ehPersonagem)) {
                const ref = refDaFicha(sheet.id), nome = String(sheet.name || 'Sem nome').trim() || 'Sem nome';
                const existente = await repositorio.entidadeDaRef(campanhaId, ref);
                const assinatura = `${nome}|${sheet.tokenImage ?? ''}`;
                if (existente && existente.criadaPor === 'ficha' && assinaturas.get(sheet.id) === assinatura) continue;
                if (existente && existente.criadaPor !== 'ficha') continue;
                const retrato = await retratoDaFicha(sheet);
                if (!existente) await repositorio.criarEntidade({ campanhaId, tipo: 'personagem', nome, refs: [ref], ...(retrato ? { retrato } : {}) });
                else if (existente.nome !== nome || assinaturas.get(sheet.id) !== assinatura) {
                    const { retrato: _antigo, ...resto } = existente;
                    await repositorio.salvarEntidade({ ...resto, nome, ...(retrato ? { retrato } : (_antigo && !sheet.tokenImage ? {} : _antigo ? { retrato: _antigo } : {})) });
                }
                assinaturas.set(sheet.id, assinatura);
            }
            for (const sheet of ficha.fichas().filter(ehPersonagem)) publicarRecursos(sheet);
        } catch (erro) {
            console.warn('Ficha: não consegui publicar as personagens na campanha', erro);
        } finally {
            sincronizando = false;
            if (denovo) { denovo = false; agendar(); }
        }
    }
    function agendar() { clearTimeout(temporizador); temporizador = setTimeout(() => { void sincronizar(); }, 400); }

    const ultimosRecursos = new Map();
    function publicarRecursos(sheet = ficha.aberta()) {
        const r = recursosDaFicha(sheet); if (!r || !campanhaAtiva()) return;
        const chave = JSON.stringify(r); if (ultimosRecursos.get(sheet.id) === chave) return; ultimosRecursos.set(sheet.id, chave);
        barramento.campanhaId = campanhaAtiva();
        try { barramento.emitir('ficha.recursos', { ficha: refDaFicha(sheet.id), ...r }); } catch (erro) { console.warn('Ficha: recursos não enviados', erro); }
    }
    function publicarRolagem(sheet, { titulo, total, modificador }) {
        if (!ehPersonagem(sheet) || !campanhaAtiva() || !Number.isFinite(Number(total))) return;
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
    const aoMudarCampanha = event => { if (event.key === CHAVE_CAMPANHA_ATIVA) agendar(); };
    globalThis.addEventListener?.('storage', aoMudarCampanha);
    agendar();
    return {
        publicarRolagem, publicarRecursos, sincronizar, agendar,
        parar() { clearTimeout(temporizador); globalThis.removeEventListener?.('storage', aoMudarCampanha); barramento.fechar(); },
    };
}
