// Em desenvolvimento e no app de desktop (entra pelo `app.js` dentro de `if (import.meta.env.DEV || import.meta.env.VITE_PONTE === '1')`; o Vite elimina este módulo do build do Pages).
// Ferramentas do Dossiê para o assistente (Claude via ponte do mesa-dev): listar, ler, criar e ajustar fichas e ameaças.
// Cada ferramenta é criada por `ferramentasDoDossie(ctx)`; o contexto é injetável para testar sem navegador (ver tests/ponte.test.mjs).
//
// ctx = { fichas(), aberta(), criar({ sistema, raw }) → ficha, salvar(), abrir(id), sincronizar() }
// O app é quem sabe criar (o mesmo caminho do clique em "nova ficha", sem tutorial nem wizard); aqui só se monta o que a ficha nova leva.
import { conectarPonte, json } from '../vendor/mesa-core/ponte.js';
import { formatarRef } from '../vendor/mesa-core/refs.js';
import { refDaFicha, ehAmeaca, ehPersonagem } from './mesa.js';
import {
    THREAT_ELEMENTS, THREAT_SIZES, ACTION_TYPES, DAMAGE_TYPES, CREATURE_TYPES_PARANORMAL, CREATURE_TYPES_MUNDANE, THREAT_RANGES
} from './systems/threat/threat-data.js';
import { getBalance } from './systems/threat/threat-balance.js';
import { normalizeThreatSheet, applyDerivedDice } from './systems/threat/threat-system.js';
import { aplicarEscolhas, ARQUETIPOS } from './systems/threat/threat-wizard.js';
import { CLASSES } from './data/original-data.js';

const PRESETS = ['equilibrada', 'editora', 'leve'];
const ATRIBUTOS_ORIGINAL = ['for', 'agi', 'vig', 'int', 'pre'];
const ATRIBUTOS_ORDEM2 = { Físico: 'Físico', Mente: 'Mente', Emoção: 'Emoção' };
const ELEMENTOS = Object.keys(THREAT_ELEMENTS).filter(e => e !== 'mundana');

const semAcento = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const opcoes = lista => lista.map(x => `"${x}"`).join(', ');
const nomeDe = ficha => String(ficha.name || 'Sem nome');

/** Valida um valor contra uma lista (sem diferenciar maiúsculas/acentos) e devolve o item da lista; erro com as opções. */
function daLista(valor, lista, campo) {
    const achado = lista.find(x => semAcento(x) === semAcento(valor));
    if (!achado) throw new Error(`${campo} "${valor}" não existe. Opções: ${opcoes(lista)}.`);
    return achado;
}
function inteiro(valor, campo, min, max) {
    const n = Number(valor);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) throw new Error(`"${campo}" deve ser um número inteiro de ${min} a ${max} (recebi ${JSON.stringify(valor)}).`);
    return n;
}
function textoCurto(valor, campo, max = 4000) {
    if (typeof valor !== 'string') throw new Error(`"${campo}" deve ser texto.`);
    return valor.slice(0, max);
}

// ─── Campos simples editáveis, por tipo de ficha ──────────────────────────────────────────────────────────────────
// campo do assistente → { chave: na ficha, ler(valor) → valor validado, descricao }
const texto = (chave, descricao, max) => ({ chave, descricao, ler: (v, campo) => textoCurto(v, campo, max) });
const numero = (chave, descricao, min, max) => ({ chave, descricao, ler: (v, campo) => inteiro(v, campo, min, max) });
const ATRIBUTOS_AMEACA = ['for', 'agi', 'int', 'pre', 'vig'];
const listaDe = (valor, campo, max) => {
    if (!Array.isArray(valor) || valor.length > max) throw new Error(`"${campo}" deve ser uma lista com até ${max} itens.`);
    return valor;
};
const objeto = (valor, campo) => {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error(`"${campo}" deve ser um objeto.`);
    return valor;
};
const salvaguarda = (k, nome) => ({
    chave: `salvaguardas.${k}`, descricao: `Bônus de ${nome} (os dados seguem o atributo).`,
    ler: (v, campo) => inteiro(v, campo, 0, 200),
    aplicar: (f, v) => { f.salvaguardas[k].bonus = v; }, obter: f => f.salvaguardas?.[k]?.bonus
});
/** Números de uma ficha de ameaça: o que `numeros` (em dossie_ameaca_criar) e `campos` (em dossie_ficha_editar) aceitam com o mesmo nome. */
const NUMEROS_AMEACA = {
    defesa: numero('defesa', 'Defesa.', 0, 200),
    fortitude: salvaguarda('fortitude', 'Fortitude'),
    reflexos: salvaguarda('reflexos', 'Reflexos'),
    vontade: salvaguarda('vontade', 'Vontade'),
    deslocamento: {
        chave: 'deslocamento', descricao: 'Deslocamento em metros.', ler: (v, campo) => inteiro(v, campo, 0, 300),
        aplicar: (f, v) => { f.deslocamento = { ...f.deslocamento, metros: v }; }, obter: f => f.deslocamento?.metros
    },
    dtPresenca: {
        chave: 'presenca.dt', descricao: 'DT da presença perturbadora.', ler: (v, campo) => inteiro(v, campo, 0, 100),
        checar: f => { if (!f.presenca?.ativa) throw new Error('"dtPresenca": esta ameaça não tem presença perturbadora.'); },
        aplicar: (f, v) => { f.presenca = { ...f.presenca, dt: v }; }, obter: f => f.presenca?.dt
    },
    atributos: {
        chave: 'atributos', descricao: 'Atributos { for, agi, int, pre, vig } (os dados de salvaguardas e sentidos seguem).',
        ler: (v, campo) => Object.fromEntries(Object.entries(objeto(v, campo)).map(([k, n]) => [daLista(k, ATRIBUTOS_AMEACA, `${campo}: atributo`), inteiro(n, `${campo}.${k}`, 0, 20)])),
        aplicar: (f, v) => { f.atributos = { ...f.atributos, ...v }; applyDerivedDice(f); }, obter: f => f.atributos
    },
    pericias: {
        chave: 'pericias', descricao: 'Perícias [{ nome, dados, bonus }]; substitui a lista.',
        ler: (v, campo) => listaDe(v, campo, 30).map((p, i) => {
            if (!p || typeof p !== 'object' || !String(p.nome ?? '').trim()) throw new Error(`"${campo}" item ${i + 1}: falta o "nome".`);
            return { id: `pericia-${i + 1}`, nome: textoCurto(String(p.nome).trim(), `${campo}.nome`, 60), dados: inteiro(p.dados ?? 1, `${campo}.dados`, 1, 20), bonus: inteiro(p.bonus ?? 0, `${campo}.bonus`, 0, 200), condicional: null };
        }),
        aplicar: (f, v) => { f.pericias = v; }, obter: f => f.pericias?.map(({ nome, dados, bonus }) => ({ nome, dados, bonus }))
    },
    resistencias: {
        chave: 'resistencias', descricao: 'Resistências a dano [{ tipo, valor }]; substitui a lista.',
        ler: (v, campo) => listaDe(v, campo, 30).map((r, i) => {
            if (!r || typeof r !== 'object' || !String(r.tipo ?? '').trim()) throw new Error(`"${campo}" item ${i + 1}: falta o "tipo".`);
            return { tipo: textoCurto(String(r.tipo).trim(), `${campo}.tipo`, 60), valor: inteiro(r.valor, `${campo}.valor`, 0, 999) };
        })
    },
    vulnerabilidades: {
        chave: 'vulnerabilidades', descricao: 'Vulnerabilidades (lista de textos); substitui a lista.',
        ler: (v, campo) => listaDe(v, campo, 30).map(x => textoCurto(String(x).trim(), campo, 80)).filter(Boolean)
    },
    imunidades: {
        chave: 'imunidades', descricao: 'Imunidades (lista de textos); substitui a lista.',
        ler: (v, campo) => listaDe(v, campo, 30).map(x => textoCurto(String(x).trim(), campo, 80)).filter(Boolean)
    }
};
const CAMPOS = {
    ameaca: {
        nome: texto('name', 'Nome da ameaça.', 120),
        subtitulo: texto('subtitulo', 'Subtítulo (ex.: "SANGUE").', 120),
        vd: numero('vd', 'Valor de Desafio (só o rótulo; não recalcula os números).', 0, 400),
        pv: numero('pv', 'PV atuais.', 0, 99999),
        pvMax: { ...numero('pvMax', 'PV máximos.', 1, 99999), aplicar: (f, v) => { f.pvMax = v; f.pv = Math.min(f.pv, v); } },
        ...NUMEROS_AMEACA,
        tipo: { chave: 'tipo', descricao: 'Tipo da criatura (Criatura, Relíquia, Humano, Animal, Veículo).', ler: (v, campo) => daLista(v, [...CREATURE_TYPES_PARANORMAL, ...CREATURE_TYPES_MUNDANE], campo) },
        tamanho: { chave: 'tamanho', descricao: `Tamanho: ${THREAT_SIZES.join(', ')}.`, ler: (v, campo) => daLista(v, THREAT_SIZES, campo) },
        notas: texto('notasMestre', 'Notas do mestre (texto livre).', 8000)
    },
    ordem2: {
        nome: texto('name', 'Nome do personagem.', 120),
        ocupacao: texto('occupation', 'Ocupação.', 120),
        historia: texto('history', 'História / anotações.', 8000),
        pv: numero('pv', 'PV atuais.', 0, 999),
        pvMax: numero('maxPv', 'PV máximos.', 0, 999),
        pd: numero('pd', 'PD (Pontos de Determinação) atuais.', 0, 999),
        pdMax: numero('maxPd', 'PD máximos.', 0, 999)
    },
    original: {
        nome: texto('name', 'Nome do personagem.', 120),
        jogador: texto('jogador', 'Nome do jogador.', 120),
        historia: texto('history', 'História / anotações.', 8000),
        pv: numero('pv', 'PV atuais (o máximo vem da classe, do NEX e do Vigor).', 0, 999),
        pe: numero('pe', 'PE atuais.', 0, 999),
        san: numero('san', 'Sanidade atual.', 0, 999)
    }
};
const aplicarCampo = (ficha, def, valor) => (def.aplicar ? def.aplicar(ficha, valor) : (ficha[def.chave] = valor));
const obterCampo = (ficha, def) => (def.obter ? def.obter(ficha) : ficha[def.chave]);
const sistemaDaFicha = ficha => (ehAmeaca(ficha) ? 'ameaca' : ficha.systemMode === 'original' ? 'original' : 'ordem2');
const todosOsCampos = () => [...new Set(Object.values(CAMPOS).flatMap(c => Object.keys(c)))];

// ─── Resumos legíveis ─────────────────────────────────────────────────────────────────────────────────────────────
const lista = ficha => {
    const sistema = sistemaDaFicha(ficha);
    return {
        id: ficha.id, ref: formatarRef(refDaFicha(ficha.id)), nome: nomeDe(ficha),
        tipo: ehAmeaca(ficha) ? 'ameaca' : 'personagem', sistema,
        ...(sistema === 'ameaca' ? { vd: ficha.vd, elementos: ficha.elementos ?? [] } : {}),
        ...(sistema === 'original' ? { classe: ficha.classeId, nex: ficha.nex } : {})
    };
};
const poolTexto = p => (p ? `${p.dados}d20${p.bonus ? (p.bonus > 0 ? '+' : '') + p.bonus : ''}` : '');

function resumoDaFicha(ficha, ctx) {
    const base = lista(ficha);
    if (ehAmeaca(ficha)) {
        return {
            ...base, categoria: ficha.categoria, subtitulo: ficha.subtitulo, criatura: ficha.tipo, tamanho: ficha.tamanho,
            pv: `${ficha.pv}/${ficha.pvMax}`, defesa: ficha.defesa, atributos: ficha.atributos,
            salvaguardas: Object.fromEntries(Object.entries(ficha.salvaguardas ?? {}).map(([k, p]) => [k, poolTexto(p)])),
            resistencias: ficha.resistencias, vulnerabilidades: ficha.vulnerabilidades, imunidades: ficha.imunidades,
            presenca: ficha.presenca?.ativa ? `DT ${ficha.presenca.dt}, ${ficha.presenca.dano} ${ficha.presenca.tipoDano}, imune a partir de NEX ${ficha.presenca.imuneNex}%` : 'sem presença perturbadora',
            deslocamentoMetros: ficha.deslocamento?.metros,
            pericias: (ficha.pericias ?? []).map(p => `${p.nome} ${poolTexto(p)}`),
            acoes: (ficha.acoes ?? []).map(a => ({
                nome: a.nome, tipoAcao: a.tipoAcao, texto: a.texto || undefined,
                ataques: (a.ataques ?? []).map(t => ({ nome: t.nome, alcance: t.alcance, teste: poolTexto(t.teste), dano: `${t.dano} ${t.tipoDano}`, critico: t.critico }))
            })),
            notas: ficha.notasMestre || undefined
        };
    }
    if (ficha.systemMode === 'original') {
        return {
            ...base, jogador: ficha.jogador || undefined, classe: ficha.classeId, trilha: ficha.trilhaId, origem: ficha.origemId, nex: ficha.nex, atributos: ficha.atributos,
            pv: `${ficha.pv}/${ficha.maxPv}`, pe: `${ficha.pe}/${ficha.maxPe}`, sanidade: `${ficha.san}/${ficha.maxSan}`, historia: ficha.history || undefined
        };
    }
    return {
        ...base, ocupacao: ficha.occupation, perfil: ficha.profile, atributos: ficha.attributes,
        pv: `${ficha.pv}/${ficha.maxPv}`, pd: `${ficha.pd}/${ficha.maxPd}`, historia: ficha.history || undefined
    };
}

// ─── Ameaça: o cálculo do wizard, reaproveitado ───────────────────────────────────────────────────────────────────
function lerAcoes(acoes, bal, atributos) {
    if (acoes === undefined) return null;
    if (!Array.isArray(acoes)) throw new Error('"acoes" deve ser uma lista de { nome, tipoAcao, texto?, dano?, tipoDano?, alcance? }.');
    const tipos = ACTION_TYPES.map(t => t.id);
    return acoes.map((a, i) => {
        if (!a || typeof a !== 'object' || !String(a.nome ?? '').trim()) throw new Error(`Ação ${i + 1}: falta o "nome".`);
        const tipoAcao = a.tipoAcao === undefined ? 'padrao' : daLista(a.tipoAcao, tipos, `Ação "${a.nome}": tipoAcao`);
        const ataques = [];
        if (a.dano !== undefined && String(a.dano).trim()) {
            ataques.push({
                id: `atk-${i + 1}`, nome: String(a.nome).trim(),
                alcance: a.alcance === undefined ? 'corpo' : THREAT_RANGES.find(r => semAcento(r.id) === semAcento(a.alcance) || semAcento(r.nome) === semAcento(a.alcance))?.id
                    ?? (() => { throw new Error(`Ação "${a.nome}": alcance "${a.alcance}" não existe. Opções: ${opcoes(THREAT_RANGES.map(r => r.id))}.`); })(),
                multiplicador: 1, teste: { dados: Math.max(1, atributos?.for || bal.ataque.dados), bonus: bal.ataque.bonus },
                dano: String(a.dano).trim(),
                tipoDano: a.tipoDano === undefined ? 'Impacto' : daLista(a.tipoDano, DAMAGE_TYPES, `Ação "${a.nome}": tipoDano`),
                critico: '20/x2'
            });
        }
        return {
            id: `act-${i + 1}`, tipoAcao, nome: String(a.nome).trim(), gatilho: '', custo: '', usos: null, ataques,
            texto: a.texto === undefined ? '' : textoCurto(a.texto, 'texto'), coluna: 'direita', ativaQuando: null, fase: null
        };
    });
}

const NUMEROS_CRIAR = {
    pv: { ...numero('pv', 'PV (atuais e máximos).', 1, 99999), aplicar: (f, v) => { f.pv = f.pvMax = v; } },
    ...NUMEROS_AMEACA
};
/** Aplica o objeto `numeros` por cima do que veio do VD; valida tudo antes de mexer na ficha. */
function aplicarNumeros(sheet, numeros) {
    if (numeros === undefined) return;
    objeto(numeros, 'numeros');
    const fora = Object.keys(numeros).filter(k => !NUMEROS_CRIAR[k]);
    if (fora.length) throw new Error(`"numeros": campo(s) desconhecido(s) ${fora.map(c => `"${c}"`).join(', ')}. Permitidos: ${opcoes(Object.keys(NUMEROS_CRIAR))}.`);
    const lidos = Object.keys(numeros).map(k => ({ k, def: NUMEROS_CRIAR[k], valor: NUMEROS_CRIAR[k].ler(numeros[k], `numeros.${k}`) }));
    lidos.forEach(n => n.def.checar?.(sheet));
    // atributos primeiro: os dados das salvaguardas seguem o atributo; o resto não depende da ordem
    lidos.sort((a, b) => (b.k === 'atributos') - (a.k === 'atributos')).forEach(n => aplicarCampo(sheet, n.def, n.valor));
}

/** Monta a ficha de ameaça como o wizard a monta (`aplicarEscolhas`), validando contra as listas do `threat-data.js`. */
export function montarAmeaca(args) {
    const nome = String(args.nome ?? '').trim();
    if (!nome) throw new Error('Falta o "nome" da ameaça.');
    const vd = inteiro(args.vd, 'vd', 10, 400);
    const categoria = args.categoria === undefined ? 'paranormal' : daLista(args.categoria, ['paranormal', 'mundana'], 'Categoria');
    const preset = args.preset === undefined ? 'equilibrada' : daLista(args.preset, PRESETS, 'Preset');
    const arquetipo = args.arquetipo === undefined ? null : daLista(args.arquetipo, ARQUETIPOS.map(a => a.id), 'Arquétipo');
    let elementos = [];
    if (categoria === 'paranormal') {
        if (!Array.isArray(args.elementos) || !args.elementos.length) throw new Error(`Informe ao menos um elemento em "elementos". Opções: ${opcoes(ELEMENTOS)}.`);
        elementos = [...new Set(args.elementos.map(e => daLista(e, ELEMENTOS, 'Elemento')))];
    } else if (Array.isArray(args.elementos) && args.elementos.length) throw new Error('Ameaça "mundana" não tem elementos; omita "elementos" ou use categoria "paranormal".');
    const tipos = categoria === 'mundana' ? CREATURE_TYPES_MUNDANE : CREATURE_TYPES_PARANORMAL;
    const tipo = args.tipo === undefined ? tipos[0] : daLista(args.tipo, tipos, `Tipo (${categoria})`);
    const tamanho = args.tamanho === undefined ? 'Médio' : daLista(args.tamanho, THREAT_SIZES, 'Tamanho');

    const bal = getBalance(vd, preset);
    const sheet = normalizeThreatSheet({ name: nome, systemMode: 'threat', vd, categoria, elementos });
    aplicarEscolhas(sheet, {
        nome, subtitulo: args.subtitulo === undefined ? '' : textoCurto(args.subtitulo, 'subtitulo', 120), categoria, vd, preset, tipo, tamanho,
        elementoPrincipal: elementos[0] ?? 'mundana', elementosComplementares: elementos.slice(1), arquetipo: arquetipo ?? 'boss',
        resistenciasPadrao: true, incluirVulnerabilidade: true, presencaAtiva: categoria === 'paranormal', adicionarEnigma: false, adicionarHabilidadeElementar: false,
        ataquePadrao: {}, acoesExtras: []
    });
    // Sem arquétipo, os números ficam como a tabela (o arquétipo do wizard ajusta PV e Defesa por cima).
    if (!arquetipo) { sheet.pv = sheet.pvMax = bal.pv; sheet.defesa = bal.defesa; }
    aplicarNumeros(sheet, args.numeros);
    const acoes = lerAcoes(args.acoes, bal, sheet.atributos);
    if (acoes) sheet.acoes = acoes;
    if (args.descricao !== undefined) sheet.notasMestre = textoCurto(args.descricao, 'descricao', 8000);
    sheet.fonte = 'homebrew'; sheet.isCustom = true;
    return sheet;
}

/** Monta a ficha de personagem mínima (o que o clique de nova ficha leva, mais o pedido). */
export function montarPersonagem(args) {
    const nome = String(args.nome ?? '').trim();
    if (!nome) throw new Error('Falta o "nome" da ficha.');
    const sistema = daLista(args.sistema ?? '', ['ordem2', 'original'], 'Sistema');
    const raw = { name: nome };
    if (args.conceito !== undefined) raw.history = textoCurto(args.conceito, 'conceito', 8000);
    if (sistema === 'ordem2') {
        if (args.classe !== undefined || args.nex !== undefined) throw new Error('"classe" e "nex" são do sistema "original". Em "ordem2" use só "atributos" (Físico, Mente, Emoção).');
        if (args.atributos !== undefined) {
            if (!args.atributos || typeof args.atributos !== 'object') throw new Error('"atributos" deve ser um objeto.');
            raw.attributes = {};
            for (const [k, v] of Object.entries(args.atributos)) raw.attributes[daLista(k, Object.keys(ATRIBUTOS_ORDEM2), 'Atributo')] = inteiro(v, k, 0, 20);
        }
        return { sistema, raw };
    }
    const classe = args.classe === undefined ? 'combatente' : daLista(args.classe, Object.keys(CLASSES), 'Classe');
    raw.classeId = classe;
    raw.trilhaId = CLASSES[classe]?.trilhas?.[0]?.id ?? '';
    raw.nex = args.nex === undefined ? (CLASSES[classe]?.mundano ? 0 : 5) : inteiro(args.nex, 'nex', 0, 99);
    raw.atributos = { for: 1, agi: 1, vig: 1, int: 1, pre: 1 };
    if (args.atributos !== undefined) {
        if (!args.atributos || typeof args.atributos !== 'object') throw new Error('"atributos" deve ser um objeto.');
        for (const [k, v] of Object.entries(args.atributos)) raw.atributos[daLista(k, ATRIBUTOS_ORIGINAL, 'Atributo')] = inteiro(v, k, 0, 7);
    }
    return { sistema, raw };
}

// ─── As ferramentas ───────────────────────────────────────────────────────────────────────────────────────────────
export function ferramentasDoDossie(ctx) {
    const achar = id => {
        const ficha = ctx.fichas().find(f => f.id === id);
        if (!ficha) throw new Error(`Ficha "${id}" não existe no Dossiê. Use dossie_fichas_listar para ver os ids.`);
        return ficha;
    };
    const depoisDeCriar = async ficha => {
        ctx.salvar();
        await ctx.sincronizar();
    };
    const campos = CAMPOS;
    return [
        {
            nome: 'dossie_fichas_listar',
            descricao: 'Lista as fichas do Dossiê (personagens e ameaças) com id, ref, nome, tipo e sistema.',
            esquema: { type: 'object', properties: { tipo: { type: 'string', enum: ['personagem', 'ameaca'] }, busca: { type: 'string', description: 'Parte do nome.' } }, required: [], additionalProperties: false },
            async executar(args) {
                if (args.tipo !== undefined && !['personagem', 'ameaca'].includes(args.tipo)) throw new Error('"tipo" deve ser "personagem" ou "ameaca".');
                const busca = semAcento(args.busca);
                const achadas = ctx.fichas().filter(f => (ehAmeaca(f) || ehPersonagem(f))
                    && (!args.tipo || (args.tipo === 'ameaca') === ehAmeaca(f)) && (!busca || semAcento(nomeDe(f)).includes(busca)));
                return [json(achadas.map(lista))];
            }
        },
        {
            nome: 'dossie_ficha_ler',
            descricao: 'Lê o resumo de uma ficha (atributos, PV/PD; ameaça: VD, defesa, ações).',
            esquema: { type: 'object', properties: { id: { type: 'string', description: 'De dossie_fichas_listar.' } }, required: ['id'], additionalProperties: false },
            async executar(args) { return [json(resumoDaFicha(achar(String(args.id ?? '')), ctx))]; }
        },
        {
            nome: 'dossie_ameaca_criar',
            descricao: 'Cria ameaça com os números do VD; "numeros" substitui PV, defesa, salvaguardas etc. (outros sistemas). Devolve o id. Detalhes: plataforma_guia ferramentas-dossie.',
            esquema: {
                type: 'object',
                properties: {
                    nome: { type: 'string' },
                    vd: { type: 'integer', minimum: 10, maximum: 400, description: 'Valor de Desafio.' },
                    elementos: { type: 'array', items: { type: 'string', enum: ELEMENTOS }, description: 'Obrigatório se paranormal.' },
                    categoria: { type: 'string', enum: ['paranormal', 'mundana'], description: 'Padrão paranormal.' },
                    tipo: { type: 'string', description: 'Tipos por categoria: ver guia.' },
                    tamanho: { type: 'string', enum: THREAT_SIZES, description: 'Padrão Médio.' },
                    preset: { type: 'string', enum: PRESETS, description: 'Dureza dos números.' },
                    arquetipo: { type: 'string', enum: ARQUETIPOS.map(a => a.id), description: 'Opcional, como no wizard.' },
                    subtitulo: { type: 'string' },
                    descricao: { type: 'string', description: 'Notas do mestre.' },
                    numeros: {
                        type: 'object', description: 'Números diretos; substituem os do VD (ex.: OP2). Omitidos seguem o VD.',
                        properties: {
                            pv: { type: 'integer', minimum: 1, maximum: 99999 }, defesa: { type: 'integer', minimum: 0, maximum: 200 },
                            fortitude: { type: 'integer', minimum: 0, maximum: 200, description: 'Bônus.' }, reflexos: { type: 'integer', minimum: 0, maximum: 200, description: 'Bônus.' }, vontade: { type: 'integer', minimum: 0, maximum: 200, description: 'Bônus.' },
                            deslocamento: { type: 'integer', minimum: 0, maximum: 300, description: 'Metros.' }, dtPresenca: { type: 'integer', minimum: 0, maximum: 100 },
                            atributos: { type: 'object', description: 'for, agi, int, pre, vig (0 a 20).', additionalProperties: { type: 'integer', minimum: 0, maximum: 20 } },
                            pericias: { type: 'array', items: { type: 'object', properties: { nome: { type: 'string' }, dados: { type: 'integer', minimum: 1, maximum: 20 }, bonus: { type: 'integer', minimum: 0, maximum: 200 } }, required: ['nome'], additionalProperties: false } },
                            resistencias: { type: 'array', items: { type: 'object', properties: { tipo: { type: 'string' }, valor: { type: 'integer', minimum: 0, maximum: 999 } }, required: ['tipo', 'valor'], additionalProperties: false } },
                            vulnerabilidades: { type: 'array', items: { type: 'string' } }, imunidades: { type: 'array', items: { type: 'string' } }
                        },
                        additionalProperties: false
                    },
                    acoes: {
                        type: 'array', description: 'Substitui a ação padrão.',
                        items: {
                            type: 'object',
                            properties: {
                                nome: { type: 'string' }, tipoAcao: { type: 'string', enum: ACTION_TYPES.map(t => t.id), description: 'Padrão: padrao.' },
                                texto: { type: 'string' }, dano: { type: 'string', description: 'Ex.: "2d8+6".' },
                                tipoDano: { type: 'string', enum: DAMAGE_TYPES, description: 'Padrão: Impacto.' }, alcance: { type: 'string', enum: THREAT_RANGES.map(r => r.id), description: 'Padrão: corpo.' }
                            },
                            required: ['nome'], additionalProperties: false
                        }
                    }
                },
                required: ['nome', 'vd'], additionalProperties: false
            },
            async executar(args) {
                const raw = montarAmeaca(args);
                const ficha = ctx.criar({ sistema: 'threat', raw });
                await depoisDeCriar(ficha);
                return [json({ id: ficha.id, ref: formatarRef(refDaFicha(ficha.id)), resumo: resumoDaFicha(ficha, ctx) })];
            }
        },
        {
            nome: 'dossie_ficha_criar',
            descricao: 'Cria uma ficha de personagem mínima e a abre na tela. Devolve o id. Ameaças: dossie_ameaca_criar. Detalhes: plataforma_guia ferramentas-dossie.',
            esquema: {
                type: 'object',
                properties: {
                    nome: { type: 'string' }, sistema: { type: 'string', enum: ['ordem2', 'original'] },
                    classe: { type: 'string', enum: Object.keys(CLASSES), description: 'Só "original".' },
                    nex: { type: 'integer', minimum: 0, maximum: 99, description: 'Só "original".' },
                    atributos: { type: 'object', description: 'Chaves por sistema: ver guia.', additionalProperties: { type: 'integer' } },
                    conceito: { type: 'string', description: 'Vai para a história.' }
                },
                required: ['nome', 'sistema'], additionalProperties: false
            },
            async executar(args) {
                const dados = montarPersonagem(args);
                const ficha = ctx.criar(dados);
                await depoisDeCriar(ficha);
                return [json({ id: ficha.id, ref: formatarRef(refDaFicha(ficha.id)), resumo: resumoDaFicha(ficha, ctx) })];
            }
        },
        {
            nome: 'dossie_ficha_editar',
            descricao: 'Edita campos simples de uma ficha (texto e números). Detalhes: plataforma_guia ferramentas-dossie.',
            esquema: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    nome: { type: 'string', description: 'Atalho para campos.nome.' },
                    campos: {
                        type: 'object',
                        description: 'Campos por tipo de ficha: ver guia.',
                        properties: Object.fromEntries(todosOsCampos().map(c => [c, {}])),
                        additionalProperties: true      // campo fora da lista: a ferramenta responde com a lista, em vez de o cliente recusar sem explicar
                    }
                },
                required: ['id'], additionalProperties: false
            },
            async executar(args) {
                const ficha = achar(String(args.id ?? ''));
                const mapa = campos[sistemaDaFicha(ficha)];
                const pedido = { ...(args.campos && typeof args.campos === 'object' ? args.campos : {}) };
                if (args.nome !== undefined) pedido.nome = args.nome;
                const chaves = Object.keys(pedido);
                if (!chaves.length) throw new Error(`Nada a editar: informe "nome" ou "campos". Campos desta ficha: ${opcoes(Object.keys(mapa))}.`);
                const fora = chaves.filter(c => !mapa[c]);
                if (fora.length) throw new Error(`Campo(s) fora da lista editável nesta ficha (${sistemaDaFicha(ficha)}): ${fora.map(c => `"${c}"`).join(', ')}. Campos permitidos: ${opcoes(Object.keys(mapa))}.`);
                const novos = chaves.map(c => ({ campo: c, def: mapa[c], valor: mapa[c].ler(pedido[c], c) }));
                for (const n of novos) n.def.checar?.(ficha);
                for (const n of novos) aplicarCampo(ficha, n.def, n.valor);
                const esperado = novos.map(n => JSON.stringify(obterCampo(ficha, n.def)));
                ctx.salvar();
                await ctx.sincronizar();
                if (ctx.aberta()?.id === ficha.id) ctx.abrir(ficha.id);      // a ficha na tela se redesenha
                // Nunca responder sucesso sem o campo ter ficado: relê a ficha depois de salvar e redesenhar (a tela pode desfazer a edição).
                const perdidos = novos.filter((n, i) => JSON.stringify(obterCampo(ficha, n.def)) !== esperado[i]).map(n => n.campo);
                if (perdidos.length) throw new Error(`Não consegui gravar: ${perdidos.map(c => `"${c}"`).join(', ')} voltou ao valor anterior depois de salvar. ${novos.length > perdidos.length ? 'Os outros campos pedidos foram gravados. ' : ''}Peça ao mestre para conferir a ficha.`);
                const gravado = Object.fromEntries(novos.map(n => [n.campo, obterCampo(ficha, n.def)]));
                return [json({ id: ficha.id, alterados: chaves, gravado, resumo: resumoDaFicha(ficha, ctx) })];
            }
        }
    ];
}

/** Liga a ponte (navegador, só em desenvolvimento). `ctx` vem do `app.js`. */
export function iniciarPonte(ctx) {
    return conectarPonte({ app: 'ficha', titulo: 'Dossiê', ferramentas: ferramentasDoDossie(ctx) });
}
