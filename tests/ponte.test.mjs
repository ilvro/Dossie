import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ferramentasDoDossie, CHAVE_CRIADOS, idsCriados } from '../src/ponte.js';
import { getBalance } from '../src/systems/threat/threat-balance.js';
import { normalizeThreatSheet } from '../src/systems/threat/threat-system.js';
import { normalizeOriginalSheet } from '../src/systems/original/original-system.js';

/** Um Dossiê de mentira: a lista de fichas, o armazenamento e os ganchos que o app daria; `chamadas` registra a ordem. */
function cenario({ fichas = [], confirma = true } = {}) {
    const chamadas = [], lista = [...fichas], memoria = new Map();
    let aberta = lista[0] ?? null;
    const ctx = {
        fichas: () => lista, aberta: () => aberta,
        criar: ({ sistema, raw }) => {
            chamadas.push(`criar:${sistema}`);
            const ficha = sistema === 'threat' ? normalizeThreatSheet(raw) : sistema === 'original' ? normalizeOriginalSheet({ systemMode: 'original', ...raw }) : { id: `o2-${lista.length}`, systemMode: 'ordem2', pv: 10, maxPv: 12, pd: 16, maxPd: 18, ...raw, attributes: { Físico: 6, Mente: 8, Emoção: 8, ...raw.attributes } };
            lista.push(ficha); aberta = ficha; return ficha;
        },
        salvar: () => chamadas.push('salvar'), abrir: id => chamadas.push(`abrir:${id}`), sincronizar: async () => { chamadas.push('sincronizar'); },
        confirmar: async texto => { chamadas.push(`confirmar:${texto}`); return confirma; },
        armazenamento: { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) }
    };
    const f = Object.fromEntries(ferramentasDoDossie(ctx).map(t => [t.nome, t]));
    const dados = async (nome, args) => JSON.parse((await f[nome].executar(args))[0].texto);
    return { ctx, f, chamadas, lista, memoria, dados };
}

test('expõe as cinco ferramentas, todas com prefixo dossie_ e esquema', () => {
    const { f } = cenario();
    assert.deepEqual(Object.keys(f).sort(), ['dossie_ameaca_criar', 'dossie_ficha_criar', 'dossie_ficha_editar', 'dossie_ficha_ler', 'dossie_fichas_listar']);
    for (const t of Object.values(f)) assert.equal(t.esquema.type, 'object');
});

test('ameaça VD 60 com preset editora sai com os números da tabela', async () => {
    const { dados, lista } = cenario();
    const r = await dados('dossie_ameaca_criar', { nome: 'Carniçal de Sangue', vd: 60, elementos: ['sangue'], preset: 'editora', acoes: [{ nome: 'Mordida', dano: '2d8+6', tipoDano: 'Perfuração' }] });
    const ficha = lista[0], bal = getBalance(60, 'editora');
    assert.equal(r.id, ficha.id);
    assert.equal(ficha.pvMax, bal.pv); assert.equal(ficha.pv, 105); assert.equal(ficha.defesa, 21); assert.equal(bal.defesa, 21);
    assert.equal(ficha.salvaguardas.fortitude.bonus + ficha.salvaguardas.reflexos.bonus + ficha.salvaguardas.vontade.bonus, bal.resForte.bonus + bal.resMedia.bonus + bal.resFraca.bonus);
    assert.equal(ficha.presenca.dt, bal.dt);
    assert.equal(ficha.systemMode, 'threat'); assert.deepEqual(ficha.elementos, ['sangue']); assert.equal(ficha.vd, 60);
    assert.equal(ficha.acoes.length, 1); assert.equal(ficha.acoes[0].nome, 'Mordida');
    assert.equal(ficha.acoes[0].ataques[0].dano, '2d8+6'); assert.equal(ficha.acoes[0].ataques[0].tipoDano, 'Perfuração'); assert.equal(ficha.acoes[0].ataques[0].teste.bonus, bal.ataque.bonus);
});

test('ameaça sem ações mantém o ataque padrão do wizard; arquétipo ajusta PV e Defesa', async () => {
    const { dados, lista } = cenario();
    await dados('dossie_ameaca_criar', { nome: 'A', vd: 40, elementos: ['morte'] });
    assert.equal(lista[0].acoes.length, 1); assert.ok(lista[0].acoes[0].ataques.length);
    await dados('dossie_ameaca_criar', { nome: 'B', vd: 60, elementos: ['morte'], preset: 'editora', arquetipo: 'tank' });
    assert.equal(lista[1].pvMax, Math.round(105 * 1.15)); assert.equal(lista[1].defesa, 19);
});

test('valores fora das listas voltam como erro com as opções', async () => {
    const { f } = cenario();
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'X', vd: 60, elementos: ['fogo'] }), /Elemento "fogo" não existe\. Opções: "sangue", "morte"/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'X', vd: 60, elementos: ['sangue'], tamanho: 'Gigante' }), /Opções: "Minúsculo"/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'X', vd: 60, elementos: ['sangue'], acoes: [{ nome: 'Y', tipoAcao: 'rapida' }] }), /Opções: "padrao"/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'X', vd: 5, elementos: ['sangue'] }), /vd/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'X', vd: 60 }), /elemento/);
});

test('criar salva, sincroniza e registra o id como criado pelo assistente', async () => {
    const { dados, chamadas, memoria, ctx } = cenario();
    const r = await dados('dossie_ameaca_criar', { nome: 'Carniçal', vd: 40, elementos: ['sangue'] });
    assert.deepEqual(chamadas, ['criar:threat', 'salvar', 'sincronizar']);
    assert.deepEqual(JSON.parse(memoria.get(CHAVE_CRIADOS)), [r.id]);
    assert.deepEqual(idsCriados(ctx), [r.id]);
});

test('ficha original: classe, nex e atributos viram PV/PE coerentes; ordem2 recusa classe', async () => {
    const { dados, f, lista } = cenario();
    const r = await dados('dossie_ficha_criar', { nome: 'Rita', sistema: 'original', classe: 'ocultista', nex: 10, atributos: { pre: 3, vig: 2 }, conceito: 'Psicóloga' });
    const ficha = lista[0];
    assert.equal(ficha.classeId, 'ocultista'); assert.equal(ficha.nex, 10); assert.equal(ficha.atributos.pre, 3); assert.equal(ficha.atributos.for, 1);
    assert.ok(ficha.maxPv > 0 && ficha.maxPe > 0); assert.equal(ficha.history, 'Psicóloga'); assert.equal(r.id, ficha.id);
    await assert.rejects(f.dossie_ficha_criar.executar({ nome: 'X', sistema: 'original', classe: 'bardo' }), /Opções: "combatente"/);
    await assert.rejects(f.dossie_ficha_criar.executar({ nome: 'X', sistema: 'ordem2', classe: 'combatente' }), /original/);
    await dados('dossie_ficha_criar', { nome: 'Alan', sistema: 'ordem2', atributos: { Físico: 7 } });
    assert.equal(lista[1].attributes.Físico, 7); assert.equal(lista[1].attributes.Mente, 8);
});

test('editar ficha alheia sem confirmação volta "o mestre recusou" e não muda nada', async () => {
    const alheia = { id: 'a1', systemMode: 'threat', name: 'Antiga', pv: 10, pvMax: 10 };
    const { f, chamadas } = cenario({ fichas: [alheia], confirma: false });
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'a1', campos: { pv: 3 } }), /O mestre recusou/);
    assert.equal(alheia.pv, 10); assert.ok(!chamadas.includes('salvar'));
    assert.ok(chamadas[0].startsWith('confirmar:'));
});

test('editar ficha alheia confirmada altera; ficha criada pelo assistente não pergunta', async () => {
    const alheia = { id: 'a1', systemMode: 'ordem2', name: 'Alan', pv: 10, maxPv: 12 };
    const { f, dados, chamadas, lista } = cenario({ fichas: [alheia] });
    await dados('dossie_ficha_editar', { id: 'a1', nome: 'Alan II', campos: { pv: 5, pvMax: 14 } });
    assert.equal(alheia.name, 'Alan II'); assert.equal(alheia.pv, 5); assert.equal(alheia.maxPv, 14);
    assert.deepEqual(chamadas.map(c => c.split(':')[0]), ['confirmar', 'salvar', 'sincronizar', 'abrir']);
    chamadas.length = 0;
    const { id } = await dados('dossie_ameaca_criar', { nome: 'Nova', vd: 20, elementos: ['energia'] });
    chamadas.length = 0;
    await dados('dossie_ficha_editar', { id, campos: { defesa: 30 } });
    assert.equal(lista.find(x => x.id === id).defesa, 30); assert.ok(!chamadas.some(c => c.startsWith('confirmar')));
});

test('campo fora da lista volta erro com a lista; valor inválido também', async () => {
    const mina = { id: 'm', systemMode: 'threat', name: 'M', pv: 1, pvMax: 1 };
    const { f, memoria } = cenario({ fichas: [mina] });
    memoria.set(CHAVE_CRIADOS, JSON.stringify(['m']));
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'm', campos: { tokenImage: 'x' } }), /"tokenImage".*Campos permitidos: "nome", "subtitulo", "vd"/);
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'm', campos: { pv: 'muito' } }), /inteiro/);
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'm', campos: { tamanho: 'Gigante' } }), /Opções/);
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'zzz', campos: { pv: 1 } }), /não existe/);
});

test('listar filtra por tipo e busca sem acento; ler resume a ameaça', async () => {
    const { dados } = cenario({ fichas: [{ id: 'p', systemMode: 'ordem2', name: 'Álvaro' }, { id: 't', systemMode: 'threat', name: 'Lobo Mau', vd: 20, elementos: [] }, { name: 'sem id' }] });
    assert.equal((await dados('dossie_fichas_listar', {})).length, 2);
    assert.deepEqual((await dados('dossie_fichas_listar', { tipo: 'ameaca' })).map(x => x.id), ['t']);
    assert.deepEqual((await dados('dossie_fichas_listar', { busca: 'alvaro' })).map(x => x.id), ['p']);
    assert.equal((await dados('dossie_fichas_listar', { tipo: 'ameaca' }))[0].ref, 'mesa:ficha/ficha/t');
    const novo = await dados('dossie_ameaca_criar', { nome: 'Carniçal', vd: 40, elementos: ['sangue'] });
    const lido = await dados('dossie_ficha_ler', { id: novo.id });
    assert.equal(lido.vd, 40); assert.equal(lido.criadaPeloAssistente, true); assert.ok(lido.acoes.length);
});
