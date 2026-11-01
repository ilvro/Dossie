/**
 * Dados Oficiais dos Personagens de Contos da Vigília (Ordem Paranormal II • Playtest Beta)
 * Extraídos das 12 páginas oficiais de Playtest_beta_-_fichas_de_personagens.pdf
 */

export const VIGILIA_CHARACTERS = [
  {
    id: 'sheet-vigilia-rhiona',
    folderId: 'folder-vigilia',
    name: 'Rhiona Mac Tuirenn',
    firstName: 'RHIONA',
    lastName: 'MAC TUIRENN',
    profile: 'Analista',
    occupation: 'Ferreira',
    level: 3,
    age: 23,
    shortBio: 'Filha do ferreiro, detém o raro conhecimento da metalurgia e prestígio na comunidade. Idade 23.',
    pv: 22,
    maxPv: 22,
    pvTemp: 0,
    pd: 12,
    maxPd: 12,
    pdTemp: 0,
    armorPoints: 1, // Segredo do Aço
    maxArmorPoints: 2,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-rhiona-portrait.png',
    backgroundImage: '',
    attributes: {
      Físico: 10,
      Mente: 6,
      Emoção: 6
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 8, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'LUTA', skillDie: 10, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'MEDICINA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO (METALURGIA)', skillDie: 8, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'PONTARIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 8, training: 'Treinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'analise',
        profileAbility: 'Analista',
        themeLinked: true,
        schema: 'abilities',
        title: 'ANÁLISE',
        type: 'Habilidade de Perfil',
        content: 'Você pode gastar uma ação para receber **2 marcadores de análise**.\n• Quando faz um teste, **pode gastar quantos marcadores quiser após rolar os dados**. Para cada marcador gasto, pode mudar o resultado de um dado em **+1 ou –1** (até o máximo do dado).\n• Você pode acumular no **máximo 4 marcadores de análise** e, no fim da cena, **perde** quaisquer marcadores não usados.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [
          {
            id: 'analise-m',
            type: 'pips',
            displayStyle: 'rectangles',
            label: 'Marcadores de Análise',
            current: 0,
            maxFormula: '4'
          }
        ],
        actions: []
      },
      {
        id: 'leitura-de-combate',
        schema: 'abilities',
        title: 'LEITURA DE COMBATE',
        type: 'Habilidade',
        content: 'Em combate, sempre que você gastar uma ação para se defender, você recebe um marcador de análise.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'segredo-do-aco',
        schema: 'abilities',
        title: 'SEGREDO DO AÇO',
        type: 'Habilidade',
        content: 'Você sabe usar equipamentos marciais. Além disso, se estiver vestindo um item que forneça pontos de armadura, o item fornece **1 ponto de armadura adicional**.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'equip-rhiona',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Martelo de forja** (arma corpo a corpo, dano RA+3), tenaz de ferreiro.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-martelo',
            name: 'Ataque com Martelo (Luta d10+Físico d10)',
            expression: '1d10 + 1d10'
          },
          {
            id: 'dano-martelo',
            name: 'Dano Martelo (RA+3)',
            expression: 'RA + 3'
          }
        ]
      }
    ],
    history: `Filha do ferreiro da vila, Rhiona Mac Tuirenn (RÍ-o-na Mac TÚR-en) é versada nos segredos místicos do ferro e do fogo. Caberá a ela perpetuar o legado de fornecer para as famílias de Ballynyr as ferramentas e armas essenciais para o trabalho e a proteção da vila.

Trabalha batendo o martelo na bigorna e testando em combate as próprias armas que faz. Sua figura feminina empunhando o martelo é vista como uma manifestação de Brígida, antiga deusa da forja, e Rhiona carrega no pescoço uma pequena medalha de Santa Brígida, a versão sincrética da deusa.

Um casamento com Rhiona seria de grande valor, e o interesse da moça tem sido disputado por filhos de fazendeiros e até por guerreiros da nobreza menor. Porém, desde que seu pai caiu doente, ela está mais interessada em administrar o negócio da família, e por isso passa horas debatendo contabilidade com o Irmão Cavan.

Quando se permite descansar, senta-se próximo à fogueira para ouvir as histórias que Malik ibn Qamar traz de um mundo distante. Também é próxima de Rowan, responsável por supri-la de ferro coletado do pântano. Recentemente, ela o avistou patrulhando as fronteiras das terras de seu pai sem que isso fosse solicitado.`,
    relations: [
      { target: 'ROWAN', degree: 1, feeling: 'CONFIANÇA', note: 'É quem lhe traz o minério de ferro do pântano.' },
      { target: 'MUIRENN', degree: 0, feeling: 'NEUTRO', note: 'Soube de enfermos que foram tratados pela curandeira.' },
      { target: 'CAVAN', degree: 2, feeling: 'AMIZADE', note: 'Passam horas debatendo contabilidade.' },
      { target: 'MALIK', degree: 1, feeling: 'ADMIRAÇÃO', note: 'Gosta de ouvir as histórias que ele traz de terras distantes.' },
      { target: 'SIRA', degree: 0, feeling: 'NEUTRO', note: 'Aguarda ela se recuperar do naufrágio para fazer perguntas.' },
      { target: 'SORCHA', degree: 1, feeling: 'RESPEITO', note: 'Reconhece a importância de sua vigilância.' },
      { target: 'CORMAC', degree: 1, feeling: 'CURIOSIDADE', note: 'Pergunta-se de onde vem a espada que carrega.' }
    ]
  },

  {
    id: 'sheet-vigilia-rowan',
    folderId: 'folder-vigilia',
    name: 'Rowan Lobo Castanho',
    firstName: 'ROWAN',
    lastName: 'LOBO CASTANHO',
    profile: 'Vigilante',
    occupation: 'Adestrador',
    level: 3,
    age: 25,
    shortBio: 'Aprendiz do caçador da vila, tem a companhia de um lobo enorme e leal. Idade 25.',
    pv: 20,
    maxPv: 20,
    pvTemp: 0,
    pd: 12,
    maxPd: 12,
    pdTemp: 0,
    armorPoints: 0,
    maxArmorPoints: 0,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-rowan-portrait.png',
    backgroundImage: '',
    attributes: {
      Físico: 8,
      Mente: 8,
      Emoção: 6
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'LUTA', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'MEDICINA', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'PONTARIA', skillDie: 10, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'prontidao',
        profileAbility: 'Vigilante',
        themeLinked: true,
        schema: 'abilities',
        title: 'PRONTIDÃO',
        type: 'Habilidade de Perfil',
        content: 'Uma vez por rodada, quando você ou outro ser em alcance curto faz um teste, você pode **gastar 2 PD para rolar novamente**, ou para fazer o outro ser rolar novamente, **um dos dados do teste cujo resultado não tenha sido 1**.\n\nAlém disso, em combates, você pode fazer sua ação na **fase dela ou em fases posteriores**, e após qualquer ação daquela fase **já ter sido rolada**.',
        accent: '#9aa49e',
        icon: '◆',
        cost: '2 PD',
        markers: [],
        actions: []
      },
      {
        id: 'esquiva',
        schema: 'abilities',
        title: 'ESQUIVA',
        type: 'Habilidade',
        content: 'Uma vez por rodada, quando sofre um ataque, pode fazer um **teste de Acrobacia (d6+d8)** oposto ao teste de ataque como uma **ação livre**. Se vencer, evita o ataque.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'teste-esquiva',
            name: 'Teste de Esquiva (Acrobacia d6 + Físico d8)',
            expression: '1d6 + 1d8'
          }
        ]
      },
      {
        id: 'espectro-lobo',
        schema: 'abilities',
        title: 'ESPECTRO, O LOBO',
        type: 'Habilidade',
        content: 'Você possui um parceiro lobo que fornece **+d6 em testes de ataque corpo a corpo**. Porém, se o dado do lobo rolar 1, ele terá se machucado e não poderá mais ajudá-lo pelo resto da cena.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [
          {
            id: 'lobo-ativo',
            type: 'toggle',
            label: 'Lobo Apto',
            current: 1,
            maxFormula: '1'
          }
        ],
        actions: []
      },
      {
        id: 'equip-rowan',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Arco curto de teixo** (arma à distância, dano RA+1), **lança de javali** (arma corpo a corpo, dano RA+2; fornece um aumento de passo no primeiro ataque da cena).',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-arco',
            name: 'Tiro de Arco (Pontaria d10+Físico d8)',
            expression: '1d10 + 1d8'
          },
          {
            id: 'dano-arco',
            name: 'Dano Arco (RA+1)',
            expression: 'RA + 1'
          },
          {
            id: 'ataque-lanca',
            name: 'Golpe com Lança (Luta d6+Físico d8)',
            expression: '1d6 + 1d8'
          },
          {
            id: 'dano-lanca',
            name: 'Dano Lança (RA+2)',
            expression: 'RA + 2'
          }
        ]
      }
    ],
    history: `Rowan (RÓ-u-an) era a prole mais nova de uma numerosa família camponesa. Quando criança, era apenas mais uma boca para alimentar. Na mesma época, seu tio Fergus Mac Colum (FÉR-gus mak KÓ-lum), então caçador da vila de Ballynyr, começou a mostrar sinais de velhice. Sem filhos, precisava de um aprendiz a quem transmitir seu ofício. Assim, a família enviou Rowan. Realizava trabalho braçal, como carregar peles pesadas, cortar lenha e limpar armadilhas e, em troca, o tio lhe ensinava a arte de fabricar arcos, curtir couro, rastrear animais e manejar armas.

Adaptou-se bem a vida nos ermos, pois nunca foi muito sociável, trocando com alegria a companhia de humanos pela de animais. Mata para preservar o ciclo da vida, mas também é capaz de poupar — e até cativar — mesmo o mais temido predador. Foi em uma noite sem lua que encontrou um lobo ferido. Era uma rara variedade castanha. Outros diriam que o certo era matá-lo, mas Rowan escolheu a vida. Tratou os ferimentos do lobo sem esperar nada em troca, mas recebeu uma amizade eterna. Hoje, os dois são inseparáveis.

Rowan anda sempre em companhia da fera, o que desperta a desconfiança dos moradores da vila. Dizem os mais supersticiosos que Rowan enxerga através dos olhos da besta, ou até que é capaz de assumir uma forma lupina. Rhiona Mac Tuirenn não acredita nisso. Muirenn Lua Pálida talvez até acredite, mas não se importa. São as únicas pessoas, além do tio idoso, com quem Rowan se importa… quase como se fossem animais.`,
    relations: [
      { target: 'RHIONA', degree: 1, feeling: 'DEVER', note: 'A ferreira é importante para a vila e deve ser protegida.' },
      { target: 'MUIRENN', degree: 2, feeling: 'CUMPLICIDADE', note: 'Têm em comum o modo de vida apartado da vila.' },
      { target: 'CAVAN', degree: 0, feeling: 'NEUTRO', note: 'O monge traz bons conselhos aos camponeses.' },
      { target: 'MALIK', degree: 0, feeling: 'NEUTRO', note: 'O jeito bisbilhoteiro do andarilho não chega a incomodar.' },
      { target: 'SIRA', degree: 0, feeling: 'NEUTRO', note: 'Só se viram uma vez.' },
      { target: 'SORCHA', degree: 0, feeling: 'NEUTRO', note: 'Acha os rastros da passagem dela chamativos demais.' },
      { target: 'CORMAC', degree: 1, feeling: 'TRANQUILIDADE', note: 'Sabe de onde ele vem pelos espinhos grudados em suas roupas, mas não o considera uma ameaça.' }
    ]
  },

  {
    id: 'sheet-vigilia-muirenn',
    folderId: 'folder-vigilia',
    name: 'Muirenn da Lua Pálida',
    firstName: 'MUIRENN',
    lastName: 'DA LUA PÁLIDA',
    profile: 'Executor',
    occupation: 'Herborista',
    level: 3,
    age: 21,
    shortBio: 'Bruxa do bosque. Dizem ser filha das fadas. Possui conhecimentos de ervas e tradições ancestrais. Idade 21.',
    pv: 15,
    maxPv: 15,
    pvTemp: 0,
    pd: 17,
    maxPd: 17,
    pdTemp: 0,
    armorPoints: 0,
    maxArmorPoints: 0,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-muirenn-portrait.png',
    backgroundImage: '',
    attributes: {
      Físico: 8,
      Mente: 8,
      Emoção: 8
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO (FOLCLORE)', skillDie: 8, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'LUTA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'MEDICINA', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'PONTARIA', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'impeto',
        profileAbility: 'Executor',
        themeLinked: true,
        schema: 'abilities',
        title: 'ÍMPETO',
        type: 'Habilidade de Perfil',
        content: 'Você possui uma **barra de ímpeto, com cinco espaços**. Sempre que **faz um teste e falha**, você preenche um espaço na barra de ímpeto. Como uma ação livre, você pode gastar espaços da barra de ímpeto para receber benefícios:\n• **1 espaço.** Você recebe **+d4** em um teste.\n• **3 espaços.** Você **aumenta um atributo em um passo** até o fim da cena.\n• **3 espaços.** Em cenas de conflito, você faz uma **ação extra**.\n\nNo fim da cena, sua barra de ímpeto esvazia.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [
          {
            id: 'impeto-m',
            type: 'pips',
            displayStyle: 'rectangles',
            label: 'Barra de Ímpeto',
            current: 0,
            maxFormula: '5'
          }
        ],
        actions: []
      },
      {
        id: 'arsenal-herborista',
        schema: 'abilities',
        title: 'ARSENAL DE HERBORISTA',
        type: 'Habilidade',
        content: 'Você possui uma pequena bolsa contendo preparados medicinais feitos com ervas, óleos e mel. Para usar o item, escolha um alvo e **gaste uma ação**. Cada item é de **uso único**.\n\n• **Tônico de urtiga-feroz.** O alvo recebe aumento de passo no atributo Físico por uma cena.\n• **Bálsamo de confrei.** O alvo recupera 2d4 PV (se for outro ser, precisa ficar parado nesta rodada).\n• **Pote de vespa.** Faça um teste de Sobrevivência para um ataque à distância, dano RA+1. Se o alvo sobreviver, perde sua próxima ação espantando as vespas.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'balsamo-cura',
            name: 'Curar com Bálsamo (2d4 PV)',
            expression: '2d4'
          },
          {
            id: 'ataque-vespas',
            name: 'Lançar Pote de Vespa (Sobrevivência d8+Mente d8)',
            expression: '1d8 + 1d8'
          },
          {
            id: 'dano-vespas',
            name: 'Dano Vespas (RA+1)',
            expression: 'RA + 1'
          }
        ]
      },
      {
        id: 'equip-muirenn',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Faca ritualística** (arma corpo a corpo, dano RA+0), maleta de medicamentos.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-faca',
            name: 'Golpe com Faca (Luta d4+Físico d8)',
            expression: '1d4 + 1d8'
          },
          {
            id: 'dano-faca',
            name: 'Dano Faca (RA+0)',
            expression: 'RA + 0'
          }
        ]
      }
    ],
    history: `Anos atrás, em uma madrugada fria de outono, a vila de Ballynyr acordou com o choro de um bebê. Era uma menina abandonada em um cesto — não se sabe por quem, já que a vila é isolada. A crença inicial de que havia sido deixada por fadas ganhou ainda mais força quando olharam melhor para ela: na testa, possuía uma marca branca perfeitamente circular. “Changeling!”, disse alguém, e com isso ninguém quis acolhê-la. Com uma exceção.

Atraída pela comoção que acontecia na vila, apareceu a velha curandeira a qual todos chamavam de bruxa. Marróg Niamh (MÁ-rog NÍV) vivia sozinha em sua cabana na floresta, em meio a ervas e unguentos, considerada estranha e indesejada. Ironicamente, quando alguém adoecia, era a ela que recorriam.

Diante da criança rejeitada por todos, disse: “Então ela ficará comigo.” e levou-a para sua cabana. Muirenn (MÍ-ren) da Lua Pálida cresceu como uma criança normal e aprendeu com a velha sua tradição oral. Seu único amigo é Rowan Lobo Castanho, outro pária, que lhe traz carne de caça sempre que pode. No início, irritava-se com a forma como sua mentora era tratada pelos demais. Contudo, após a morte de Marróg, Muirenn tomou para si o dever de proteger os aldeões, mesmo aqueles que não mereciam.`,
    relations: [
      { target: 'RHIONA', degree: 0, feeling: 'NEUTRO', note: 'Não gosta de armas de metal, mas sabe que são necessárias.' },
      { target: 'ROWAN', degree: 2, feeling: 'AMIZADE', note: 'Ao contrário do restante da vila, não tem medo do lobo.' },
      { target: 'CAVAN', degree: 0, feeling: 'NEUTRO', note: 'Desaprova a doutrina escrita do monge, mas não a odeia.' },
      { target: 'MALIK', degree: 0, feeling: 'NEUTRO', note: 'O julga tolo, mas não perigoso.' },
      { target: 'SIRA', degree: 0, feeling: 'NEUTRO', note: 'Sabe que ela já se recuperou do naufrágio, mas finge debilidade.' },
      { target: 'SORCHA', degree: 0, feeling: 'NEUTRO', note: 'Duvida que a guarda a protegeria de algum perigo.' },
      { target: 'CORMAC', degree: 0, feeling: 'NEUTRO', note: 'Só mais um forasteiro sendo bem recebido na vila que a desamparou.' }
    ]
  },

  {
    id: 'sheet-vigilia-cavan',
    folderId: 'folder-vigilia',
    name: 'Irmão Cavan',
    firstName: 'IRMÃO CAVAN',
    lastName: 'DO MOSTEIRO DO OLMO CINZENTO',
    profile: 'Analista',
    occupation: 'Professor',
    level: 3,
    age: 26,
    shortBio: 'Monge enviado à vila como educador, contabilista e guia espiritual. Embora seja um erudito, seu corpo foi forjado pelo trabalho braçal no mosteiro. Idade 26.',
    pv: 15,
    maxPv: 15,
    pvTemp: 0,
    pd: 15,
    maxPd: 15,
    pdTemp: 0,
    armorPoints: 0,
    maxArmorPoints: 0,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-cavan.png',
    backgroundImage: '',
    attributes: {
      Físico: 6,
      Mente: 10,
      Emoção: 6
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO (ERUDIÇÃO)', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 10, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 8, training: 'Veterano', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 8, training: 'Veterano', attribute: 'Emoção', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'LUTA', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'MEDICINA', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PONTARIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'analise',
        profileAbility: 'Analista',
        themeLinked: true,
        schema: 'abilities',
        title: 'ANÁLISE',
        type: 'Habilidade de Perfil',
        content: 'Você pode gastar uma ação para receber **2 marcadores de análise**.\n• Quando faz um teste, **pode gastar quantos marcadores quiser após rolar os dados**. Para cada marcador gasto, pode mudar o resultado de um dado em **+1 ou –1** (até o máximo do dado).\n• Você pode acumular no **máximo 4 marcadores de análise** e, no fim da cena, **perde** quaisquer marcadores não usados.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [
          {
            id: 'analise-m',
            type: 'pips',
            displayStyle: 'rectangles',
            label: 'Marcadores de Análise',
            current: 0,
            maxFormula: '4'
          }
        ],
        actions: []
      },
      {
        id: 'curandeiro',
        schema: 'abilities',
        title: 'CURANDEIRO',
        type: 'Habilidade',
        cost: '2 PD',
        content: 'Você pode gastar **uma ação e 2 PD** para curar um aliado. Faça um **teste de Medicina (DT 7)**. Se passar, você cura PV do aliado iguais à **RA do teste**. Você só pode usar este poder em um mesmo alvo uma vez por cena.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'teste-curandeiro',
            name: 'Teste de Medicina (Medicina d6+Mente d10 vs DT 7)',
            expression: '1d6 + 1d10'
          }
        ]
      },
      {
        id: 'mentoria',
        schema: 'abilities',
        title: 'MENTORIA',
        type: 'Habilidade',
        content: 'Quando ajuda outro personagem, você pode fazer um **teste da perícia que usou para ajudar contra DT 7**. Se passar, o personagem ajudado pode **substituir um dos dados rolados por ele pela sua rolagem alta (RA)**.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'equip-cavan',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Porrete** (arma corpo a corpo, dano RA+1).',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-porrete',
            name: 'Golpe com Porrete (Luta d8+Mente d10)',
            expression: '1d8 + 1d10'
          },
          {
            id: 'dano-porrete',
            name: 'Dano Porrete (RA+1)',
            expression: 'RA + 1'
          }
        ]
      }
    ],
    history: `Cavan (KÁ-van) foi ofertado por sua família ao Mosteiro do Olmo Cinzento aos sete anos de idade, logo após um de seus irmãos morrer de desnutrição em um inverno especialmente longo. Como noviço, aprendeu a ler e escrever, medir e calcular, produzir e administrar. Mais do que isso, anos de trabalho braçal no mosteiro arando campos rochosos com bois, carregando pedras pesadas para erguer muros e cortando lenha para aquecer os claustros no inverno o ensinaram a usar seu corpo com maestria.

É dedicado e disciplinado, e desde cedo se destacou na caligrafia e na docência. Após proferir seus votos de obediência, pobreza e castidade, tornou-se um monge consagrado. Enviado pelo abade, instalou-se na vila de Ballynyr para atuar como administrador agrícola e guia espiritual. Ali, ensina técnicas de cultivo aos adultos e cânticos litúrgicos às crianças.

Sua amiga mais próxima é Rhiona Mac Tuirenn, a filha do ferreiro, que o ajudou a ser bem recebido na região e a quem admira mais profundamente do que seus votos deveriam permitir. Embora bem recebido, seus ensinamentos cristãos ainda entram em choque com os costumes folclóricos locais.`,
    relations: [
      { target: 'RHIONA', degree: 3, feeling: 'GRANDE AFEIÇÃO', note: 'Sentimento conflitante com seus votos monásticos.' },
      { target: 'ROWAN', degree: 0, feeling: 'NEUTRO', note: 'Espera um dia poderem conversar melhor.' },
      { target: 'MUIRENN', degree: 0, feeling: 'NEUTRO', note: 'Desaprova a tradição da curandeira, mas não a odeia.' },
      { target: 'MALIK', degree: 1, feeling: 'ADMIRAÇÃO', note: 'Interesse pelo conhecimento trazido de outras terras.' },
      { target: 'SIRA', degree: 0, feeling: 'NEUTRO', note: 'Aguarda ela se recuperar do naufrágio para fazer perguntas.' },
      { target: 'SORCHA', degree: 0, feeling: 'NEUTRO', note: 'Acredita que ela já sofreu muito.' },
      { target: 'CORMAC', degree: 1, feeling: 'DISCRIÇÃO', note: 'Reconhece seu sotaque de nobre bretão, mas não contou a ninguém.' }
    ]
  },

  {
    id: 'sheet-vigilia-malik',
    folderId: 'folder-vigilia',
    name: 'Malik ibn Qamar',
    firstName: 'MALIK',
    lastName: 'IBN QAMAR',
    profile: 'Executor',
    occupation: 'Explorador',
    level: 3,
    age: 24,
    shortBio: 'Andarilho árabe em busca das maravilhas e horrores nas fronteiras do mundo conhecido. Idade 24.',
    pv: 15,
    maxPv: 15,
    pvTemp: 0,
    pd: 19,
    maxPd: 19,
    pdTemp: 0,
    armorPoints: 0,
    maxArmorPoints: 0,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-malik.png',
    backgroundImage: '',
    attributes: {
      Físico: 6,
      Mente: 6,
      Emoção: 10
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO (ERUDIÇÃO)', skillDie: 8, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'LUTA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'MEDICINA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 10, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'PONTARIA', skillDie: 8, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'impeto',
        profileAbility: 'Executor',
        themeLinked: true,
        schema: 'abilities',
        title: 'ÍMPETO',
        type: 'Habilidade de Perfil',
        content: 'Você possui uma **barra de ímpeto, com cinco espaços**. Sempre que **faz um teste e falha**, você preenche um espaço na barra de ímpeto. Como uma ação livre, você pode gastar espaços da barra de ímpeto para receber benefícios:\n• **1 espaço.** Você recebe **+d4** em um teste.\n• **3 espaços.** Você **aumenta um atributo em um passo** até o fim da cena.\n• **3 espaços.** Em cenas de conflito, você faz uma **ação extra**.\n\nNo fim da cena, sua barra de ímpeto esvazia.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [
          {
            id: 'impeto-m',
            type: 'pips',
            displayStyle: 'rectangles',
            label: 'Barra de Ímpeto',
            current: 0,
            maxFormula: '5'
          }
        ],
        actions: []
      },
      {
        id: 'impeto-fervilhante',
        schema: 'abilities',
        title: 'ÍMPETO FERVILHANTE',
        type: 'Habilidade',
        content: 'No início de cada cena, você preenche um espaço de sua barra de ímpeto.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'equip-malik',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Arco composto de Al-Andalus** (arma à distância, dano RA+1), diário de viagem.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-arco-andalus',
            name: 'Disparo de Arco (Pontaria d8+Físico d6)',
            expression: '1d8 + 1d6'
          },
          {
            id: 'dano-arco-andalus',
            name: 'Dano Arco Al-Andalus (RA+1)',
            expression: 'RA + 1'
          }
        ]
      }
    ],
    history: `Malik ibn Qamar (Ma-LÍK Í-bi-n Ka-MAR) é um poeta e geógrafo fascinado por explorar os limites do mundo conhecido. Nascido no Emirado de Al-Andalus e inspirado pela poesia árabe, decidiu deixar para trás sua terra e tornar-se um andarilho. Assim, viajou através da Península Ibérica, cruzou o Canal da Mancha e alcançou os confins da Irlanda, experimentando as maravilhas e horrores que o trajeto poderia oferecer.

Na pequena vila de Ballynyr, encontrou tudo o que mais procurava: mistérios. Seja se surpreendendo pela eficácia das ervas medicinais de Muirenn da Lua Pálida ou apreciando a caligrafia impecável de Irmão Cavan, Malik faz novas descobertas a cada dia.

Recentemente, a chegada da náufraga Sira Cissé despertou seu interesse. Ela se recusa a falar abertamente de onde veio ou como chegou aqui, mas Malik não desistiu de descobrir. Ele anota tudo o que descobre em seu diário de viagem e espera um dia retornar à sua pátria levando novos conhecimentos do mundo além-mar. Contudo, recentemente a vila se tornou ainda mais isolada e obscura, e ele não sabe se esse retorno será possível.`,
    relations: [
      { target: 'RHIONA', degree: 0, feeling: 'NEUTRO', note: 'Gosta de tê-la como ouvinte de suas histórias.' },
      { target: 'ROWAN', degree: 0, feeling: 'NEUTRO', note: 'Interessado em seu lobo e as superstições que o cercam.' },
      { target: 'MUIRENN', degree: 1, feeling: 'ADMIRAÇÃO', note: 'Fascinado por seu conhecimento ancestral exótico.' },
      { target: 'CAVAN', degree: 1, feeling: 'ADMIRAÇÃO', note: 'Fascinado por sua caligrafia e didática.' },
      { target: 'SIRA', degree: 1, feeling: 'CURIOSIDADE', note: 'Enche-a de perguntas pessoais em toda oportunidade.' },
      { target: 'SORCHA', degree: 0, feeling: 'NEUTRO', note: 'Sente-se oprimido pelo olhar desconfiado dela.' },
      { target: 'CORMAC', degree: 1, feeling: 'CURIOSIDADE', note: 'Admira seu vocabulário.' }
    ]
  },

  {
    id: 'sheet-vigilia-sira',
    folderId: 'folder-vigilia',
    name: 'Sira Cissé',
    firstName: 'SIRA',
    lastName: 'CISSÉ',
    profile: 'Vigilante',
    occupation: 'Viking',
    level: 3,
    age: 27,
    shortBio: 'Náufraga que chegou à vila recentemente. Tudo que se sabe de seu passado é que veio de muito longe. Idade 27.',
    pv: 20,
    maxPv: 20,
    pvTemp: 0,
    pd: 12,
    maxPd: 12,
    pdTemp: 0,
    armorPoints: 0,
    maxArmorPoints: 0,
    systemMode: 'ordem2',
    viewMode: 'vigilia',
    tokenImage: '/assets/vigilia/token-sira-portrait.png',
    backgroundImage: '',
    attributes: {
      Físico: 8,
      Mente: 6,
      Emoção: 8
    },
    skills: [
      { name: 'ACROBACIA', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'ANIMAIS', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'APTIDÃO (ERUDIÇÃO)', skillDie: 6, training: 'Treinado', attribute: 'Mente', extra: 0 },
      { name: 'ATLETISMO', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 },
      { name: 'CRIME', skillDie: 8, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'DISCIPLINA', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'ENGANAÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'FURTIVIDADE', skillDie: 10, training: 'Veterano', attribute: 'Físico', extra: 0 },
      { name: 'INSPECIONAR', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'INTIMIDAR', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'INTUIÇÃO', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'LUTA', skillDie: 8, training: 'Veterano', attribute: 'Mente', extra: 0 },
      { name: 'MEDICINA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OCULTISMO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'OFÍCIO', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'PERCEPÇÃO', skillDie: 6, training: 'Treinado', attribute: 'Emoção', extra: 0 },
      { name: 'PERSUASÃO', skillDie: 4, training: 'Destreinado', attribute: 'Emoção', extra: 0 },
      { name: 'PONTARIA', skillDie: 4, training: 'Destreinado', attribute: 'Físico', extra: 0 },
      { name: 'SOBREVIVÊNCIA', skillDie: 4, training: 'Destreinado', attribute: 'Mente', extra: 0 },
      { name: 'VIGOR', skillDie: 6, training: 'Treinado', attribute: 'Físico', extra: 0 }
    ],
    cards: [
      {
        id: 'prontidao',
        profileAbility: 'Vigilante',
        themeLinked: true,
        schema: 'abilities',
        title: 'PRONTIDÃO',
        type: 'Habilidade de Perfil',
        content: 'Uma vez por rodada, quando você ou outro ser em alcance curto faz um teste, você pode **gastar 2 PD para rolar novamente**, ou para fazer o outro ser rolar novamente, **um dos dados do teste cujo resultado não tenha sido 1**.\n\nAlém disso, em combates, você pode fazer sua ação na **fase dela ou em fases posteriores**, e após qualquer ação daquela fase **já ter sido rolada**.',
        accent: '#9aa49e',
        icon: '◆',
        cost: '2 PD',
        markers: [],
        actions: []
      },
      {
        id: 'antecipacao-tatica',
        schema: 'abilities',
        title: 'ANTECIPAÇÃO TÁTICA',
        type: 'Habilidade',
        cost: '2 PD',
        content: 'No início de qualquer combate, você pode **gastar 2 PD**. Se fizer isso, ganha uma rodada na qual **pode agir antes dos demais personagens e NPCs**.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'sorrateiro',
        schema: 'abilities',
        title: 'SORRATEIRO',
        type: 'Habilidade',
        cost: '3 PD',
        content: 'Quando faz um teste usando **Crime ou Furtividade**, você pode **gastar 3 PD para receber +d8 no teste**.',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: []
      },
      {
        id: 'equip-sira',
        schema: 'items',
        title: 'EQUIPAMENTO',
        type: 'Equipamento',
        content: '**Machado de batalha nórdico** (arma corpo a corpo, dano RA+3).',
        accent: '#9aa49e',
        icon: '◆',
        markers: [],
        actions: [
          {
            id: 'ataque-machado',
            name: 'Golpe com Machado (Luta d8+Mente d6)',
            expression: '1d8 + 1d6'
          },
          {
            id: 'dano-machado',
            name: 'Dano Machado Nórdico (RA+3)',
            expression: 'RA + 3'
          }
        ]
      }
    ],
    history: `Filha de uma família de mercadores do reino sub-saariano de Wagadu, Sira Cissé (SÍ-ra si-SÊ) desde jovem acompanhava seus pais em caravanas do deserto até o Mediterrâneo, onde negociavam sal, seda e especiarias… mas sempre sentiu que não fazia parte desse mundo.

Antes de recarregar os camelos e retornar para casa, observava os navios no porto, imaginando para onde iriam. Seu sonho era deixar para trás as areias do deserto e partir para a imensidão do mar. Assim que teve idade, deixou a família e usou suas habilidades de negociação, combate e orientação pelas estrelas para conseguir trabalho em embarcações mercantes. A bordo de diferentes navios, cruzou o Mediterrâneo.

Foi quando bebia em uma taverna na Península Ibérica, reclamando que as incursões davam muito trabalho e pouco dinheiro, que os vikings atacaram. Eles desembarcaram na vila costeira, mataram, pilharam e espalharam o horror. Mas Sira se recusou a ser uma vítima. Enquanto outros corriam e eram abatidos, decidiu lutar. Combateu sozinha, com fúria, força e inteligência aguerrida. Em desvantagem numérica, foi derrotada, mas sua bravura despertou o interesse do capitão. Assim, Sira foi incorporada à tripulação.

A bordo do navio viking, descobriu uma forma mais eficiente de lucrar com a navegação: a pirataria. Com os piratas, aprendeu golpes sujos e táticas desleais, e passou a velejar pelo norte frio e indômito. Tudo ia bem, até que uma tempestade se abateu sobre eles e o navio naufragou. Sira foi encontrada em uma costa remota da Irlanda e acolhida na vila de Ballynyr. Obviamente, não revelou seu passado de pilhagem, pois isso pode despertar a hostilidade de seus anfitriões. Tem interesse em Rhiona e Irmão Cavan, pois ambos possuem poder social que podem lhe ser útil em seu plano de retornar para o mar.`,
    relations: [
      { target: 'RHIONA', degree: 1, feeling: 'ANSEIO', note: 'Deseja usar o poder social da ferreira para voltar para o mar.' },
      { target: 'ROWAN', degree: 0, feeling: 'NEUTRO', note: 'Só se viram uma vez.' },
      { target: 'MUIRENN', degree: 1, feeling: 'GRATIDÃO', note: 'A curandeira tratou suas feridas após o naufrágio.' },
      { target: 'CAVAN', degree: 1, feeling: 'ANSEIO', note: 'Deseja usar o poder religioso do monge para voltar para o mar.' },
      { target: 'MALIK', degree: 0, feeling: 'NEUTRO', note: 'Não gosta de suas perguntas desnecessárias.' },
      { target: 'SORCHA', degree: 1, feeling: 'RESPEITO', note: 'Reconhece a força da guerreira e sabe que pode contar com ela em uma luta.' },
      { target: 'CORMAC', degree: 1, feeling: 'EMPATIA', note: 'Suspeita que o jovem esteja escondendo algo, o que os torna iguais.' }
    ]
  }
];
