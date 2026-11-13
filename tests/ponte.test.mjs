import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ferramentasDoDossie } from '../src/ponte.js';
import { getBalance } from '../src/systems/threat/threat-balance.js';
import { normalizeThreatSheet } from '../src/systems/threat/threat-system.js';
import { normalizeOriginalSheet } from '../src/systems/original/original-system.js';

/** Um Dossiê de mentira: a lista de fichas, os ganchos que o app daria; `chamadas` registra a ordem. */
function cenario({ fichas = [], aoSalvar = null } = {}) {
    const chamadas = [], lista = [...fichas];
    let aberta = lista[0] ?? null;
    const ctx = {
        fichas: () => lista, aberta: () => aberta,
        criar: ({ sistema, raw }) => {
            chamadas.push(`criar:${sistema}`);
            const ficha = sistema === 'threat' ? normalizeThreatSheet(raw) : sistema === 'original' ? normalizeOriginalSheet({ systemMode: 'original', ...raw }) : { id: `o2-${lista.length}`, systemMode: 'ordem2', pv: 10, maxPv: 12, pd: 16, maxPd: 18, ...raw, attributes: { Físico: 6, Mente: 8, Emoção: 8, ...raw.attributes } };
            lista.push(ficha); aberta = ficha; return ficha;
        },
        salvar: () => { chamadas.push('salvar'); aoSalvar?.(); }, abrir: id => chamadas.push(`abrir:${id}`), sincronizar: async () => { chamadas.push('sincronizar'); }
    };
    const f = Object.fromEntries(ferramentasDoDossie(ctx).map(t => [t.nome, t]));
    const dados = async (nome, args) => JSON.parse((await f[nome].executar(args))[0].texto);
    return { ctx, f, chamadas, lista, dados };
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

test('criar salva e sincroniza', async () => {
    const { dados, chamadas } = cenario();
    await dados('dossie_ameaca_criar', { nome: 'Carniçal', vd: 40, elementos: ['sangue'] });
    assert.deepEqual(chamadas, ['criar:threat', 'salvar', 'sincronizar']);
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

test('editar qualquer ficha altera direto, sem pedir confirmação', async () => {
    const alheia = { id: 'a1', systemMode: 'ordem2', name: 'Alan', pv: 10, maxPv: 12 };
    const { dados, chamadas } = cenario({ fichas: [alheia] });
    await dados('dossie_ficha_editar', { id: 'a1', nome: 'Alan II', campos: { pv: 5, pvMax: 14 } });
    assert.equal(alheia.name, 'Alan II'); assert.equal(alheia.pv, 5); assert.equal(alheia.maxPv, 14);
    assert.deepEqual(chamadas.map(c => c.split(':')[0]), ['salvar', 'sincronizar', 'abrir']);
});

test('ocupação em texto livre fica gravada e a resposta mostra o que foi gravado', async () => {
    const brenna = { id: 'b1', systemMode: 'ordem2', name: 'Brenna', occupation: 'Cientista', pv: 10, maxPv: 12 };
    const { dados } = cenario({ fichas: [brenna] });
    const r = await dados('dossie_ficha_editar', { id: 'b1', campos: { ocupacao: 'Druidisa anciã' } });
    assert.equal(brenna.occupation, 'Druidisa anciã');
    assert.deepEqual(r.gravado, { ocupacao: 'Druidisa anciã' }); assert.equal(r.resumo.ocupacao, 'Druidisa anciã');
});

test('se a tela desfaz a edição ao salvar, a ferramenta responde erro em vez de sucesso', async () => {
    const brenna = { id: 'b1', systemMode: 'ordem2', name: 'Brenna', occupation: 'Cientista', history: '', pv: 10, maxPv: 12 };
    const { f } = cenario({ fichas: [brenna], aoSalvar: () => { brenna.occupation = 'Cientista'; } });
    await assert.rejects(f.dossie_ficha_editar.executar({ id: 'b1', campos: { ocupacao: 'Druidisa anciã', historia: 'x' } }), /Não consegui gravar: "ocupacao".*Os outros campos/);
});

test('campo fora da lista volta erro com a lista; valor inválido também', async () => {
    const mina = { id: 'm', systemMode: 'threat', name: 'M', pv: 1, pvMax: 1 };
    const { f } = cenario({ fichas: [mina] });
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
    assert.equal(lido.vd, 40); assert.ok(lido.acoes.length);
});

test('orçamento: descrições até 400 caracteres e campos até 80', () => {
    const { f } = cenario();
    const varrer = o => !o || typeof o !== 'object' ? [] : [...(typeof o.description === 'string' && o.description.length > 80 ? [o.description] : []), ...Object.values(o).flatMap(varrer)];
    for (const t of Object.values(f)) { assert.ok(t.descricao.length <= 400, t.nome); assert.deepEqual(varrer(t.esquema), [], t.nome); }
});

test('numeros diretos substituem os do VD e o resto continua vindo do VD', async () => {
    const { dados, lista } = cenario();
    const bal = getBalance(20, 'equilibrada');
    const r = await dados('dossie_ameaca_criar', {
        nome: 'Cria da Floresta', vd: 20, elementos: ['sangue'],
        numeros: {
            pv: 10, defesa: 14, fortitude: 4, reflexos: 6, vontade: 2, deslocamento: 9, dtPresenca: 17,
            atributos: { for: 3, agi: 4 }, pericias: [{ nome: 'Furtividade', dados: 3, bonus: 8 }],
            resistencias: [{ tipo: 'Corte', valor: 5 }], vulnerabilidades: ['Fogo'], imunidades: ['Veneno']
        }
    });
    const f = lista[0];
    assert.equal(f.pv, 10); assert.equal(f.pvMax, 10); assert.equal(f.defesa, 14);
    assert.deepEqual([f.salvaguardas.fortitude.bonus, f.salvaguardas.reflexos.bonus, f.salvaguardas.vontade.bonus], [4, 6, 2]);
    assert.equal(f.salvaguardas.reflexos.dados, 4);       // dados seguem a Agilidade
    assert.equal(f.deslocamento.metros, 9); assert.equal(f.presenca.dt, 17);
    assert.equal(f.atributos.for, 3); assert.equal(f.pericias[0].nome, 'Furtividade'); assert.equal(f.pericias[0].bonus, 8);
    assert.deepEqual(f.resistencias, [{ tipo: 'Corte', valor: 5 }]); assert.deepEqual(f.vulnerabilidades, ['Fogo']); assert.deepEqual(f.imunidades, ['Veneno']);
    assert.equal(f.vd, 20); assert.equal(f.presenca.dano, `${bal.presenca.dados}d${bal.presenca.faces}`);   // do VD
    assert.equal(r.resumo.pv, '10/10'); assert.equal(r.resumo.defesa, 14); assert.equal(r.resumo.salvaguardas.fortitude.startsWith('2d20+4') || /d20\+4$/.test(r.resumo.salvaguardas.fortitude), true);
    assert.equal(r.resumo.deslocamentoMetros, 9); assert.deepEqual(r.resumo.pericias, ['Furtividade 3d20+8']);
});

test('numeros inválidos voltam erro claro e nada é criado', async () => {
    const { f, lista } = cenario();
    const base = { nome: 'X', vd: 20, elementos: ['sangue'] };
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: { defesa: -1 } }), /"numeros\.defesa" deve ser um número inteiro de 0 a 200/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: { pv: 1.5 } }), /numeros\.pv/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: { fortitude: 'alta' } }), /numeros\.fortitude/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: { sorte: 3 } }), /desconhecido\(s\) "sorte"\. Permitidos: "pv", "defesa"/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: { atributos: { xyz: 1 } } }), /atributo "xyz" não existe/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ ...base, numeros: 'muito' }), /"numeros" deve ser um objeto/);
    await assert.rejects(f.dossie_ameaca_criar.executar({ nome: 'M', vd: 20, categoria: 'mundana', numeros: { dtPresenca: 10 } }), /sem presença|não tem presença/);
    assert.equal(lista.length, 0);
});

test('editar ameaça aceita os mesmos números e mostra o que ficou', async () => {
    const { dados, lista } = cenario();
    const { id } = await dados('dossie_ameaca_criar', { nome: 'Nova', vd: 20, elementos: ['energia'] });
    const r = await dados('dossie_ficha_editar', { id, campos: { pvMax: 20, defesa: 15, vontade: 9, atributos: { vig: 5 }, deslocamento: 6, resistencias: [{ tipo: 'Fogo', valor: 10 }] } });
    const f = lista[0];
    assert.equal(f.pvMax, 20); assert.ok(f.pv <= 20); assert.equal(f.defesa, 15); assert.equal(f.salvaguardas.vontade.bonus, 9);
    assert.equal(f.salvaguardas.fortitude.dados, 5); assert.equal(f.deslocamento.metros, 6);
    assert.deepEqual(r.gravado.resistencias, [{ tipo: 'Fogo', valor: 10 }]); assert.equal(r.gravado.vontade, 9);
    await assert.rejects(dados('dossie_ficha_editar', { id, campos: { reflexos: 500 } }), /reflexos/);
    await assert.rejects(dados('dossie_ficha_editar', { id, campos: { imunidades: 'frio' } }), /lista/);
    assert.equal(f.pvMax, 20);
});
