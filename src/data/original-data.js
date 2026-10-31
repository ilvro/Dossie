/* ==========================================================================
   VAESEN — Ficha Digital para Ordem Paranormal RPG
   ARQUIVO DE CONTEÚDO (DADOS DO JOGO)
   ==========================================================================

   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA MEXER PARA ADICIONAR CONTEÚDO.
   O app.js só LÊ estas listas e monta a ficha sozinho — ou seja, para
   adicionar um ritual novo, um poder novo, uma origem nova, uma trilha nova
   ou mudar a progressão de uma classe (sua homebrew), basta copiar um dos
   objetos de exemplo abaixo, colar dentro do array certo e mudar os campos.

   Não é necessário entender o resto do código para editar isto aqui.
   Sempre respeite as vírgulas entre os objetos "{ ... }, { ... }" dentro
   dos arrays "[ ... ]".

   Ao final do arquivo há um guia rápido "COMO ADICIONAR CONTEÚDO" com
   exemplos prontos para copiar e colar.

   AVISO: os dados abaixo (perícias, tabelas de NEX, poderes, rituais) foram
   compilados a partir de resumos públicos do sistema Ordem Paranormal para
   servir de ESQUELETO funcional da ficha. Como vocês jogam com homebrew,
   revise e ajuste os valores/textos contra o livro de vocês — o importante
   aqui é a ESTRUTURA (o app já entende ela), não decorar o texto oficial
   palavra por palavra.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. ATRIBUTOS
   -------------------------------------------------------------------------- */
const ATRIBUTOS = [
  { id: "for", nome: "Força",     abrev: "FOR" },
  { id: "agi", nome: "Agilidade", abrev: "AGI" },
  { id: "vig", nome: "Vigor",     abrev: "VIG" },
  { id: "int", nome: "Intelecto", abrev: "INT" },
  { id: "pre", nome: "Presença",  abrev: "PRE" },
];


/* --------------------------------------------------------------------------
   2. PERÍCIAS
   Campo "atributo" usa o "id" definido em ATRIBUTOS acima.
   Campo "somenteTreinado": true = só pode ser testada se treinada (ex: Ciências).
   -------------------------------------------------------------------------- */
const PERICIAS = [
  { id: "acrobacia",       nome: "Acrobacia",        atributo: "agi" },
  { id: "adestramento",    nome: "Adestramento",     atributo: "pre" },
  { id: "artes",           nome: "Artes",            atributo: "pre" },
  { id: "atletismo",       nome: "Atletismo",        atributo: "for" },
  { id: "atualidades",     nome: "Atualidades",      atributo: "int" },
  { id: "ciencias",        nome: "Ciências",         atributo: "int", somenteTreinado: true },
  { id: "crime",           nome: "Crime",            atributo: "agi" },
  { id: "diplomacia",      nome: "Diplomacia",       atributo: "pre" },
  { id: "enganacao",       nome: "Enganação",        atributo: "pre" },
  { id: "fortitude",       nome: "Fortitude",        atributo: "vig" },
  { id: "furtividade",     nome: "Furtividade",      atributo: "agi" },
  { id: "iniciativa",      nome: "Iniciativa",       atributo: "agi" },
  { id: "intimidacao",     nome: "Intimidação",      atributo: "pre" },
  { id: "intuicao",        nome: "Intuição",         atributo: "pre" },
  { id: "investigacao",    nome: "Investigação",     atributo: "int" },
  { id: "luta",            nome: "Luta",             atributo: "for" },
  { id: "medicina",        nome: "Medicina",         atributo: "int", somenteTreinado: true },
  { id: "ocultismo",       nome: "Ocultismo",        atributo: "int", somenteTreinado: true },
  { id: "percepcao",       nome: "Percepção",        atributo: "pre" },
  { id: "pilotagem",       nome: "Pilotagem",        atributo: "agi", somenteTreinado: true },
  { id: "pontaria",        nome: "Pontaria",         atributo: "agi" },
  { id: "profissao",       nome: "Profissão",        atributo: "int", somenteTreinado: true },
  { id: "reflexos",        nome: "Reflexos",         atributo: "agi" },
  { id: "religiao",        nome: "Religião",         atributo: "pre", somenteTreinado: true },
  { id: "sobrevivencia",   nome: "Sobrevivência",    atributo: "int" },
  { id: "tatica",          nome: "Tática",           atributo: "int", somenteTreinado: true },
  { id: "tecnologia",      nome: "Tecnologia",       atributo: "int", somenteTreinado: true },
  { id: "vontade",         nome: "Vontade",          atributo: "pre" },
];


/* --------------------------------------------------------------------------
   3. ORIGENS
   "pericias": array de ids de PERICIAS que a origem treina automaticamente.
   "poder": a habilidade única de origem.
   "itemInicial": texto livre (opcional).
   -------------------------------------------------------------------------- */
const ORIGENS = [
  {
    id: "acadêmico",
    nome: "Acadêmico",
    descricao: "Você era um pesquisador ou professor universitário. De forma proposital ou não, seus estudos tocaram em assuntos misteriosos e chamaram a atenção da Ordo Realitas.",
    pericias: ["ciencias", "investigacao"],
    poder: {
      nome: "Saber é Poder",
      bonus: "+5 em testes de Intelecto (2 PE)",
      descricao: "Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.",
    },
    // "poderesExtras": habilidades de origem adicionais (use alternativa: true
    // quando o jogador escolhe ENTRE ela e o poder principal).
    poderesExtras: [
      {
        nome: "Estudos Aprofundados",
        descricao: "Seus profundos estudos sobre um assunto lhe ofereceram um domínio em sua respectiva área. Escolha uma perícia baseada em Intelecto relacionada aos seus estudos. Em testes desta perícia, rolar 19 no dado irá contar como um 20 natural.",
      },
    ],
  },

  {
    id: "advogado",
    nome: "Advogado",
    descricao: "Você construiu uma carreira como advogado, resolvendo casos difíceis com precisão e habilidade. Durante a investigação de um caso peculiar, você descobriu evidências que iam além das explicações racionais. Talvez tenha pego um caso em que o réu era um cultista, ou até encontrado documentos com detalhes perturbadores.",
    pericias: ["diplomacia", "investigacao"],
    poder: {
      nome: "Objeção",
      bonus: "+2 em Intuição contra mentiras; +5 para mudar atitude de culpados",
      descricao: "Você aprendeu a ler os padrões das pessoas. Você recebe +2 em testes de Intuição para descobrir se alguém está mentindo ou contando a verdade. Além disso, recebe +5 em testes de mudar atitude (também vale para Intimidação) contra personagens que tenham cometido algum crime ou sejam culpados de algo.",
    },
  },
  {
    "id": "agente-de-saúde",
    "nome": "Agente de Saúde",
    "descricao": "Você era um profissional da saúde, como um enfermeiro, farmacêutico, médico, psicólogo ou socorrista, treinado no atendimento e cuidado de pessoas. Você pode ter sido surpreendido por um evento paranormal durante o trabalho ou mesmo cuidado de um agente da Ordem em uma emergência, que ficou surpreso com o quão bem você lidou com a situação.",
    "pericias": ["intuicao", "medicina"],
    "poder": {
      "nome": "Técnica Medicinal",
      bonus: "+2× Intelecto no total de PV curados",
      "descricao": "Sempre que cura um personagem, você adiciona o dobro do seu Intelecto no total de PV curados."
    },
    poderesExtras: [
      {
        nome: "Tratamento Preventivo",
        descricao: "Você pode gastar uma Ação de Interlúdio para realizar um tratamento preventivo em um número de aliados igual ao seu Intelecto. Durante o Interlúdio, aliados afetados recebem PVs adicionais iguais ao seu NEX+Intelecto, e na próxima vez que entrarem em morrendo, deverão rolar 1d4. Caso tirem 4, em vez de cair, continuam de pé com 1 PV.",
      },
    ],
  },
  {
    id: "alpinista",
    nome: "Alpinista",
    descricao: "Você viajou para diversos lugares ao redor do mundo, escalando montanhas e aprendendo a encontrar a paz consigo mesmo. Por isso, você topa qualquer aventura, até as que envolvem criaturas e lugares que não deveriam pertencer a esse mundo.",
    pericias: ["atletismo", "vontade"],
    poder: {
      nome: "Coração da Montanha",
      bonus: "+3m de deslocamento; ignora terreno difícil e escalada",
      descricao: "Você ignora as penalidades por andar em terreno difícil e por escalar. Além disso, você ganha um bônus de +3m no seu deslocamento.",
    },
  },
  {
    "id": "amigo-dos-animais",
    "nome": "Amigo dos Animais",
    "descricao": "Você desenvolveu uma conexão muito forte com outros seres: os animais. Seja por nunca ter se dado muito bem com humanos ou por preferir a companhia de um melhor amigo de quatro patas, você leva sua vida ao lado de um bichano e até mesmo aprende com a natureza perceptiva deles.",
    "pericias": ["adestramento", "percepcao"],
    "poder": {
      "nome": "Companheiro Animal",
      bonus: "+2 em perícia à escolha (via aliado)",
      "descricao": "Você consegue entender as intenções e sentimentos de animais, e pode usar Adestramento para mudar a atitude deles. Além disso, você possui um melhor amigo, um animal que cresceu com você e pelo qual tem profundo apego. Ele conta como um aliado que fornece +2 em uma perícia a sua escolha (aprovada pelo mestre). Quando você alcança NEX 35%, ele também passa a fornecer o bônus de um aliado de um tipo a sua escolha (aprovado pelo mestre). Por fim, quando você alcança NEX 70%, ele fornece a habilidade do tipo de aliado escolhido. Perder seu parceiro é muito doloroso. Se ele morrer, você perde 10 pontos de Sanidade permanentemente, além de ficar perturbado até o fim da cena. Como encontrar um novo companheiro fica a critério do mestre, mas geralmente será uma ação entre missões."
    }
  },
  {
    "id": "amnésico",
    "nome": "Amnésico",
    "descricao": "Você perdeu a maior parte da memória. Sabe apenas o próprio nome, ou nem isso. Sua amnésia pode ser resultado de um trauma paranormal ou mesmo de um ritual. Talvez você tenha sido vítima de cultistas? Talvez você tenha sido um cultista? Seja como for, hoje a Ordem é a única família que conhece. Quem sabe, cumprindo missões, você descubra algo sobre seu passado.",
    "pericias": ["à escolha do mestre (2)"],
    "poder": {
      "nome": "Vislumbres do Passado",
      bonus: "+1d4 PE temporários (1x/sessão, condicional)",
      "descricao": "Uma vez por sessão, você pode fazer um teste de Intelecto (DT 10) para reconhecer pessoas ou lugares familiares, que tenha encontrado antes de perder a memória. Se passar, recebe 1d4 PE temporários e, a critério do mestre, uma informação útil."
    }
  },
  {
    "id": "artista",
    "nome": "Artista",
    "descricao": "Você era um ator, músico, escritor, dançarino, influenciador… Seu trabalho pode ter sido inspirado por uma experiência paranormal do passado e o que o público acha que é pura criatividade, a Ordem sabe que tem um lado mais sombrio.",
    "pericias": ["artes", "enganacao"],
    "poder": {
      "nome": "Magnum Opus",
      bonus: "+5 em Presença e perícias de Presença (situacional)",
      "descricao": "Você é famoso por uma de suas obras. Uma vez por missão, pode determinar que uma pessoa envolvida em uma cena de interação o reconheça. Você recebe +5 em testes de Presença e de perícias baseadas em Presença contra aquela pessoa. A critério do mestre, pode receber esse bônus em outras situações nas quais seria reconhecido."
    }
  },
  {
    "id": "astronauta",
    "nome": "Astronauta",
    "descricao": "Outrora limitada a membros de algumas agências espaciais estatais, a profissão de explorador espacial se tornou mais acessível conforme mais países, e até mesmo empresas privadas, se envolveram com viagens na fronteira final. Como um astronauta, você se acostumou à pressão de ser responsável pela vida de seus colegas e por experimentos de milhões de reais. E foi na escuridão do espaço que você descobriu que não estamos sozinhos.",
    "pericias": ["ciencias", "fortitude"],
    "poder": {
      "nome": "Acostumado ao Extremo",
      bonus: "-5 de dano de fogo/frio/mental (1 PE, custo cresce por uso)",
      "descricao": "Quando sofre dano de fogo, de frio ou mental, você pode gastar 1 PE para reduzir esse dano em 5. A cada vez que usa esta habilidade novamente na mesma cena, seu custo aumenta em +1 PE."
    }
  },
  {
    "id": "atleta",
    "nome": "Atleta",
    "descricao": "Você competia em um esporte individual ou coletivo, como natação ou futebol. Seu desempenho pode ser fruto de uma influência paranormal que nem mesmo você conhecia ou você pode ter se envolvido em algum evento relacionado ao Outro Lado em uma de suas competições.",
    "pericias": ["acrobacia", "atletismo"],
    "poder": {
      "nome": "110%",
      bonus: "+5 em testes de Força/Agilidade (2 PE)",
      "descricao": "Quando faz um teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria) você pode gastar 2 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "barman",
    "nome": "Barman",
    "descricao": "Você trabalhava atrás do balcão, ouvindo histórias e confissões de todos os tipos. Em uma noite, coisas ilógicas aconteceram em seu local de trabalho, talvez um cliente tenha deixado um item misterioso para trás, ou você escutou algo que não deveria.",
    "pericias": ["diplomacia", "profissao"],
    "poder": {
      "nome": "Senhor dos Coquetéis",
      bonus: "+2 em Vontade e resistência mental (grupo)",
      "descricao": "Em cenas de interlúdio, você pode fazer a ação alimentar-se para preparar uma bebida especial. Você e todos os aliados que fizerem a ação alimentar-se recebem os efeitos do prato energético e recebem +2 em testes de vontade e resistência mental até falharem em um teste desta perícia."
    }
  },
  {
    "id": "bombeiro",
    "nome": "Bombeiro",
    "descricao": "Você passou anos apagando incêndios, salvando vidas e enfrentando situações de extremo perigo. Durante um resgate em um prédio antigo, encontrou algo que mudou sua perspectiva para sempre. Talvez descobriu um misterioso símbolo esculpido nas paredes chamuscadas, ou percebeu que as chamas não eram realmente fogo, e sim energias malignas de demônios que sussurravam entre as “chamas”. Sua bravura e habilidades de proteção podem ser a salvação de cidadãos e agentes em meio ao paranormal.",
    "pericias": ["atletismo", "Vontade ou Iniciativa"],
    "poder": {
      "nome": "Resgate",
      bonus: "+2 em testes de resgate (2 PE)",
      "descricao": "Quando um personagem em até alcance longo estiver machucado ou perturbado, você pode gastar 2 PE para utilizar Corrida como ação de movimento até o alvo para ajudá-lo, recebendo +2 em quaisquer testes necessários, como agarrar e derrubar algo no caminho."
    }
  },
  {
    "id": "caçador",
    "nome": "Caçador",
    "descricao": "Você cresceu nas florestas, aprendendo a caçar e rastrear desde jovem. Talvez tenha encontrado uma criatura que desafiava a lógica e a natureza ou até mesmo descoberto algo estranho entre ass cavernas e árvores. De qualquer forma, sobreviver a esse encontro mudou sua vida para sempre.",
    "pericias": ["furtividade", "sobrevivencia"],
    "poder": {
      "nome": "Sentido de Predador",
      bonus: "+1d20 no próximo teste de ataque (2 PE)",
      "descricao": "Você pode gastar 2 PE para fazer um teste de Percepção (DT 20) e observar durante uma ação de movimento onde acertar ou a melhor posição para atirar, recebendo +1d20 no próximo teste de ataque."
    }
  },
  {
    "id": "chef",
    "nome": "Chef",
    "descricao": "Você é um cozinheiro amador ou profissional. Talvez trabalhasse em um restaurante, talvez simplesmente gostasse de cozinhar para a família e amigos. Como sua comida fez com que você se envolvesse com o paranormal? Ninguém sabe. Mas os outros agentes adoram quando você vai para a missão!",
    "pericias": ["fortitude", "profissao"],
    "poder": {
      "nome": "Ingrediente Secreto",
      "descricao": "Em cenas de interlúdio, você pode fazer a ação alimentar-se para cozinhar um prato especial. Você, e todos os membros do grupo que fizeram a ação alimentar-se, recebem o benefício de dois pratos (caso o mesmo benefício seja escolhido duas vezes, seus efeitos se acumulam)."
    }
  },
  {
    "id": "chef-do-outro-lado",
    "nome": "Chef do Outro Lado",
    "descricao": "Você nunca foi muito bom na culinária convencional. Depois de sobreviver ao paranormal, entretanto, descobriu um talento que é considerado um grande tabu até mesmo pelos ocultistas mais experientes: cozinhar e ingerir entidades do Outro Lado. Acreditando estar realizando algum tipo de arte gastronômica esotérica, ou simplesmente por se render a impulsos incontroláveis, você elabora pratos nunca vistos antes misturando ingredientes comuns da Realidade com aquilo que não deveria existir. Você é a prova viva do ditado popular: \"tem gosto pra tudo\".",
    "pericias": ["ocultismo", "profissao"],
    "poder": {
      "nome": "Fome do Outro Lado",
      bonus: "RD 10 contra o elemento do ingrediente (ou vulnerabilidade)",
      "descricao": "Você pode usar partes de criaturas do Outro Lado como ingredientes culinários. No início de cada missão você pode solicitar essas partes como itens de Categoria I que ocupam 0,5 espaço, e pode obtê-las de criaturas derrotadas (cada criatura Pequena ou maior fornece 1 ingrediente paranormal). Você pode gastar uma ação de interlúdio e 1 ingrediente para preparar um prato especial; faça um teste de Profissão (cozinheiro) com DT 15 + O (o mestre oculta o resultado do teste até alguém comer o prato). Se você passar no teste, o prato fornece RD 10 contra o tipo de dano do elemento da criatura cujo ingrediente foi usado. Caso contrário, o prato causa vulnerabilidade a esse tipo de dano. Os efeitos duram até o fim da próxima cena. Independentemente do resultado, se alimentar do paranormal, por menor que seja a porção, gera consequências brutais e permanentes em seu organismo, sendo uma das formas mais rápidas de destruir sua mente. A cada refeição consumida, você perde 1 ponto permanente de Sanidade. Além disso, se estiver usando a regra opcional Nível de Experiência e Nível de Exposição (p. 98), o NEX do personagem aumenta em 3% para cada parte de criatura diferente que ingerir (mesmo que não esteja usando essa regra, use as alterações descritas na regra para personagens que ingerem partes de criaturas dessa forma). A coragem para se beneficiar desses pratos é algo muito mais presente em grupos de cultistas e, por todas essas razões, não é uma ação apoiada pela Ordo Realitas."
    }
  },
  {
    "id": "cientista-forense",
    "nome": "Cientista Forense",
    "descricao": "Você trabalhava coletando provas para a solução de crimes, seja para a polícia, seja para uma empresa privada de investigação. Usava métodos e técnicas adquiridos através de uma graduação em uma área científica ou médica, além de cursos específicos. Recrutado para a Ordem pelos seus conhecimentos técnicos, seu trabalho não mudou muito - mas o tipo de crime que você investiga, sim.",
    "pericias": ["ciencias", "investigacao"],
    "poder": {
      "nome": "Investigação Científica",
      "descricao": "Uma vez por cena de investigação, você pode gastar uma ação livre para procurar pistas, usando Ciências no lugar da perícia que seria usada para tentar encontrar a pista em questão."
    }
  },
  {
    "id": "criminoso",
    "nome": "Criminoso",
    "descricao": "Você vivia uma vida fora da lei, seja como mero batedor de carteiras, seja como membro de uma facção criminosa. Em algum momento, você se envolveu em um assunto da Ordem — talvez tenha roubado um item amaldiçoado? A organização, por sua vez, achou melhor recrutar seus talentos do que ter você como um estorvo.",
    "pericias": ["crime", "furtividade"],
    "poder": {
      "nome": "O Crime Compensa",
      "descricao": "No final de uma missão, escolha um item encontrado na missão. Em sua próxima missão, você pode incluir esse item em seu inventário sem que ele conte em seu limite de itens por patente."
    }
  },
  {
    "id": "cultista-arrependido",
    "nome": "Cultista Arrependido",
    "descricao": "Você fez parte de um culto paranormal. Talvez fossem ignorantes iludidos, que acreditavam estar contatando entidades benevolentes. Talvez soubessem exatamente o que estavam fazendo. Seja como for, algo abriu seus olhos e agora você luta pelo lado certo — embora carregue para sempre traços de sua vida pregressa. Outros membros da Ordem podem desconfiar de sua conversão e você sabe que precisará se esforçar para conquistar a confiança de todos.",
    "pericias": ["ocultismo", "religiao"],
    "poder": {
      "nome": "Traços do Outro Lado",
      bonus: "Poder paranormal à escolha; Sanidade inicial pela metade",
      "descricao": "Você possui um poder paranormal à sua escolha. Porém, começa o jogo com metade da Sanidade normal para sua classe."
    }
  },
  {
    "id": "desgarrado",
    "nome": "Desgarrado",
    "descricao": "Você não vivia de acordo com as normas da sociedade. Podia ser um eremita, uma pessoa em situação de rua ou simplesmente alguém que descobriu o paranormal e abandonou sua rotina — sabendo o quão frágil era a existência humana, não conseguia simplesmente continuar indo para o trabalho todo dia. De qualquer forma, a vida sem os confortos modernos o deixou mais forte.",
    "pericias": ["fortitude", "sobrevivencia"],
    "poder": {
      "nome": "Calejado",
      bonus: "+1 PV a cada 5% de NEX",
      "descricao": "Você recebe +1 PV para cada 5% de NEX."
    }
  },
  {
    "id": "diplomata",
    "nome": "Diplomata",
    "descricao": "Você atuava em uma área onde as habilidades sociais e políticas eram ferramentas indispensáveis. Talvez fosse representante comercial de uma empresa, membro de um partido político ou embaixador do governo. Em algum momento, entretanto, você teve uma experiência paranormal que revelou entidades com as quais não se é possível negociar. Agora, você usa os contatos que adquiriu para combater o Outro Lado.",
    "pericias": ["atualidades", "diplomacia"],
    "poder": {
      "nome": "Conexões",
      bonus: { pericia: "diplomacia", formula: "fixo", valor: 2 },
      "descricao": "Você recebe +2 em Diplomacia. Além disso, se puder contatar um NPC capaz de lhe auxiliar, você pode gastar 10 minutos e 2 PE para substituir um teste de uma perícia relacionada ao conhecimento desse NPC, feito até o fim da cena, por um teste de Diplomacia."
    }
  },
  {
    "id": "engenheiro",
    "nome": "Engenheiro",
    "descricao": "Pedreiro, industriário, operador de máquinas em uma fábrica, inventor, artesão… Você passou uma parte de sua vida em um emprego braçal ou intelectual, desempenhando atividades práticas que lhe deram uma visão pragmática do mundo. Sua rotina mundana, entretanto, foi confrontada de alguma forma pelo paranormal, e você não consegue mais esquecer tudo que viu sobre os mistérios do mundo.",
    "pericias": ["ciencias", "tecnologia"],
    "poder": {
      "nome": "Invenção",
      "descricao": "Em uma cena de interlúdio, você pode gastar uma de suas ações para transformar uma arma improvisada em uma arma comum, ou transformar uma armadura improvisada em uma vestimenta."
    }
  },
  {
    "id": "executivo",
    "nome": "Executivo",
    "descricao": "Você possuía um trabalho de escritório em uma grande empresa, banco ou corporação. Era um administrador, advogado, contador ou de qualquer outra profissão que lida com papelada e burocracia. Sua vida era bastante normal, até que você descobriu algo que não devia. Talvez o sucesso da empresa residisse em um ritual? Talvez toda a corporação fosse fachada para um culto e o presidente, um líder cultista envolvido com entidades paranormais? Após essa descoberta, você foi recrutado pela Ordem e trocou seu trabalho de escritório por missões de campo — hoje, sua vida é tudo, menos normal.",
    "pericias": ["diplomacia", "profissao"],
    "poder": {
      "nome": "Processo Otimizado",
      bonus: "+5 em teste de perícia (2 PE, situacional)",
      "descricao": "Sempre que faz um teste de perícia durante um teste estendido, ou uma ação para revisar documentos (físicos ou digitais), pode pagar 2 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "experimento",
    "nome": "Experimento",
    "descricao": "Você foi uma cobaia em um experimento físico. Pode ter sido um voluntário em um procedimento experimental legítimo, ou submetido a experimentos científicos ou paranormais contra sua vontade. Qualquer que seja a natureza desse evento, causou alterações permanentes em seu corpo, como um cheiro forte de químicos, cicatrizes ou manchas estranhas, ou outra metamorfose claramente antinatural. Elas concedem capacidades extraordinárias, mas trazem um estigma que provoca reações negativas em outras pessoas.",
    "pericias": ["atletismo", "fortitude"],
    "poder": {
      "nome": "Mutação",
      bonus: "RD 2; +2 em perícia à escolha (For/Agi/Vig); −O em Diplomacia",
      "descricao": "Você recebe resistência a dano 2 e +2 em uma perícia à sua escolha que seja originalmente baseada em Força, Agilidade ou Vigor. Entretanto, sofre −O em Diplomacia."
    }
  },
  {
    "id": "explorador",
    "nome": "Explorador",
    "descricao": "Você é uma pessoa que se interessa muito por história ou geografia, frequentemente embarcando em trilhas e explorações para enriquecer seus estudos. Suas aventuras tornaram seu corpo mais resistente e capaz de se manter firme mesmo nas situações mais adversas. No entanto, um encontro trágico com o paranormal marcou sua jornada.",
    "pericias": ["fortitude", "sobrevivencia"],
    "poder": {
      "nome": "Manual do Sobrevivente",
      bonus: "+5 em testes de resistência ambiental (2 PE)",
      "descricao": "Ao fazer um teste para resistir a armadilhas, clima, doenças, fome, sede, fumaça, sono, sufocamento ou veneno, incluindo de fontes paranormais, você pode gastar 2 PE para receber +5 nesse teste. Além disso, em cenas de interlúdio, você considera condições de sono precárias como normais."
    }
  },
  {
    "id": "fanático-por-criaturas",
    "nome": "Fanático por Criaturas",
    "descricao": "Você sempre foi obcecado pelo sobrenatural. Desde que pode se lembrar, a ideia de encontrar uma criatura o fascina tanto quanto o assusta. Essa faísca fez você se tornar um \"caçador de monstros\", dedicando-se a localizar as feras citadas em documentários sensacionalistas. Para você, todo rumor e crendice pode esconder um fundo de verdade. Talvez uma de suas pesquisas o tenha levado diretamente a uma criatura paranormal, ou talvez elas tenham encontrado você primeiro. Afinal, você nunca esteve se escondendo.",
    "pericias": ["investigacao", "ocultismo"],
    "poder": {
      "nome": "Conhecimento Oculto",
      "descricao": "Você pode fazer testes de Ocultismo para identificar criatura a partir de informações como uma imagem, rastros, indícios de sua presença ou outras pistas que o mestre considere suficientes. Se passar, você descobre as características da criatura (conforme descrito na perícia), mas não sua identidade ou tipo específico. Além disso, quando passa em um teste de Ocultismo para identificar criatura, você recebe também +2 em todos os testes contra a criatura até o fim da missão."
    }
  },
  {
    "id": "fotógrafo",
    "nome": "Fotógrafo",
    "descricao": "Você é um artista visual que usa câmeras para capturar momentos e transmitir histórias através de imagens estáticas. Costumeiramente movido pela paixão de observar o mundo ao seu redor, buscando ângulos únicos e perspectivas singulares para documentar a vida e a sociedade, você não fazia ideia de que encontraria elementos paranormais através de sua lente.",
    "pericias": ["artes", "percepcao"],
    "poder": {
      "nome": "Através da Lente",
      bonus: "+5 em Investigação/Percepção via câmera (2 PE)",
      "descricao": "Quando faz um teste de Investigação ou de Percepção ou para adquirir pistas olhando através de uma câmera ou analisando fotos, você pode gastar 2 PE para receber +5 nesse teste (um personagem que se move olhando através de uma lente anda à metade de seu deslocamento)."
    }
  },
  {
    "id": "inventor-paranormal",
    "nome": "Inventor Paranormal",
    "descricao": "A curiosidade e a criatividade fizeram de você uma pessoa que busca constantemente desafiar limites e criar soluções inovadoras, sendo mais de uma vez intitulado como um \"cientista louco\". Você teve contato com o paranormal por meio de seus experimentos ou foi procurado pela Ordem porque suas pesquisas chamaram atenção demais. De qualquer forma, o Outro Lado inspira você a utilizar o desconhecido em suas invenções.",
    "pericias": ["profissao", "vontade"],
    "poder": {
      "nome": "Invenção Paranormal",
      "descricao": "Escolha um ritual de 1º círculo. Você possui um invento paranormal, um item de categoria 0 que ocupa 1 espaço e que permite que você execute o efeito do ritual escolhido. Para ativar o invento, você gasta uma ação padrão (ou a ação necessária para lançar o ritual, o que for maior) e faz um teste de Profissão (engenheiro) com DT 15 +5 para cada ativação na mesma missão. Se passar, o item faz o equivalente a conjurar o ritual em sua forma básica sem pagar seu custo em PE. Se falhar, ele enguiça. Você pode gastar uma ação de interlúdio para fazer a manutenção do seu invento; fazer isso o conserta e redefine sua DT de ativação para 15. Você pode trocar o ritual contido em seu invento no início de cada missão."
    }
  },
  {
    "id": "investigador",
    "nome": "Investigador",
    "descricao": "Você era um investigador do governo, como um perito forense ou policial federal, ou privado, como um detetive particular. Pode ter tido contato com o paranormal em algum caso ou ter sido recrutado pela Ordem por suas habilidades de resolução de mistérios.",
    "pericias": ["investigacao", "percepcao"],
    "poder": {
      "nome": "Faro para Pistas",
      bonus: "+5 para procurar pistas (1 PE)",
      "descricao": "Uma vez por cena, quando fizer um teste para procurar pistas, você pode gastar 1 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "jornalista",
    "nome": "Jornalista",
    "descricao": "Uma espécie ameaçada de extinção, você atuava investigando notícias para um jornal, rede de televisão, blog, canal de YouTube… Você se juntou a Ordem porque descobriu algo relacionado ao paranormal, ou foi recrutado para investigar um caso específico. Seja como for, continua buscando a verdade - não mais para informar as pessoas, mas sim para protegê-las.",
    "pericias": ["atualidades", "investigacao"],
    "poder": {
      "nome": "Fontes Confiáveis",
      bonus: "+5 em novo teste de pista (1 PE)",
      "descricao": "Uma vez por sessão de jogo, você pode gastar 1 PE para contatar suas fontes - pessoas com acesso a informações nas quais você confia. Isso permite que você role novamente um teste já realizado para encontrar uma pista, com +5 de bônus, ou receba outra informação relevante (a critério do mestre)."
    }
  },
  {
    "id": "jovem-místico",
    "nome": "Jovem Místico",
    "descricao": "Você possui uma profunda conexão com sua espiritualidade, suas crenças ou o próprio universo. Essa conexão faz com que você veja o mundo e viva sua vida de forma diferente e peculiar, características que o tornaram mais suscetível a um encontro com o paranormal.",
    "pericias": ["ocultismo", "religiao"],
    "poder": {
      "nome": "A Culpa é das Estrelas",
      bonus: "+2 em testes de perícia (1 PE, condicional)",
      "descricao": "Escolha um número da sorte entre 1 e 6. No início de cada cena, você pode gastar 1 PE e rolar 1d6. Se o resultado for seu número da sorte, você recebe +2 em testes de perícia até o fim da cena. Caso contrário, na próxima vez que usar esta habilidade, escolha mais um número como número da sorte. Quando rolar um de seus números da sorte, a quantidade de números volta a 1."
    }
  },
  {
    "id": "legista-do-turno-da-noite",
    "nome": "Legista do Turno da Noite",
    "descricao": "Em um trabalho como o seu, é de se esperar que você já tenha visto muita coisa. No entanto, quando o sol se põe, seus colegas vão embora e a luz artificial deixa cantos sombrios do necrotério, talvez você veja mais do que gostaria. Os sons que poderiam ter sido fruto de sua imaginação se revelaram mais do que um truque da sua própria mente, fazendo você descobrir que nem sempre a morte é o fim de tudo.",
    "pericias": ["ciencias", "medicina"],
    "poder": {
      "nome": "Luto Habitual",
      bonus: "+5 em Medicina (socorros/necropsia, 2 PE)",
      "descricao": "Você sofre apenas a metade do dano mental por presenciar uma cena que, a critério do mestre, esteja relacionada à rotina de um legista (como presenciar uma morte, ver um cadáver ou encontrar órgãos humanos). Além disso, quando faz um teste de Medicina para primeiros socorros ou necropsia, você pode gastar 2 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "lutador",
    "nome": "Lutador",
    "descricao": "Você pratica uma arte marcial ou esporte de luta, ou cresceu em um bairro perigoso onde aprendeu briga de rua. Já quebrou muitos ossos, tanto seus quanto dos outros. Pode ter conhecido a Ordem após um torneio secreto envolvendo entidades do Outro Lado ou ter sido recrutado pela sua capacidade de luta.",
    "pericias": ["luta", "reflexos"],
    "poder": {
      "nome": "Mão Pesada",
      bonus: "+2 em dano corpo a corpo",
      "descricao": "Você recebe +2 em rolagens de dano com ataques corpo a corpo."
    }
  },
  {
    "id": "magnata",
    "nome": "Magnata",
    "descricao": "Você possui muito dinheiro ou patrimônio. Pode ser o herdeiro de uma família antiga ligada ao oculto, ter criado e vendido uma empresa e decidido usar sua riqueza para uma causa maior, ou ter ganho uma loteria após inadvertidamente escolher números amaldiçoados que formavam um ritual.",
    "pericias": ["diplomacia", "pilotagem"],
    "poder": {
      "nome": "Patrocinador da Ordem",
      bonus: "Limite de crédito +1 patente (ou 25% de desconto)",
      "descricao": "Seu limite de crédito é sempre considerado um acima do atual. Caso não esteja usando o sistema de limite de créditos, você ganha um desconto de 25% em todas as compras."
    }
  },
  {
    id: "marinheiro",
    nome: "Marinheiro",
    descricao: "Você era, ou é, uma pessoa com grande autoridade a bordo. Você já viu muita coisa em alto mar, desde ouvir histórias de fantasmas e lugares misteriosos até lidar com ataques de contrabandistas.",
    pericias: ["iniciativa", "intimidacao"],
    // A homebrew ainda não descreve o poder desta origem ("Poder. Poder.").
    poder: {
      nome: "Poder de Marinheiro",
      descricao: "Ainda não definido na homebrew — combine o efeito com o mestre.",
    },
  },
  {
    "id": "mateiro",
    "nome": "Mateiro",
    "descricao": "Você conhece áreas rurais e selvagens. Você pode ser um guia florestal, um biólogo de campo ou simplesmente um entusiasta da vida selvagem. Qualquer que seja sua relação com a natureza, ela foi sua porta para o contato com o Outro Lado.",
    "pericias": ["percepcao", "sobrevivencia"],
    "poder": {
      "nome": "Mapa Celeste",
      bonus: "Rerrola Sobrevivência, fica com o melhor (2 PE)",
      "descricao": "Desde que possa ver o céu, você sempre sabe as direções dos pontos cardeais e consegue chegar sem se perder em qualquer lugar que já tenha visitado ao menos uma vez. Quando faz um teste de Sobrevivência, você pode gastar 2 PE para rolar o teste novamente e escolher o melhor entre os dois resultados. Além disso, em cenas de interlúdio, você considera condições de sono precárias como normais."
    }
  },
  {
    "id": "mercenário",
    "nome": "Mercenário",
    "descricao": "Você é um soldado de aluguel, que trabalha sozinho ou como parte de alguma organização que vende serviços militares. Escoltas e assassinatos fizeram parte de sua rotina por tempo o suficiente para você se envolver em alguma situação com o paranormal. Você é o que os conspiradores mais temem. Seu nome e rosto já foram apagados de diversos registros - a sua identidade atual é realmente sua?",
    "pericias": ["Iniciativa ou Tática", "Furtividade ou Intimidação"],
    "poder": {
      "nome": "Posição de Combate",
      bonus: "+5 em Investigação/Diplomacia/Enganação (vs. indiferentes)",
      "descricao": "Você tem experiência em como chegar em um alvo em meio a uma multidão ou sem causar alarde. Você recebe +5 em testes de Investigação, Diplomacia e Enganação contra alvos que estejam Indiferentes a sua presença."
    }
  },
  {
    "id": "mergulhador",
    "nome": "Mergulhador",
    "descricao": "Seja por profissão ou por hobby, você é um aventureiro subaquático que explora os mistérios e maravilhas do mundo submerso. Trajando seu equipamento de mergulho, você consegue se aventurar a grandes profundidades para descobrir um mundo totalmente diferente daquele que conhecemos na superfície. Infelizmente, no dia em que você olhou para o abismo, ele encarou você de volta.",
    "pericias": ["atletismo", "fortitude"],
    "poder": {
      "nome": "Fôlego de Nadador",
      bonus: "+5 PV",
      "descricao": "Você recebe +5 PV e pode prender a respiração por um número de rodadas igual ao dobro do seu Vigor. Além disso, quando passa em um teste de Atletismo para natação, você avança seu deslocamento normal (em vez da metade)."
    }
  },
  {
    "id": "militar",
    "nome": "Militar",
    "descricao": "Você serviu em uma força militar, como o exército ou a marinha. Passou muito tempo treinando com armas de fogo, até se tornar um perito no uso delas. Acostumado a obedecer ordens e partir em missões, está em casa na Ordo Realitas. O inimigo é diferente, mas um tiro bem dado continua resolvendo o problema.",
    "pericias": ["pontaria", "tatica"],
    "poder": {
      "nome": "Para Bellum",
      bonus: "+2 em dano com armas de fogo",
      "descricao": "Você recebe +2 em rolagens de dano com armas de fogo."
    }
  },
  {
    "id": "motorista",
    "nome": "Motorista",
    "descricao": "Você é um caminhoneiro, motorista de aplicativo, motoboy, piloto de corrida, motorista de ambulância ou qualquer outro tipo de condutor profissional. Você levava a vida transportando cargas ou passageiros, até o dia em que suas viagens cruzaram o caminho do Outro Lado.",
    "pericias": ["pilotagem", "reflexos"],
    "poder": {
      "nome": "Mãos no Volante",
      bonus: "+5 em Pilotagem/resistência ao pilotar (2 PE)",
      "descricao": "Você não sofre penalidades em testes de ataque por estar em um veículo em movimento e, sempre que estiver pilotando e tiver que fazer um teste de Pilotagem ou resistência, pode gastar 2 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "nerd-entusiasta",
    "nome": "Nerd Entusiasta",
    "descricao": "Você dedicou muito do seu tempo aprendendo sobre videogames, RPGs de mesa, ficção científica ou qualquer outro assunto considerado \"nerd\". Sua obsessão em pesquisar fundo seus assuntos de interesse e sua capacidade em lidar com os mais variados temas chamou a atenção de organizações paranormais.",
    "pericias": ["ciencias", "tecnologia"],
    "poder": {
      "nome": "O Inteligentão",
      bonus: "+1d6 no bônus da ação ler (2d6 em vez de 1d6)",
      "descricao": "O bônus que você recebe ao utilizar a ação de interlúdio ler aumenta em +1 dado (de +1d6 para +2d6)."
    }
  },
  {
    "id": "operário",
    "nome": "Operário",
    "descricao": "Pedreiro, industriário, operador de máquinas em uma fábrica… Você passou uma parte de sua vida em um emprego braçal, desempenhando atividades práticas que lhe deram uma visão pragmática do mundo. Sua rotina mundana, entretanto, foi confrontada de alguma forma pelo paranormal, e você não consegue mais esquecer tudo que viu sobre os mistérios do mundo.",
    "pericias": ["fortitude", "profissao"],
    "poder": {
      "nome": "Ferramenta de Trabalho",
      bonus: "+1 em ataque, dano e margem de ameaça (arma escolhida)",
      "descricao": "Escolha uma arma simples ou tática que, a critério do mestre, poderia ser usada como ferramenta em sua profissão (como uma marreta para um pedreiro). Você sabe usar a arma escolhida e recebe +1 em testes de ataque, rolagens de dano e margem de ameaça com ela."
    }
  },
  {
    "id": "policial",
    "nome": "Policial",
    "descricao": "Você fez parte de uma força de segurança pública, civil ou militar. Em alguma patrulha ou chamado se deparou com um caso paranormal e sobreviveu para contar a história.",
    "pericias": ["percepcao", "pontaria"],
    "poder": {
      "nome": "Patrulha",
      bonus: "+2 em Defesa",
      "descricao": "Você recebe +2 em Defesa."
    }
  },
  {
    "id": "politico",
    "nome": "Político",
    "descricao": "Você fez parte de uma força de segurança pública, civil ou militar. Em alguma patrulha ou chamado se deparou com um caso paranormal e sobreviveu para contar a história.",
    "pericias": ["diplomacia", "enganacao"],
    "poder": {
      "nome": "Lavagem de Mãos",
      "descricao": "O dinheiro que tem ao seu dispor sempre te ajudou a conquistar o que queria. Sempre que estiver em uma cena que dependa de interação com NPCs para adquirir informações, você pode subornar a pessoa para conseguir dois sucessos. Este dinheiro teve que sair de algum lugar, por isso, na sua próxima missão, você e seu grupo, diminuem em uma patente o limite de crédito que possuem para está missão. Alternativamente, você também pode não receber um item da maior categoria de prestígio que possuir em sua próxima missão, para anular a penalidade de seu grupo. Esta penalidade é cumulativa."
    }
  },
  {
    "id": "professor",
    "nome": "Professor",
    "descricao": "Você leciona em uma escola ou universidade, ensinando ciências, artes ou outro campo do saber. Sua profissão é uma das mais nobres de todas e o colocou em contato com muitas pessoas e conhecimentos.",
    "pericias": ["ciencias", "diplomacia"],
    "poder": {
      "nome": "Professor",
      bonus: "+1 em atributo de aliado (2 PE)",
      "descricao": "Você sabe extrair o melhor das pessoas. Uma vez por cena, pode gastar uma ação padrão e 2 PE para fornecer +1 em um atributo de outro personagem em alcance curto até o fim da cena."
    }
  },
  {
    "id": "profetizado",
    "nome": "Profetizado",
    "descricao": "Como qualquer pessoa, você vai morrer. Entretanto, diferente delas, você sabe como isso vai acontecer. De algum jeito, seja por pesadelos, pensamentos intrusivos ou até visões inesperadas, você tem uma premonição clara — ou misteriosa e enigmática — de como serão seus últimos momentos de vida. O mestre pode determinar essa \"cena de morte\" em segredo e revelar apenas os detalhes que você já premuniu ou ambos podem determinar as condições para esse inevitável falecimento. A cena pode ser bem detalhada ou conter apenas alguns sinais. Por exemplo: \"você se vê pendurado em um gancho de carne, sangrando até desfalecer, no subsolo de um açougue\" ou \"a única coisa de que se lembra é da visão de um gancho\". Será que você é capaz de mudar seu próprio destino?",
    "pericias": ["vontade", "à escolha (relacionada à premonição)"],
    "poder": {
      "nome": "Luta ou Fuga",
      bonus: { pericia: "vontade", formula: "fixo", valor: 2 },
      "descricao": "Conhecer os sinais de sua morte o deixa mais confiante, principalmente quando eles não estão presentes. Você recebe +2 em Vontade. Quando surge uma referência a sua premonição (um objeto semelhante a um gancho, por exemplo, para alguém cuja morte está ligada a morrer em um gancho de carne), uma onda de adrenalina toma seu corpo e seus instintos de luta ou fuga se intensificam. Além do bônus em Vontade, você recebe +2 PE temporários que duram até o fim da cena."
    }
  },
  {
    "id": "psicólogo",
    "nome": "Psicólogo",
    "descricao": "Você se especializou no estudo e tratamento das questões mentais do ser humano. Em sua prática profissional, você teve contato com o paranormal e descobriu que algumas aflições mentais possuem origens sombrias e perigosas. Agora, você emprega seus conhecimentos para enfrentar o Outro Lado.",
    "pericias": ["intuicao", "profissao"],
    "poder": {
      "nome": "Terapia",
      "descricao": "Você pode usar Profissão (psicólogo) como Diplomacia. Além disso, uma vez por rodada, quando você ou um aliado em alcance curto falha em um teste de resistência contra um efeito que causa dano mental, você pode gastar 2 PE para fazer um teste de Profissão (psicólogo) e usar o resultado desse teste no lugar do teste de resistência falho."
    }
  },
  {
    "id": "religioso",
    "nome": "Religioso",
    "descricao": "Você é devoto ou sacerdote de uma fé. Independentemente da religião que pratica, se dedica a auxiliar as pessoas com problemas espirituais. A partir disso, teve contato com o paranormal, o que fez com que fosse convocado pela Ordem.",
    "pericias": ["religiao", "vontade"],
    "poder": {
      "nome": "Acalentar",
      bonus: "+5 em Religião para acalmar",
      "descricao": "Você recebe +5 em testes de Religião para acalmar. Além disso, quando acalma uma pessoa, ela recebe um número de pontos de Sanidade igual a 1d6 + a sua Presença."
    }
  },
  {
    "id": "repórter-investigativo",
    "nome": "Repórter Investigativo",
    "descricao": "Você está sempre em busca de histórias significativas, investigando eventos, entrevistando fontes e analisando dados para descobrir a verdade por trás dos acontecimentos. Profissionais do seu ramo costumam ser curiosos, persistentes e, em muitos casos, éticos em sua busca pela verdade. Por outro lado, essa profissão leva pessoas ao encontro do indescritível, e com você não foi diferente.",
    "pericias": ["atualidades", "investigacao"],
    "poder": {
      "nome": "Encontrar a Verdade",
      bonus: "+5 em Investigação (2 PE)",
      "descricao": "Você pode usar Investigação no lugar de Diplomacia ao fazer testes para persuadir e mudar atitude e, quando faz um teste de Investigação, pode gastar 2 PE para receber +5 nesse teste."
    }
  },
  {
    "id": "servidor-público",
    "nome": "Servidor Público",
    "descricao": "Você possuía carreira em um órgão do governo, lidando com burocracia e atendendo pessoas. Sua rotina foi quebrada quando você viu que o prefeito era um cultista ou que a câmara de vereadores se reunia à noite para realizar rituais. Quando os próprios representantes do povo estão dispostos a sacrificá-lo para entidades malignas, onde reside nossa esperança? Hoje, você sabe a resposta para essa pergunta: na Ordo Realitas.",
    "pericias": ["intuicao", "vontade"],
    "poder": {
      "nome": "Espírito Cívico",
      bonus: "+2 no bônus ao ajudar (1 PE)",
      "descricao": "Sempre que faz um teste para ajudar, você pode gastar 1 PE para aumentar o bônus concedido em +2."
    }
  },
  {
    "id": "teórico-da-conspiração",
    "nome": "Teórico da Conspiração",
    "descricao": "A humanidade nunca pisou na lua. Reptilianos ocupam importantes cargos públicos. A Terra é plana… E secretamente governada pelos Illuminati. Você sabe isso tudo, pois investigou a fundo esses importantes assuntos. Quando sua pesquisa esbarrou no paranormal, você foi recrutado. Na Ordem, sua loucura determinação será usada para um bom propósito.",
    "pericias": ["investigacao", "ocultismo"],
    "poder": {
      "nome": "Eu Já Sabia",
      bonus: "RD contra dano mental = Intelecto",
      "descricao": "Você não se abala tanto com entidades ou anomalias. Afinal, sempre soube que isso tudo existia. Você recebe resistência a dano mental igual ao seu Intelecto."
    },
    poderesExtras: [
      {
        nome: "Conhecimento Oculto",
        alternativa: true,
        descricao: "Você pode fazer testes de Ocultismo para identificar criatura a partir de informações como uma imagem, rastros, indícios de sua presença ou outras pistas que o mestre considere suficientes. Se passar, você descobre as características da criatura (conforme descrito na perícia), mas não sua identidade ou tipo específico. Além disso, quando passa em um teste de Ocultismo para identificar criatura, você recebe também +2 em todos os testes contra a criatura até o fim da missão.",
      },
    ],
  },
  {
    "id": "t.i.",
    "nome": "T.I.",
    "descricao": "Programador, engenheiro de software ou simplesmente \"o cara da T.I.\", você tem treinamento e experiência para lidar com sistemas informatizados. Seu talento (ou curiosidade exagerada) chamou a atenção da Ordem.",
    "pericias": ["investigacao", "tecnologia"],
    "poder": {
      "nome": "Motor de Busca",
      "descricao": "A critério do mestre, sempre que tiver acesso a internet, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Tecnologia."
    }
  },
  {
    "id": "trabalhador-rural",
    "nome": "Trabalhador Rural",
    "descricao": "Você trabalhava no campo ou em áreas isoladas, como fazendeiro, pescador, biólogo, veterinário… Você se acostumou com o convívio com a natureza e os animais e talvez tenha ouvido uma ou outra história de fantasmas ao redor da fogueira. Em algum momento da sua vida, porém, descobriu que muitas dessas histórias são verdadeiras.",
    "pericias": ["adestramento", "sobrevivencia"],
    "poder": {
      "nome": "Desbravador",
      bonus: "+5 em Adestramento/Sobrevivência (2 PE)",
      "descricao": "Quando faz um teste de Adestramento ou Sobrevivência, você pode gastar 2 PE para receber +5 nesse teste. Além disso, você não sofre penalidade em deslocamento por terreno difícil."
    }
  },
  {
    "id": "trambiqueiro",
    "nome": "Trambiqueiro",
    "descricao": "Uma vida digna exige muito trabalho, então é melhor nem tentar. Você vivia de pequenos golpes, jogatina ilegal e falcatruas. Certo dia, enganou a pessoa errada; no dia seguinte, se viu servindo à Ordem. Pelo menos agora tem a chance de usar sua lábia para o bem.",
    "pericias": ["crime", "enganacao"],
    "poder": {
      "nome": "Impostor",
      "descricao": "Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação."
    }
  },
  {
    "id": "transtornado-arrependido",
    "nome": "Transtornado Arrependido",
    "descricao": "(Essa origem é o exemplo de um Cultista Arrependido. Você já caminhou entre os Transtornados. Talvez tenha sido um seguidor cego, seduzido pelas promessas de transcendência por meio da carne e da dor. Talvez tenha conhecido a natureza visceral do culto desde o início e ainda assim escolheu mergulhar no delírio. Seja como for, em algum momento algo rompeu o ciclo. Você se libertou, mas ainda sente o eco dos rituais e a presença do Sangue sussurrando na própria carne.",
    "pericias": ["luta", "ocultismo"],
    "poder": {
      "nome": "Sofrimento de Sangue",
      bonus: "RD 2 a dano físico (aumenta com Sangue)",
      "descricao": "Eles podem tentar, mas já não dói mais. Você recebe RD 2 a dano físico. Para cada dois rituais de Sangue que possua, ou para cada poder paranormal de Sangue que possua, essa RD aumenta em +1. Contudo, a lembrança das desgraças que você viveu ou fez te causa pesadelos terríveis. Sua condição de descanso é sempre uma categoria pior (luxuosa se torna confortável, confortável se torna normal e normal se torna precária). A critério da sua história, você também pode escolher outro elemento para funcionar com esse poder."
    }
  },
  {
    "id": "tripulante",
    "nome": "Tripulante",
    "descricao": "Você era um trabalhador em navios de cruzeiro, pesqueiros, militares ou até mesmo  piratas. Por isso, se acostumou às viagens marítimas, desbravando os mares deste mundo, lidando com seus perigos amedrontadores e lendas de outros mundos.",
    "pericias": ["percepcao", "vontade"],
    "poder": {
      "nome": "Lutando pelo Povo",
      bonus: "+2 PV temporários por inimigo em vantagem numérica",
      "descricao": "Como um membro da marinha ou guarda-costeira, você viaja pelo mar brandindo a justiça de seu país, seja em guerras contra outros países, ou de piratas causando o caos pelas águas. Em situações como estas, suas maiores forças afloram, conseguindo se sobressair mesmo em emboscadas e com desvantagem numérica. Caso esteja em desvantagem em uma cena de combate, você recebe 2 PV temporários para cada ser que os inimigos possuírem de vantagem numérica."
    }
  },
  {
    "id": "universitário",
    "nome": "Universitário",
    "descricao": "Você era aluno de uma faculdade. Em sua rotina de estudos, provas e festas, acabou descobrindo algo — talvez um livro amaldiçoado na antiga biblioteca do campus? Por seu achado, foi convocado pela Ordem. Agora, estuda com mais afinco: nesse novo curso, ouviu dizer que as provas podem ser mortais.",
    "pericias": ["atualidades", "investigacao"],
    "poder": {
      "nome": "Dedicação",
      bonus: "+1 PE (mais 1 a cada NEX ímpar)",
      "descricao": "Você recebe +1 PE, e mais 1 PE adicional a cada NEX ímpar (15%, 25%…). Além disso, seu limite de PE por turno aumenta em 1 (em NEX 5% seu limite é 2, em NEX 10% é 3 e assim por diante; isso não afeta a DT de seus efeitos)."
    }
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    descricao: "Você trabalhou como barista, lojista ou vendedor ambulante, ou era dono ou administrava um comércio, como uma padaria, uma banca de jornal, um bar ou até um restaurante. Talvez você colecionava algo em quantias surpreendentes, sejam moedas, revistinhas ou qualquer tipo de artigo que seja lançado em grandes quantias. Por algum motivo, provavelmente relacionado a sua coleção ou um cliente atípico, os seus negócios lucrativos se tornaram sua porta de entrada para o submundo ocultista.",
    pericias: ["diplomacia", "intuicao"],
    poder: {
      nome: "Deixa que eu Faço",
      descricao: "Você sempre teve que lidar com funcionários ou clientes ruins, e, algumas vezes, é melhor você assumir o controle e fazer o trabalho bem feito do seu jeito. Uma vez por rodada, quando um de seus aliados falha em um teste, você pode gastar 2 PE para fazer a mesma ação como ação livre.",
    },
  },
  {
    "id": "vítima",
    "nome": "Vítima",
    "descricao": "Em algum momento de sua vida — infância, juventude ou início da vida adulta — você encontrou o paranormal… E a experiência não foi nada boa. Você viu os espíritos dos mortos, foi atacado por uma entidade ou mesmo foi sequestrado para ser sacrificado em um ritual impedido no último momento. A experiência foi traumática, mas você não se abateu; em vez disso, decidiu lutar para impedir que outros inocentes passem pelo mesmo. E, já tendo sido vítima do paranormal, se tornou habilidoso em evitar perigos.",
    "pericias": ["reflexos", "vontade"],
    "poder": {
      "nome": "Cicatrizes Psicológicas",
      bonus: "+1 Sanidade a cada 5% de NEX",
      "descricao": "Você recebe +1 de Sanidade para cada 5% de NEX."
    }
  }
];


/* --------------------------------------------------------------------------
   3.1 APRIMORAMENTO DE ORIGENS (homebrew)
   A partir de NEX 40% o personagem pode gastar um poder de classe
   ("Aprimoramento de Origem") para aprimorar sua origem: ganha mais uma
   perícia treinada (se já for treinado, escolhe outra) e o poder de origem
   recebe o aprimoramento abaixo, por substituição ou adição (veja o texto).
   "pericia": id de PERICIAS, ou texto livre quando há escolha.
   "poder": opcional — algumas origens só ganham a perícia.
   -------------------------------------------------------------------------- */
const APRIMORAMENTOS_ORIGEM = {
  "acadêmico": { pericia: "atualidades", poder: { nome: "Pesquisa Extensiva", descricao: "Além do normal, uma vez por cena, você pode rolar novamente um teste de perícia baseado em Intelecto." } },
  "agente-de-saúde": { pericia: "diplomacia", poder: { nome: "Tratamento Psiquiátrico", descricao: "Você pode realizar testes de Diplomacia para tirar seres de Enlouquecendo usando Intelecto ao invés de Presença." } },
  "amnésico": { pericia: "Uma à escolha do mestre", poder: { nome: "Déjà Vu", descricao: "A DT de Vislumbres do Passado se torna 15 e o bônus em PE temporários se torna 4d4." } },
  "artista": { pericia: "intuicao", poder: { nome: "Meu Melhor Trabalho", descricao: "Você pode usar Magnum Opus uma vez por sessão." } },
  "atleta": { pericia: "fortitude", poder: { nome: "120%", descricao: "Ao usar a habilidade 110%, pode gastar 1 PE adicional para usar em Luta ou Pontaria." } },
  "bombeiro": { pericia: "diplomacia" },
  "caçador": { pericia: "tatica" },
  "chef": { pericia: "sobrevivencia", poder: { nome: "Ingredientes Fortes", descricao: "Quando você cozinha em um interlúdio, a categoria do descanso aumenta em um passo." } },
  "cientista-forense": { pericia: "crime" },
  "vendedor": { pericia: "intuicao" },
  "criminoso": { pericia: "reflexos", poder: { nome: "Punguista", descricao: "Você pode usar a habilidade O Crime Compensa para incluir até dois itens." } },
  "cultista-arrependido": { pericia: "vontade", poder: { nome: "Mergulho Paranormal", descricao: "Os pré-requisitos de poderes paranormais reduzem em 1 para você." } },
  "desgarrado": { pericia: "vontade", poder: { nome: "Vigor Perfeito", descricao: "Você recebe +1 PV por NEX." } },
  "engenheiro": { pericia: "ciencias", poder: { nome: "Ferramenta Aprimorada", descricao: "A categoria do item escolhido é reduzida em II." } },
  "executivo": { pericia: "enganacao", poder: { nome: "Processo Aprimorado", descricao: "Uma vez por cena, você pode gastar 1 PE para rolar novamente um teste de perícia, porém com um bônus de até +5." } },
  "investigador": { pericia: "intuicao", poder: { nome: "Análise Profunda", descricao: "Uma vez por rodada, você pode usar Faro para Pistas." } },
  "jornalista": { pericia: "intuicao" },
  "lutador": { pericia: "fortitude", poder: { nome: "Ataque Preciso", descricao: "O bônus de Mão Pesada também se aplica a testes de ataque corpo a corpo." } },
  "magnata": { pericia: "enganacao", poder: { nome: "Crédito a Mais", descricao: "Além do normal, escolha um aliado (incluindo você mesmo) para receber um item adicional da maior categoria que você tem acesso." } },
  "mercenário": { pericia: "furtividade", poder: { nome: "O Melhor Vem Primeiro", descricao: "Ao usar a habilidade Posição de Combate, você pode gastar +3 PE para receber uma ação padrão adicional." } },
  "militar": { pericia: "intimidacao", poder: { nome: "Plano de Ataque", descricao: "Você pode gastar 4 PE e uma ação completa para analisar um inimigo. Faça um teste de Tática (DT 20 +5 para cada categoria de tamanho além de médio). Se passar, o inimigo sofre –5 na Defesa contra você e seus aliados até o fim da cena." } },
  "operário": { pericia: "luta", poder: { nome: "Revolução", descricao: "Os bônus de Ferramenta de Trabalho são dobrados." } },
  "policial": { pericia: "Diplomacia ou Enganação", poder: { nome: "Sentinela", descricao: "O bônus na Defesa aumenta para +5." } },
  "politico": { pericia: "atualidades" },
  "professor": { pericia: "intuicao" },
  "religioso": { pericia: "ocultismo", poder: { nome: "Pregador", descricao: "Você pode realizar uma missa ou ritos religiosos. Gaste uma ação de interlúdio para que um número de aliados igual à sua Presença recebam PV, PE ou PS temporários (escolha um desses) pelo resto da missão. O valor de pontos temporários recebidos é igual a sua Presença × 5." } },
  "servidor-público": { pericia: "diplomacia", poder: { nome: "Quebrar um Galho", descricao: "Ao invés do normal, você pode gastar 1 PE para somar +5 no bônus de um teste de ajuda." } },
  "teórico-da-conspiração": { pericia: "vontade", poder: { nome: "Eu Esperava Mais", descricao: "Além do normal, você tem +1d20 em resistências para condições de medo." } },
  "t.i.": { pericia: "intuicao", poder: { nome: "Revisar Código", descricao: "Uma vez por rodada, você pode fazer um teste de Tecnologia como ação livre." } },
  "trabalhador-rural": { pericia: "fortitude", poder: { nome: "Companheiro", descricao: "Além do normal, aliados fornecem bônus dobrados para você. Acólito fornece +4 na DT, Faz-Tudo fornece +1d12, Guerrilheiro causa +2d8 pontos de dano e Socorrista cura 2d8+2 PV de si mesmo ou aliado adjacente." } },
  "trambiqueiro": { pericia: "furtividade", poder: { nome: "Blefe", descricao: "Você pode usar a habilidade Impostor uma vez por rodada." } },
  "universitário": { pericia: "vontade", poder: { nome: "Força de Vontade", descricao: "Você recebe +1 PE por NEX ao invés de +1 PE em NEX ímpares." } },
  "vítima": { pericia: "iniciativa", poder: { nome: "Já Passei Por Isso", descricao: "Você pode gastar 4 PE para rolar novamente um teste de resistência contra a Presença Perturbadora de uma criatura paranormal." } },
};
ORIGENS.forEach(o => { if (APRIMORAMENTOS_ORIGEM[o.id]) o.aprimoramento = APRIMORAMENTOS_ORIGEM[o.id]; });


/* --------------------------------------------------------------------------
   4. CLASSES
   Cada classe tem:
     - stats base/por-NEX de PV, PE, SAN
     - proficiencias (texto livre)
     - periciasIniciaisTexto (texto explicando quantas perícias treinar)
     - tabelaNex: o que a classe ganha em cada NEX (5% a 99%)
         tipo: "fixo"      -> ganha automaticamente (mostra o texto)
         tipo: "escolha"   -> jogador escolhe 1 item da lista "poderes" da classe
         tipo: "trilha"    -> jogador escolha 1 poder da trilha escolhida
     - poderes: lista de "Poder de Classe" que o jogador pode escolher
         sempre que a tabelaNex tiver um passo do tipo "escolha"
     - trilhas: subclasses, cada uma com sua lista de poderes por NEX
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   3.5 PODERES GERAIS
   Poderes que QUALQUER personagem pode escolher, de qualquer classe/trilha
   (aparecem junto com os poderes da classe no mesmo menu "Adicionar", lá na
   aba Habilidades — marcados como "(Geral)"). Assim como o resto do
   conteúdo deste arquivo, isso foi montado como uma base funcional a partir
   de resumos públicos do sistema — revise o texto/efeito de cada um contra
   o material de vocês e ajuste como quiser (é só editar os objetos abaixo).
   -------------------------------------------------------------------------- */
const PODERES_GERAIS =  [
  // Homebrew: estes cinco eram poderes de combatente e agora são gerais.
  { "nome": "Artista Marcial", "preRequisito": "", "descricao": "Seus ataques desarmados causam 1d6 pontos de dano, podem causar dano letal e se tornam ágeis (veja p. 59). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10." },
  { "nome": "Ataque de Oportunidade", "preRequisito": "", "descricao": "Sempre que um ser sair voluntariamente de um espaço adjacente ao seu, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele." },
  { "nome": "Combater com Duas Armas", "preRequisito": "AGI 3, Treinado em Luta ou Pontaria", "descricao": "Se estiver empunhando duas armas (e pelo menos uma for leve) e fizer a ação agredir, você pode fazer dois ataques, um com cada arma. Se fizer isso, sofre –O em todos os testes de ataque até o seu próximo turno." },
  { "nome": "Saque Rápido", "preRequisito": "Treinado em Iniciativa", "bonus": "+2 em Iniciativa", "descricao": "Você pode sacar ou guardar itens como uma ação livre (em vez de ação de movimento). Além disso, caso esteja usando a regra opcional de contagem de munição, uma vez por rodada pode recarregar uma arma de disparo como uma ação livre. Além do normal, também concede +2 em Iniciativa." },
  { "nome": "Tiro Certeiro", "preRequisito": "Treinado em Pontaria", "descricao": "Se estiver usando uma arma de disparo, você soma sua Agilidade nas rolagens de dano e ignora a penalidade contra alvos envolvidos em combate corpo a corpo (mesmo se não usar a ação mirar)." },
  {
    "nome": "Acrobático",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Acrobacia (se já treinado)",
    "descricao": "Você possui um talento natural para piruetas, cambalhotas e outras acrobacias complexas. Você recebe treinamento em Acrobacia ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, terreno difícil não reduz seu deslocamento nem o impede de realizar investidas."
  },
  {
    "nome": "Alcance Distante",
    "preRequisito": "",
    "bonus": "+1,5m de alcance (armas de alcance)",
    "descricao": "Seu raio de alcance aumenta em +1.5m. Não afeta habilidades ou ataques corpo a corpo."
  },
  {
    "nome": "Ataque Furtivo",
    "preRequisito": "Treinado em Furtividade",
    "bonus": "+1d6 a +5d6 de dano furtivo (escala com NEX, 1 PE)",
    "descricao": "Você sabe atingir os pontos vitais de um inimigo distraído. Uma vez por rodada, quando atinge um alvo desprevenido com um ataque corpo a corpo ou em alcance curto, ou um alvo que esteja flanqueando, você pode gastar 1 PE para dar +1d6 de dano do mesmo tipo da arma. Em NEX 30% o dano adicional aumenta para +2d6, em NEX 50% o dano aumenta para +3d6, em NEX 75% o dano aumenta para +4d6 e em NEX 99% o dano aumenta para +5d6. Caso tenha a habilidade pela trilha Infiltrador, escolher essa habilidade faz com que o dano de seus dados aumente para d8 em vez de d6."
  },
  {
    "nome": "Atlético",
    "preRequisito": "FOR 2",
    "bonus": "+2 em Atletismo (se já treinado); +3m de deslocamento",
    "descricao": "Você possui um corpo atlético, resultado de uma fortuita disposição genética ou árduo treinamento. Você recebe treinamento em Atletismo ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, recebe +3m em seu deslocamento."
  },
  {
    "nome": "Atraente",
    "preRequisito": "PRE 2",
    "bonus": "+5 em Artes/Diplomacia/Enganação/Intimidação (situacional)",
    "descricao": "Seja por pura beleza física ou por sua postura e atitude, você atrai olhares por onde passa. Você recebe +5 em testes de Artes, Diplomacia, Enganação, e Intimidação contra pessoas que possam se sentir fisicamente atraídas por você."
  },
  {
    "nome": "Corpo Calejado",
    "preRequisito": "VIG 3",
    "bonus": "+Vigor em Defesa e testes de resistência",
    "descricao": "De tanto apanhar, você se tornou mais resistente. Você passa a adicionar o seu Vigor na sua defesa e testes de resistência."
  },
  {
    "nome": "Dedos Ágeis",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Crime (se já treinado)",
    "descricao": "Você possui uma motricidade fina precisa, particularmente útil para manipular ferramentas delicadas. Você recebe treinamento em Crime ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, pode arrombar com uma ação padrão, furtar com uma ação livre (apenas uma vez por rodada) e sabotar com uma ação completa."
  },
  {
    "nome": "Detector de Mentiras",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Intuição (se já treinado)",
    "descricao": "Você possui uma aptidão para perceber os sutis sinais de alguém que está mentindo. Você recebe treinamento em Intuição ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, outros seres sofrem uma penalidade de –10 em testes de Enganação para mentir para você."
  },
  {
    "nome": "Emboscada",
    "preRequisito": "Treinado em Iniciativa, AGI 2",
    "bonus": "+5 em Acrobacia/Atletismo para escapar e resistir a restrição de movimento",
    "descricao": "Você recebe +5 em testes de Acrobacia ou Atletismo para escapar e em testes para resistir a efeitos que restrinjam seu movimento. Além disso, no início de cada cena de combate, você ganha uma ação padrão extra."
  },
  {
    "nome": "Especialista Esotérico",
    "preRequisito": "INT 3",
    "descricao": "Poucos compreendem o uso de catalisadores ritualísticos como você. Ao conjurar um ritual, você pode combinar os efeitos de até três catalisadores ritualísticos diferentes ao mesmo tempo."
  },
  {
    "nome": "Especialista em Emergências",
    "preRequisito": "INT 2",
    "bonus": "+2 em Medicina (se já treinado)",
    "descricao": "Você recebeu treinamento como socorrista de emergência, e sabe como tratar um paciente em situações de urgência. Você recebe treinamento em Medicina ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, pode aplicar cicatrizantes e medicamentos como uma ação de movimento e, uma vez por rodada, pode sacar um desses itens como uma ação livre."
  },
  {
    "nome": "Espreitar",
    "preRequisito": "Mobilidade Perfeita",
    "bonus": "+2 em ataque e dano corpo a corpo/disparo (com Mobilidade Perfeita)",
    "descricao": "Quando usa Mobilidade Perfeita, você também recebe +2 em testes de ataque e rolagens de dano com armas corpo a corpo e de disparo (exceto armas de fogo)."
  },
  {
    "nome": "Estigmado",
    "preRequisito": "",
    "descricao": "A adrenalina causada pela dor faz você se manter focado no que está acontecendo. Sempre que sofre dano mental de efeitos de medo, você pode converter esse dano em perda de pontos de vida (se sofre 5 pontos de dano mental de medo você pode, em vez disso, perder 5 pontos de vida)."
  },
  {
    "nome": "Estudo de Toxinologia",
    "preRequisito": "Treinado em Ciências ou Sobrevivência",
    "descricao": "Você pode fabricar seus próprios venenos caseiros."
  },
  {
    "nome": "Evasão",
    "preRequisito": "AGI 2, Treinado em Reflexos",
    "descricao": "Quando sofre um ataque que permite um teste de Reflexos para reduzir o dano à metade, você não sofre dano algum se passar. Esta habilidade exige liberdade de movimentos; você não pode usá-la se estiver usando armadura pesada ou sob alguma condição que te deixe imóvel. Além disso, uma vez por rodada, você pode gastar 1 PE para evitar um ataque de oportunidade."
  },
  {
    "nome": "Finta Aprimorada",
    "preRequisito": "Treinado em Luta, INT ou AGI 2",
    "descricao": "Uma vez por rodada, você pode fintar como ação de movimento."
  },
  {
    "nome": "Finta Desconcertante",
    "preRequisito": "Treinado em Enganação",
    "bonus": "–2 nos ataques do inimigo (cumulativo, condicional)",
    "descricao": "Se por duas rodadas seguidas seu inimigo FOR enganado por uma finta, ele deve fazer um teste de Vontade (DT INT). Caso falhe, sofre uma penalidade de -2 em todos os ataques contra você até o final da cena. Esse poder é cumulativo."
  },
  {
    "nome": "Foco em Perícia",
    "preRequisito": "Treinado na perícia escolhida",
    "bonus": "+O em perícia escolhida",
    "descricao": "Você se dedicou a estudar e treinar os vários pormenores de uma área de conhecimento específica. Escolha uma perícia (exceto Luta e Pontaria). Quando faz um teste dessa perícia, você rola +O. Você pode escolher este poder outras vezes para perícias diferentes."
  },
  {
    "nome": "Força Apurada",
    "preRequisito": "",
    "bonus": "+2 em testes de Força (acumulável)",
    "descricao": "Você recebe +2 em testes baseados em Força. Você pode escolher esse poder várias vezes."
  },
  {
    "nome": "Informado",
    "preRequisito": "INT 2",
    "bonus": "+2 em Atualidades (se já treinado)",
    "descricao": "Você passa bastante tempo consumindo fofocas… bem, notícias sobre o mundo ao seu redor. Você recebe treinamento em Atualidades ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, pode usar Atualidades no lugar de qualquer outra perícia para testes envolvendo informações, desde que aprovado pelo mestre."
  },
  {
    "nome": "Interrogador",
    "preRequisito": "FOR 2",
    "bonus": "+2 em Intimidação (se já treinado)",
    "descricao": "Você sabe como usar o medo para extrair todo tipo de informação das outras pessoas. Você recebe treinamento em Intimidação ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, pode fazer testes de Intimidação para coagir como uma ação padrão, mas apenas uma vez por cena contra a mesma pessoa."
  },
  {
    "nome": "Inventário Organizado",
    "preRequisito": "INT 2",
    "bonus": "+Intelecto no limite de espaços",
    "descricao": "Você sabe como organizar sua mochila e seu equipamento de forma organizada e racional. Você soma seu Intelecto no limite de espaços que pode carregar. Para você, itens muito leves ou pequenos, que normalmente ocupam meio espaço (0,5), em vez disso ocupam 1/4 de espaço (0,25)."
  },
  {
    "nome": "Limites Rompidos",
    "preRequisito": "Treinado em Vontade",
    "descricao": "Você ignora o limite de PE por rodada."
  },
  {
    "nome": "Mente Forte",
    "preRequisito": "Treinado em Vontade",
    "bonus": "+1 determinação por NEX; +5 em resistência mental",
    "descricao": "Você recebe +1 ponto de determinação por NEX e +5 em testes de resistência contra efeitos mentais."
  },
  {
    "nome": "Mentiroso Nato",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Enganação (se já treinado)",
    "descricao": "Você é um cara de pau, capaz de mentir descaradamente sem que ninguém perceba. Você recebe treinamento em Enganação ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, a penalidade que você sofre por mentiras muito implausíveis diminui para –O."
  },
  {
    "nome": "Mestre em Facas",
    "preRequisito": "",
    "bonus": "+1 na margem de ameaça (facas/punhais/adagas)",
    "descricao": "A margem de ameaça para facas, punhais e adagas aumenta em +1 para você."
  },
  {
    "nome": "Observador",
    "preRequisito": "INT 2",
    "bonus": "+2 em Investigação (se já treinado); +Intelecto em Intuição",
    "descricao": "Você possui uma combinação de sentidos apurados para perceber pistas e intelecto afiado para processá-las. Você recebe treinamento em Investigação ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, soma seu Intelecto em Intuição."
  },
  {
    "nome": "Pai de Pet",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Adestramento (se já treinado); aliado dá +2 em 2 perícias",
    "descricao": "Você adora animais, e cuida de seus pets como se fossem seus filhos. Você recebe treinamento em Adestramento ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, possui um animal de estimação que o auxilia e o acompanha em suas aventuras. Em termos de jogo, é um aliado que fornece +2 em duas perícias a sua escolha (exceto Luta ou Pontaria e aprovadas pelo mestre)."
  },
  {
    "nome": "Palavras de Devoção",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Religião (se já treinado); resistência a dano mental 5 (grupo, 3 PE)",
    "descricao": "Você combina uma fé verdadeira com o conhecimento dos ritos e tradições de sua religião. Você recebe treinamento em Religião ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, uma vez por cena, pode gastar 3 PE e uma ação completa para executar uma oração para um número de pessoas até o dobro de sua Presença. Até o fim da cena, todos os participantes dessa oração recebem resistência a dano mental 5."
  },
  {
    "nome": "Parceiro",
    "preRequisito": "Treinado em Diplomacia, NEX 30%",
    "descricao": "Em algum momento da sua vida, você conquistou uma amizade fiel e verdadeira; alguém disposto a até mesmo a se arriscar para lhe ajudar. Você possui um parceiro, uma pessoa que o acompanha e o auxilia em suas missões. Escolha os detalhes dele, como nome, aparência e personalidade. Em termos de jogo, é um aliado de um tipo à sua escolha (veja OPRPG, p. 171). O parceiro obedece às suas ordens e se arrisca para ajudá-lo, mas, se FOR maltratado, pode parar de segui-lo (de acordo com o mestre). Se perder seu aliado, você precisa gastar uma folga da Ordem (veja p. 94) para receber outro."
  },
  {
    "nome": "Pensamento Tático",
    "preRequisito": "INT 2",
    "bonus": "+2 em Tática (se já treinado)",
    "descricao": "Você possui uma mente voltada para análises táticas e pensamento estratégico. Você recebe treinamento em Tática ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, quando você passa em um teste de Tática para analisar terreno, você e seus aliados em alcance médio recebem uma ação de movimento adicional na primeira rodada do próximo combate neste terreno (desde que ele ocorra até o fim do dia)."
  },
  {
    "nome": "Personalidade Esotérica",
    "preRequisito": "INT 2",
    "bonus": "+3 PE; +2 em Ocultismo (se já treinado)",
    "descricao": "Você sempre teve uma afinidade com assuntos esotéricos. Você recebe +3 PE e recebe treinamento em Ocultismo. Se já FOR treinado nesta perícia, recebe +2 nela."
  },
  {
    "nome": "Persuasivo",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Diplomacia (se já treinado)",
    "descricao": "Você possui uma personalidade diplomática e sabe obter o que deseja por meio de argumentação e conversa. Você recebe treinamento em Diplomacia ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, ao fazer um teste para persuasão, a penalidade que você sofre por perguntar ou pedir coisas custosas ou perigosas diminui em –5."
  },
  {
    "nome": "Pesquisador Científico",
    "preRequisito": "INT 2",
    "bonus": "+2 em Ciências (se já treinado)",
    "descricao": "Você possui um profundo respeito pela ciência e acredita que ela é a resposta para muitos de seus questionamentos. Você recebe treinamento em Ciências ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, você pode usar Ciências no lugar de Ocultismo e Sobrevivência para identificar criaturas e animais, respectivamente."
  },
  {
    "nome": "Proativo",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Iniciativa (se já treinado)",
    "descricao": "Seu negócio é fazer as coisas, e não deixar para depois. Você recebe treinamento em Iniciativa ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, ao rolar um 19 ou 20 em pelo menos um dos dados de um teste de Iniciativa, você recebe uma ação padrão adicional em seu primeiro turno."
  },
  {
    "nome": "Provisões de Emergência",
    "preRequisito": "",
    "descricao": "Você é um sujeito precavido e mantém uma reserva secreta para quando as coisas ficarem ruins. Você possui um esconderijo com equipamentos e suprimentos escondidos para uma situação de emergência. Uma vez por missão, você pode usar uma ação de interlúdio para recuperar o conteúdo de seu esconderijo (pessoalmente ou através de algum contato). Você recebe novos equipamentos a sua escolha equivalente à sua patente no início desta missão (como se tivesse uma nova fase de preparação de missão)."
  },
  {
    "nome": "Raciocínio Rápido",
    "preRequisito": "INT 3",
    "bonus": "+Intelecto em Defesa e testes de resistência",
    "descricao": "Sua inteligência te ajuda a evitar os perigos de um combate mortal. Você soma o seu Intelecto no valor da sua Defesa e testes de resistência."
  },
  {
    "nome": "Racionalidade Inflexível",
    "preRequisito": "INT 3",
    "descricao": "Suas convicções e sua visão de mundo são baseadas em argumentos racionais e lógicos. Você pode usar Intelecto no lugar de Presença como atributo-chave de Vontade e para calcular seus pontos de esforço."
  },
  {
    "nome": "Rato de Computador",
    "preRequisito": "INT 2",
    "bonus": "+2 em Tecnologia (se já treinado)",
    "descricao": "Você adora computadores e outros dispositivos tecnológicos. Você recebe treinamento em Tecnologia ou, se já FOR treinado nesta perícia, recebe +2 nela. Você pode hackear, localizar arquivo ou operar dispositivo como uma ação completa e, uma vez por cena de investigação, se tiver acesso a um computador, pode fazer um teste de Tecnologia para procurar pistas sem gastar uma rodada de investigação."
  },
  {
    "nome": "Reações Inteligentes",
    "preRequisito": "INT 2, Treinado em Reflexos",
    "descricao": "Você tem uma visão mais estratégica no campo de batalha. Você ganha uma reação adicional."
  },
  {
    "nome": "Reflexos Inteligentes",
    "preRequisito": "INT 2, Treinado em Reflexos ou Iniciativa",
    "descricao": "Você substitui o atributo-base de Reflexos e Iniciativa por Intelecto."
  },
  {
    "nome": "Resistente",
    "preRequisito": "Treinado em Fortitude, VIG 2",
    "bonus": { "pericia": "fortitude", "formula": "porNexImpar", "valor": 1 },
    "descricao": "Você ganha +1 de Fortitude a cada NEX ímpar."
  },
  {
    "nome": "Resposta Rápida",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Reflexos (se já treinado)",
    "descricao": "Seus reflexos são tão apurados que o permitem agir antes mesmo de você perceber as ameaças de forma consciente. Você recebe treinamento em Reflexos ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, ao falhar em um teste de Percepção para evitar ficar desprevenido, você pode gastar 2 PE para rolar novamente o teste usando Reflexos."
  },
  {
    "nome": "Sentidos Aguçados",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Percepção (se já treinado)",
    "descricao": "Todos os seus sentidos são mais aguçados que o normal. Você recebe treinamento em Percepção ou, se já FOR treinado nessa perícia, recebe +2 nela. Além disso, não fica desprevenido contra inimigos que não possa ver e, sempre que erra um ataque devido a camuflagem, pode rolar mais uma vez o dado da chance de falha."
  },
  {
    "nome": "Sobrevivencialista",
    "preRequisito": "INT 2",
    "bonus": "+2 em Sobrevivência (se já treinado); +2 em resistência a clima",
    "descricao": "Você aprecia — ou aprecia enfrentar — a natureza. Você recebe treinamento em Sobrevivência ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, você recebe +2 em testes para resistir a efeitos de clima e terreno difícil natural não reduz seu deslocamento nem impede que você execute investidas."
  },
  {
    "nome": "Sorrateiro",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Furtividade (se já treinado)",
    "descricao": "Você sabe ser discreto em qualquer situação. Você recebe treinamento em Furtividade ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, você não sofre penalidades por se mover normalmente enquanto está furtivo, nem por seguir alguém em ambientes sem esconderijos ou sem movimento."
  },
  {
    "nome": "Sortudo",
    "preRequisito": "PRE 2",
    "descricao": "Você tem uma sorte inexplicável que parece bater no momento certo. Você tem 3 pontos de sorte. Quando você faz qualquer teste, antes do mestre anunciar se é uma falha ou não, você pode escolher par ou ímpar, e jogar um dado. Se o resultado do dado FOR oque você escolheu (par ou ímpar), você tem direito a rolar +1d20 para o teste anterior. Se você FOR alvo de um ataque, você também pode gastar 2 pontos de sorte para fazer o atacante rerolar os dados, sendo forçado a usar o novo resultado. Você recupera um ponto de sorte toda vez que tira um 20 e em interlúdios."
  },
  {
    "nome": "Talentoso",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Artes (se já treinado)",
    "descricao": "Você possui inclinação para todas as formas de expressão artística. Você recebe treinamento em Artes ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, quando faz um teste de Artes para impressionar, o bônus em perícias que você recebe aumenta em +1 para cada 5 pontos adicionais em que o resultado de seu teste passar a DT."
  },
  {
    "nome": "Teimosia Obstinada",
    "preRequisito": "PRE 2",
    "bonus": "+2 em Vontade (se já treinado)",
    "descricao": "As pessoas chamam você de teimoso. Mas elas estão erradas! Você recebe treinamento em Vontade ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, quando faz um teste de Vontade contra um efeito que cause uma condição mental ou tente modificar sua categoria de atitude (como o ritual Enfeitiçar), você pode gastar 2 PE para receber +5 neste teste."
  },
  {
    "nome": "Tenacidade",
    "preRequisito": "VIG 2",
    "bonus": "+2 em Fortitude (se já treinado)",
    "descricao": "Seu corpo desenvolveu a capacidade de suportar rigores extremos. Você recebe treinamento em Fortitude ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, ao estar morrendo, mas consciente (com pelo menos 1 PV), você pode fazer um teste de Fortitude (DT 20 + 10 por teste anterior na mesma cena) como ação livre. Se FOR bem-sucedido, encerra a condição morrendo."
  },
  {
    "nome": "Torturador",
    "preRequisito": "",
    "descricao": "Efeitos específicos causados por você ignoram resistências e suas durações são estendidas por um turno. Fatigado, fraco, em chamas, envenenado e sangrando são afetados por esse poder."
  },
  {
    "nome": "Técnicas de Infiltração",
    "preRequisito": "AGI 2",
    "descricao": "Você pode ficar furtivo com uma ação livre."
  },
  {
    "nome": "Valente",
    "preRequisito": "PRE 2",
    "bonus": "+1d20 em resistência para aliados próximos",
    "descricao": "Quando você passa num teste de resistência, aliados em alcance curto recebem +1d20 no mesmo teste até o final do seu próximo turno."
  },
  {
    "nome": "Veloz",
    "preRequisito": "",
    "bonus": "+3m de deslocamento (ação livre)",
    "descricao": "Você pode se mover pelo menos 3m por rodada como ação livre."
  },
  {
    "nome": "Vitalidade Reforçada",
    "preRequisito": "VIG 2",
    "bonus": "+1 PV a cada 5% de NEX; +2 em Fortitude",
    "descricao": "Você possui uma capacidade superior de suportar ferimentos. Você recebe +1 PV para cada 5% de NEX (ou para cada nível, se estiver usando a regra de nível de experiência) e +2 em Fortitude."
  },
  {
    "nome": "Vontade Inabalável",
    "preRequisito": "PRE 2",
    "bonus": "+1 PE a cada 10% de NEX; +2 em Vontade",
    "descricao": "Sua mente é preparada para suportar os mais rigorosos traumas. Você recebe +1 PE para cada 10% de NEX (ou para cada 2 níveis, se estiver usando a regra de nível de experiência) e +2 em Vontade."
  },
  {
    "nome": "Ás do Volante",
    "preRequisito": "AGI 2",
    "bonus": "+2 em Pilotagem (se já treinado)",
    "descricao": "Você é um apaixonado por velocidade, e tem a coragem (ou falta de juízo) necessária para executar qualquer manobra. Você recebe treinamento em Pilotagem ou, se já FOR treinado nesta perícia, recebe +2 nela. Além disso, uma vez por rodada, quando um veículo que você está pilotando sofre dano, você pode fazer um teste de Pilotagem (DT igual ao resultado do teste de ataque ou à DT do efeito que causou o dano). Se passar, evita esse dano."
  },
  {
    "nome": "Último Sangue",
    "preRequisito": "",
    "bonus": "+1 dado de dano contra alvos sangrando",
    "descricao": "Quando você ataca um alvo sangrando, seus ataques causam um dado de dano adicional do mesmo tipo da arma."
  }
]

// Homebrew: poderes de classe compartilhados pelas três classes.
// "repetivel": pode ser escolhido mais de uma vez.
const PODER_VERSATILIDADE = {
  nome: "Versatilidade",
  preRequisito: null,
  repetivel: true,
  descricao: "Você recebe a primeira habilidade de uma segunda trilha da sua classe. Você pode escolher este poder novamente para receber a habilidade seguinte dessa trilha, desde que possua as anteriores. Um personagem só pode ter duas trilhas — esse limite aumenta com o poder paranormal Versatilidade Amplificada. Na ficha: escolha a trilha secundária em Habilidades → Trilhas.",
};
const PODER_APRIMORAMENTO_ORIGEM = {
  nome: "Aprimoramento de Origem",
  preRequisito: "NEX 40%",
  descricao: "Suas habilidades de origem se aperfeiçoam com suas experiências. Você recebe mais uma perícia treinada de acordo com a sua origem (se já for treinado, pode escolher outra) e seu poder de origem é aprimorado, por substituição ou adição. Na ficha: o aprimoramento aparece junto do poder de origem.",
};

const CLASSES = {

  combatente: {
    nome: "Combatente",
    resumo: "Perito em armas brancas e de fogo, a linha de frente contra o Outro Lado.",
    pv: { base: 20, porNex: 4 },
    pe: { base: 6, porNex: 3 },
    san: { base: 12, porNex: 3 },
    pd: { base: 6, porNex: 3 },   // regra opcional de Pontos de Determinação (substitui PE e SAN)
    // PV/PE fixos que a tabela de NEX concede (somados automaticamente).
    bonusPorNex: [{ nex: 85, pv: 5, pe: 5 }],
    proficiencias: "Armas simples, armas táticas e proteções leves (e pesadas, a partir de certo NEX).",
    periciasIniciaisTexto: "Luta ou Pontaria, e Fortitude ou Reflexos, mais 2 + Intelecto perícias à escolha.",

    tabelaNex: [
      { nex: 5,  tipo: "fixo",    texto: "Ataque especial (2 PE, +5)" },
      { nex: 10, tipo: "trilha",  texto: "Escolha de trilha" },
      { nex: 15, tipo: "escolha", texto: "Poder de combatente" },
      { nex: 20, tipo: "fixo",    texto: "Aumento de Atributo" },
      { nex: 25, tipo: "escolha", texto: "Poder de combatente, habilidade de trilha" },
      { nex: 30, tipo: "escolha", texto: "Ataque especial (3 PE, +10)" },
      { nex: 35, tipo: "fixo",    texto: "Grau de treinamento (3 + Intelecto perícias)" },
      { nex: 40, tipo: "trilha",  texto: "Poder de combatente, habilidade de trilha" },
      { nex: 45, tipo: "escolha", texto: "Aumento de atributo" },
      { nex: 50, tipo: "fixo",    texto: "Ataque especial (4 PE, +15)" },
      { nex: 55, tipo: "escolha", texto: "Poder de combatente" },
      { nex: 60, tipo: "escolha", texto: "Perícia adicional ou +2 em perícia treinada" },
      { nex: 65, tipo: "trilha",  texto: "Poder de combatente, habilidade de trilha" },
      { nex: 70, tipo: "fixo",    texto: "Grau de treinamento (3 + Intelecto perícias)" },
      { nex: 75, tipo: "escolha", texto: "Ataque especial (5 PE, +20)" },
      { nex: 80, tipo: "fixo",    texto: "Aumento de atributo" },
      { nex: 85, tipo: "escolha", texto: "+5 PV, +5 PE" },
      { nex: 90, tipo: "escolha", texto: "Poder de combatente" },
      { nex: 95, tipo: "fixo",    texto: "Aumento de atributo" },
      { nex: 99, tipo: "trilha",  texto: "Poder de combatente, habilidade de trilha" },
    ],

    poderes: [
        PODER_VERSATILIDADE,
        PODER_APRIMORAMENTO_ORIGEM,

        { "nome": "Acuidade Armamentista", "preRequisito": null, "descricao": "Armas leves tem seu dano aumentado em um passo (de d6 para d8, de d8 para d10, de d10 para d12)." },

        { "nome": "Armamento Pesado", "preRequisito": "FOR 2", "descricao": "Você recebe proficiência com armas pesadas." },



        { "nome": "Atirador Rudimentar", "preRequisito": null, "descricao": "O dano das suas armas de disparo (exceto armas de fogo) aumenta em um dado do mesmo tipo." },

        { "nome": "Combate Defensivo", "preRequisito": "INT 2", "descricao": "Quando usa a ação agredir, você pode combater defensivamente. Se fizer isso, até seu próximo turno, sofre –O em todos os testes de ataque, mas recebe +5 na Defesa." },


        { "nome": "Corte Arterial", "preRequisito": null, "descricao": "Ao acertar um ataque crítico usando uma arma cortante, você pode gastar 1 PE para deixar o alvo sangrando." },

        { "nome": "Empunhadura Pesada", "preRequisito": "Veterano em Luta", "descricao": "Quando causa dano com uma arma corpo a corpo de duas mãos, você pode rolar novamente qualquer resultado 1 ou 2 das rolagens de dano da arma." },

        { "nome": "Especialista em Proteção Leve", "preRequisito": null, "descricao": "Você sabe usufruir do que a proteção leve tem de melhor. Se estiver usando uma proteção leve, você recebe +2 na Defesa e em Reflexos." },

        { "nome": "Especialização em Armadura", "preRequisito": "VIG 2, Proteção Pesada, Treinado em Luta", "descricao": "Itens que concedem bônus na defesa te concedem metade do seu bônus em RD física." },

        { "nome": "Esquiva Ofensiva", "preRequisito": null, "descricao": " Sempre que esquivar com sucesso, você pode realizar uma manobra de desarmar ou derrubar como ação de movimento." },

        { "nome": "Estilo de Arma e Escudo", "preRequisito": "Treinado em Luta, Proteção Pesada", "descricao": "Se estiver usando um escudo, o bônus na Defesa e RD que ele fornece aumenta em +2." },

        { "nome": "Golpe Demolidor", "preRequisito": "FOR 2, Treinado em Luta", "descricao": "Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar dois dados de dano extra do mesmo tipo de sua arma." },

        { "nome": "Golpe Pesado", "preRequisito": null, "descricao": "O dano dos seus ataques corpo a corpo aumenta em um dado do mesmo tipo." },

        { "nome": "Golpes de Arena", "preRequisito": "Wing Chun", "descricao": "Você aprendeu como se briga de verdade. Quando acerta um ataque corpo a corpo, você pode gastar 2 PE para fazer um ataque corpo a corpo adicional ou uma manobra de combate." },

        { "nome": "Incansável", "preRequisito": null, "descricao": "Uma vez por cena, você pode usar uma habilidade ou poder de classe sem gastar nenhum PE." },

        { "nome": "Inexpugnável", "preRequisito": "Proteção Pesada", "descricao": "Se estiver usando uma armadura pesada, você recebe +2 em testes de resistência. Esse bônus aumenta em +2 para cada poder que tem como pré-requisito proteção pesada." },

        { "nome": "Muay Thai", "preRequisito": "VIG 2, Artista Marcial", "descricao": "Quando fizer um bloqueio e reduzir o dano a metade, você pode gastar 2 PE como reação livre para fazer um ataque desarmado contra o atacante." },

        { "nome": "Presteza Atlética", "preRequisito": null, "descricao": "Quando faz um teste de facilitar a investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base da perícia. Se passar no teste, o próximo aliado que usar seu bônus também recebe +O no teste." },

        { "nome": "Proteção Pesada", "preRequisito": "NEX 30%", "descricao": "Você recebe proficiência com Proteções Pesadas." },

        { "nome": "Reflexos Defensivos", "preRequisito": "AGI 2", "descricao": "Você recebe +2 em Defesa e em testes de resistência." },


        { "nome": "Samba", "preRequisito": null, "descricao": "Você recebe +1d20 em testes de manobras de agarrar, derrubar e desarmar." },

        { "nome": "Segurar o Gatilho", "preRequisito": "NEX 60%", "descricao": "Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo, pagando 2 PE por cada ataque já realizado no turno. Ou seja, pode fazer o primeiro ataque extra gastando 2 PE e, se acertar, pode fazer um segundo ataque extra gastando mais 4 PE e assim por diante, até errar um ataque ou atingir o limite de seus PE por rodada." },

        { "nome": "Sentido Tático", "preRequisito": "INT 2, Treinado em Percepção e Tática", "descricao": "Você pode gastar uma ação de movimento e 2 PE para analisar o ambiente. Se fizer isso, recebe um bônus em Defesa e em testes de resistência igual ao seu Intelecto até o final da cena." },

        { "nome": "Sobrevivente", "preRequisito": "VIG 3, Veterano em Fortitude", "descricao": "Você caminha para o pico da resiliência.  Você soma sua Fortitude nos seus PVs." },

        { "nome": "Tanque de Guerra", "preRequisito": "Proteção Pesada", "descricao": "Se estiver usando uma proteção pesada, a Defesa e a resistência a dano que ela fornece aumentam em +2." },



        { "nome": "Tiro de Cobertura", "preRequisito": null, "descricao": "Você pode gastar uma ação padrão e 1 PE para disparar uma arma de fogo na direção de um ser no alcance da arma para forçá-lo a se proteger. Faça um teste de Pontaria contra a Vontade do alvo. Se vencer, até o início do seu próximo turno o alvo não pode sair do lugar onde está e sofre –5 em testes de ataque. A critério do mestre, o alvo recebe +5 no teste de Vontade se estiver em um lugar extremamente perigoso, como uma casa em chamas ou um barco afundando. Este é um efeito de medo." },

        { "nome": "Transcender", "preRequisito": null, "descricao": "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes." },

        { "nome": "Treinamento em Perícia", "preRequisito": null, "descricao": "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes." },

        { "nome": "Wing Chun", "preRequisito": "VIG 2, Artista Marcial", "descricao": "Ao fazer um ataque crítico com um ataque desarmado, você pode gastar 1 PE para fazer outro ataque desarmado como uma ação livre. O ataque pode ter qualquer alvo, contanto que esteja dentro do alcance do seu ataque." }
        ],

    trilhas: [
    {
      "id": "agente-secreto",
      "nome": "Agente Secreto",
      "descricao": "Às vezes, um governo precisa lidar com um problema de forma discreta — por precisar operar fora de sua jurisdição, para não assustar a população ou por vários outros motivos. Quando esse é o caso, usam-se agentes secretos, indivíduos treinados para trabalhar sozinhos ou em pequenos grupos, que contam apenas com suas próprias habilidades, determinação e sorrisos carismáticos. Você se tornou um desses agentes e, por suas capacidades, foi escolhido para a missão mais confidencial de todas — trabalhar com a Ordo Realitas para proteger a humanidade contra o Outro Lado.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Carteirada",
          "descricao": "Escolha uma perícia entre Diplomacia ou Enganação. Você recebe treinamento na perícia escolhida ou, se já for treinado, recebe +2 nela. Como parte do esforço conjunto da sua agência e da Ordem, no início de cada missão você recebe documentos que lhe fornecem privilégios jurídicos especiais. Esses documentos podem incluir a sua identidade verdadeira ou não, e podem ser individuais ou incluir os demais membros da sua equipe (conforme apropriado à missão). Os benefícios específicos desses documentos ficam a critério do mestre, mas em geral incluem acesso a locais restritos ou proibidos, permissão para portar armas de fogo e autoridade para assumir a jurisdição de investigações da polícia. Pessoas comuns não conseguem perceber que seus documentos são falsos, mas membros de agências de segurança ou indivíduos veteranos em Crime podem desconfiar de sua veracidade. Os documentos contam como itens operacionais que não ocupam espaço — mas cuidado para não perdê-los em locais onde novos não podem ser fornecidos!"
        },
        {
          "nex": 25,
          "nome": "Combate corpo a corpo",
          "descricao": "Quando um ser com uma arma faz um ataque corpo a corpo, você pode usar sua reação para fazer um teste de Crime ou Luta contra um teste de Luta. Em um sucesso, você rouba a arma da criatura e pode imediatamente fazer uma manobra de agarrar como parte da mesma reação."
        },
        {
          "nex": 40,
          "nome": "O Sorriso",
          "descricao": "Em seu trabalho como agente, você aprendeu que se manter contido com um sorriso “sincero” e palavras gentis são ferramentas muito eficientes em uma investigação. Você recebe +2 em Diplomacia e Enganação e, quando falha em um teste de uma dessas perícias, pode gastar 2 PE para repetir a rolagem (apenas uma vez por teste), mas deve aceitar o novo resultado, mesmo que seja pior que o primeiro. Por fim, uma vez por cena, você pode fazer um teste de Diplomacia para acalmar a si mesmo."
        },
        {
          "nex": 65,
          "nome": "Método Investigativo",
          "descricao": "Acostumado a vasculhar locais em segredo, você aprendeu a ser rápido ou “controlar a situação” antes que coisas ruins aconteçam. A urgência de qualquer cena de investigação em que você esteja presente aumenta em 1 rodada. Além disso, quando o mestre faz uma rolagem na tabela de eventos de investigação, você pode gastar 2 PE para transformar o resultado em “sem evento”. Você pode usar este efeito mais de uma vez na mesma cena, mas a cada uso adicional seu custo aumenta em +2 PE."
        },
        {
          "nex": 99,
          "nome": "Multifacetado",
          "descricao": "Viver sob vários disfarces tem sido útil, mas você faz isso há tanto tempo que talvez nem se lembre mais quem é de verdade. Essas habilidades que surgem quando você precisa foram aprendidas em disfarces anteriores, ou são apenas sua mente buscando uma saída? Uma vez por cena, você pode gastar 5 pontos de Sanidade para receber todas as habilidades de até NEX 65% de uma trilha de combatente ou especialista à sua escolha (você deve cumprir quaisquer pré-requisitos específicos da trilha). Você pode usar essas habilidades até o fim da cena, mas não pode escolher a mesma trilha mais de uma vez na mesma missão. Os pontos de Sanidade gastos para ativar essa habilidade só podem ser recuperados ao fim da missão."
        }
      ]
    },
    {
      "id": "aniquilador",
      "nome": "Aniquilador",
      "descricao": "Você é treinado para abater alvos com eficiência e velocidade. Suas armas são suas melhores amigas e você cuida tão bem delas quanto de seus companheiros de equipe. Talvez até melhor.",
      "poderes": [
        {
          "nex": 10,
          "nome": "A Favorita",
          "descricao": "Escolha uma arma para ser sua favorita, como katana ou fuzil de assalto. A categoria da arma escolhida é reduzida em I."
        },
        {
          "nex": 25,
          "nome": "Manejo Preciso",
          "descricao": "Seu vínculo com a arma favorita aumenta sua precisão. Você recebe +2 em testes de ataque com ela. Além disso, uma vez por cena, pode gastar uma ação de movimento para remover a condição quebrado dela."
        },
        {
          "nex": 40,
          "nome": "Técnica Secreta",
          "descricao": "A categoria da arma favorita passa a ser reduzida em II. Quando faz um ataque com ela, você pode gastar 2 PE para executar um dos efeitos abaixo como parte do ataque. Você pode adicionar mais efeitos gastando +2 PE por efeito adicional.\n\nb Amplo. O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original (use o mesmo teste de ataque para ambos).\n\nb Destruidor. Aumenta o multiplicador de crítico da arma em +1."
        },
        {
          "nex": 65,
          "nome": "Técnica Sublime",
          "descricao": "Você adiciona os seguintes efeitos à lista de sua Técnica Secreta:\n\nb Letal. Aumenta a margem de ameaça em +2. Você pode escolher este efeito duas vezes para aumentar a margem de ameaça em +5.\n\nb Perfurante. Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo."
        },
        {
          "nex": 99,
          "nome": "Máquina de Matar",
          "descricao": "A categoria da arma favorita passa a ser reduzida em III, ela recebe +2 na margem de ameaça e seu dano aumenta em um dado do mesmo tipo."
        }
      ]
    },
    {
      "id": "cacador",
      "nome": "Caçador",
      "descricao": "Em um mundo cheio de predadores sobrenaturais, você decidiu não ser mais uma presa. Valendo-se de relatos de segunda mão, notícias de jornais e relatórios de incidentes inexplicáveis, você reúne informações sobre como caçar as coisas que espreitam na escuridão.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Rastrear o Paranormal",
          "descricao": "Você estudou criaturas paranormais o suficiente para saber como identificar seus sinais e seguir seus rastros. Você recebe treinamento em Sobrevivência ou, se já for treinado nesta perícia, recebe +2 nela. Além disso, pode usar essa perícia no lugar de Ocultismo para identificar criaturas e no lugar de Investigação e Percepção para perceber e encontrar rastros, pistas e criaturas que tenham traços paranormais."
        },
        {
          "nex": 25,
          "nome": "Reflexos do Predador",
          "descricao": "Você antecipa os movimentos de suas presas. Você recebe +5 em Iniciativa em cenas envolvendo criaturas."
        },
        {
          "nex": 40,
          "nome": "Estudar Fraquezas",
          "descricao": "Você acredita que todo ser, mesmo aqueles do Outro Lado, tem uma fraqueza. E você vai encontrá-la… você precisa! Você pode gastar uma ação de interlúdio estudando as fraquezas de um ser específico, como uma criatura paranormal ou um membro de um culto. Para isso, você precisa de uma pista diretamente ligada ao ser, como uma parte do seu corpo ou de suas vestes. Ao fim dos estudos, você recebe uma informação útil sobre o ser. Isso pode ser uma característica relevante (“a criatura é do elemento Sangue”) ou uma informação sobre seus hábitos (“apesar de matar qualquer coisa, ela parece preferir idosos”). Além das informações, para cada pista você recebe +1 em testes de perícia contra a criatura até o fim da missão. Cada pista fornece apenas uma informação e, a critério do mestre, informações diferentes podem exigir pistas específicas."
        },
        {
          "nex": 65,
          "nome": "Atacar das Sombras",
          "descricao": "Você aprende a usar as sombras contra o Paranormal. Você não sofre a penalidade de –5 em testes de Furtividade por se mover ao seu deslocamento normal e, se estiver usando uma arma que não faça barulho (como uma faca ou um arco), a penalidade que você sofre em Furtividade por atacar na mesma rodada é reduzida para –1d20. Além disso, sua visibilidade inicial em cenas de furtividade (veja p. 92) é sempre 1 ponto abaixo da inicial (podendo ser negativa)."
        },
        {
          "nex": 99,
          "nome": "Estudar a Presa",
          "descricao": "Você sabe que eles são mais fortes e que para derrotá-los precisará revelar todos os seus segredos. Quando usa Estudar Fraquezas contra uma criatura paranormal ou um cultista, você pode transformar o tipo desse ser em sua “presa”. Contra seres desse tipo, você recebe +5 em testes de perícia, +1 na margem de ameaça e no multiplicador de crítico e resistência a dano 5. Você só pode ter um tipo de ser como presa ao mesmo tempo."
        }
      ]
    },
    {
      "id": "comandante-de-campo",
      "nome": "Comandante de Campo",
      "descricao": "Sem um oficial uma batalha não passa de uma briga de bar. Você é treinado para coordenar e auxiliar seus companheiros em combate, tomando decisões rápidas e tirando melhor proveito da situação e do talento de seus aliados.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Inspirar Confiança",
          "descricao": "Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado."
        },
        {
          "nex": 25,
          "nome": "Coordenação Tática",
          "descricao": "Você pode gastar uma ação livre e 1 PE para que um aliado em alcance curto receba +2 na Defesa ou em seu próximo teste de ataque, até o início do turno dele."
        },
        {
          "nex": 40,
          "nome": "Estrategista",
          "descricao": "Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE por aliado que quiser direcionar (limitado pelo seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional."
        },
        {
          "nex": 65,
          "nome": "Brecha na Guarda",
          "descricao": "Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo. Além disso, o alcance de inspirar confiança e estrategista aumenta para médio."
        },
        {
          "nex": 99,
          "nome": "Oficial Comandante",
          "descricao": "Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele."
        }
      ]
    },
    {
      "id": "guerreiro",
      "nome": "Guerreiro",
      "descricao": "Você treinou sua musculatura e movimentos a ponto de transformar seu corpo em uma verdadeira arma. Com golpes corpo a corpo tão poderosos quanto uma bala, você enfrenta inimigos sem medo.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Frenesi",
          "descricao": "O que não te mata te deixa mais forte. Enquanto estiver machucado, você recebe +2 em rolagens de dano, testes de ataque, testes de resistência e Defesa. A cada vez que ficar machucado em uma cena, esse bônus aumenta em +1."
        },
        {
          "nex": 25,
          "nome": "Técnica Letal",
          "descricao": "Você vive, respira e prospera no calor do combate. Você recebe um aumento de +2 na margem de ameaça com todos os seus ataques corpo a corpo."
        },
        {
          "nex": 40,
          "nome": "Revidar",
          "descricao": "Sempre que bloquear um ataque, você pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo no inimigo que o atacou."
        },
        {
          "nex": 65,
          "nome": "Força Opressora",
          "descricao": "Quando acerta um ataque corpo a corpo, você pode gastar 1 PE para realizar uma manobra derrubar ou empurrar contra o alvo do ataque como ação livre. Se escolher empurrar, recebe um bônus de +5 para cada 10 pontos de dano que causou no alvo. Se escolher derrubar e vencer no teste oposto, você pode gastar 1 PE para fazer um ataque adicional contra o alvo caído."
        },
        {
          "nex": 99,
          "nome": "Potência Máxima",
          "descricao": "Quando usa seu Ataque Especial com armas corpo a corpo, todos os bônus numéricos são dobrados. Por exemplo, se usar 5 PE para receber +5 no ataque e +15 no dano, você recebe +10 no ataque e +30 no dano."
        }
      ]
    },
    {
      "id": "monstruoso",
      "nome": "Monstruoso",
      "descricao": "Muito se fala sobre os ocultistas escolherem o caminho de tornarem sua mente uma porta para o paranormal, na tentativa de usá-lo contra ele mesmo, mas de vez em quando, um combatente é corajoso ou insano o bastante para fazer o mesmo com seu corpo. Você propositalmente desfigura e altera seu corpo para que as Entidades o invadam com maior intensidade; contudo, para sua infelicidade, os métodos para isso costumam ser brutais. Combatentes dessa trilha que chegam aos níveis mais altos de exposição inevitavelmente perdem o controle e se tornam inimigos da Ordem.\n\nEspecial: esta trilha usa a “Progressão de NEX” apresentada na regra opcional Nível de Experiência e Nível de Exposição (p. 98), mesmo que esta regra em si não esteja sendo usada. O personagem recebe todas as alterações apropriadas ao seu NEX descritas na progressão e, se a regra de Nível de Experiência estiver em uso, recebe o dobro de NEX sempre que se expõe ao paranormal.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Ser Amaldiçoado",
          "descricao": "Em suas veias corre uma maldição paranormal que aos poucos o está transformando em um monstro. Você se torna treinado em Ocultismo (se já for treinado, em vez disso recebe +2 nessa perícia). Escolha um elemento paranormal entre Sangue, Morte, Conhecimento ou Energia. Uma vez por dia, você precisa executar uma etapa ritualística desse elemento (por exemplo, beber sangue humano para Sangue, inalar cinzas de mortos para Morte, tatuar palavras que causam medo para Conhecimento ou receber choques de cabos elétricos para Energia).\n\nSe fizer isso, até o fim do dia você recebe os efeitos descritos a seguir, conforme o elemento escolhido. Caso contrário, você sofre de fome e sede nesse dia (OPRPG, p. 292).\n\nPor fim, se adquirir afinidade com um elemento, deverá escolher aquele selecionado para esta habilidade.\n\nI SANGUE Suas presas ficam protuberantes e seus olhos se tornam vermelhos. Você recebe resistência a balístico e Sangue 5 e faro e, quando faz um contra-ataque bem-sucedido, soma seu Vigor na rolagem de dano, mas sofre –5 em Ciências e Intuição.\n\nI MORTE Você fica pálido e seu metabolismo se torna bem mais lento. Você recebe resistência a perfuração e Morte 5 e imunidade a fadiga e soma sua Força em seu total de pontos de vida, mas sofre –5 em Diplomacia e Enganação.\n\nI CONHECIMENTO Seus olhos são banhados em um dourado sobrenatural. Você recebe resistência a balístico e Conhecimento 5 e visão no escuro e soma seu Intelecto na Defesa, mas sofre –5 em Atletismo e Acrobacia.\n\nI ENERGIA Sua pele ganha cicatrizes de queimaduras elétricas com múltiplas cores. Você recebe resistência a corte, eletricidade, fogo e Energia 5 e soma sua Agilidade na RD recebida por um bloqueio bem-sucedido, mas sofre –5 em Investigação e Percepção."
        },
        {
          "nex": 25,
          "nome": "Primeiros Sintomas",
          "descricao": "A maldição em você já começa a fortalecer seu corpo, mesmo antes das mudanças mais drásticas. Você recebe +1 PV a cada 5% de NEX. Além disso, a fome e sede causadas por deixar de executar sua etapa ritualística podem ser adiadas em um dia, uma vez por semana."
        },
        {
          "nex": 40,
          "nome": "Ser Macabro",
          "descricao": "Conforme sua humanidade é substituída pela Entidade, as mudanças em seu corpo e mente se intensificam. A resistência a dano que você recebe por executar a etapa ritualística de seu elemento aumenta para 10, enquanto a penalidade em perícias aumenta para –20. Por fim, quando executa sua etapa ritualística, você recebe os efeitos adicionais incluídos na descrição de seu elemento, a seguir.\n\nI SANGUE Você veste poucas roupas, expondo o máximo de sua pele sensível ao ambiente que puder. Seu corpo já está repleto de cicatrizes e feridas, muitas causadas por você mesmo para saborear a dor. Devorar qualquer coisa que não seja carne ou sangue não é capaz de conter sua fome. Você pode usar Força para calcular seus pontos de esforço (em vez de Presença). Além disso, pode gastar uma ação de movimento e 1 ou mais PE (limitado por sua Força) para recuperar 1d8 PV por PE gasto.\n\nI MORTE Roupas modernas e complexas não parecem fazer sentido pra você. Seus trajes são anacrônicos e simples, às vezes adornado de cristais, esqueletos de pequenas criaturas pendurados, pedras, raízes e plantas mortas. Você recebe +5 em Intimidação e pode usar Vigor para calcular seus pontos de esforço (em vez de Presença). Além disso, morre se iniciar quatro turnos morrendo na mesma cena (e não apenas três) e não precisa mais comer ou beber para viver, mas ainda sofre da fome paranormal causada por essa trilha.\n\nI CONHECIMENTO Você está sempre vestindo joias de ouro puro ou roupas com ouro em suas linhas. Seu corpo está quase inteiramente coberto de palavras que evocam medo, como famosas últimas frases ou pedidos de socorro. Você já sabe que é superior a todos eles. Seu Intelecto aumenta em +1. Além disso, você pode usar Intelecto como atributo-chave para Enganação e para calcular seus pontos de esforço (em vez de Presença).\n\nI ENERGIA Você está sempre vestindo roupas complexas e modernas, com luzes brilhantes e dispositivos conectados a baterias e à sua pele para receber pequenos choques estimulantes. Você pode usar Agilidade como atributo-chave para calcular seus pontos de esforço (em vez de Presença). Além disso, quando acerta um ataque corpo a corpo, pode gastar 1 ou mais PE (limitado por sua Agilidade). Se fizer isso, seu ataque causa +1d6 pontos de dano de Energia para cada 1 PE gasto."
        },
        {
          "nex": 65,
          "nome": "Ser Assustador",
          "descricao": "Como um parasita, você sente a Entidade andar por todo o seu corpo, fazendo de você uma morada. A resistência a dano que você recebe por executar a etapa ritualística de seu elemento aumenta para 15, mas sua Presença é reduzida permanentemente em 1. Por fim, quando executa sua etapa ritualística, você recebe os seguintes efeitos adicionais associados ao seu elemento.\n\nI SANGUE Você dilacerou seus próprios órgãos sensitivos, como olhos, nariz e orelhas, para que possa sentir com total intensidade o sabor e a dor da sua existência. Arames farpados e lâminas enroladas em seu corpo permitem que você não pare de sentir. A esse ponto, a palavra “não” já parece ser um conceito inútil para suas decisões: você está disposto a aceitar tudo, provar de tudo, sofrer tudo. Você tem 50% de chance de ignorar o dano adicional de um acerto crítico ou ataque furtivo. Além disso, recebe uma arma natural de mordida (dano 1d8, crítico x2, perfuração). Uma vez por rodada, quando usa a ação agredir para atacar com outra arma, você pode gastar 1 PE para fazer um ataque corpo a corpo extra com a mordida.\n\nI MORTE O Lodo preto da Morte faz parte do seu consumo diário, ele se espalha pelo seu organismo apodrecendo seu sistema, mantendo-o vivo através da morte. Não é incomum você ser considerado um “acumulador de lixo”: é difícil diferenciar um animal vivo de um galho morto, pois perante a Morte todas as coisas são iguais. No início de cada turno em que estiver morrendo, você pode fazer um teste de Vigor (DT 15). Se passar, encerra a condição morrendo e acorda com 1 PV. Além disso, sempre que faz um acerto crítico em combate ou reduz um inimigo a 0 PV, você recupera 2 PE.\n\nI CONHECIMENTO Você injeta e ingere ouro líquido esporadicamente e não há mais espaço para tatuagens. Ler, reler e escrever novos registros faz parte da sua rotina extremamente organizada e metódica. Você pode deixar de ser treinado em uma de suas perícias para receber um número de dados de bônus igual ao seu Intelecto. Até o fim da cena, sempre que fizer um teste, você pode gastar um desses dados de bônus para receber +5 nesse teste. Você recupera todas as perícias treinadas perdidas dessa forma ao final de seu próximo interlúdio.\n\nI ENERGIA A intensidade dos choques aumenta, além de ter conectado em suas veias pequenos tubos para gotejamento de ácido. Respirar através de uma máscara de gás para inalar alucinógenos a todo momento deixa tudo mais divertido, colorido e caótico. Sua resistência a dano passa a se aplicar também a dano químico. Além disso, você pode extrair energia de fontes elétricas; para isso, deve gastar uma ação de movimento e tocar uma fonte de eletricidade. Você recupera uma quantidade de PE conforme o tipo de fonte: 1d4 PE para um dispositivo portátil, como um tablet ou celular, 2d4 PE para um dispositivo grande, como uma moto ou um carro elétrico, e 4d4 para uma fonte do tamanho de uma casa. Usar este efeito descarrega completamente a fonte e sobrecarrega seus circuitos, que se tornam incapazes de transmitir energia."
        },
        {
          "nex": 99,
          "nome": "Ser Aterrorizante",
          "descricao": "Você foi transformado no habitat perfeito para a entidade que reside no interior de seu corpo e mente. Os efeitos por executar sua etapa ritualística se tornam permanentes (mas você ainda precisa executá-la para evitar sentir fome e sede) e você passa a ser considerado uma criatura paranormal para efeitos de habilidades e itens. Além disso, a resistência a dano que você recebe por essa trilha aumenta para 20 e você recebe os seguintes efeitos adicionais associados ao seu elemento.\n\nI SANGUE Você se move como uma criatura bestial; não existe sensibilidade ou empatia. Apenas o instinto e a necessidade de consumir mais. Se o resultado é devorar, essa é a decisão correta. Pensamentos são esporádicos e raros, como pequenos sustos de humanidade que são engolidos pelo fluxo que banha o Outro Lado. Seu Intelecto diminui em –1 e sua Força aumenta em +1. Sempre que causa dano com sua mordida em um ser, você recupera 5 PV (esse ganho também é multiplicado em um acerto crítico). Além disso, você aprende o ritual Forma Monstruosa. Entretanto, seu desejo de assumir essa forma pode sobrepujar sua própria vontade; sempre que sofre dano, você deve fazer um teste de Vontade (DT 10 + o dano sofrido). Se falhar e não estiver sob efeito de Forma Monstruosa, sua próxima ação padrão deve ser conjurar esse ritual (se não puder, você perde a ação).\n\nI MORTE Você está morto, mas ainda é forçado a existir. Sua aparência é a de um cadáver apodrecido, todos os seus órgãos foram consumidos pela Morte e, por dedicar sua existência inteira à entidade, você se tornou imortal. Preso na eternidade de cada segundo, você ainda é arrastado pela Realidade pela percepção alheia, pois mesmo que sua mente tenha se tornado o próprio tempo, todas as coisas precisam de um fim. Sua Presença diminui em –1 e seu Vigor aumenta em +1. Você recebe imunidade a dano de Morte e se torna imortal (se morrer, você volta à vida no dia seguinte, sendo “restaurado” pelo Lodo). Entretanto, se for reduzido a 0 PV por dano de fogo ou Energia, seu Lodo é destruído e você não retorna à vida. Por fim, você aprende o ritual Fim Inevitável.\n\nI CONHECIMENTO Sua boca desapareceu após você costurá-la com fios dourados, pois ninguém é digno do seu ensinamento. Seus olhos aumentaram e ficaram mais profundos, com escleras negras. Todos os seus membros se alongaram e ficaram mais finos. Suas tatuagens e textos se converteram em sigilos do Outro Lado. A verdade que você deve esquecer está atrás de uma porta dourada, e você consegue enxergá-la, mas sabe que ao abri-la, irá perder tudo. Sua Força diminui em –1 e seu Intelecto aumenta em +1. Além disso, você recebe Percepção às Cegas e aprende um ritual de Conhecimento de 4º círculo a sua escolha. Entretanto, sempre que conjura esse ritual, você perde a memória de tudo que vivenciou desde o início da cena.\n\nI ENERGIA Tudo faz parte de você e você é tudo. Você se tornou uma metamorfose ambulante, assumindo uma forma plasmática que não pode ser descrita nem como líquida, sólida ou gasosa. Seu corpo flutua alguns centímetros acima do chão e não é mais possível segurar objetos, afinal tudo que você toca também se torna parte de você enquanto está em contato. Seus traços físicos mudam constantemente e você não pode ser mais descrito com apenas uma aparência definitiva. Decisões lógicas não fazem mais parte da sua vida, o Caos é inevitável. Sua Força diminui em –1 e sua Agilidade aumenta em +1. Você pode pairar a 1,5m do chão com deslocamento 12m (o que permite que ignore terreno difícil e o torna imune a dano por queda), pode passar por qualquer espaço por onde uma criatura Minúscula poderia passar e se torna imune a condições de paralisia de origem física (como ser agarrado ou enredado). Por fim, você aprende o ritual Deflagração de Energia. Entretanto, você não pode mais se beneficiar de itens vestidos e, por não ter corpo físico, só consegue manipular objetos com sua mente; você pode manipular um objeto dessa forma por vez, e apenas objetos que poderia manipular com suas duas mãos."
        }
      ]
    },
    {
      "id": "operacoes-especiais",
      "nome": "Operações Especiais",
      "descricao": "Você é um combatente eficaz. Suas ações são calculadas e otimizadas, sempre antevendo os movimentos inimigos e se posicionando da maneira mais inteligente no campo de batalha.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Iniciativa Aprimorada",
          "descricao": "Você recebe +5 em Iniciativa e uma ação de movimento adicional na primeira rodada."
        },
        {
          "nex": 25,
          "nome": "Reação Calculada",
          "descricao": "Uma vez por rodada, você pode gastar uma reação e 1 PE para receber +5 na Defesa contra um único ataque."
        },
        {
          "nex": 40,
          "nome": "Ataque Extra",
          "descricao": "Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional."
        },
        {
          "nex": 65,
          "nome": "Surto de Adrenalina",
          "descricao": "Uma vez por rodada, você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional."
        },
        {
          "nex": 99,
          "nome": "Sempre Alerta",
          "descricao": "Você recebe uma ação padrão adicional no início de cada cena de combate."
        }
      ]
    },
    {
      "id": "tropa-de-choque",
      "nome": "Tropa de Choque",
      "descricao": "Você é duro na queda. Treinou seu corpo para resistir a traumas f ísicos, tornando-o praticamente inquebrável, e por isso não teme se colocar entre seus aliados e o perigo.",
      "poderes": [
        {
          "nex": 10,
          "nome": "Casca Grossa",
          "descricao": "Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida."
        },
        {
          "nex": 25,
          "nome": "Postura Firme",
          "descricao": "Você recebe +2 na Defesa contra manobras (agarrar, derrubar, desarmar, empurrar) e não pode ser movido contra sua vontade a menos que o efeito diga o contrário."
        },
        {
          "nex": 40,
          "nome": "Cai Dentro",
          "descricao": "Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado. Este poder só funciona se você puder ser efetivamente atacado e estiver no alcance do ataque (por exemplo, adjacente a um oponente atacando em corpo a corpo ou dentro do alcance de uma arma de ataque à distância). Um oponente que passe no teste de Vontade não pode ser afetado por seu poder Cai Dentro até o final da cena."
        },
        {
          "nex": 65,
          "nome": "Duro de Matar",
          "descricao": "Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal."
        },
        {
          "nex": 99,
          "nome": "Inquebrável",
          "descricao": "Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, em vez do normal, você não fica indefeso e ainda pode realizar ações. Você ainda segue as regras de morte normalmente."
        }
      ]
    }
  ],
  },

  especialista: {
    nome: "Especialista",
    resumo: "Versátil e engenhoso, especializado em resolver problemas com perícia e inteligência.",
    pv: { base: 16, porNex: 3 },
    pe: { base: 6, porNex: 3 },
    san: { base: 16, porNex: 4 },
    pd: { base: 8, porNex: 4 },   // regra opcional de Pontos de Determinação (substitui PE e SAN)
    bonusPorNex: [{ nex: 85, pv: 5, pe: 5 }],
    proficiencias: "Armas simples e proteções leves.",
    periciasIniciaisTexto: "7 + Intelecto perícias à escolha.",

    tabelaNex: [
        { nex: 5,  tipo: "fixo",    texto: "Eclético, perito (2 PE, +1d6)" },
        { nex: 10, tipo: "trilha",  texto: "Escolha de trilha" },
        { nex: 15, tipo: "escolha", texto: "Poder de especialista" },
        { nex: 20, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 25, tipo: "trilha",  texto: "Poder de especialista, habilidade de trilha" },
        { nex: 30, tipo: "fixo",    texto: "Perito (3 PE, +1d8)" },
        { nex: 35, tipo: "fixo",    texto: "Grau de treinamento (5 + Intelecto perícias)" },
        { nex: 40, tipo: "trilha",  texto: "Engenhosidade (veterano), poder de especialista, trilha" },
        { nex: 45, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 50, tipo: "fixo",    texto: "Perito (4 PE, +1d10)" },
        { nex: 55, tipo: "escolha", texto: "Poder de especialista" },
        { nex: 60, tipo: "fixo",    texto: "Slot adicional de perito" },
        { nex: 65, tipo: "trilha",  texto: "Poder de especialista, habilidade de trilha" },
        { nex: 70, tipo: "fixo",    texto: "Grau de treinamento (5 + Intelecto perícias)" },
        { nex: 75, tipo: "fixo",    texto: "Engenhosidade (expert), perito (5 PE, +1d12)" },
        { nex: 80, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 85, tipo: "fixo",    texto: "+5 PV, +5 PE" },
        { nex: 90, tipo: "escolha", texto: "Poder de especialista" },
        { nex: 95, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 99, tipo: "trilha",  texto: "Poder de especialista, habilidade de trilha" }
        ],

    poderes: [
        PODER_VERSATILIDADE,
        PODER_APRIMORAMENTO_ORIGEM,

        {
            "nome": "Adepto do Escuro",
            "preRequisito": null,
            "descricao": "Seus olhos se adaptaram a verem melhor no escuro. Você ignora camuflagem leve e total por escuridão. Além disso, recebe +2 em testes de Investigação e Percepção feitos em ambientes com pouca ou sem nenhuma luz."
        },

        {
            "nome": "Analítico",
            "preRequisito": null,
            "descricao": "Você pode usar Perito em Luta e Pontaria."
        },

        {
            "nome": "Análise de Combate",
            "preRequisito": "Treinado em Tática e Percepção",
            "descricao": "Você pode gastar uma ação de movimento e 1 PE para fazer uma análise completa do estilo de luta de um inimigo em alcance curto. Até o fim da cena, você adiciona seu Intelecto em testes de ataque, rolagens de dano e Defesa contra o alvo analisado. Além disso, Ao utilizar Tática para Analisar Terreno, você também adiciona seu Intelecto em testes de ataque ao usar a vantagem descrita. Para cada 5 pontos que superar a DT, recebe +2 pontos adicionais deste poder."
        },

        {
            "nome": "Arqueiro",
            "preRequisito": null,
            "descricao": "Você soma seu Intelecto em rolagens de dano e em ataques com armas de disparo (exceto armas de fogo)."
        },


        {
            "nome": "Atirador Rudimentar",
            "preRequisito": null,
            "descricao": "O dano das suas armas de disparo (exceto armas de fogo) aumenta em um dado do mesmo tipo."
        },

        {
            "nome": "Balística Avançada",
            "preRequisito": null,
            "descricao": "Você recebe proficiência com armas táticas de fogo e +2 em rolagens de dano com armas de fogo."
        },

        {
            "nome": "Caçador",
            "preRequisito": null,
            "descricao": "O bônus de ataque em posição elevada aumenta para +2d20."
        },

        {
            "nome": "Conhecimento Aplicado",
            "preRequisito": "INT 2",
            "descricao": "Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Int."
        },

        {
            "nome": "Criatividade Técnica",
            "preRequisito": null,
            "descricao": "Se estiver usando um item que te concede um bônus de perícia baseada em Agilidade, você pode gastar 1 PE para usar esse bônus em outra perícia baseada em Agilidade."
        },

        {
            "nome": "Doutor",
            "preRequisito": null,
            "descricao": "Você é extremamente estudado e letrado em conhecimentos científicos. Você pode gastar 2 PE rerolar um dado de Medicina, Ciências ou Paramédico."
        },

        {
            "nome": "Fórmula Secreta",
            "preRequisito": null,
            "descricao": "Você soma seu Intelecto no dano e DT dos seus venenos."
        },

        {
            "nome": "Hacker",
            "preRequisito": "Treinado em Tecnologia",
            "descricao": "Você recebe +5 em testes de Tecnologia para invadir sistemas e diminui o tempo necessário para hackear qualquer sistema para uma ação completa."
        },

        {
            "nome": "Mão na Boca",
            "preRequisito": "Treinado em Luta, NEX 25%",
            "descricao": "Você recebe +2 em testes de agarrar. Quando faz um ataque furtivo contra um ser desprevenido, você pode fazer uma manobra de combate como ação livre. Se conseguir agarrar, ele não poderá falar enquanto estiver agarrado."
        },

        {
            "nome": "Mãos Rápidas",
            "preRequisito": "AGI 3, Treinado em Crime ou Furtividade",
            "descricao": "Ao fazer um teste de Crime ou qualquer ação com objetos pequenos (como munição, veneno) você pode gastar 1 PE para fazê-la como uma ação livre e furtivamente, se quiser. Além disso, você recebe +1d20 em todos os testes de Crime."
        },

        {
            "nome": "Médico da Salvação",
            "preRequisito": "Paramédico",
            "descricao": "Você se especializou em salvar vidas. Os dados de sua habilidade de médico de campo Paramédico aumentam de d10 para d12. Além disso, quando usa a habilidade Paramédico, você pode gastar 3 PE, uma vez por rodada, para usá-la como uma ação de movimento em vez de ação padrão."
        },

        {
            "nome": "Mente Criminosa",
            "preRequisito": null,
            "descricao": "Você soma seu Intelecto em testes de Crime e Furtividade."
        },

        {
            "nome": "Mochila de Utilidades",
            "preRequisito": null,
            "descricao": "Um item a sua escolha (exceto armas) conta como uma categoria abaixo e ocupa 1 espaço a menos."
        },

        {
            "nome": "Movimento Tático",
            "preRequisito": "Treinado em Atletismo",
            "descricao": "Você pode gastar 1 PE para ignorar a penalidade em deslocamento por terreno difícil e por escalar até o final do turno."
        },

        {
            "nome": "Na Trilha Certa",
            "preRequisito": null,
            "descricao": "Sempre que tiver sucesso em um teste para procurar pistas, você pode gastar 1 PE para receber +O no próximo teste. Os custos e os bônus são cumulativos (se passar num segundo teste, pode pagar 2 PE para receber um total de +OO no próximo teste, e assim por diante)."
        },

        {
            "nome": "Nerd",
            "preRequisito": null,
            "descricao": "Você é um repositório de conhecimento útil (e inútil). Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar, recebe uma informação útil para essa cena (se for uma investigação, uma dica para uma pista; se for um combate, uma fraqueza de um inimigo, e assim por diante). A fonte da informação pode ser desde um livro antigo que você leu na biblioteca até um episódio de sua série de ficção favorita."
        },

        {
            "nome": "Ninja Urbano",
            "preRequisito": null,
            "descricao": "Você recebe proficiência com armas táticas de ataque corpo a corpo e de disparo (exceto de fogo) e +2 em rolagens de dano com armas de corpo a corpo e de disparo."
        },

        {
            "nome": "Oculto e Letal",
            "preRequisito": null,
            "descricao": "Você tem um crítico garantido ao fazer um ataque em um inimigo que não está ciente de você."
        },

        {
            "nome": "Pensamento Ágil",
            "preRequisito": null,
            "descricao": "Uma vez por rodada, durante uma cena de investigação, você pode gastar 2 PE para fazer uma ação de procurar pistas adicional."
        },

        {
            "nome": "Perito em Explosivos",
            "preRequisito": null,
            "descricao": "Você soma seu Intelecto na DT para resistir aos seus explosivos e pode excluir dos efeitos da explosão um número de alvos igual ao seu valor de Intelecto."
        },

        {
            "nome": "Precisão Máxima",
            "preRequisito": null,
            "descricao": "Ao mirar, você pode gastar 2 PE para receber +1d20 no teste de ataque."
        },

        {
            "nome": "Primeira Impressão",
            "preRequisito": null,
            "descricao": "Você recebe +OO no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição que fizer em uma cena."
        },

        {
            "nome": "Transcender",
            "preRequisito": null,
            "descricao": "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes."
        },

        {
            "nome": "Treinamento em Perícia",
            "preRequisito": null,
            "descricao": "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes."
        }
        ],

    trilhas: [
            {
            "id": "agente-secreto",
            "nome": "Agente Secreto",
            "descricao": "Às vezes, um governo precisa lidar com um problema de forma discreta — por precisar operar fora de sua jurisdição, para não assustar a população ou por vários outros motivos. Quando esse é o caso, usam-se agentes secretos, indivíduos treinados para trabalhar sozinhos ou em pequenos grupos, que contam apenas com suas próprias habilidades, determinação e sorrisos carismáticos. Você se tornou um desses agentes e, por suas capacidades, foi escolhido para a missão mais confidencial de todas — trabalhar com a Ordo Realitas para proteger a humanidade contra o Outro Lado.",
            "poderes": [
            {
            "nex": 10,
            "nome": "Carteirada",
            "descricao": "Escolha uma perícia entre Diplomacia ou Enganação. Você recebe treinamento na perícia escolhida ou, se já for treinado, recebe +2 nela. Como parte do esforço conjunto da sua agência e da Ordem, no início de cada missão você recebe documentos que lhe fornecem privilégios jurídicos especiais. Esses documentos podem incluir a sua identidade verdadeira ou não, e podem ser individuais ou incluir os demais membros da sua equipe (conforme apropriado à missão). Os benefícios específicos desses documentos ficam a critério do mestre, mas em geral incluem acesso a locais restritos ou proibidos, permissão para portar armas de fogo e autoridade para assumir a jurisdição de investigações da polícia. Pessoas comuns não conseguem perceber que seus documentos são falsos, mas membros de agências de segurança ou indivíduos veteranos em Crime podem desconfiar de sua veracidade. Os documentos contam como itens operacionais que não ocupam espaço — mas cuidado para não perdê-los em locais onde novos não podem ser fornecidos!"
            },
            {
            "nex": 25,
            "nome": "Combate corpo a corpo",
            "descricao": "Quando um ser com uma arma faz um ataque corpo a corpo, você pode usar sua reação para fazer um teste de Crime ou Luta contra um teste de Luta. Em um sucesso, você rouba a arma da criatura e pode imediatamente fazer uma manobra de agarrar como parte da mesma reação."
            },
            {
            "nex": 40,
            "nome": "O Sorriso",
            "descricao": "Em seu trabalho como agente, você aprendeu que se manter contido com um sorriso “sincero” e palavras gentis são ferramentas muito eficientes em uma investigação. Você recebe +2 em Diplomacia e Enganação e, quando falha em um teste de uma dessas perícias, pode gastar 2 PE para repetir a rolagem (apenas uma vez por teste), mas deve aceitar o novo resultado, mesmo que seja pior que o primeiro. Por fim, uma vez por cena, você pode fazer um teste de Diplomacia para acalmar a si mesmo."
            },
            {
            "nex": 65,
            "nome": "Método Investigativo",
            "descricao": "Acostumado a vasculhar locais em segredo, você aprendeu a ser rápido ou “controlar a situação” antes que coisas ruins aconteçam. A urgência de qualquer cena de investigação em que você esteja presente aumenta em 1 rodada. Além disso, quando o mestre faz uma rolagem na tabela de eventos de investigação, você pode gastar 2 PE para transformar o resultado em “sem evento”. Você pode usar este efeito mais de uma vez na mesma cena, mas a cada uso adicional seu custo aumenta em +2 PE."
            },
            {
            "nex": 99,
            "nome": "Multifacetado",
            "descricao": "Viver sob vários disfarces tem sido útil, mas você faz isso há tanto tempo que talvez nem se lembre mais quem é de verdade. Essas habilidades que surgem quando você precisa foram aprendidas em disfarces anteriores, ou são apenas sua mente buscando uma saída? Uma vez por cena, você pode gastar 5 pontos de Sanidade para receber todas as habilidades de até NEX 65% de uma trilha de combatente ou especialista à sua escolha (você deve cumprir quaisquer pré-requisitos específicos da trilha). Você pode usar essas habilidades até o fim da cena, mas não pode escolher a mesma trilha mais de uma vez na mesma missão. Os pontos de Sanidade gastos para ativar essa habilidade só podem ser recuperados ao fim da missão."
            }
        ]
        },
        {
        "id": "atirador-de-elite",
        "nome": "Atirador de Elite",
        "descricao": "Um tiro, uma morte. Ao contrário dos combatentes, você é perito em neutralizar ameaças de longe, terminando uma briga antes mesmo que ela comece. Você trata sua arma como uma ferramenta de precisão, sendo capaz de executar façanhas incríveis.",
        "poderes": [
            { "nex": 10, "nome": "Mira de Elite", "descricao": "Você recebe proficiência com armas de fogo que usam balas longas e soma seu Intelecto em rolagens de dano com essas armas." },
            { "nex": 25, "nome": "Olho Treinado", "descricao": "Ao atacar com uma arma de fogo que use balas longas, você ignora metade de qualquer bônus de cobertura do alvo (arredondado para baixo)." },
            { "nex": 40, "nome": "Disparo Letal", "descricao": "Quando faz a ação mirar você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque que fizer até o final de seu próximo turno." },
            { "nex": 65, "nome": "Disparo Impactante", "descricao": "Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre derrubar, desarmar, empurrar ou quebrar." },
            { "nex": 99, "nome": "Atirar para Matar", "descricao": "Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar dados." }
        ]
        },
        {
        "id": "bibliotecario",
        "nome": "Bibliotecário",
        "descricao": "Poucas pessoas lêem tanto quanto você, mas diferente do que imaginam, passar a vida cercado de conhecimento não o torna menos apto. Na verdade, seu vasto conhecimento é muitas vezes a única solução para situações desesperadoras. Alguém precisa ser a chave dos segredos. Alguém precisa saber, mesmo que isso signifique perder.",
        "poderes": [
            { "nex": 10, "nome": "Conhecimento Prático", "descricao": "Você pode se lembrar de muitas informações úteis de suas leituras. Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Int. Se possuir o poder Conhecimento Aplicado, em vez disso seu custo é reduzido em –1 PE." },
            { "nex": 25, "nome": "Referência Cruzada", "descricao": "Uma vez por cena, você pode gastar 2 PE e uma ação padrão para fazer um teste de Investigação (DT 20) e, se passar, se lembra de uma informação relevante sobre o assunto, como se tivesse acesso a uma boa biblioteca." },
            { "nex": 40, "nome": "Leitor Contumaz", "descricao": "Você consome livros de forma obstinada. Cada dado de bônus que você recebe pela ação de interlúdio ler aumenta para 1d8 e você pode aplicar esse bônus em testes de qualquer perícia. Além disso, quando usa este bônus em um teste, você pode gastar 2 PE para aumentá-lo em +1 dado (de 1d8 para 2d8)." },
            { "nex": 65, "nome": "Rato de Biblioteca", "descricao": "Acostumado com bibliotecas, você sabe como extrair informações de qualquer lugar repleto de livros. Se estiver em um ambiente com muitos livros (como uma livraria, uma biblioteca ou um antiquário), você pode gastar alguns minutos (ou, se estiver em uma cena de investigação, uma rodada) para receber os benefícios de uma ação de interlúdio à sua escolha entre ler e revisar caso. Você só pode usar essa habilidade uma vez por cena." },
            { "nex": 99, "nome": "A Força do Saber", "descricao": "Tanto tempo passado entre livros e textos fortaleceu sua mente. Seu Intelecto aumenta em +1 e você soma o valor desse atributo em seu total de PE. Além disso, escolha uma perícia qualquer. Você troca o atributo-base dessa perícia para Intelecto." }
        ]
        },
        {
        "id": "infiltrador",
        "nome": "Infiltrador",
        "descricao": "Você é um perito em infiltração e sabe neutralizar alvos desprevenidos sem causar alarde. Combinando talento acrobático, destreza manual e conhecimento técnico você é capaz de superar qualquer barreira de defesa, mesmo quando a missão parece impossível.",
        "poderes": [
            { "nex": 10, "nome": "Ataque Furtivo", "descricao": "Você sabe atingir os pontos vitais de um inimigo distraído. Uma vez por rodada, quando atinge um alvo desprevenido com um ataque corpo a corpo ou em alcance curto, ou um alvo que você esteja flanqueando, você pode gastar 1 PE para causar +1d6 pontos de dano do mesmo tipo da arma. Em NEX 25% o dano adicional aumenta para +2d6, em NEX 40% aumenta para +3d6, em NEX 65% aumenta para +4d6 e em NEX 99% aumenta para +5d6." },
            { "nex": 25, "nome": "Gatuno", "descricao": "Você recebe +5 em Atletismo e Crime e pode percorrer seu deslocamento normal quando se esconder sem penalidade (veja a perícia Furtividade)." },
            { "nex": 40, "nome": "Assassino", "descricao": "Você fica mais mortal quando pega seus oponentes desprevenidos. Você tem vantagem (+1d20) em testes de ataque contra qualquer ser que ainda não tenha chegado no turno dele no combate. Além disso, qualquer ataque que você fizer contra esse ser que está surpreso, será um ataque crítico."},
            { "nex": 65, "nome": "Assassinar", "descricao": "Você pode gastar uma ação de movimento e 3 PE para analisar um alvo em alcance curto. Até o fim de seu próximo turno, seu primeiro Ataque Furtivo que causar dano a ele tem seus dados de dano extras dessa habilidade dobrados. Além disso, se sofrer dano de seu ataque, o alvo fica inconsciente ou morrendo, à sua escolha (Fortitude DT Agi evita)." },
            { "nex": 99, "nome": "Sombra Fugaz", "descricao": "Quando faz um teste de Furtividade após atacar ou fazer outra ação chamativa, você pode gastar 3 PE para não sofrer a penalidade de –3d20 no teste." }
        ]
        },
        {
        "id": "medico-de-campo",
        "nome": "Médico de Campo",
        "descricao": "Você é treinado em técnicas de primeiros socorros e tratamento de emergência, o que torna você um membro valioso para qualquer grupo de agentes. Ao contrário dos profissionais de saúde convencionais, você está acostumado com o campo de batalha e sabe tomar decisões rápidas no meio do caos. Especial: para escolher esta trilha, você precisa ser treinado em Medicina. Para usar as habilidades desta trilha, você precisa possuir um kit de medicina.",
        "poderes": [
            { "nex": 10, "nome": "Paramédico", "descricao": "Você pode usar uma ação padrão e 2 PE para curar 2d10 pontos de vida de si mesmo ou de um aliado adjacente. Você pode curar +1d10 PV respectivamente em NEX 40%, 65% e 99%, gastando +1 PE por dado adicional de cura." },
            { "nex": 25, "nome": "Diagnóstico Rápido", "descricao": "Você pode gastar uma ação padrão para analisar um aliado ferido e descobrir a extensão exata de seus ferimentos e condições, recebendo +2 em testes de Medicina relacionados a ele pelo resto da cena." },
            { "nex": 40, "nome": "Equipe de Trauma", "descricao": "Você pode usar uma ação padrão e 2 PE para remover uma condição negativa (exceto morrendo e enlouquecendo) de um aliado adjacente." },
            { "nex": 65, "nome": "Resgate", "descricao": "Uma vez por rodada, se estiver em alcance curto de um aliado machucado ou morrendo, você pode se aproximar do aliado com uma ação livre (desde que seja capaz de fazê-lo usando seu deslocamento normal). Além disso, sempre que curar PV ou remover condições do aliado, você e o aliado recebem +5 na Defesa até o início de seu próximo turno. Por fim, para você, o total de espaços ocupados por carregar um personagem é reduzido pela metade." },
            { "nex": 99, "nome": "Reanimação", "descricao": "Uma vez por cena, você pode gastar uma ação completa e 10 PE para trazer de volta à vida um personagem que tenha morrido na mesma cena (exceto morte por dano massivo)." }
        ]
        },
        {
        "id": "muambeiro",
        "nome": "Muambeiro",
        "descricao": "Você sempre foi bom em lidar com equipamentos, e aprendeu como produzir ou encontrar, os itens certos em qualquer ocasião. Esse talento pode ser fundamental para manter todos em sua equipe vivos.",
        "poderes": [
            { "nex": 10, "nome": "Mascate", "descricao": "Você aprendeu um ofício útil e desenvolveu métodos para ter sempre à mão o que precisa para praticá-lo. Você recebe treinamento em uma Profissão à sua escolha entre armeiro, engenheiro ou químico, e recebe +5 em sua capacidade de carga. Além disso, quando fabrica um item improvisado a DT é reduzida em –10 (em vez de –5)." },
            { "nex": 25, "nome": "Estoque Pessoal", "descricao": "Você sempre carrega alguns suprimentos extras. Uma vez por sessão, pode gastar uma ação padrão para produzir um item geral de categoria I, como se o tivesse comprado durante a preparação da missão." },
            { "nex": 40, "nome": "Fabricação Própria", "descricao": "Você desenvolveu suas próprias técnicas para fabricar equipamentos rapidamente. Você leva apenas metade do tempo para fabricar itens mundanos. Ou seja, com uma ação de manutenção pode fabricar duas munições, explosivos e demais consumíveis, e precisa de apenas uma ação de manutenção para armas, proteções e demais equipamentos gerais (itens modificados ou paranormais não são afetados por esta habilidade)." },
            { "nex": 65, "nome": "Laboratório de Campo", "descricao": "Sua habilidade em reparar e fabricar itens permite que você lide com a complexidade de dispositivos paranormais. Você recebe treinamento em uma Profissão à sua escolha entre armeiro, engenheiro ou químico ou, se já for treinado em uma dessas perícias, recebe +5 nela. Além disso, você pode usar fabricação em campo para fabricar e consertar itens paranormais (fabricar um item paranormal exige três ações de interlúdio que não precisam ser consecutivas, veja p. 94)." },
            { "nex": 99, "nome": "Achado Conveniente", "descricao": "Entre protótipos e itens encontrados durante a missão, sua mochila sempre pode ter a ferramenta certa para a ocasião. Você pode gastar uma ação completa e 5 PE para “produzir” um item de até categoria III (exceto itens paranormais). O item pode ser um protótipo em que você estava trabalhando, um item encontrado anteriormente na missão ou qualquer outra justificativa aprovada pelo mestre. O item permanece em funcionamento até o fim da cena, quando então deixa de funcionar permanentemente (fica sem energia ou munição, uma peça fundamental se gasta ou quebra etc)." }
        ]
        },
        {
        "id": "negociador",
        "nome": "Negociador",
        "descricao": "Você é um diplomata habilidoso e consegue influenciar outras pessoas, seja por lábia ou intimidação. Sua capacidade de avaliar situações com rapidez e eficiência pode tirar o grupo de apuros que nem a mais poderosa das armas poderia resolver.",
        "poderes": [
            { "nex": 10, "nome": "Eloquência", "descricao": "Você pode usar uma ação completa e 1 PE por alvo em alcance curto para afetar outras pessoas com sua fala. Faça um teste de Diplomacia, Enganação ou Intimidação contra a Vontade dos alvos. Se você vencer, os alvos ficam fascinados enquanto você se concentrar (uma ação padrão por rodada). Um alvo hostil ou que esteja envolvido em combate recebe +5 em seu teste de resistência e tem direito a um novo teste por rodada, sempre que você se concentrar. Uma pessoa que passar no teste fica imune a este efeito por um dia." },
            { "nex": 25, "nome": "Leitura Rápida", "descricao": "Ao interagir com um NPC pela primeira vez, você pode gastar 1 PE para descobrir sua atitude inicial em relação ao grupo e uma motivação ou fraqueza que possa usar a seu favor." },
            { "nex": 40, "nome": "Discurso Motivador", "descricao": "Você pode gastar uma ação padrão e 4 PE para inspirar seus aliados com suas palavras. Você e todos os seus aliados em alcance curto ganham +O em testes de perícia até o fim da cena. A partir de NEX 65%, você pode gastar 8 PE para fornecer um bônus total de +OO." },
            { "nex": 65, "nome": "Eu Conheço um Cara", "descricao": "Uma vez por missão, você pode ativar sua rede de contatos para pedir um favor, como por exemplo trocar todo o equipamento do seu grupo (como se tivesse uma segunda fase de preparação de missão), conseguir um local de descanso ou mesmo ser resgatado de uma cena. O mestre tem a palavra final de quando é possível usar essa habilidade e quais favores podem ser obtidos." },
            { "nex": 99, "nome": "Truque de Mestre", "descricao": "Acostumado a uma vida de fingimento e manipulação, você pode gastar 5 PE para simular o efeito de qualquer habilidade que você tenha visto um de seus aliados usar durante a cena. Você ignora os pré-requisitos da habilidade, mas ainda precisa pagar todos os seus custos, incluindo ações, PE e materiais, e ela usa os seus parâmetros de jogo, como se você estivesse usando a habilidade em questão." }
        ]
        },
        {
        "id": "perseverante",
        "nome": "Perseverante",
        "descricao": "Você sabe que é um sobrevivente. Talvez tenha sido o único a escapar com vida de uma grande tragédia, ou simplesmente possua o espírito necessário para perseverar onde todos os outros caíram. Em filmes de terror, os monstros e assassinos costumam pegar suas vítimas isoladas uma a uma com facilidade, até se depararem com uma protagonista resiliente e que parece nunca desistir. Seja por experiência ou instinto, você tem certeza que se estivesse em um desses filmes, seria o último sobrevivente a sair vivo no final.",
        "poderes": [
            { "nex": 10, "nome": "Soluções Improvisadas", "descricao": "Você não é um sobrevivente à toa. Quando as coisas dão errado, você consegue pensar em alguma solução inusitada. Você pode gastar 2 PE para rolar novamente 1 dos dados de um teste recém-realizado (apenas uma vez por teste) e ficar com o melhor resultado entre as duas rolagens." },
            { "nex": 25, "nome": "Instinto de Sobrevivência", "descricao": "Você recebe +2 em testes de resistência (Fortitude, Reflexos e Vontade) enquanto estiver machucado." },
            { "nex": 40, "nome": "Fuga Obstinada", "descricao": "Seu instinto de sobrevivência lhe impulsiona para desprender as mais desesperadas fugas. Você recebe +O em testes de perícia para fugir de um inimigo (seja em uma perseguição ou não). Além disso, em cenas de perseguição, se você for a presa, pode acumular até 4 falhas antes de ser pego." },
            { "nex": 65, "nome": "Determinação Inquestionável", "descricao": "Nos momentos mais sombrios, você consegue encontrar em seu interior a força para perseverar. Uma vez por cena, você pode gastar 5 PE e uma ação padrão para remover uma condição de medo, mental ou de paralisia que esteja lhe afligindo. A critério do mestre, certas condições, como paralisia causada por uma doença, não podem ser removidas por essa habilidade." },
            { "nex": 99, "nome": "Só Mais um Passo...", "descricao": "Você não chegou até aqui para morrer, e fará qualquer coisa para escapar com vida. Uma vez por rodada, quando sofre dano que reduziria seus PV a 0, você pode gastar 5 PE para, em vez disso, ficar com 1 PV. Esta habilidade não funciona contra dano massivo." }
        ]
        },
        {
        "id": "tecnico",
        "nome": "Técnico",
        "descricao": "Sua principal habilidade é a manutenção e reparo do valioso equipamento que seu time carrega em missão. Seu conhecimento técnico também permite que improvise ferramentas com o que tiver à disposição e sabote os itens usados por seus inimigos.",
        "poderes": [
            { "nex": 10, "nome": "Inventário Otimizado", "descricao": "Você soma seu Intelecto à sua Força para calcular sua capacidade de carga. Por exemplo, se você tem Força 1 e Intelecto 3, seu inventário tem 20 espaços." },
            { "nex": 25, "nome": "Gambiarra", "descricao": "Você pode improvisar equipamentos ou modificações com materiais ao seu redor. Escolha um equipamento geral ou outro tipo de objeto à sua escolha (consulte o mestre) e gaste uma ação completa e 2 PE, mais 2 PE por categoria do item escolhido. Você cria uma versão funcional do item escolhido, que segue suas regras de espaço e categoria como normal. Ao final da cena, seu equipamento improvisado se torna inútil. Você pode fazer um equipamento que não se torna inútil no fim da cena se usar essa ação em uma cena de interlúdio." },
            { "nex": 40, "nome": "Remendão", "descricao": "Você pode gastar uma ação completa e 1 PE para remover a condição quebrado de um equipamento adjacente até o final da cena. Além disso, qualquer equipamento geral tem sua categoria reduzida em I para você." },
            { "nex": 65, "nome": "Improvisar", "descricao": "Você pode improvisar equipamentos com materiais ao seu redor. Escolha um equipamento geral e gaste uma ação completa e 2 PE, mais 2 PE por categoria do item escolhido. Você cria uma versão funcional do equipamento, que segue suas regras de espaço e categoria como normal. Ao final da cena, seu equipamento improvisado se torna inútil." },
            { "nex": 99, "nome": "Preparado para Tudo", "descricao": "Você sempre tem o que precisa para qualquer situação. Sempre que precisar de um item qualquer (exceto armas), pode gastar uma ação de movimento e 3 PE por categoria do item para lembrar que colocou ele no fundo da bolsa! Depois de encontrado, o item segue normalmente as regras de inventário." }
        ]
        }
    ],
  },

  ocultista: {
    nome: "Ocultista",
    resumo: "Estuda e domina o paranormal para usá-lo como arma, aprendendo a conjurar Rituais.",
    pv: { base: 12, porNex: 2 },
    pe: { base: 8, porNex: 4 },
    san: { base: 20, porNex: 5 },
    pd: { base: 10, porNex: 5 },   // regra opcional de Pontos de Determinação (substitui PE e SAN)
    proficiencias: "Armas simples e proteções leves.",
    bonusPorNex: [{ nex: 85, pe: 8 }],
    periciasIniciaisTexto: "Ocultismo e Vontade, mais 3 + Intelecto perícias à escolha.",

    tabelaNex: [
        { nex: 5,  tipo: "fixo",    texto: "Escolhido pelo Outro Lado (1º círculo)" },
        { nex: 10, tipo: "trilha",  texto: "Escolha de trilha" },
        { nex: 15, tipo: "escolha", texto: "Poder de ocultista" },
        { nex: 20, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 25, tipo: "trilha",  texto: "Escolhido pelo Outro Lado (2º círculo), habilidade de trilha" },
        { nex: 30, tipo: "escolha", texto: "Poder de ocultista" },
        { nex: 35, tipo: "fixo",    texto: "Grau de treinamento (3 + Intelecto perícias)" },
        { nex: 40, tipo: "trilha",  texto: "Poder de ocultista, habilidade de trilha" },
        { nex: 45, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 50, tipo: "fixo",    texto: "Escolhido pelo Outro Lado (3 círculo)" },
        { nex: 55, tipo: "escolha", texto: "Poder de ocultista" },
        { nex: 60, tipo: "fixo",    texto: "Perícia adicional ou +2 em perícia treinada" },
        { nex: 65, tipo: "trilha",  texto: "Poder de ocultista, habilidade de trilha" },
        { nex: 70, tipo: "fixo",    texto: "Grau de treinamento (3 + Intelecto perícias)" },
        { nex: 75, tipo: "fixo",    texto: "Escolhido pelo Outro Lado (4 círculo)" },
        { nex: 80, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 85, tipo: "fixo",    texto: "+8 de PE" },
        { nex: 90, tipo: "escolha", texto: "Poder de ocultista" },
        { nex: 95, tipo: "fixo",    texto: "Aumento de atributo" },
        { nex: 99, tipo: "trilha",  texto: "Poder de ocultista, habilidade de trilha" }
    ],

    poderes: [
        PODER_VERSATILIDADE,
        PODER_APRIMORAMENTO_ORIGEM,

        {
            "nome": "Afinidade Elemental",
            "preRequisito": null,
            "descricao": "A execução de rituais é diminuída em um passo (de completa para padrão, de padrão para movimento) quando sobre uma superfície relacionada ao ritual (Transfigurar Água em um rio, rituais de Sangue em superfícies de sangue, por exemplo)."
        },

        {
            "nome": "Camuflar Ocultismo",
            "preRequisito": null,
            "descricao": "Você pode gastar uma ação livre para esconder símbolos e sigilos que estejam desenhados ou gravados em objetos ou em sua pele, tornando-os invisíveis para outras pessoas além de você mesmo. Além disso, quando lança um ritual, pode gastar +2 PE para lançá-lo sem usar componentes ritualísticos e sem gesticular (o que permite conjurar um ritual com as mãos presas), usando apenas concentração. Outros seres só perceberão que você lançou um ritual se passarem num teste de Ocultismo (DT 25)."
        },

        {
            "nome": "Consumo Prolongado",
            "preRequisito": null,
            "descricao": "Você passa a poder obter os efeitos de um catalisador comum em até dois rituais antes do item se desfazer. Além disso, pode gastar seus componentes ritualísticos para utilizá-los como um catalisador improvisado."
        },

        {
            "nome": "Criar Selo",
            "preRequisito": null,
            "descricao": "Você sabe fabricar selos paranormais de rituais que conheça (veja a página 151). Fabricar um selo gasta uma ação de interlúdio e um número de PE iguais ao custo de conjurar o ritual. Você pode ter um número máximo de selos criados ao mesmo tempo igual à sua Presença."
        },

        {
            "nome": "Envolto em Mistério",
            "preRequisito": null,
            "descricao": "Sua aparência e postura assombrosas o permitem manipular e assustar pessoas ignorantes ou supersticiosas. O mestre define o que exatamente você pode fazer e quem se encaixa nessa descrição. Como regra geral, você recebe +5 em Enganação e Intimidação contra pessoas não treinadas em Ocultismo."
        },

        {
            "nome": "Especialista em Elemento",
            "preRequisito": null,
            "descricao": "Escolha um elemento. A DT para resistir aos seus rituais desse elemento aumenta em +2."
        },

        {
            "nome": "Ferramentas Paranormais",
            "preRequisito": null,
            "descricao": "Você reduz a categoria de um item paranormal em I e pode ativar itens paranormais sem pagar seu custo em PE."
        },

        {
            "nome": "Fluxo de Poder",
            "preRequisito": "NEX 60%",
            "descricao": "Você pode manter dois efeitos sustentados de rituais ativos ao mesmo tempo com apenas uma ação livre, pagando o custo de cada efeito separadamente."
        },

        {
            "nome": "Fortalecimento Ritualístico",
            "preRequisito": "NEX 25%, INT 2",
            "descricao": "Você soma seu Intelecto na DT dos seus rituais."
        },

        {
            "nome": "Guiado pelo Paranormal",
            "preRequisito": null,
            "descricao": "Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional."
        },

        {
            "nome": "Guerrilheiro Paranormal",
            "preRequisito": null,
            "descricao": "Ao conjurar o ritual Amaldiçoar Arma em uma arma tática, pode usá-la como se fosse proficiente com ela até o fim do ritual."
        },

        {
            "nome": "Identificação Paranormal",
            "preRequisito": null,
            "descricao": "Você recebe +10 em testes de Ocultismo para identificar criaturas, objetos ou rituais."
        },

        {
            "nome": "Improvisar Componentes",
            "preRequisito": null,
            "descricao": "Uma vez por cena, você pode gastar uma ação completa para fazer um teste de Investigação (DT 15). Se passar, encontra objetos que podem servir como componentes ritualísticos de um elemento à sua escolha. O mestre define se é possível usar esse poder na cena atual."
        },

        {
            "nome": "Intuição Paranormal",
            "preRequisito": null,
            "descricao": "Sempre que usa a ação facilitar investigação, você soma seu Intelecto ou Presença no teste (à sua escolha)."
        },

        {
            "nome": "Maldição Protetora",
            "preRequisito": null,
            "descricao": "Caso esteja usando um item amaldiçoado, você soma sua Presença ou Intelecto na sua Defesa."
        },

        {
            "nome": "Manobra Rochosa",
            "preRequisito": null,
            "descricao": "Ao conjurar Transfigurar Terra, você pode gastar 2 PE para realizar qualquer manobra que não seja quebrar no oponente afetado."
        },

        {
            "nome": "Mestre em Elemento",
            "preRequisito": "Especialista em Elemento no elemento escolhido, NEX 45%",
            "descricao": "Escolha um elemento. O custo para lançar rituais desse elemento diminui em –1 PE."
        },

        {
            "nome": "Ritual Intenso",
            "preRequisito": "INT 2 ou PRE 2",
            "descricao": "Você soma sua Presença ou Intelecto nas rolagens de dano e de cura dos seus rituais."
        },

        {
            "nome": "Ritual Potente",
            "preRequisito": "INT 2",
            "descricao": "Você soma seu Intelecto nas rolagens de dano ou nos efeitos de cura de seus rituais."
        },

        {
            "nome": "Ritual Predileto",
            "preRequisito": null,
            "descricao": "Escolha um ritual que você conhece. Você reduz em –1 PE o custo do ritual. Essa redução se acumula com reduções fornecidas por outras fontes."
        },

        {
            "nome": "Tática Paranormal",
            "preRequisito": null,
            "descricao": "Você recebe +2 em testes de ataque para cada ser sob efeito de um ritual seu."
        },

        {
            "nome": "Tatuagem Ritualística",
            "preRequisito": null,
            "descricao": "Símbolos marcados em sua pele reduzem em –1 PE o custo de rituais de alcance pessoal que têm você como alvo."
        },

        {
            "nome": "Transcender",
            "preRequisito": null,
            "descricao": "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes."
        },

        {
            "nome": "Treinamento em Perícia",
            "preRequisito": null,
            "descricao": "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes."
        }
        ],

    trilhas: [
        {
        "id": "criptologista",
        "nome": "Criptologista",
        "descricao": "Você estuda tentando compreender as linguagens utilizadas para se comunicar com o Outro Lado. Mesmo desconfiando que não haja uma solução concreta, você analisa os padrões, desenvolve técnicas e ensina aos seus aliados maneiras de aprimorar suas súplicas ao paranormal. (Arquivos Secretos 05 — a homebrew não define a habilidade de NEX 25% desta trilha.)",
        "poderes": [
            { "nex": 10, "nome": "Método Intuitivo", "descricao": "Você recebe o poder Criar Selo (OPRPG, p. 33). Se recebê-lo novamente, dobra a quantidade máxima de selos criados ao mesmo tempo. Você pode criar 2 selos com uma ação de interlúdio, em vez de apenas 1. O número de selos que você pode criar em uma ação de interlúdio aumenta em +1 para cada outra habilidade desta trilha que possuir." },
            { "nex": 40, "nome": "Método Intuitivo (40%)", "descricao": "Selos feitos por você são mais fáceis de usar. O teste para usar o Selo de um ritual que o usuário não conhece muda para Ocultismo (DT 10 + custo em PE do ritual). Além disso, você recebe +5 em testes para identificar rituais." },
            { "nex": 65, "nome": "Decifrar à Distância", "descricao": "Quando usa um Selo Paranormal, você não precisa estar empunhando-o nem precisa lê-lo em voz alta. Basta poder lê-lo, mesmo que apenas mentalmente, mas o Selo precisa estar, no máximo, em alcance curto de você." },
            { "nex": 99, "nome": "Selo Supremo", "descricao": "Selos feitos por você dispensam testes de Ocultismo para serem usados, à sua escolha. Além disso, os seus Selos sofrem as seguintes alterações: se o ritual pede testes de resistência, a DT aumenta em +5; se o ritual causa dano, a rolagem de dano aumenta em +3 dados extras do mesmo tipo; se o ritual for usado em forma aprimorada, o usuário do Selo não precisa pagar o custo adicional em PE." }
        ]
        },
        {
        "id": "conduite",
        "nome": "Conduíte",
        "descricao": "Você domina os aspectos fundamentais da conjuração de rituais e é capaz de aumentar o alcance e velocidade de suas conjurações. Conforme sua conexão com as entidades paranormais aumenta você se torna capaz de interferir com os rituais de outros ocultistas.",
        "poderes": [
            { "nex": 10, "nome": "Ampliar Ritual", "descricao": "Quando lança um ritual, você pode gastar +2 PE para aumentar seu alcance em um passo (de curto para médio, de médio para longo ou de longo para extremo) ou dobrar sua área de efeito." },
            { "nex": 25, "nome": "Fluxo Constante", "descricao": "Você recupera 1 PE adicional ao descansar. Além disso, uma vez por cena, pode reduzir o custo de PE de um ritual que for conjurar em 1 (mínimo 1)." },
            { "nex": 40, "nome": "Acelerar Ritual", "descricao": "Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como uma ação livre." },
            { "nex": 65, "nome": "Anular Ritual", "descricao": "Quando for alvo de um ritual, você pode gastar uma quantidade de PE igual ao custo pago por esse ritual e fazer um teste oposto de Ocultismo contra o conjurador. Se vencer, você anula o ritual, cancelando todos os seus efeitos." },
            { "nex": 99, "nome": "Canalizar o Medo", "descricao": "Você aprende o ritual Canalizar o Medo." }
        ]
        },
        {
        "id": "exorcista",
        "nome": "Exorcista",
        "descricao": "Da escuridão da noite, quando as sombras se tornam mais densas, emerge um chamado desesperado. Um grito sufocado pela presença maligna que assola uma alma atormentada. É então que o exorcista se ergue para enfrentar o paranormal. Com sua fé como escudo e suas palavras como espada, independente de sua religião ou crença, você mergulha na escuridão, onde a Realidade e o Outro Lado travam uma batalha pelo medo humano.",
        "poderes": [
            { "nex": 10, "nome": "Especialização", "descricao": "Qualquer que seja sua fé, você passou a estudar alguma entidade específica que te fascina. Escolha entre as quatro entidades paranormais conhecidas: Sangue, Morte, Energia e Conhecimento. Você passa a estudar e se conectar com essa entidade mais profundamente. Os benefícios são à critério do mestre, mas, como regra geral, recebe +2 de resistência à dano daquele elemento. Toda vez que Transcender, essa RD aumenta em +2." },
            { "nex": 25, "nome": "Purificação, Aprofundamento", "descricao": "Você manipula sua conexão com o Outro Lado e usa seus estudos para abençoar um aliado. Você pode remover qualquer condição negativa de um aliado (exceto enlouquecendo, perturbado, morrendo e machucado), gastando 3 PE por condição.\nAlém disso, você aprofunda seus estudos ocultistas. Você recebe Versatilidade em uma trilha de Ocultista à sua escolha." },
            { "nex": 40, "nome": "Poder da Fé", "descricao": "Sua fé e o estudo de suas doutrinas religiosas alimentam suas defesas mentais e espirituais. Você se torna veterano em Religião ou, se já for veterano, recebe +1d20 nessa perícia. Quando falha em um teste de resistência, você pode gastar 2 PE para repetir o teste usando Religião, mas deve aceitar o resultado da segunda rolagem, mesmo que seja menor que a primeira." },
            { "nex": 65, "nome": "Parareligiosidade", "descricao": "Você conjura rituais com uma intensidade tão fervorosa que potencializa seus efeitos. Quando conjura um ritual, você pode gastar +2 PE para adicionar a ele um efeito equivalente ao de um catalisador ritualístico a sua escolha." },
            { "nex": 99, "nome": "Chagas da Resistência", "descricao": "Por meio de sua fé, sua mente consegue extrair forças de seu corpo para suportar qualquer agressão. Quando sua Sanidade é reduzida a 0, você pode gastar 10 PV para, em vez disso, ficar com SAN 1." }
        ]
        },
        {
        "id": "flagelador",
        "nome": "Flagelador",
        "descricao": "Dor é um poderoso catalisador paranormal e você aprendeu a transformá-la em poder para seus rituais. Quando se torna especialmente poderoso, consegue usar a dor e o sofrimento de seus inimigos como instrumento de seus rituais ocultistas.",
        "poderes": [
            { "nex": 10, "nome": "Poder do Flagelo", "descricao": "Ao conjurar um ritual, você pode gastar seus próprios pontos de vida para pagar o custo em pontos de esforço, à taxa de 2 PV por PE pago. Rituais conjurados desta forma têm a DT aumentada em um valor igual ao seu Vigor, e efeitos de cura somam o dobro do seu Vigor. Pontos de vida gastos dessa forma só podem ser recuperados com descanso." },
            { "nex": 25, "nome": "Abraçar a Dor", "descricao": "Sempre que sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade." },
            { "nex": 40, "nome": "Vigor Sacrificial", "descricao": "Você pode gastar uma ação padrão e sofrer dano igual à metade do seu Vigor (arredondado para cima, esse dano não pode ser reduzido de forma alguma) para recuperar uma quantidade de PE igual ao dano sofrido." },
            { "nex": 65, "nome": "Absorver Agonia", "descricao": "Sempre que reduz um ou mais inimigos a 0 PV com um ritual, você recebe uma quantidade de PE temporários igual ao círculo do ritual utilizado. Por exemplo, se ativar esse poder com um ritual de 2º círculo, receberá 2 PE." },
            { "nex": 99, "nome": "Medo Tangível", "descricao": "Você aprende o ritual Medo Tangível." }
        ]
        },
        {
        "id": "graduado",
        "nome": "Graduado",
        "descricao": "Você foca seus estudos em se tornar um conjurador versátil e poderoso, conhecendo mais rituais que os outros ocultistas e sendo capaz de torná-los mais difíceis de serem resistidos. Seu objetivo é desvendar e dominar os segredos do Outro Lado, custe o que custar.",
        "poderes": [
            { "nex": 10, "nome": "Saber Ampliado", "descricao": "Você aprende um ritual de 1º círculo. Toda vez que ganha acesso a um novo círculo, aprende um ritual adicional daquele círculo. Esses rituais não contam no seu limite de rituais." },
            { "nex": 25, "nome": "Estudo Aplicado", "descricao": "Você pode gastar 10 minutos e 1 PE revisando suas anotações para trocar um ritual conhecido de 1º ou 2º círculo por outro do mesmo círculo. Você só pode fazer isso uma vez por interlúdio." },
            { "nex": 40, "nome": "Grimório Ritualístico", "descricao": "Você cria um grimório especial, que armazena rituais que sua mente não seria capaz de guardar. Você aprende uma quantidade de rituais de 1º ou 2º círculos igual ao seu Intelecto. Quando ganha acesso a um novo círculo, pode incluir um novo ritual desse círculo em seu grimório. Esses rituais não contam em seu limite de rituais conhecidos. Para conjurar um ritual armazenado em seu grimório, você precisa antes empunhar o grimório e gastar uma ação completa o folheando para relembrar o ritual. O grimório ocupa 1 espaço em seu inventário. Se perdê-lo, você pode replicá-lo com duas ações de interlúdio." },
            { "nex": 65, "nome": "Rituais Eficientes", "descricao": "A DT para resistir a todos os seus rituais aumenta em +5." },
            { "nex": 99, "nome": "Conhecendo o Medo", "descricao": "Você aprende o ritual Conhecendo o Medo." }
        ]
        },
        {
        "id": "intuitivo",
        "nome": "Intuitivo",
        "descricao": "Assim como combatentes treinam seus corpos para resistir a traumas físicos, você preparou sua mente para resistir aos efeitos do Outro Lado. Seu foco e força de vontade fazem com que você expanda os limites de suas capacidades paranormais.",
        "poderes": [
            { "nex": 10, "nome": "Mente Sã", "descricao": "Você compreende melhor as entidades do Outro Lado, e passa a ser menos abalado por seus efeitos. Você recebe resistência paranormal +5 (+5 em testes de resistência contra efeitos paranormais)." },
            { "nex": 25, "nome": "Foco Mental", "descricao": "Uma vez por cena, você pode gastar uma ação padrão e 2 PE para repetir um teste de resistência que acabou de falhar, mantendo o novo resultado." },
            { "nex": 40, "nome": "Presença Poderosa", "descricao": "Sua resiliência mental faz com que você possa extrair mais do Outro Lado. Você adiciona sua Presença ao seu limite de PE por turno, mas apenas para conjurar rituais (não para DT)." },
            { "nex": 65, "nome": "Inabalável", "descricao": "Você recebe resistência a dano mental e paranormal 10. Além disso, quando é alvo de um efeito paranormal que permite um teste de Vontade para reduzir o dano à metade, você não sofre dano algum se passar." },
            { "nex": 99, "nome": "Presença do Medo", "descricao": "Você aprende o ritual Presença do Medo." }
        ]
        },
        {
        "id": "lamina-paranormal",
        "nome": "Lâmina Paranormal",
        "descricao": "Alguns ocultistas preferem ficar fechados em suas bibliotecas estudando livros e rituais. Outros preferem investigar fenômenos paranormais em sua fonte. Já você, prefere usar o paranormal como uma arma. Você aprendeu e dominou técnicas de luta mesclando suas habilidades de conjuração com suas capacidades de combate.",
        "poderes": [
            { "nex": 10, "nome": "Lâmina Maldita", "descricao": "Você aprende o ritual Amaldiçoar Arma. Se já o conhece, pode gastar +1 PE quando o lança para reduzir seu tempo de conjuração para movimento. Além disso, quando conjura esse ritual, você pode usar Ocultismo, em vez de Luta ou Pontaria, para testes de ataque com a arma amaldiçoada." },
            { "nex": 25, "nome": "Fio Amaldiçoado", "descricao": "Armas que você amaldiçoou com o ritual Amaldiçoar Arma recebem +1 na margem de ameaça enquanto estiverem sob o efeito do ritual." },
            { "nex": 40, "nome": "Gladiador Paranormal", "descricao": "Sempre que acerta um ataque corpo a corpo em um inimigo, você recebe 2 PE temporários. Você pode ganhar um máximo de PE temporários por cena igual ao seu limite de PE. PE temporários desaparecem no final da cena." },
            { "nex": 65, "nome": "Conjuração Marcial", "descricao": "Uma vez por rodada, quando você lança um ritual com execução de uma ação padrão, pode gastar 2 PE para fazer um ataque corpo a corpo como uma ação livre." },
            { "nex": 99, "nome": "Lâmina do Medo", "descricao": "Você aprende o ritual Lâmina do Medo." }
        ]
        },
        {
        "id": "parapsicologo",
        "nome": "Parapsicólogo",
        "descricao": "Você esteve em um meio de pessoas dedicadas a cuidar da mente humana… Mas, quando descobriu a maior ameaça para a nossa psique, descobriu também que seus colegas não passavam de tolos céticos. Quando você falou sobre o paranormal, eles apenas riram. Desprezado pela academia, você decidiu perseguir a verdade sozinho. Afinal, a diferença entre o remédio e o veneno é a dosagem. Se o paranormal pode ser usado para perturbar, também pode ser usado para sanar. Ele só precisa ser estudado, analisado e aplicado por alguém competente como você, mesmo que isso custe sua vida. Especial: para escolher esta trilha, você precisa ser treinado em Profissão (psicólogo).",
        "poderes": [
            { "nex": 10, "nome": "Terapia", "descricao": "Por meio de seus estudos parapsicológicos, você começa a compreender os efeitos do paranormal sobre a mente humana. Você pode usar Profissão (psicólogo) como Diplomacia. Além disso, uma vez por rodada, quando você ou um aliado em alcance curto falha em um teste de resistência contra um efeito que causa dano mental, você pode gastar 2 PE para fazer um teste de Profissão (psicólogo) e usar o resultado desse teste no lugar do teste de resistência falho. Se já possuir esta habilidade, em vez disso seu custo é reduzido em –1 PE e você recebe +2 em Profissão (psicólogo)." },
            { "nex": 25, "nome": "Escuta Ativa", "descricao": "Uma vez por cena, ao conversar com alguém por pelo menos um minuto, você pode gastar 2 PE para descobrir se ela está mentindo ou sofrendo de alguma condição mental, sem precisar fazer um teste." },
            { "nex": 40, "nome": "Palavras-chave", "descricao": "Combinando psicologia e estudos do Outro Lado, você desenvolveu técnicas e sabe o que dizer para restaurar a sanidade de seus pacientes. Quando passa em um teste de perícia para acalmar (veja OPRPG, p. 44), você pode gastar uma quantidade de pontos de esforço até seu limite de PE. Para cada 1 PE gasto desta forma, a pessoa que está sendo tratada recupera 1 ponto de Sanidade (ou 1 PD, se estiver usando a regra “Jogando sem Sanidade” da p. 104)." },
            { "nex": 65, "nome": "Reprogramação Mental", "descricao": "Ignorando os avisos de cautela de seus pares, você descobriu como hipnotizar e manipular a mente humana para reprogramar suas capacidades. Você pode gastar 5 PE e uma ação de interlúdio para manipular o cérebro de outra pessoa voluntária em alcance curto (essa pessoa também gasta sua ação de interlúdio). Até o próximo interlúdio, a pessoa recebe, à escolha dela, um poder geral, um poder da própria classe ou o primeiro poder de uma trilha que não a dela, acreditando que isso sempre fez parte de sua vida. A pessoa precisa cumprir os pré-requisitos do poder escolhido." },
            { "nex": 99, "nome": "A Sanidade Está Lá Fora", "descricao": "Graças aos seus estudos, a capacidade de curar a mente humana de (quase) todas as mazelas está ao seu alcance. Você pode gastar uma ação de movimento e 5 PE para remover todas as condições de medo ou mentais de uma pessoa adjacente (incluindo você mesmo)." }
        ]
        },
        {
        "id": "possuido",
        "nome": "Possuído",
        "descricao": "Você nunca quis contato com o Outro Lado, mas ele parece ter especialmente escolhido você para perseguir. Desde que consegue lembrar, você estava predestinado a essa maldição, como se o paranormal estivesse crescendo em seu interior antes mesmo de seu nascimento… E assim, você foi empurrado para uma batalha sem fim… Sem opção, só lhe resta lutar, enquanto o paranormal dentro de você aflora cada vez mais.",
        "poderes": [
            { "nex": 10, "nome": "Poder Não Desejado", "descricao": "Você sente o paranormal tomando forma em seu interior. Ele oferece um poder assustador, mas ao mesmo tempo exige que você siga o caminho que ele escolheu. Sempre que receber um novo poder de ocultista, em vez disso você recebe o poder Transcender. Entretanto, você possui uma reserva paranormal alimentada pela presença em seu interior. Essa reserva é representada por pontos de possessão (PP); seu total de PP é igual a 3, mais 2 pontos para cada poder Transcender que possui. O limite de PP que você pode gastar por turno é igual à sua Presença; para cada PP gasto, você recupera 10 PV ou 2 PE. Você recupera 1 PP a cada ação de interlúdio dormir." },
            { "nex": 25, "nome": "Sussurro Constante", "descricao": "Sua reserva de pontos de possessão aumenta em +2. Além disso, você recupera 1 PP adicional sempre que ficar Abalado ou sofrer uma condição de medo." },
            { "nex": 40, "nome": "As Sombras Dentro de Mim", "descricao": "Cada vez mais a Entidade cresce dentro de você, tomando seus músculos e guiando seus movimentos. Sua recuperação de PP aumenta para 2 por ação dormir. Além disso, você pode gastar 2 PE para permitir que sua Entidade controle temporariamente seus músculos. Você assume uma postura desnatural que permite movimentos bizarros e silenciosos; você recebe +O em Acrobacia, Atletismo e Furtividade por uma rodada e, se estiver em uma cena de furtividade (veja p. 92), nesta rodada o aumento em sua visibilidade por qualquer ação é reduzido em –1." },
            { "nex": 65, "nome": "Ele Me Ensina", "descricao": "Mais do que apenas uma força, o paranormal lentamente se torna uma voz, sussurrando segredos em sua mente. Escolha entre transcender ou receber o primeiro poder de uma trilha de ocultista que não a sua. Você precisa atender os pré-requisitos do poder." },
            { "nex": 99, "nome": "Tornamo-nos Um", "descricao": "Desabrochando em seu interior, o paranormal se manifesta como uma dádiva poderosa. Baseado no elemento com que tem afinidade, você recebe um dos poderes a seguir: Presente da Obsessão (Sangue), Presente do Tempo (Morte), Presente do Saber (Conhecimento) ou Presente do Espaço (Energia)." }
        ]
        }
    ],
  },

  /* ------------------------------------------------------------------------
     SOBREVIVENTE (homebrew) — classe "mundana" para personagens em NEX 0%.
     nexBase: 0  → diz ao app.js que os valores de "base" desta classe já
     correspondem ao NEX 0%, e não ao NEX 5% como nas outras 3 classes.
     escalaAtributoPorNex: false → nas outras classes, cada aumento de NEX
     soma DE NOVO o atributo (Vigor/Presença) ao PV/PE, além do valor fixo
     "porNex" (assim funciona o livro para Combatente/Especialista/Ocultista).
     Na sua homebrew de Sobrevivente, o texto diz só "+2 PV" e "+1 PE" por
     estágio, sem somar o atributo de novo — por isso este flag desliga
     esse comportamento só para esta classe.
     ------------------------------------------------------------------------ */
  sobrevivente: {
    nome: "Sobrevivente",
    mundano: true,   // classe "mundana": usa Estágio (1–5) em vez de NEX%, e é travada em nexMax até o jogador fazer Treinamento Especial (trocar de classe)
    nexMax: 20,       // último estágio (5) = NEX 20% internamente
    nexBase: 0,
    escalaAtributoPorNex: false,
    resumo: "Uma pessoa comum, com uma ocupação regular — mas essa normalidade não vai durar muito.",
    pv: { base: 10, porNex: 2 },   // PV inicial = 10+VIGOR; a cada estágio +2
    pe: { base: 3, porNex: 1 },    // PE inicial = 3+PRESENÇA; a cada estágio +1
    san: { base: 10, porNex: 2 },  // SAN inicial = 10; a cada estágio +2
    pd: { base: 4, porNex: 2 },    // PD inicial = 4+PRESENÇA; a cada estágio +2 (regra opcional)
    proficiencias: "Nenhuma proficiência especial (a menos que a origem conceda alguma).",
    periciasIniciaisTexto: "2 + Intelecto perícias à escolha. Além disso, todo Sobrevivente escolhe uma das habilidades gerais abaixo (na aba Habilidades) e começa com um Poder Geral.",

    tabelaNex: [
      { nex: 0,  tipo: "fixo",   texto: "Empenho: gaste 1 PE para receber +2 em um teste de perícia." },
      { nex: 5,  tipo: "trilha", texto: "Escolha uma trilha (Durão, Esperto ou Esotérico) e recebe o 1º poder dela." },
      { nex: 10, tipo: "fixo",   texto: "Aumento de Atributo: +1 em um atributo à escolha." },
      { nex: 15, tipo: "trilha", texto: "Recebe o 2º (e último) poder da trilha escolhida." },
      { nex: 20, tipo: "fixo",   texto: "Cicatrizado: escolha um elemento de perigo paranormal já enfrentado; sofre –O em resistência contra ele, mas 1x/sessão pode sacrificar 1 PV perm. para ignorar dano mental/gasto de PE, ou 1 PE perm. para reduzir dano físico à metade." },
    ],

    // "Poder Geral" inicial (escolha 1) + Poder Geral mundano avulso — usados
    // através do mesmo seletor de poderes de classe da aba Habilidades.
    poderes: [
      { nome: "Saúde Aprimorada", preRequisito: null, grupoUnico: "aprimoramento", descricao: "Habilidade inicial (escolha 1 entre as 4). Você recebe +5 PV iniciais." },
      // "grupoUnico": a ficha só pode ter UM poder de cada grupo (o
      // aprimoramento inicial do sobrevivente é uma escolha única).
      // "regra": só existe na regra de recursos indicada — "pesan" (PE e
      // Sanidade) ou "pd" (Pontos de Determinação, onde os dois viram um só).
      { nome: "Sanidade Aprimorada", preRequisito: null, grupoUnico: "aprimoramento", regra: "pesan", descricao: "Habilidade inicial (escolha 1 entre as 4). Você recebe +5 SAN iniciais." },
      { nome: "Esforço Aprimorado", preRequisito: null, grupoUnico: "aprimoramento", regra: "pesan", descricao: "Habilidade inicial (escolha 1 entre as 4). Você recebe +5 PE iniciais." },
      { nome: "Determinação Aprimorada", preRequisito: null, grupoUnico: "aprimoramento", regra: "pd", descricao: "Habilidade inicial (escolha 1 entre as 3). Você recebe +3 PD iniciais." },
      { nome: "Treinamento Aprimorado", preRequisito: null, grupoUnico: "aprimoramento", descricao: "Habilidade inicial (escolha 1 entre as 4). Você recebe uma quantidade de perícias treinadas igual ao seu Intelecto." },
    ],

    trilhas: [
      {
        id: "durao",
        nome: "Durão",
        descricao: "Um indivíduo resistente, que consegue defender a si mesmo ou aos outros em situações de perigo — atleta, segurança, trabalhador da construção civil etc.",
        // pvBonusPorEstagio: bônus de PV fixo concedido por esta trilha, somado
        // por cima da progressão normal da classe, acumulado conforme o
        // Estágio atual (chaves = nº do Estágio, valores = PV ganho naquele
        // Estágio). Aqui: +4 PV ao entrar no Estágio 2 (quando escolhe a
        // trilha) e mais +2 PV ao chegar no Estágio 3 — não tem relação com
        // NEX real, é só a numeração do Estágio (1 a 5) do Sobrevivente.
        pvBonusPorEstagio: { 2: 4, 3: 2 },
        poderes: [
          { nex: 5,  nome: "Durão", descricao: "Você recebe +4 PV. Quando subir para o 3º estágio, recebe +2 PV adicionais." },
          { nex: 15, nome: "Pancada Forte", descricao: "Quando faz um ataque, pode gastar 1 PE para receber +O no teste de ataque. Se se tornar um combatente, perde esta habilidade, mas reduz o custo de ativação de Ataque Especial em –1 PE." },
        ],
      },
      {
        id: "esperto",
        nome: "Esperto",
        descricao: "Estudante, técnico, engenheiro ou outra pessoa equipada com conhecimento, inteligência e persuasão.",
        poderes: [
          { nex: 5,  nome: "Esperto", descricao: "Você se torna treinado em uma perícia adicional à sua escolha." },
          { nex: 15, nome: "Entendido", descricao: "Escolha duas perícias treinadas (exceto Luta e Pontaria). Ao testar uma delas, pode gastar 1 PE para somar +1d4 no resultado. Se se tornar um especialista, perde esta habilidade, mas reduz o custo de ativação de Perito em –1 PE." },
        ],
      },
      {
        id: "esoterico",
        nome: "Esotérico",
        descricao: "Uma pessoa ligada a aspectos espirituais do mundo (religiões, astrologia, cartomancia) ou que possui um sexto sentido em relação ao paranormal e ao Outro Lado.",
        // pvSubstituiProgressao: nerf desta trilha — em vez de ganhar o PV
        // normal de estágio da classe (+2 por Estágio, escalando com todos os
        // Estágios), o Esotérico ganha só +1 PV fixo ao entrar no Estágio 2 e
        // +1 PV fixo ao entrar no Estágio 5 (chaves = nº do Estágio). Isso
        // SUBSTITUI totalmente a progressão normal de PV da classe, só para
        // quem está nesta trilha.
        pvSubstituiProgressao: { 2: 1, 5: 1 },
        poderes: [
          { nex: 5,  nome: "Esotérico", descricao: "Pode gastar uma ação padrão e 1 PE para sentir energias paranormais em alcance curto. O mestre dirá quais informações você consegue obter, se houver." },
          { nex: 15, nome: "Iniciado", descricao: "Você aprende e pode conjurar um ritual de 1º círculo à sua escolha. Se se tornar um ocultista, soma este ritual aos três que aprende com Escolhido pelo Outro Lado." },
        ],
      },
    ],
  },
};

// Homebrew: as trilhas Caçador e Monstruoso (de combatente) também podem ser
// escolhidas por Especialistas (Agente Secreto já está nas duas listas).
CLASSES.especialista.trilhas.push(
  ...CLASSES.combatente.trilhas.filter(t => ["cacador", "monstruoso"].includes(t.id))
);


/* --------------------------------------------------------------------------
   5. PODERES PARANORMAIS (obtidos ao Transcender / poder de ocultista, custam Sanidade)
   -------------------------------------------------------------------------- */
const PODERES_PARANORMAIS = [
  {
    "nome": "Adrenalina",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "+1 PE temporário ao sofrer corte/perfuração",
    "descricao": "A dor de ter sua carne machucada de forma extrema lhe deixa eufórico. Você recebe 1 PE temporário toda vez que sofre dano de corte ou perfuração.\nAfinidade: Você passa a receber 1 PE temporário e 1 PV temporário toda vez que é alvo de qualquer dano físico que te acerte, mesmo que tenha reduzido esse dano a zero.\nPré-requisito:  Sangue 1."
  },
  {
    "nome": "Anatomia Insana",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "50% de chance de ignorar dano crítico/furtivo",
    "descricao": "O seu corpo é transfigurado e parece desenvolver um instinto próprio separado da sua consciência. Você tem 50% de chance (resultado par em 1d4) de ignorar o dano adicional de um acerto crítico ou ataque furtivo.\nPré-requisito: Sangue 2.\nAfinidade: você é imune aos efeitos de acertos críticos e ataques furtivos."
  },
  {
    "nome": "Arma de Sangue",
    "elemento": "Sangue",
    "custoSAN": null,
    "descricao": "O Sangue devora parte de seu corpo e se manifesta como parte de você. Você pode gastar uma ação de movimento e 2 PE para produzir garras, chifres ou uma lâmina de sangue cristalizado que brota de seu antebraço. Qualquer que seja sua escolha, é considerada uma arma simples, corpo a corpo e leve, que você não precisa empunhar e causa 1d10 pontos de dano de Sangue, que aumenta para 1d12+2 quando estiver machucado, com crítico 20/x2. Uma vez por turno, quando você usa a ação agredir, pode gastar 1 PE para fazer um ataque adicional com essa arma, ou pode gastar 2 PE para recuperar PVs equivalentes ao dano dado. Essas duas habilidades podem ser usadas em conjunto.  A arma dura até o final da cena, e então se desfaz numa poça de sangue coagulado.\nAfinidade: A arma se torna permanentemente parte de você. O crítico se torna 18, o dano base aumenta para 1d12+2, e quando estiver machucado o dano base aumenta para 2d10+1. Ao acertar um ataque, você pode gastar 2 PE para fincar a arma de sangue no alvo, que, após uma rodada, explode em sangue, causando 4d8 de dano de Sangue. Após usar essa habilidade, a arma entra em estado de regeneração e não pode ser usada por 2 rodadas."
  },
  {
    "nome": "Armadura Viva",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "RD 2 a dano físico (+1 por poder de Sangue)",
    "descricao": "Camadas de quitina surgem logo abaixo da última cada da sua pele, tornando-a grossa e rígida, e a sua pele se torna parecida como uma armadura. Você recebe RD 2 para dano físico, aumentando em +1 para cada poder paranormal de Sangue que tiver.\nAfinidade: A RD aumenta para 5."
  },
  {
    "nome": "Carapaça Espinhenta",
    "elemento": "Sangue",
    "custoSAN": null,
    "descricao": "Uma vez por cena, quando for o alvo de um ataque corpo a corpo, você pode gastar uma reação defensiva e 5 PVs para invocar espinhos que saem de sua pele e perfuram o atacante, fazendo com que ele receba metade do dano físico total causado a você na cena como dano de Sangue. Você pode escolher deixar o alvo agarrado nos seus espinhos durante uma rodada, à sua escolha.\nAfinidade: Você pode usar essa reação múltiplas vezes por cena. No entanto, em vez do normal, o alvo passa a sofrer metade do dano que ele causa no ataque à você."
  },
  {
    "nome": "Espreitar da Besta",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "+5 em Furtividade (Afinidade: +10)",
    "descricao": "O Sangue do Outro Lado deu a você o poder de controlar seu corpo e se mover exatamente como as bestas predadoras fazem. Você recebe +5 em Furtividade. Em cenas de perseguição (p. 90), se for o caçador, pode usar Furtividade em vez de Atletismo. Em cenas de furtividade (p. 92), seus movimentos são calculados pelos seus instintos, o que permite que faça ações discretas sem sofrer –O de penalidade.\nAfinidade: o bônus em Furtividade aumenta para +10."
  },
  {
    "nome": "Instintos Sanguinários",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "Visão no escuro e faro",
    "descricao": "Ao se conectar com o Sangue do Outro Lado, você desperta instintos animalescos paranormais. Você recebe visão no escuro e faro.\nAfinidade: seus instintos aguçados transformam o terror da perseguição em uma tempestade viciante de adrenalina. Você não pode mais ser flanqueado, não fica desprevenido e recebe +5 em testes de resistência contra armadilhas da realidade ou paranormais."
  },
  {
    "nome": "Sangue de Ferro",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "+2 PV por NEX",
    "descricao": "O seu sangue flui de forma paranormal e agressiva, concedendo vigor não natural. Você recebe +2 pontos de vida por NEX. Quando sobe de NEX, os PV que recebe por este poder aumentam de acordo. Por exemplo, se escolher este poder em NEX 50%, recebe 20 PV. Quando subir para NEX 55%, recebe +2 PV, e assim por diante.\nAfinidade: você recebe +5 em Fortitude e se torna imune a venenos e doenças."
  },
  {
    "nome": "Sangue Fervente",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "+1 em Agilidade ou Força quando machucado",
    "descricao": "A intensidade da dor desperta em você sentimentos bestiais e prazerosos que você nem imaginava que existiam. Enquanto estiver machucado, você recebe +1 em Agilidade ou Força, à sua escolha (escolha sempre que este efeito for ativado).\nPré-requisito: Sangue 2.\nAfinidade: o bônus que você recebe em Agilidade ou Força aumenta para +2."
  },
  {
    "nome": "Sangue Prazeroso",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "RD 5 quando machucado",
    "descricao": "Sua conexão com o Sangue permite que você resista a dor apenas para que consiga sentir ela por mais tempo. Enquanto estiver machucado, você recebe resistência a dano 5.\nAfinidade: Na primeira vez que entrar no estado de machucado em uma cena, você recebe +20 PV temporários até o fim da cena.\nPré-requisito:  Sangue 1."
  },
  {
    "nome": "Sangue Vivo",
    "elemento": "Sangue",
    "custoSAN": null,
    "bonus": "Cura acelerada 2 enquanto machucado",
    "descricao": "A carnificina não pode parar, o Sangue precisa continuar fluindo. Sempre que estiver machucado, você recebe cura acelerada 2 (veja a página 179) — este poder pode ativar várias vezes por cena. Esse efeito nunca cura você acima da metade dos PV máximos (ou seja, você nunca deixa de estar machucado) e termina no fim da cena ou caso você perca a condição machucado.\nPré-requisito: Sangue 1.\nAfinidade: a cura acelerada aumenta para 5."
  },
  {
    "nome": "Absorver Conhecimento",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "descricao": "Você se conecta com o Conhecimento do Outro Lado para adquirir informação de forma paranormal, sem precisar gastar tempo de pesquisa. Se estiver empunhando uma fonte de conhecimento escrito (como um livro, um texto aberto em um celular ou uma pedra de runas), você pode gastar 1 PE e uma ação completa para fazer uma pergunta a esta fonte. Se a resposta estiver armazenada na fonte, você a obtém automaticamente. Se usar este poder em conjunto com a ação de interlúdio ler, você aumenta o dado de bônus recebido por esta ação em um passo (de d6 para 1d8, por exemplo).\nAfinidade: quando usa um ritual de Conhecimento que tenha como alvo 1 pessoa (exceto você), se puder tocar o alvo o custo desse ritual é reduzido em –1 PE."
  },
  {
    "nome": "Apatia Herege",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "descricao": "Saber tudo é perder tudo. Contudo, não se deve subestimar a capacidade de adaptação humana. Ao se conectar com o Conhecimento do Outro Lado, você usa as experiências grotescas que já viveu para desligar suas emoções e blindar sua mente. Quando faz um teste contra uma condição de medo, você pode gastar 2 PE para rolar o teste novamente. Você deve aceitar o resultado da segunda rolagem, mesmo que seja menor que a primeira.\nPré-requisito: Conhecimento 1.\nAfinidade: você pode usar esse poder depois de saber se passou no teste, além de poder escolher a melhor rolagem entre as duas."
  },
  {
    "nome": "Expansão de Conhecimento",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "descricao": "Você se conecta com o Conhecimento do Outro Lado, rompendo os limites de sua compreensão. Você aprende um poder de classe que não pertença à sua classe (caso o poder possua pré-requisitos, você precisa preenchê-los).\nPré-requisito: Conhecimento 1.\nAfinidade: você aprende um segundo poder de classe que não pertença à sua classe."
  },
  {
    "nome": "Faça Eles Sentirem",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "bonus": "Dano de Conhecimento = Sanidade perdida",
    "descricao": "Eles que deviam estar sofrendo o que você sofreu. Uma vez por cena, você escolhe um alvo para sofrer dano de Conhecimento igual à sua perda de Sanidade (máxima - atual).\nAfinidade: Você pode usar esse poder duas vezes por cena."
  },
  {
    "nome": "Infecção Gnóstica",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "bonus": "+1d4+1 de dano de Conhecimento por aliado afetado",
    "descricao": "Você absorve o sofrimento daqueles ao seu ao redor. Para cada ser na cena que ficar Perturbado, Enlouquecendo ou Insano, você recebe um bônus de 1d4+1 de dano de Conhecimento, com limite de dados igual à sua Presença ou Intelecto, oque for maior.\nAfinidade: Você passa a receber +1d6 de dano de Conhecimento em seus ataques a cada 5 pontos de dano mental sofridos em uma cena."
  },
  {
    "nome": "Percepção Paranormal",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "descricao": "O Conhecimento sussurra em sua mente. Em cenas de investigação, sempre que fizer um teste para procurar pistas, você pode rolar novamente um dado com resultado menor que 10. Você deve aceitar a segunda rolagem, mesmo que seja menor que a primeira.\nAfinidade: você pode rolar novamente até dois dados com resultado menor que 10."
  },
  {
    "nome": "Precognição",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "bonus": "+5 em Defesa e testes de resistência",
    "descricao": "Você possui um “sexto sentido” que o avisa do perigo antes que ele aconteça. Você recebe +5 em Defesa e em testes de resistência.\nAfinidade: Você fica imune à condição desprevenido e recebe +5 em Iniciativa."
  },
  {
    "nome": "Sensitivo",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "bonus": "+5 em Diplomacia, Intimidação e Intuição",
    "descricao": "Você consegue sentir as emoções e intenções de outros seres, como medo, raiva ou malícia, recebendo +5 em testes de Diplomacia, Intimidação e Intuição.\nAfinidade: quando você faz um teste oposto usando uma dessas perícias, o oponente sofre –O."
  },
  {
    "nome": "Versatilidade Amplificada",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "descricao": "Você avança um nível de trilha OU escolhe uma terceira trilha para seu personagem, à sua escolha. Na ficha: em Habilidades → Trilhas, deixe a 3ª trilha vazia para avançar um nível na trilha secundária, ou escolha uma 3ª trilha."
  },
  {
    "nome": "Visão do Oculto",
    "elemento": "Conhecimento",
    "custoSAN": null,
    "bonus": "+5 em Percepção; visão no escuro",
    "descricao": "Você não enxerga mais pelos olhos, mas sim pela percepção do Conhecimento em sua mente. Você recebe +5 em testes de Percepção e enxerga no escuro.\nAfinidade: você ignora camuflagem."
  },
  {
    "nome": "Afortunado",
    "elemento": "Energia",
    "custoSAN": null,
    "descricao": "A Energia considera resultados medíocres entediantes. Uma vez por rolagem, você pode rolar novamente um resultado 1 em qualquer dado que não seja d20.\nAfinidade: além disso, uma vez por teste, você pode rolar novamente um resultado 1 em d20."
  },
  {
    "nome": "Campo Protetor",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "+5 em Defesa (ao esquivar, 1 PE)",
    "descricao": "Você consegue gerar um campo de Energia que o protege de perigos. Quando usa a ação esquiva, você pode gastar 1 PE para receber +5 em Defesa.\nPré-requisito: Energia 1.\nAfinidade: quando usa este poder, você também recebe +5 em Reflexo e, até o início de seu próximo turno, se passar em um teste de Reflexo que reduziria o dano à metade, em vez disso não sofre nenhum dano."
  },
  {
    "nome": "Causalidade Fortuita",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "–5 na DT para procurar pistas",
    "descricao": "A Energia o conduz rumo a descobertas. Em cenas de investigação, a DT para procurar pistas diminui em –5 para você até você encontrar uma pista.\nAfinidade: a DT para procurar pistas sempre diminui em –5 para você."
  },
  {
    "nome": "Conexão Empática",
    "elemento": "Energia",
    "custoSAN": null,
    "descricao": "Você consegue usar a Energia do Outro Lado para se conectar com objetos tecnológicos energizados. Você pode gastar uma ação completa e 2 PE para tocar um objeto elétrico que esteja ligado, como um celular, uma batedeira ou uma máquina de lavar roupa. Até o fim da cena, ou até deixar de tocá-lo, você pode conversar com o objeto como se ele fosse um ser senciente, e de algum jeito consegue escutar respostas. Um objeto tem percepção limitada de seus arredores, e sua personalidade e memórias são definidas apenas pelos arquivos ou programas que contém registrado em si; um objeto não tem lembranças do que ocorreu em seus arredores a não ser que tenha uma câmera e arquivos de vídeo em seu sistema, por exemplo. O objeto possui uma atitude inicial indiferente, mas pode ser persuadido com testes de Diplomacia (objetos normalmente têm Vontade 1, mas objetos particularmente sofisticados ou protegidos podem ter Vontade 2 ou 3, a critério do mestre). Apenas você é capaz de “ouvir” o objeto e precisa falar em voz alta para que ele te “escute”. Quando o efeito termina, o item emite um lamento enquanto experimenta uma sensação traumática de morte; se você tentar falar novamente com ele, sua atitude será hostil devido ao sofrimento ao qual foi exposto.\nPré-requisito: Energia 1.\nAfinidade: você recebe +5 em testes de perícias baseadas em Intelecto ou Presença com o item."
  },
  {
    "nome": "Fotossíntese",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "Cura acelerada 1 (sob sol/Luz)",
    "descricao": "Sua pele passa a canalizar fontes de energia que o sustentam de pé. Ao estar exposto a uma fonte de sol ou o ritual Luz, você recebe cura acelerada 1.\nAfinidade: Seu corpo passa a se nutrir majoritariamente por luz solar. A cura acelerada sob o efeito de Fotossíntese aumenta para 2. Além disso, você demora mais para sofrer efeitos de fome e sono caso tenha se exposto ao sol nesse dia - mecanicamente, você tem direito aos efeitos de uma ação de Interlúdio à sua escolha entre Alimentar-se, Dormir e Relaxar durante longos períodos de exposição ao sol como em uma viagem, mesmo que não tenha parado para descansar."
  },
  {
    "nome": "Golpe de Sorte",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "+1 na margem de ameaça",
    "descricao": "Seus ataques recebem +1 na margem de ameaça.\nPré-requisito: Energia 1.\nAfinidade: seus ataques recebem +1 no multiplicador de crítico."
  },
  {
    "nome": "Inércia",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "+3m de deslocamento",
    "descricao": "Quando as forças da Energia agem sobre um ser, é improvável que ele fique parado. Seu deslocamento aumenta em 3 metros.\nAfinidade: Ganha +1.5 metros, totalizando 4.5m."
  },
  {
    "nome": "Manipular Entropia",
    "elemento": "Energia",
    "custoSAN": null,
    "descricao": "Nada diverte mais a Energia do que a possibilidade de um desastre ainda maior. Quando outro ser em alcance curto faz um teste de perícia, você pode gastar 2 PE para fazê-lo rolar novamente um dos dados desse teste.\nPré-requisito: Energia 1.\nAfinidade: o alvo rola novamente todos os dados que você escolher."
  },
  {
    "nome": "Mão Espectral",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "Mão extra livre (Afinidade: +2 Percepção e Defesa)",
    "descricao": "A energia te concede um novo amigo, uma mão fantasmagórica que parece ter consciência própria. A mão se torna parte de você permanentemente e pode realizar suas próprias ações a vontade dela. Você pode esconder e mostrar ela como ação livre, de acordo com o humor da mão, além de poder agarrar objetos em até 3m de distância. Em termos de regras, você ganha uma mão livre extra. A mão não tem voz e se comunica através de gestos.\nAfinidade: Você também recebe +2 de Percepção e Defesa.\nEsse poder também pode ser um poder paranormal de Conhecimento."
  },
  {
    "nome": "Presságio",
    "elemento": "Energia",
    "custoSAN": null,
    "bonus": "+1d20 acumulável (Afinidade: +2d20)",
    "descricao": "Você sente a ramificação no destino quando suas ações criam novas possibilidades, como um “sexto sentido”. Toda vez que você fizer uma ação drástica ou arriscada que muda completamente a história de uma sessão, você é recompensado pela Energia e recebe +1d20 para “guardar” que pode ser usado em qualquer teste à sua escolha. Esse bônus é cumulativo e deve ser separado entre testes; ou seja, caso ative o gatilho e ainda não tenha usado o +1d20, você recebe +1d20 adicional. Você pode ter um máximo de d20 acumulados igual a sua Presença ou igual a quantidade de Poderes Paranormais de Energia que você tiver, o que for maior.\nAfinidade: O bônus aumenta para +2d20."
  },
  {
    "nome": "Valer-se do Caos",
    "elemento": "Energia",
    "custoSAN": null,
    "descricao": "Você pode tentar manipular o caos do mundo ao seu redor, um ato que fornece grande poder às custas da ordem de sua mente. Quando faz um teste, você pode escolher tentar controlar o caos. Se fizer isso, você recebe +O nesse teste. Entretanto, se o teste for uma falha, ou se o resultado desse d20 adicional (use um dado de cor diferente para identificá-lo) for igual ou menor que 5, você perde 1d4 pontos de Sanidade.\nAfinidade: você perde Sanidade se o teste for uma falha ou se o resultado do O extra for 1 ou 2."
  },
{
    "nome": "Antecipar Vitalidade",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "Sua ligação com a Morte permite que você sacrifique sua vitalidade futura para auxiliar seu presente. Quando faz um teste, você pode acumular uma carga de antecipação para adicionar +O a esse teste. Você pode acumular um máximo de cargas de antecipação igual ao seu Vigor. Enquanto tiver uma carga de antecipação, em sua próxima ação de interlúdio dormir em vez de recuperar pontos de vida você perde uma dessas cargas.\nAfinidade: você amplia sua capacidade de sacrificar o presente pelo futuro. O limite de cargas de antecipação que você pode acumular aumenta em +2 e você passa a perder 2 cargas por ação dormir."
  },
  {
    "nome": "Aura de Pavor",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "Ao receber esse poder, você é tomado por uma aura de Morte que nunca mais o abandona. Do ponto de vista dos outros, é como se o mundo ao seu redor perdesse as cores e se tornasse mais opressor. Você pode gastar 2 PE e uma ação de movimento para deixar uma pessoa ou animal em alcance médio apavorado (Vontade DT Pre reduz para abalado). O alvo não precisa ser capaz de ver você. Esta condição termina ao fim da cena, se o alvo se afastar de você além de alcance médio ou se você usar este efeito em outro alvo. Uma mesma pessoa ou animal só pode sofrer o efeito deste poder uma vez por dia.\nAfinidade: a DT para resistir ao poder aumenta em +5 e o número de alvos muda para quaisquer pessoas ou animais escolhidos no alcance."
  },
  {
    "nome": "Consumir Entropia",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "A Morte sussurra nos espaços entre os segundos, e você aprendeu a beber do desgaste inevitável do mundo. Oportunidades premeditadas e vidas desperdiçadas; você não vai deixar elas irem em vão. Sempre que um ser é finalizado em alcance curto, você absorve seu tempo desperdiçado, recuperando metade dos seus PVs máximos ou 2d8 PEs, à sua escolha.\nAfinidade: Quando esse poder é ativado, você também passa a recuperar uma ação padrão naquele turno."
  },
  {
    "nome": "Curado pelo Tempo",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "Não há nada que o tempo não cura. Uma vez por cena, você pode gastar uma ação padrão para se concentrar na espiral infinita da Morte na sua mente, removendo todas as condições negativas que você esteja sobre efeito (exceto enlouquecendo, morrendo, perturbado e machucado).\nAfinidade: Muda para duas vezes por cena.\nPré-requisito: Morte 1."
  },
  {
    "nome": "Encarar a Morte",
    "elemento": "Morte",
    "custoSAN": null,
    "bonus": "+1 no limite de PE por rodada (Afinidade: +2)",
    "descricao": "Sua conexão com a Morte faz com que você não hesite em situações de perigo. Durante cenas de ação, seu limite de gasto de PE aumenta em +1 (isso não afeta a DT de seus efeitos).\nAfinidade: durante cenas de ação, seu limite de gasto de PE aumenta em +2 (para um total de +3)."
  },
  {
    "nome": "Escapar da Morte",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "A Morte tem um interesse especial em sua caminhada. Uma vez por cena, quando receber dano que o deixaria com 0 PV, você fica com 1 PV. Não funciona em caso de dano massivo.\nPré-requisito: Morte 1.\nAfinidade: em vez do normal, você evita completamente o dano. Em caso de dano massivo, você fica com 1 PV."
  },
  {
    "nome": "Potencial Aprimorado",
    "elemento": "Morte",
    "custoSAN": null,
    "bonus": "+1 PE por NEX",
    "descricao": "A Morte lhe concede potencial latente de momentos roubados de outro lugar. Você recebe +1 ponto de esforço por NEX. Quando sobe de NEX, os PE que recebe por este poder aumentam de acordo. Por exemplo, se escolher este poder em NEX 30%, recebe 6 PE. Quando subir para NEX 35%, recebe +1 PE adicional, e assim por diante.\nAfinidade: você recebe +1 PE adicional por NEX (para um total de +2 PE por NEX)."
  },
  {
    "nome": "Potencial Reaproveitado",
    "elemento": "Morte",
    "custoSAN": null,
    "bonus": "+2 PE temporários por resistência bem-sucedida",
    "descricao": "Você absorve os momentos desperdiçados de outros seres. Uma vez por rodada, quando passa num teste de resistência, você ganha 2 PE temporários cumulativos. Os pontos desaparecem no final da cena.\nAfinidade: você ganha 3 PE temporários, em vez de 2."
  },
  {
    "nome": "Surto Temporal",
    "elemento": "Morte",
    "custoSAN": null,
    "descricao": "A sua percepção temporal se torna distorcida e espiralizada, fazendo com que a noção de passagem do tempo nunca mais seja a mesma para você. Uma vez por cena, durante seu turno, você pode gastar 3 PE para realizar uma ação padrão adicional.\nPré-requisito: Morte 2.\nAfinidade: em vez de uma vez por cena, você pode usar este poder uma vez por turno."
  },
  {
    "nome": "Tempo Aproveitado",
    "elemento": "Morte",
    "custoSAN": null,
    "bonus": "+1 ação em interlúdios",
    "descricao": "Você aproveita melhor cada segundo que passa na sua vida. Você recebe +1 ação em interlúdios.\nAfinidade: Você recebe +1 ação em interlúdios (totalizando +2). Além disso, relaxar recupera +2 pontos de Sanidade adicionais."
  }
];


/* --------------------------------------------------------------------------
   6. RITUAIS
   "elemento": Sangue, Morte, Conhecimento, Energia, Medo, Fúria (ajuste como preferir).
   "circulo": 1 a 4.
   "execucao": "ação padrão", "ação completa", "reação", "1 minuto"...
   -------------------------------------------------------------------------- */
const RITUAIS = [
  {
    "id": "alterar-destino",
    "nome": "Alterar Destino",
    "elemento": "Energia",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "Reação",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você vislumbra seu futuro próximo, analisando milhões de possibilidades e escolhendo a melhor. Você recebe +15 em um teste de resistência ou na Defesa contra um ataque.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para “curto” e o alvo para “um aliado à sua escolha”."
  },
  {
    "id": "alterar-memoria",
    "nome": "Alterar Memória",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "Instantânea",
    "resistencia": "Vontade anula",
    "descricao": "Você invade a mente do alvo e altera ou apaga suas memórias de até uma hora atrás. Se escolher alterar as memórias, você pode mudar detalhes de eventos recentes, como a identidade de alguém encontrado ou o endereço de um lugar visitado, mas não reescrever completamente esses eventos. O alvo recupera suas memórias após 1d4 dias.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Você pode alterar ou apagar memórias de até 24 horas atrás. Requer 4º círculo."
  },
  {
    "id": "amaldicoar-arma-conhecimento",
    "nome": "Amaldiçoar Arma (Conhecimento)",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo ou pacote de munição",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o bônus de dano para +2d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus de dano para +4d6. Requer 3º círculo e afinidade."
  },
  {
    "id": "amaldicoar-arma-energia",
    "nome": "Amaldiçoar Arma (Energia)",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo ou pacote de munição",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o bônus de dano para +2d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus de dano para +4d6. Requer 3º círculo e afinidade."
  },
  {
    "id": "amaldicoar-arma-morte",
    "nome": "Amaldiçoar Arma (Morte)",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo ou pacote de munição",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o bônus de dano para +2d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus de dano para +4d6. Requer 3º círculo e afinidade."
  },
  {
    "id": "amaldicoar-arma-sangue",
    "nome": "Amaldiçoar Arma (Sangue)",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo ou pacote de munição",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o bônus de dano para +2d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus de dano para +4d6. Requer 3º círculo e afinidade."
  },
  {
    "id": "amaldicoar-tecnologia",
    "nome": "Amaldiçoar Tecnologia",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 acessório ou arma de fogo",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você imbui o alvo com Energia, fazendo-o funcionar acima de sua capacidade. O item recebe uma modificação a sua escolha.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda para duas modificações. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda para três modificações. Requer 3º círculo e afinidade."
  },
  {
    "id": "ancora-temporal",
    "nome": "Âncora Temporal",
    "elemento": "Morte",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Uma aura espiralada surge sobre o alvo. No início de cada turno dele, ele deve fazer um teste de Vontade. Se falhar, não poderá se deslocar naquele turno (ele ainda pode agir, só não pode se deslocar). Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Muda o alvo para “seres a sua escolha”. Requer 4º círculo."
  },
  {
    "id": "aprimorar-fisico",
    "nome": "Aprimorar Físico",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "O alvo tem seus músculos tonificados e seus ligamentos reforçados, recebendo +1 em Agilidade ou Força, à escolha dele.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o bônus para +2. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o bônus para +3. Requer 4º círculo e afinidade."
  },
  {
    "id": "aprimorar-mente",
    "nome": "Aprimorar Mente",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "O alvo tem sua mente energizada por fagulhos do Conhecimento. Ele recebe +1 em Intelecto ou Presença, à escolha dele (PE, perícias treinadas ou graus de treinamento).",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o bônus para +2. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o bônus para +3. Requer 4º círculo e afinidade."
  },
  {
    "id": "arma-atroz",
    "nome": "Arma Atroz",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "A arma é recoberta por veias carmesim e passa a exalar uma aura de violência. Ela fornece +2 em testes de ataque e +1 na margem de ameaça.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o bônus para +5 em testes de ataque. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus para +5 em testes de ataque e +2 na margem de ameaça e no multiplicador de crítico. Requer 3º círculo e afinidade."
  },
  {
    "id": "armadura-de-sangue",
    "nome": "Armadura de Sangue",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Seu sangue escorre para fora do corpo, cobrindo-o sob a forma de uma carapaça que fornece +5 em Defesa. Esse bônus é cumulativo com outros rituais, mas não com bônus fornecido por equipamento.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda o efeito para “fornece +10 na Defesa e resistência a balístico, corte, impacto e perfuração 5”. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o efeito para “fornece +15 na Defesa e resistência a balístico, corte, impacto e perfuração 10”. Requer 4º círculo e afinidade."
  },
  {
    "id": "canalizar-o-medo",
    "nome": "Canalizar o Medo",
    "elemento": "Medo",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "Permanente até ser descarregada",
    "resistencia": "Não possui",
    "descricao": "Você transfere parte de seu poder para outra pessoa. Escolha um ritual de até 3º círculo que você conheça; o alvo pode conjurar este ritual em sua forma básica uma vez, sem pagar seu custo em PE (mas pode usar formas avançadas gastando seus próprios PE para isso). Até o ritual transferido ser conjurado, seus PE máximos diminuem em um valor igual ao custo dele.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "capturar-o-coracao",
    "nome": "Capturar o Coração",
    "elemento": "Sangue",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Você desperta uma paixão doentia e obcecada por você no alvo, que passa a querar agradá-lo a todo custo, mesmo que para isso precise ficar contra seus amigos. No início de cada turno do alvo ele deve fazer um teste de Vontade. Se falhar, age de forma a ajudá-lo na melhor de suas capacidades naquele turno. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "chamas-do-caos",
    "nome": "Chamas do Caos",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "Veja texto",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você manipula o calor e o fogo. Ao conjurar o ritual, escolha um dos seguintes efeitos. Chamejar: o alvo é uma arma corpo a corpo. Ela causa +1d6 pontos de dano de fogo. Esquentar: o alvo é um objeto, que começa a esquentar. Ele sofre 1d6 pontos de dano de fogo por rodada e causa o mesmo dano a qualquer ser que o esteja empunhando ou vestindo. A critério do mestre, o objeto ou o ser pode pegar fogo. Um ser pode gastar uma ação completa para resfriar o objeto (jogando areia ou jogando-o numa fonte de água próxima, por exemplo) e cancelar o efeito do ritual. Extinguir: o alvo é uma chama de tamanho Grande ou menor, que é apagada. Isso cria uma nuvem de fumaça que ocupa uma esfera de 3m de raio centrada onde estava a chama. Dentro da fumaça, seres têm camuflagem leve. Modelar: o alvo é uma chama de tamanho Grande ou menor. A cada rodada, você pode gastar uma ação livre para movimentá-la 9m em qualquer direção. Se atravessar o espaço ocupado por um ser, ela causa 3d6 pontos de dano de fogo nele. Um ser só pode sofrer dano dessa maneira uma vez por rodada.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a duração para sustentada e adiciona “Resistência: Reflexos reduz à metade”. Em vez do normal, uma vez por rodada você pode gastar uma ação de movimento para projetar uma labareda, num alvo em alcance curto. O alvo sofre 4d6 pontos de dano de Energia (Reflexos reduz à metade).",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Como discente, mas muda o dano para 8d6. Requer 3º círculo."
  },
  {
    "id": "cicatrização",
    "nome": "Cicatrização",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você acelera o tempo ao redor das feridas do alvo, que cicatrizam instantaneamente. O alvo recupera 3d8+3 PV, mas envelhece 1 ano automaticamente.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Aumenta a cura para 5d8+5 PV. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o alcance para “curto”, o alvo para “seres escolhidos” e aumenta a cura para 7d8+7 PV. Requer 4º círculo e afinidade com Morte."
  },
  {
    "id": "cineraria",
    "nome": "Cinerária",
    "elemento": "Medo",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "nuvem de 6m de raio",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você manifesta uma névoa carregada de essência paranormal. Rituais conjurados dentro da névoa têm sua DT aumentada em +5.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, rituais conjurados dentro da névoa custam –2 PE.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Além do normal, rituais conjurados dentro da névoa causam dano maximizado."
  },
  {
    "id": "compreensao-paranormal",
    "nome": "Compreensão Paranormal",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser ou objeto",
    "duracao": "cena",
    "resistencia": "Vontade anula (veja texto)",
    "descricao": "O ritual confere a você compreensão sobrenatural da linguagem. Se tocar um objeto contendo informação (ou livro, um dispositivo com uma gravação…), você entende as palavras mesmo que não conheça seu idioma, contanto que se trate de um idioma humano (not funciona com símbolos ou sigilos paranormais). Se tocar uma pessoa, pode se comunicar com ela como se falassem um idioma em comum. Se tocar um ser não inteligente, como um animal, pode perceber seus sentimentos básicos, como medo ou felicidade. Um alvo involuntário tem direito a um teste de Vontade.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alcance para “curto” e o alvo para “alvos escolhidos”. Você pode entender todos os alvos afetados. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para “pessoal” e o alvo para “você”. Em vez do normal, você pode falar, entender e escrever qualquer idioma humano. Requer 3º círculo."
  },
  {
    "id": "conhecendo-o-medo",
    "nome": "Conhecendo o Medo",
    "elemento": "Medo",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "Instantânea",
    "resistencia": "Vontade parcial",
    "descricao": "Você manifesta medo absoluto na mente do alvo. Se ele falhar no teste de resistência, a Sanidade dele é reduzida a 0 e ele fica enlouquecendo. Se ele passar, sofre 10d6 pontos de dano mental e fica apavorado por 1 rodada. Uma pessoa que fique insana pelo efeito deste ritual se transforma em uma criatura paranormal a critério do mestre.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "consumir-manancial",
    "nome": "Consumir Manancial",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você suga uma pequena porção do tempo de vida de plantas, insetos e até mesmo do solo ao redor, gerando Lodo e recebendo 3d6 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda os PV temporários recebidos para 6d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para “área: esfera com 6m de raio centrada em você” e a resistência para “Fortitude reduz à metade”. Em vez do normal, você suga energia de todos os seres vivos na área, causando 3d6 pontos de dano de Morte em cada um e recebendo PV temporários iguais ao dano total causado até o final da cena. Requer 3º círculo e afinidade."
  },
  {
    "id": "contato-paranormal",
    "nome": "Contato Paranormal",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "1 dia",
    "resistencia": "Não possui",
    "descricao": "Você barganha com a entidade de Conhecimento para que o auxilie durante o dia, em troca de se alimentar de sua Sanidade. Quando o ritual é conjurado, você recebe seis d6. Sempre que fizer um teste de perícia, você pode gastar um desses d6, rolá-lo e adicionar o resultado no teste. No entanto, essa ajuda tem um preço: sempre que rolar um 6 no dado, a entidade toma 2 pontos de Sanidade de você. Se você ficar sem dados ou chegar a Sanidade 0, o ritual acaba.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda os dados de auxílio para d8. Sempre que rolar um 8 num desses dados, a entidade toma 3 pontos de sua Sanidade. Requer 4º círculo.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda os dados de auxílio para d12. Sempre que rolar um 12 num desses dados, a entidade toma 5 pontos de sua Sanidade. Requer 4º círculo e afinidade."
  },
  {
    "id": "contencao-fantasmagorica",
    "nome": "Contenção Fantasmagórica",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Reflexos anula",
    "descricao": "Três laços de Energia surgem do chão e se enroscam no alvo, deixando-o agarrado. O alvo pode tentar se livrar, gastando uma ação padrão para fazer um teste de Atletismo (DT do ritual). Se passar, destrói um laço, mais um laço adicional para cada 5 pontos pelos quais superou a DT. Os laços também podem ser atacados e destruídos: cada um tem Defesa 10, 10 PV, RD 5 e imunidade a Energia. Se todos os laços forem destruídos, o ritual é dissipado. Por serem feitos de Energia, os laços afetam criaturas incorpóreas.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Aumenta o número de laços para 6, e você pode escolher o alvo de cada laço, com um mínimo de dois laços por alvo. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Como discente, e cada laço destruído libera uma onda de choque que causa 2d6+2 pontos de dano de Energia no alvo agarrado. Requer 3º círculo e afinidade."
  },
  {
    "id": "controle-mental",
    "nome": "Controle Mental",
    "elemento": "Conhecimento",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 pessoa ou animal",
    "duracao": "Sustentada",
    "resistencia": "Vontade parcial",
    "descricao": "Você domina a mente do alvo, que obedece todos os seus comandos, exceto ordens suicidas. Um alvo tem direito a um teste de Vontade no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam pasmos por 1 rodada (apenas uma vez por cena).",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda o alvo para até cinco pessoas ou animais.",
    "adicionalPEVerdadeiro": 10,
    "descricaoPEVerdadeiro": "Muda o alvo para até dezoito pessoas ou animais. Requer afinidade com Conhecimento."
  },
  {
    "id": "convocacao-instantanea",
    "nome": "Convocação Instantânea",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "ilimitado",
    "alvo": "1 objeto de até 2 espaços",
    "duracao": "Instantânea",
    "resistencia": "Vontade anula",
    "descricao": "Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com o símbolo do ritual e pode ocupar no máximo 2 espaços. Se o objeto estiver sendo empunhado por outra pessoa, ela pode fazer um teste de Vontade para negar o efeito, mas você saberá onde o objeto está e quem o está carregando (ou sua aparência, caso não conheça a pessoa). Por até 1h depois da convocação, você pode gastar uma ação de movimento para enviar o objeto de volta para o local em que ele estava antes.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda o alvo para um objeto de até 10 espaços.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o alvo para “1 recipiente Médio (como uma mala ou caixote), com itens que somem até 10 espaços” e a duração para “permanente”. Em vez do normal, você encanta o recipiente para mantê-lo escondido no Outro Lado. Você pode convocar o recipiente para um espaço livre adjacente, ou de volta para o esconderijo paranormal, com uma ação padrão. Para isso, você deve ter em mãos uma miniatura do objeto, que funciona como um utensílio de categoria II. Quando conjura esta versão do ritual, você perde 1 PE permanentemente."
  },
  {
    "id": "convocar-o-algoz",
    "nome": "Convocar o Algoz",
    "elemento": "Morte",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "1,5m",
    "alvo": "1 pessoa",
    "duracao": "Sustentada",
    "resistencia": "Vontade parcial, Fortitude parcial",
    "descricao": "Usando os medos subconscientes do alvo, você manipula a espiral da Morte para criar uma imagem daquilo que ele mais teme. Apenas a própria vítima vê o algoz com nitidez; outros seres presentes (incluindo você) enxergam apenas um vulto sombrio. O algoz surge adjacente a você. No fim de cada turno seu, ele flutua 12m em direção à vítima. Se o algoz terminar o turno em alcance curto da vítima, ela deve fazer um teste de Vontade; se falhar, ficará abalada. Se o algoz terminar o turno adjacente à vítima, ela deve fazer um teste de Fortitude. Se falhar, sofre um colapso e fica com 0 PV. Se passar, sofre 6d6 pontos de dano de Morte (este dano não pode reduzir o alvo a menos de 1 PV). O algoz persegue o alvo implacavelmente, mesmo além do alcance do ritual. Ele é incorpóreo e imune a dano e só desaparece se deixar o alvo morrendo ou se for dissipado.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "corpo-adaptado",
    "nome": "Corpo Adaptado",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa ou animal",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Este ritual modifica a biologia do alvo para permitir a sobrevivência em ambientes hostis. O alvo fica imune a calor e frio extremos, pode respirar na água se respirar ar (ou vice-versa) e não sufoca em fumaça densa.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a duração para 1 dia.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para “curto” e o alvo para “pessoas ou animais escolhidos”."
  },
  {
    "id": "decadencia",
    "nome": "Decadência",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "Espirais de trevas envolvem sua mão e definham o alvo, que sofre 2d8+2 pontos de dano de Morte.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a resistência para “nenhuma” e o dano para 3d8+3. Como parte da execução do ritual, você transfere as espirais para uma arma e faz um ataque corpo a corpo contra o alvo com esta arma. Se acertar, causa o dano da arma e do ritual, somados.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para “pessoal” o alvo para “área: explosão com 6m de raio” e o dano para 8d8+8. As espirais afetam todos os seres na área. Requer 3º círculo."
  },
  {
    "id": "definhar",
    "nome": "Definhar",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Fortitude parcial",
    "descricao": "Você dispara uma lufada de cinzas que drena as forças do alvo. O alvo fica fatigado. Se passar no teste de resistência, em vez disso fica vulnerável.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Em vez do normal, o alvo fica exausto. Se passar na resistência, fica fatigado. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Como discente, mas muda o alvo para “até 5 seres”. Requer 3º círculo e afinidade com Morte."
  },
  {
    "id": "deflagracao-de-energia",
    "nome": "Deflagração de Energia",
    "elemento": "Energia",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "completa",
    "alcance": "pessoal",
    "area": "Explosão de 15m de raio",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você acumula uma quantidade imensa de Energia, então a libera em uma explosão intensa, como uma estrela em plena terra. Todos na área sofrem 3d10 x 10 pontos de dano de Energia e todos os itens tecnológicos (armas de fogo, acessórios e utensílios) param de funcionar (em termos de regras, estão quebrados). Você não é afetado pela explosão. Alvos que passem no teste de Fortitude sofrem metade do dano e seus itens voltam a funcionar após 1d4 rodadas.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Afeta apenas alvos a sua escolha."
  },
  {
    "id": "desacelerar-impacto",
    "nome": "Desacelerar Impacto",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "Reação",
    "alcance": "curto",
    "alvo": "1 ser ou objetos somando até 10 espaços",
    "duracao": "Até chegar ao solo ou cena, o que vier primeiro",
    "resistencia": "Não possui",
    "descricao": "O alvo cai lentamente. A velocidade da queda é reduzida para 18m por rodada — o suficiente para não causar dano. Como conjurar este ritual é uma reação, você pode conjurá-lo rápido o bastante para salvar a si ou um aliado de quedas inesperadas. Se o alvo for um projétil — como um disparo de arma ou um objeto largado do alto de um prédio —, o ritual faz com que ele cause metade do dano normal, devido à lentidão. Este ritual só funciona em alvos em queda livre ou similar; não pode frear um golpe de faca ou o mergulho rasante de um atacante voador.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Aumenta o total de alvos para seres ou objetos somando até 100 espaços."
  },
  {
    "id": "descarnar",
    "nome": "Descarnar",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Este ritual cruel faz com que lacerações se manifestem na pele e órgãos do alvo, que sofre 6d8 pontos de dano (metade corte, metade Sangue) e fica com uma hemorragia severa. No início de cada turno dele, o alvo deve fazer um teste de Fortitude. Se falhar, sofre 2d8 pontos de dano de Sangue. Se passar nesse teste dois turnos seguidos, a hemorragia é estancada. Alvos que passem no teste de resistência inicial sofrem metade do dano e não ficam com hemorragia.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o dano direto para 10d8 e o dano da hemorragia para 4d8. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alvo para você e a duração para sustentada. Enquanto o ritual durar, seus ataques corpo a corpo causam 4d8 pontos de dano de Sangue adicional e deixam o alvo com hemorragia automaticamente (como no efeito básico do ritual). O alvo ainda tem direito a um teste de Fortitude no início de seus turnos. Requer 3º círculo e afinidade."
  },
  {
    "id": "deteccao-de-ameacas",
    "nome": "Detecção de Ameaças",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "pessoal",
    "area": "esfera de 18m de raio",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você recebe uma percepção aguçada sobre perigos à sua volta. Quando um ser hostil ou armadilha entra na área do efeito, você tem uma sensação de perigo e pode gastar uma ação de movimento para fazer um teste de Percepção (DT 20). Se passar, sabe a direção e distância do perigo.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Além do normal, você não fica desprevenido contra perigos detectados e recebe +5 em testes de resistência contra armadilhas. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda a duração para “1 dia” e concede os mesmos benefícios de discente. Requer 4º círculo."
  },
  {
    "id": "dissipar-ritual",
    "nome": "Dissipar Ritual",
    "elemento": "Medo",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 ser ou objeto, ou esfera com 3m de raio",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você dissipa rituais ativos, como se a duração deles tivesse acabado. Efeitos de rituais instantâneos não podem ser dissipados (não se pode dissipar uma área de Paradoxo depois que já causou dano…). Faça um teste de Ocultismo; você anula quaisquer rituais ativos no alvo ou na área com DT igual ou menor que o resultado do teste. Você pode conjurar esse ritual em um item amaldiçoado para que se torne um item mundano (perdendo seus poderes) por um dia. Se o item estiver em posse de alguém, seu usuário pode fazer um teste de Vontade para negar o efeito.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "distorcao-temporal",
    "nome": "Distorção Temporal",
    "elemento": "Morte",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "Veja texto",
    "duracao": "Veja texto",
    "resistencia": "Não possui",
    "descricao": "Este ritual distorce o fluxo de tempo em relação a você, criando um pequeno bolsão temporal que dura 3 rodadas. Durante este tempo, você pode agir, mas não pode se deslocar do lugar nem interagir com seres e objetos. Da mesma forma, efeitos contínuos não o afetam, e quaisquer efeitos que você iniciar não afetarão a área ao seu redor. Efeitos de área com duração maior que este efeito vão agir normalmente quando o bolsão temporal acabar.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "distorcer-aparencia",
    "nome": "Distorcer Aparência",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Vontade desacredita",
    "descricao": "Você modifica sua aparência de modo a parecer outra pessoa. Isso inclui altura, peso, tom de pele, cor de cabelo, timbre de voz, impressão digital, córnea etc. Você recebe +10 em testes de Enganação para disfarce, mas não recebe habilidades da nova forma nem modifica suas demais estatísticas.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alcance para “curto” e o alvo para “1 ser”. Um alvo involuntária pode anular o efeito com um teste de Vontade.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Como em Discente, mas muda o alvo para “seres escolhidos”. Requer 3º círculo."
  },
  {
    "id": "eco-espiral",
    "nome": "Eco Espiral",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "2 rodadas",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "Você manifesta em suas mãos uma pequena cópia do alvo feita de cinzas. No início do próximo turno após conjurar este ritual, você precisa gastar uma ação padrão para se concentrar nele; caso contrário, ele se dissipa sem efeito. No início do segundo turno, você precisa gastar uma ação padrão para descarregá-lo. Se fizer isso, a cópia explode e o alvo sofre dano de Morte igual a quantidade de dano que sofreu na rodada em que você se concentrou (Fortitude reduz à metade). Se não fizer, o ritual se dissipa sem efeito.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alvo para “até 5 seres”.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda a duração para “até 3 rodadas”, permitindo que você se concentre nas duas primeiras e descarregue na terceira. Requer 4º círculo e afinidade."
  },
  {
    "id": "eletrocussao",
    "nome": "Eletrocussão",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser ou objeto",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você manifesta e dispara uma corrente elétrica contra o alvo, que sofre 3d6 pontos de dano de eletricidade e fica vulnerável por uma rodada. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição. Se usado contra objetos eletrônicos, este ritual causa o dobro de dano e ignora resistência.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alvo para “área: linha de 30m”. Você dispara um poderoso raio que causa 6d6 pontos de dano de Energia em todos os seres e objetos livres na área. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para “alvos escolhidos”. Em vez do normal, você dispara vários relâmpagos, um para cada alvo escolhido, causando 8d6 pontos de dano de Energia em cada. Requer 3º círculo."
  },
  {
    "id": "embaralhar",
    "nome": "Embaralhar",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você cria três cópias ilusórias suas, como hologramas extremamente realistas. As cópias ficam ao seu redor e imitam suas ações, tornando difícil para um inimigo saber quem é o verdadeiro. Você recebe +6 na Defesa. Cada vez que um ataque contra você erra, uma das imagens desaparece e o bônus na Defesa diminui em 2. Um oponente deve ver as cópias para ser confundido. Se você estiver invisível, ou o atacante fechar os olhos, você não recebe o bônus (mas o atacante sofre as penalidades normais por não enxergar).",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o número de cópias para 5 (e o bônus na Defesa para +10). Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o número de cópias para 8 (e o bônus na Defesa para +16). Além do normal, toda vez que uma cópia é destruída, emite um clarão de luz. O ser que destruiu a cópia fica ofuscado por uma rodada. Requer 3º círculo."
  },
  {
    "id": "esconder-dos-olhos",
    "nome": "Esconder dos Olhos",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "livre",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "1 rodada",
    "resistencia": "Não possui",
    "descricao": "Você fica invisível, incluindo seu equipamento, recebendo camuflagem total e +15 em testes de Furtividade. Como o normal, seres que não possam vê-lo ficam desprevenidos contra seus ataques. O efeito termina se você faz um ataque ou usa uma habilidade hostil. Ações contra objetos livres não dissipam Esconder dos Olhos (você pode tocar ou apanhar objetos que não estejam sendo segurados por outros seres). Causar dano indiretamente — por exemplo, preparar explosivos para detonar mais tarde — não é considerado um ataque. Objetos soltos voltam a ser visíveis e objetos apanhados por você ficam invisíveis. Luz transportada nunca fica invisível (mesmo que sua fonte esteja). Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a duração para “sustentada”. Em vez do normal, você gera uma esfera de invisibilidade. Você e todos os aliados a até 3m de você se tornam invisíveis, como no efeito normal do ritual (ainda ficam visíveis caso façam uma ação hostil). A esfera se move junto com você; qualquer coisa que saia da esfera fica visível. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda a execução para “ação padrão”, o alcance para “toque”, o alvo para “1 ser” e a duração para “sustentada”. O efeito não é dissipado caso o alvo faça um ataque ou ação hostil. Requer 4º círculo e afinidade."
  },
  {
    "id": "espirais-da-perdicao",
    "nome": "Espirais da Perdição",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Espirais surgem no corpo do alvo, tornando seus movimentos lentos. O alvo sofre –1d20 em testes de ataque.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a penalidade para –2d20. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 8,
    "descricaoPEVerdadeiro": "Muda a penalidade para –2d20. e o alvo para “seres escolhidos”. Requer 3º círculo."
  },
  {
    "id": "fim-inevitavel",
    "nome": "Fim Inevitável",
    "elemento": "Morte",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "completa",
    "alcance": "extremo",
    "area": "Buraco negro com 1,5m de diâmetro",
    "duracao": "4 rodadas",
    "resistencia": "Fortitude parcial",
    "descricao": "Você cria um vácuo em um espaço desocupado a sua escolha. No início de cada um de seus quatro turnos seguintes, todos os seres a até 90m do vácuo, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídas e são puxadas 30m na direção do vácuo. Objetos soltos também são puxados. Seres podem gastar uma ação de movimento para se segurar em algum objeto fixo, recebendo +5 em seus testes de resistência. Seres e objetos que iniciem seu turno tocando o vácuo temporal sofrem 100 pontos de dano de Morte por rodada.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda a duração para “5 rodadas” e o efeito para que você não seja afetado. Requer afinidade.",
    "adicionalPEVerdadeiro": 10,
    "descricaoPEVerdadeiro": "Muda a duração para “6 rodadas” e o efeito para que seres escolhidos dentro do alcance não sejam afetados. Requer afinidade."
  },
  {
    "id": "flagelo-de-sangue",
    "nome": "Flagelo de Sangue",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "cena",
    "resistencia": "Fortitude parcial",
    "descricao": "Você toca uma pessoa, gravando uma marca escarificada no corpo dela enquanto profere uma ordem, como “não ataque a mim ou meus aliados”, “siga-me” ou “não saia desta sala”. A cada rodada que o alvo desobedecer a ordem, a marca inflige uma dor excruciante, que causa 10d6 pontos de dano de Sangue e deixa o alvo enjoado pela rodada (Fortitude reduz o dano à metade e evita a condição). Se o alvo passar nesse teste dois turnos seguidos a marca desaparece.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alvo para “1 ser (exceto criaturas de Sangue)”. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Como Discente, e muda a duração para “1 dia”. Requer 4º círculo e afinidade."
  },
  {
    "id": "forma-monstruosa",
    "nome": "Forma Monstruosa",
    "elemento": "Sangue",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Seu corpo se transforma, assumindo uma forma que combina suas características com as de uma criatura de Sangue; suas roupas e proteção se mesclam à sua carne, transformando-se em uma couraça, e quaisquer objetos em suas mãos se fundem aos seus braços, transformando-se em garras pontiagudas. Seu equipamento fica inacessível, mas seus bônus se mantém. Seu tamanho muda para Grande e você recebe +5 em testes de ataque e rolagens de dano corpo a corpo e 30 PV temporários. Enquanto estiver transformado, sua mente é tomada por fúria selvagem; você não pode falar nem conjurar rituais e a cada rodada deve atacar o ser mais próximo possível. Se não houver um ser que possa atacar, deve se deslocar em direção ao ser mais próximo da melhor forma possível. Se o ser mais próximo for um aliado, você pode fazer um teste de Vontade (DT do ritual). Se passar, neste turno você pode escolher qual ser atacar.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Além do normal, você recebe imunidade a atordoamento, fadiga, sangramento, sono e veneno.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda os bônus em testes de ataque e rolagens de dano para +10 e os PV temporários para 50. Requer 4º círculo e afinidade."
  },
  {
    "id": "fortalecimento-sensorial",
    "nome": "Fortalecimento Sensorial",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você potencializa seus sentidos, recebendo +1 em Investigação, Luta, Percepção e Pontaria.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, seus inimigos sofrem –1 em testes de ataque contra você. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Além do normal, você apura seus sentidos para perceber perigo. Você fica imune às condições surpreendido e desprevenido e recebe +10 em Defesa e Reflexos. Requer 4º círculo e afinidade."
  },
  {
    "id": "hemofagia",
    "nome": "Hemofagia",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "Você arranca o sangue do corpo do alvo através da pele dele, causando 6d6 pontos de dano de Sangue. Você então absorve esse sangue, recuperando pontos de vida iguais à metade do dano causado.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a resistência para “nenhuma”. Como parte da execução do ritual, você faz um ataque corpo a corpo contra o alvo. Se acertar, causa o dano do ataque e do ritual, recuperando PV em quantidade igual à metade do dano total causado.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alcance para “pessoal”, o alvo para “você” e a duração para “cena”. Em vez do normal, a cada rodada você pode gastar uma ação padrão para tocar 1 ser e causar 4d6 pontos de dano de Sangue. Você recupera PV iguais à metade do dano causado. Requer 4º círculo."
  },
  {
    "id": "inexistir",
    "nome": "Inexistir",
    "elemento": "Conhecimento",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Vontade parcial",
    "descricao": "Este é um ritual extremamente cruel, que já condenou grandes agentes da Ordem ao oblívio. Você toca o alvo com a intenção de apagá-lo por completo da existência, fazendo a mente e o corpo do alvo serem reescritos e desmantelados da existência. O alvo começa a levitar a poucos centímetros do chão e textos narrando todos os momentos de sua vida surgem e brilham por cima de sua pele, até que a existência dele começa a ser destruída de dentro, causando 10d12+10 pontos de dano de Conhecimento. Se o alvo passar no teste de resistência, em vez disso sofre 2d12 pontos de dano e fica debilitado por uma rodada. Independente do resultado do teste de resistência, se os PV do alvo forem reduzidos a 0 ou menos, ele será completamente apagado, não restando nenhum traço de sua existência.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda o dano para 15d12+15 e o danto resistido para 3d12.",
    "adicionalPEVerdadeiro": 10,
    "descricaoPEVerdadeiro": "Muda o dano para 20d12+20 e o dano resistido para 4d12. Requer afinidade."
  },
  {
    "id": "invadir-mente",
    "nome": "Invadir Mente",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio ou toque",
    "alvo": "1 ser ou 2 pessoas voluntárias",
    "duracao": "Instantânea ou 1 dia",
    "resistencia": "Vontade parcial ou nenhuma",
    "descricao": "Quando conjura este ritual, você gera um dos efeitos a seguir, a sua escolha: rajada mental (usa os primeiros parâmetros do cabeçalho acima) ou ligação telepática (usa os segundos parâmetros). Rajada Mental: você infecta a mente do alvo com o Conhecimento proibido do Outro Lado, dilacerando o cérebro dele. O alvo sofre 6d6 pontos de dano de Conhecimento e fica atordoado por uma rodada. Se passar no teste de Vontade, sofre metade do dano e não fica atordoado. Um mesmo alvo só pode ficar atordoado por este ritual uma vez por cena. Ligação Telepática: você cria um elo mental entre duas pessoas (você pode ser uma delas), que podem se comunicar independente da distância pela duração do ritual (1 dia).",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Se escolher rajada mental, aumenta o dano para 10d6. Se escolher ligação telepática, em vez do normal, você cria um elo mental que permite que você gaste uma ação de movimento para ver e ouvir pelos sentidos do alvo. Um alvo involuntário pode fazer um teste de Vontade para suprimir o ritual por uma hora. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Se escolher rajada mental, aumenta o dano para 10d6 e muda o alvo para “seres escolhidos”. Se escolher ligação telepática, você pode criar um vínculo mental entre até 5 pessoas. Requer 4º círculo."
  },
  {
    "id": "involucro-de-carne",
    "nome": "Invólucro de Carne",
    "elemento": "Sangue",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "1 clone seu",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você manifesta uma poça de sangue no chão, de onde emerge uma cópia sua. Ela é idêntica em aparência e capacidades (em termos de jogo, tem as mesmas estatísticas) e surge com uma cópia de todo equipamento mundano que você estiver carregando. A cópia não tem consciência (valor de Intelecto e Presença nulos) e não age sem que você dê uma ordem. Você pode gastar uma ação de movimento para dar uma ordem à cópia, como “lute contra aquele ser”. No final de cada um de seus turnos, a cópia segue a ordem da melhor maneira possível, mas ainda é incapaz de tomar decisões sozinha e acatará qualquer ordem perigosa sem hesitar, mesmo que leve à sua destruição. Alternativamente, no início de seu turno, você pode controlar ativamente a cópia. Se fizer isso, você entra num transe temporário e assume o controle da cópia como se fosse seu corpo, usando os sentidos dela. Qualquer ser que interagir com a cópia tem direito a um teste de Percepção (DT do ritual) para perceber que é uma cópia. A cópia se desfaz em uma poça de sangue coagulado se chegar a 0 PV ou sair do alcance.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "lamina-do-medo",
    "nome": "Lâmina do Medo",
    "elemento": "Medo",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você manifesta uma lâmina impossível, que pode ser descrita apenas como uma “fenda na Realidade”, com qual golpeia um alvo adjacente. Se o alvo falhar no teste de Fortitude, seus PV são reduzidos a 0 e ele fica morrendo; se passar, sofre 10d8 pontos de dano de Medo (ignora todas as resistências) e fica apavorado por uma rodada. Se uma pessoa ficar morrendo pela Lâmina do Medo e sobreviver, o ferimento causado pelo ritual passa a se transformar constantemente, jamais cicatrizando e fazendo com que a pessoa passe a viver em dor constante. Aprender este ritual requer um poder de trilha específico.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "localizacao",
    "nome": "Localização",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "pessoal",
    "area": "Círculo com 90m de raio",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Este ritual pode encontrar uma pessoa ou objeto a sua escolha. Você pode pensar em termos gerais (“um policial”, “algo de metal”) ou específicos (“A delegada Joana”, “uma pistola”). O ritual indica a direção e distância da pessoa ou objeto mais próximo desse tipo, caso esteja ao alcance. Você pode movimentar-se para continuar procurando. Procurar algo muito específico (“a chave do armazém 4 no porto”) exige que você tenha em mente uma imagem precisa do objeto; caso a imagem não seja parecida com a verdade, o ritual falha, mas você gasta os PE mesmo assim. Este ritual pode ser bloqueado por uma fina camada de chumbo.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alcance para “toque”, o alvo para “1 pessoa” e a duração para “1 hora”. Em vez do normal, a pessoa tocada descobre o caminho mais direto para entrar ou sair de um lugar. Assim, o ritual pode ser usado para descobrir a rota até o relicário de uma catedral ou a saída mais próxima de uma caverna (mas não para encontrar a localização de uma pessoa ou objeto; funciona apenas em relação a lugares). Caso a pessoa demore mais de uma hora para percorrer o caminho, o conhecimento se perde.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Aumenta a área para círculo de 1km de raio. Requer 4º círculo."
  },
  {
    "id": "medo-tangivel",
    "nome": "Medo Tangível",
    "elemento": "Medo",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "O ritual transforma seu corpo em uma manifestação do Medo, tornando-o imune a efeitos mundanos. Você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de doenças e venenos, e não sofre dano adicional por acertos críticos e ataques furtivos. Além disso, dano do tipo balístico, corte, impacto ou perfuração não podem reduzir seu total de pontos de vida abaixo de 1, tornando-o virtualmente imortal contra efeitos mundanos.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "mergulho-mental",
    "nome": "Mergulho Mental",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "Sustentada",
    "resistencia": "Vontade parcial (veja texto)",
    "descricao": "Você mergulha nos pensamentos do alvo para descobrir informações sobre ele. Durante o mergulho, você fica desprevenido. No início de cada turno seu que estiver sustentando o efeito e tocando o alvo, ele deve fazer um teste de Vontade. Se falhar, deve responder uma pergunta sua que possa ser respondida com “sim” ou “não”, sendo incapaz de mentir. O que você descobre depende das suas perguntas e do mestre: talvez você não descubra tudo que há para saber, mas pode ganhar pistas para continuar a investigação.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Muda a execução para 1 dia, o alcance para ilimitado e adiciona como componente ritualístico uma cuba de ouro cheia d’água e uma máscara (acessório de categoria II). Você pode realizar o mergulho mental à distância, submergindo seu rosto mascarado na água enquanto mentaliza o alvo. Para que esse ritual funcione, você precisa ter alguma informação sobre o alvo, como nome completo, e um objeto pessoal ou fotografia. Requer 4º círculo."
  },
  {
    "id": "miasma-entropico",
    "nome": "Miasma Entrópico",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "nuvem com 6m de raio",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial (veja texto)",
    "descricao": "Cria uma explosão de emanações tóxicas. Seres na área sofrem 4d8 pontos de dano químico e ficam enjoados por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoados.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o dano para 6d8 de Morte.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Como a versão discente, mas muda a duração para 3 rodadas. Um ser que inicie seu turno dentro da área sofre o dano novamente. Requer 3º círculo."
  },
  {
    "id": "nuvem-de-cinzas",
    "nome": "Nuvem de Cinzas",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "nuvem com 6m de raio e 6m de altura",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Uma nuvem de fuligem espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — seres a até 1,5m têm camuflagem leve e seres a partir de 3m têm camuflagem total. Um vento forte dispersa a nuvem em 4 rodadas e um vendaval a dispersa em 1 rodada. A nuvem não funciona sob a água.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Você pode escolher seres no alcance ao conjurar o ritual; eles enxergam através do efeito. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Além do normal, a nuvem fica espessa, quase sólida. Qualquer ser dentro dela tem seu deslocamento reduzido para 3m (independente de seu deslocamento normal) e sofre –2 em testes de ataque. Requer 3º círculo."
  },
  {
    "id": "odio-incontrolavel",
    "nome": "Ódio Incontrolável",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "O alvo entra em um frenesi, aumentando sua agressividade e capacidade de luta. Ele recebe +2 em testes de ataque e rolagens de dano corpo a corpo e resistência a balístico, corte, impacto e perfuração 5. Enquanto o efeito durar, o alvo não pode fazer nenhuma ação que exige calma e concentração (como usar a perícia Furtividade ou conjurar rituais), e deve sempre atacar um alvo em sua rodada, mesmo que seja um aliado se ele for o único a seu alcance.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, sempre que o alvo usar a ação agredir, pode fazer um ataque corpo a corpo adicional contra o mesmo alvo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o bônus de ataque e dano para +5 e o alvo passa a sofrer apenas metade do dano dos tipos balístico, corte, impacto e perfuração. Requer 3º círculo e afinidade."
  },
  {
    "id": "ouvir-os-sussurros",
    "nome": "Ouvir os Sussurros",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "O ritual conecta você com os sussurros, memórias ecoadas pelo Outro Lado, que você pode consultar para receber conhecimento proibido em relação a uma ação que tomará em breve. Ao usar este ritual, faça uma pergunta sobre um evento que você está prestes a fazer (na mesma cena) que possa ser respondida com “sim” ou “não”. O mestre rola 1d6 em segredo; com um resultado de 2 a 6, o ritual funciona e você recebe sua resposta, que pode ser “sim”, “não” ou “sim e não”. Com um resultado 1, o ritual falha e oferece o resultado “não”. Não há como saber se esse resultado foi dado porque o ritual falhou ou não. Lançar este ritual múltiplas vezes sobre o mesmo assunto gera sempre o primeiro resultado. Por exemplo, você está prestes a entrar em um prédio que pode ser o esconderijo de um cultista. Se você perguntar para os sussurros se o cultista está mesmo nesse local, a resposta pode ser “sim” (ele está no prédio), “não” (ele não está no prédio) ou “sim e não” (ele está no prédio, mas usou um ritual para se esconder seu corpo físico em uma dimensão do Outro Lado…). Isso é útil para saber se você deve (ou não) gastar recursos para um possível combate.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a execução para 1 minuto. Em vez do normal, você pode consultar os ecos fazendo uma pergunta sobre um evento que poderá acontecer até um dia no futuro. O mestre rola a chance de falha; com um resultado de 2 a 6, você recebe uma resposta, desde uma simples frase até uma profecia ou enigma. Em geral, este uso oferece pistas, indicando um caminho a tomar para descobrir a resposta que se procura. Numa falha você não recebe resposta alguma. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda a execução para 10 minutos e a duração para 5 rodadas. Em vez do normal, você consulta os ecos, podendo fazer uma pergunta por rodada, desde que ela possa ser respondida com “sim”, “não” ou “ninguém sabe”. O mestre rola a chance de falha para cada pergunta. Em caso de falha, a resposta também é “ninguém sabe”. Requer 3º círculo."
  },
  {
    "id": "paradoxo",
    "nome": "Paradoxo",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "esfera com 6m de raio",
    "duracao": "Instantânea",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "O ritual cria uma poderosa implosão de distorção temporal contraditória, causando 6d6 pontos de dano de Morte em todos os seres na área.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a área para efeito: esfera de 1,5 m de diâmetro e a duração para cena. Em vez do normal, cria uma esfera de emanações espirais sibilantes com 1,5m de diâmetro que causa 4d6 pontos de dano de Morte a qualquer ser no mesmo espaço. Você pode gastar uma ação de movimento para fazer a esfera voar 9m em qualquer direção. Um ser só pode sofrer dano da esfera uma vez por rodada.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o dano para 13d6. Seres reduzidos a 0 PV pelo dano do Paradoxo devem fazer um teste de Fortitude. Se falharem, são reduzidos a cinzas (morrem imediatamente). Requer 4º círculo."
  },
  {
    "id": "perturbacao",
    "nome": "Perturbação",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "duracao": "1 rodada",
    "resistencia": "Vontade anula",
    "descricao": "Você dá uma ordem que o alvo deve ser capaz de ouvir (mas não precisa entender). Se falhar na resistência, ele deve obedecer à ordem em seu próprio turno da melhor maneira possível. Escolha um dos efeitos.\nFuja: O alvo gasta seu turno tentando se afastar de você (usando todas as suas ações).\nLargue: O alvo solta quaisquer itens que esteja segurando e não pode pegá-los de volta até o início de seu próximo turno. Como esta é uma ação livre, ele ainda pode executar outras ações (exceto pegar aquilo que largou).\nPare: O alvo fica pasmo (não pode realizar ações, só reações).\nSente-se: Com uma ação livre, o alvo se senta no chão (se estava pendurado ou voando, desce até o chão). Ele pode fazer outras ações, mas não se levantar até o início de seu próximo turno.\nVenha: O alvo gasta seu turno se aproximando de você (usando todas as suas ações).",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alvo para “1 ser” e adiciona o seguinte comando: “Sofra. O alvo é acometido de dor aguda. Ele sofre 3d8 pontos de dano de Conhecimento e fica abalado por uma rodada”.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para “até 5 seres” ou adiciona o seguinte comando: “Ataque. O alvo deve fazer a ação agredir contra um outro alvo a sua escolha em alcance médio, com todas as suas capacidades”. Requer 3º círculo e afinidade."
  },
  {
    "id": "poeira-da-podridao",
    "nome": "Poeira da Podridão",
    "elemento": "Morte",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "nuvem com 6m de raio",
    "duracao": "Sustentada",
    "resistencia": "Fortitude (veja texto)",
    "descricao": "Você manifesta uma nuvem de poeira que apodrece os seres na área. Ao conjurar o ritual, e no início de cada um de seus turnos, seres e objetos na área sofrem 4d8 pontos de dano de Morte (Fortitude reduz à metade). Alvos que falharem no teste também não podem recuperar PV de nenhuma forma por uma rodada.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Muda o dano para 4d8+16."
  },
  {
    "id": "possessao",
    "nome": "Possessão",
    "elemento": "Conhecimento",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "longo",
    "alvo": "1 pessoa viva ou morta",
    "duracao": "1 dia",
    "resistencia": "Vontade anula",
    "descricao": "Você projeta sua consciência no corpo de uma pessoa viva ou morta. Enquanto possuir o alvo, você assume o controle total do corpo dele (se o alvo estiver vivo, a consciência dele troca de lugar com a sua, ficando inerte dentro do seu corpo desacordado). Em termos de jogo, você continua usando a sua ficha, mas com os atributos físicos (Agilidade, Força e Vigor) e deslocamento do alvo. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune a este ritual por um dia. Caso qualquer um dos envolvidos no ritual morra, a mente sobrevivente ficará permanentemente presa no corpo novo, a não ser que use o ritual outra vez para voltar a seu corpo antigo. Retornar para o seu corpo voluntariamente é uma ação livre.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "presenca-do-medo",
    "nome": "Presença do Medo",
    "elemento": "Medo",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "pessoal",
    "area": "Emanação de 9m de raio",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "Você se torna um receptáculo para o Medo puro, emanando ondas de pavor e ruína. Alvos dentro da área no momento da conjuração ou no início de cada um de seus turnos são acometidos por sofrimento intenso e sofrem 5d8 de dano mental e 5d8 de dano de Medo (Vontade reduz ambos à metade). Alvos que falharem no teste ficam atordoados por uma rodada (este efeito funciona apenas uma vez por cena).",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "protecao-contra-rituais",
    "nome": "Proteção contra Rituais",
    "elemento": "Medo",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você canaliza uma aura de Medo puro, que protege o alvo contra efeitos paranormais. O alvo recebe resistência a dano paranormal 5 e +5 em testes de resistência contra rituais e habilidades de criaturas paranormais.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alvo para até 5 seres tocados. Requer 3º círculo.",
    "adicionalPEVerdadeiro": 6,
    "descricaoPEVerdadeiro": "Muda o alvo para até 5 seres tocados, a resistência a dano para 10 e o bônus em testes de resistência para +10. Requer 4º círculo."
  },
  {
    "id": "purgatorio",
    "nome": "Purgatório",
    "elemento": "Sangue",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "Área de 6m de raio",
    "duracao": "Sustentada",
    "resistencia": "Fortitude parcial",
    "descricao": "Você faz brotar uma poça de sangue pegajoso na área afetada. Inimigos na área se tornam vulneráveis a dano balístico, de corte, de impacto e de perfuração. Um alvo que tente sair da área é acometido de uma dor terrível; sofre 6d6 pontos de dano de Sangue e deve fazer um teste de Fortitude. Se passar, consegue sair. Se falhar, a dor faz com que não consiga se mover e perca a ação de movimento.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "rejeitar-nevoa",
    "nome": "Rejeitar Névoa",
    "elemento": "Medo",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "nuvem de 6m de raio",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você manifesta um leve redemoinho de névoa que se movimenta suavemente dentro da área. Rituais conjurados dentro da área têm seu custo aumentado em +2 PE por círculo e sua execução aumentada em um passo (de livre para movimento, de movimento para padrão, de padrão para completa, de completa para duas rodadas). Rejeitar a Névoa anula os efeitos de Cinerária, a menos que o conjurador de Cinerária use uma ação completa por rodada para manter o ritual ativo, neutralizando o efeito dos dois rituais.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, a DT de testes de resistência contra rituais realizados na área diminui em –5.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Como discente, e o dano causado dentro da névoa por rituais é sempre mínimo."
  },
  {
    "id": "salto-fantasma",
    "nome": "Salto Fantasma",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Seu corpo se transforma momentaneamente em Energia pura e viaja até outro ponto. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo apenas imaginá-lo, desde que já tenha observado o local de alguma forma (em pessoa, por fotografia, por vídeo…). Por exemplo, pode se transportar 3m adiante para ultrapassar uma porta fechada. Uma vez transportado, você não pode agir pelo resto do seu turno. Este ritual não permite que você apareça dentro de um corpo sólido; se o ponto de chegada não tem espaço livre, você ressurge na área vazia mais próxima.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a execução para reação. Em vez do normal, você salta para um espaço adjacente (1,5m), recebendo +10 na Defesa e em testes de Reflexos contra um ataque ou efeito que esteja prestes a atingi-lo.",
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Muda o alcance para longo e o alvo para você e até dois outros seres voluntários que você esteja tocando."
  },
  {
    "id": "sopro-do-caos",
    "nome": "Sopro do Caos",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "Varia",
    "duracao": "Sustentada",
    "resistencia": "Veja texto",
    "descricao": "Você altera os movimentos de massas de ar de forma caótica. Ao conjurar o ritual, escolha um dos efeitos abaixo.\nAscender: cria uma corrente de ar ascendente capaz de erguer do chão um ser ou objeto Médio, fazendo o alvo flutuar para cima e para baixo conforme sua vontade. Você pode gastar uma ação de movimento para subir ou descer o alvo até 6m por rodada, até um máximo de 30m de altura. Você não pode mover o alvo horizontalmente — mas o alvo pode, por exemplo, escalar uma colina ou se apoiar no teto para mover-se para os lados (com metade de seu deslocamento normal). Um ser levitando fica vulnerável. Alvos involuntários têm direito a um teste de Fortitude no início de cada um de seus turnos para encerrar o efeito. Derrubar um alvo flutuando (simplesmente parando a corrente de ar) causa o dano normal de queda, mas um alvo que passe no teste pode “nadar” para o chão contra a corrente. Você pode usar essa opção para fazer uma manobra derrubar contra um alvo voador dentro do alcance, usando Ocultismo em vez de Luta.\nSopro: cria uma lufada de vento a partir de suas mãos, que empurra qualquer alvo Médio ou menor, em um cone de 4,5m — faça uma manobra empurrar usando Ocultismo em vez de Luta, usando uma mesma rolagem sua para todos os alvos. A lufada de vento também faz qualquer coisa que um vento forte e súbito faria, como levantar pó, dispersar vapores, apagar chamas, espalhar papéis ou mover uma embarcação. Manter o sopro ativo exige uma ação padrão no seu turno. Vento: cria uma área de vento forte (página 291) dentro do alcance. Se conjurada numa área que já esteja com algum efeito de vento, aumenta esse efeito em um passo. Manter o vento ativo requer uma ação de movimento. Você também pode usar essa opção para reduzir os efeitos de vento em uma área.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Passa a afetar alvos Grandes.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Passa a afetar alvos Enormes."
  },
  {
    "id": "tecer-ilusao",
    "nome": "Tecer Ilusão",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "Ilusão que se estende a até 4 cubos de 1,5m",
    "duracao": "cena",
    "resistencia": "Vontade desacredita",
    "descricao": "Este ritual cria uma ilusão visual (uma pessoa, uma parede…) ou sonora (um grito de socorro, um uivo assustador…). O ritual cria apenas imagens ou sons simples, com volume equivalente à voz de uma pessoa para cada cubo de 1,5m no efeito. Não é possível criar cheiros, texturas ou temperaturas, nem sons complexos, como uma música ou diálogo. Seres e objetos atravessam uma ilusão sem sofrer dano, mas o ritual pode, por exemplo, esconder uma armadilha ou emboscada. A ilusão é dissipada se você sair do alcance.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o efeito para até 8 cubos de 1,5m e a duração para sustentada. Você pode criar ilusões de imagem e som combinados, e pode criar sons complexos, odores e sensações térmicas. Também pode criar sensações táteis, como texturas; objetos ainda atravessam a ilusão, mas seres não conseguem atravessá-la sem passar em um teste de Vontade. A cada rodada, você pode usar uma ação livre para mover a imagem ou alterar o som, como aumentar o volume ou fazer com que pareça se afastar ou se aproximar, ainda dentro dos limites do efeito. Você pode, por exemplo, criar a ilusão de um fantasma que anda pela sala, controlando seus movimentos. A ilusão ainda é incapaz de causar ou sofrer dano. Quando você para de sustentar o ritual, a imagem ou som persiste por mais uma rodada antes do ritual se dissipar. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Você cria a ilusão de um perigo mortal. Quando o ritual é conjurado, e no início de cada um de seus turnos, um alvo interagindo com a ilusão deve fazer um teste de Vontade; se falhar, acredita que a ilusão é real e sofre 6d6 pontos de dano de Conhecimento. O alvo racionaliza o efeito sempre que falha no teste (por exemplo, acredita que o mesmo teto pode cair sobre ele várias vezes). Se um alvo passar em dois testes de Vontade seguidos, o efeito é anulado para ele. Requer 3º círculo."
  },
  {
    "id": "tela-de-ruido",
    "nome": "Tela de Ruído",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Este ritual cria uma película de Energia que recobre seu corpo e absorve energia cinética. Você recebe 30 PV temporários, mas apenas contra dano balístico, de corte, de impacto ou de perfuração. Alternativamente, você pode conjurar este ritual como uma reação quando sofrer dano, recebendo resistência 15 apenas contra esse dano.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Aumenta os PV temporário para 60 e a resistência para 30.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alcance para curto e o alvo para 1 ser ou objeto Enorme ou menor. Em vez do normal, cria uma esfera imóvel e tremeluzente com o tamanho do alvo e centrada nele. Nenhum ser, objeto ou efeito de dano pode passar pela esfera, embora seres possam respirar normalmente dentro dela. O alvo tem direito a um teste de Reflexos para evitar ser aprisionado. Requer 4º círculo."
  },
  {
    "id": "teletransporte",
    "nome": "Teletransporte",
    "elemento": "Energia",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "Até 5 seres voluntários",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "O ritual transforma o corpo e equipamento dos alvos em energia pura e os faz reaparecer num lugar a sua escolha a até 1.000km. Quando conjura este ritual, você precisa fazer um teste de Ocultismo, com DT definida pelo seu conhecimento sobre o destino. DT 25. Um lugar que você visita com frequência. DT 30. Um lugar que você já visitou pelo menos uma vez. DT 35. Um lugar que você nunca visitou e só conhece a partir da descrição de outra pessoa que esteve lá. Você não pode se teletransportar para um lugar que nunca visitou sem a descrição de alguém. Ou seja, não pode se transportar para “o local onde Júlia está presa” se nunca esteve lá nem falou com alguém que esteve. Se passar no teste, os alvos chegam ao lugar desejado. Se falhar, você chega em um lugar parecido, mas errado ou distante (até 1d10 x 10 km). Se você falhar por 5 ou mais, o ritual falha, mas você gasta PE normalmente e fica atordoado por 1d4 rodadas.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Pode se teletransportar para qualquer local na Terra."
  },
  {
    "id": "tentaculos-de-lodo",
    "nome": "Tentáculos de Lodo",
    "elemento": "Morte",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "Círculo com 6m de raio",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Uma fenda sombria se abre no chão, de onde surgem tentáculos feitos de Lodo da Morte. Ao conjurar o ritual e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando Ocultismo em vez de Luta) contra cada alvo na área. Se você vencer, o ser é agarrado; se já estava agarrado, é esmagado, sofrendo 4d6 pontos de dano (metade impacto, metade Morte). A área do ritual conta como terreno difícil. Os tentáculos são imunes a dano.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Aumenta o raio da área para 9m e aumenta o dano dos tentáculos para 6d6."
  },
  {
    "id": "terceiro-olho",
    "nome": "Terceiro Olho",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Seus olhos se enchem de sigilos e você passa a enxergar auras paranormais em alcance longo. Rituais, itens amaldiçoados e criaturas emitem auras. Você sabe o elemento da aura e seu poder aproximado — rituais de 1º círculo e criaturas de VD até 80 emitem uma aura fraca; rituais de 2º e 3º círculos e criaturas de VD entre 81 e 280 emitem uma aura moderada, e rituais de 4º círculo e criaturas de VD 281 ou maior emitem uma aura poderosa. Além disso, você pode gastar uma ação de movimento para descobrir se um ser que possa ver em alcance médio tem poderes paranormais ou se é capaz de conjurar rituais e de quais elementos.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a duração para 1 dia.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Também pode enxergar objetos e seres invisíveis, que aparecem como formas translúcidas."
  },
  {
    "id": "transfigurar-agua",
    "nome": "Transfigurar Água",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "longo",
    "area": "esfera com 30m de raio",
    "duracao": "cena",
    "resistencia": "Veja texto",
    "descricao": "Você canaliza Energia sobre um corpo de água, para que ele adquira movimentos e comportamentos paranormais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos. Congelar: toda a água mundana na área é congelada. Seres nadando na área ficam imóveis; escapar exige gastar uma ação padrão e passar num teste de Atletismo (DT igual a do ritual). Derreter: gelo mundano na área vira água e o ritual termina. A critério do mestre, isso pode criar terreno difícil. Enchente: eleva o nível da água mundana na área em até 4,5m. A sua escolha, muda área para “alvo: uma embarcação”. O alvo recebe +6m em seu deslocamento pela duração do efeito. Evaporar: toda a água e gelo mundano na área evaporam instantaneamente e o ritual termina. Qualquer ser vivo na área sofre 5d8 de dano de Energia (Fortitude reduz à metade). Partir: diminui o nível de toda água mundana na área em até 4,5m. Em um corpo d’água raso, isso abre um caminho seco, que pode ser atravessado a pé. Em um corpo d’água profundo, cria um redemoinho que pode prender barcos (um teste de Pilotagem com DT igual à do ritual permite ao piloto livrar a embarcação).",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Aumenta o deslocamento de enchente para +12m e o dano de evaporar para 10d8."
  },
  {
    "id": "transfigurar-terra",
    "nome": "Transfigurar Terra",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "longo",
    "area": "9 cubos com 1,5m de lado",
    "duracao": "Instantânea",
    "resistencia": "Veja texto",
    "descricao": "Você imbui terra, pedra, lama, argila ou areia na área com Energia, gerando efeitos sobrenaturais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos. Amolecer: se afetar o teto, uma coluna ou suporte, provoca um desabamento que causa 10d6 pontos de dano de impacto aos seres na área (Reflexos reduz à metade). Se afetar um piso de terra ou pedra, cria terreno difícil de areia ou argila, respectivamente. Modelar: pode usar pedra ou argila para criar um ou mais objetos simples de tamanho Enorme ou menor (sem mecanismos ou partes móveis). Por exemplo, pode transformar um tijolo em um martelo, criar uma passagem onde antes havia apenas uma parede ou levantar uma ou mais paredes que oferecem cobertura total (RD 8 e 50 PV para cada 3m). Solidificar: transforma lama ou areia em terra ou pedra. Seres com os pés na superfície ficam agarrados. Eles podem se soltar com uma ação padrão e um teste de Atletismo (DT igual a do ritual).",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a área para 15 cubos com 1,5m de lado.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Também afeta todos os tipos de minerais e metais. Requer 4º círculo."
  },
  {
    "id": "velocidade-mortal",
    "nome": "Velocidade Mortal",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "Você distorce a passagem do tempo ao redor do alvo, tornando-o extremamente veloz. O alvo pode realizar uma ação de movimento adicional por turno. Esta ação não pode ser usada para conjurar rituais.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Em vez de uma ação de movimento, o alvo recebe uma ação padrão adicional por turno.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alvo para “alvos escolhidos”. Requer 4º círculo e afinidade."
  },
  {
    "id": "videncia",
    "nome": "Vidência",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "completa",
    "alcance": "ilimitado",
    "alvo": "1 ser",
    "duracao": "5 rodadas",
    "resistencia": "Vontade anula",
    "descricao": "Através de uma superfície reflexiva, como um espelho, uma bacia de água ou mesmo uma TV desligada, você pode ver e ouvir um ser escolhido e seus arredores (cerca de 6m em qualquer direção). O alvo pode estar a qualquer distância, mas tem direito a um teste de resistência no início de cada um de seus turnos para impedir a Vidência naquele turno. Se o alvo passar em dois testes seguidos, o ritual é encerrado e o alvo fica imune a ele por uma semana. Para esse ritual funcionar, você precisa ter alguma informação sobre o alvo, como seu nome ou uma foto. Dependendo do conhecimento que você tiver dele, o alvo recebe bônus ou penalidades em seu teste de resistência. I Você sabe o mínimo sobre o alvo: +10. I Você possui algumas informações sobre o alvo (idade, profissão…) ou já o viu pessoalmente: +5. I Você conhece bem o alvo: –0. I Você tem um pertence pessoal ou roupa do alvo: –5. I Você tem uma parte do corpo do alvo (unhas, cabelos…): –10.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "vinculo-de-sangue",
    "nome": "Vínculo de Sangue",
    "elemento": "Sangue",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Fortitude anula",
    "descricao": "Você manifesta um símbolo de Sangue no seu corpo e no corpo do alvo. Sempre que você sofrer dano, o alvo deve fazer um teste de Fortitude. Se ele falhar, você sofre apenas metade do dano e ele sofre a metade restante. Você pode conjurar o ritual com efeito inverso, fazendo com que você receba metade de todo o dano que o alvo receberia. Alvos voluntários não precisam fazer testes de resistência.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "vomitar-pestes",
    "nome": "Vomitar Pestes",
    "elemento": "Sangue",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "1 enxame Grande (quadrado de 3m)",
    "duracao": "Sustentada",
    "resistencia": "Reflexos reduz à metade",
    "descricao": "Você vomita um enxame de pequenas criaturas de Sangue, que surge em um ponto adjacente a sua escolha. O enxame pode passar pelo espaço de outros seres e não impede que outros seres entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 5d12 pontos de dano de sangue a qualquer ser no espaço dele (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, um alvo que falhe no teste de Reflexos fica agarrado (o enxame escala e cobre o corpo dele). O alvo pode gastar uma ação padrão e fazer um teste de Acrobacia ou Atletismo para escapar. Se você mover o enxame, o alvo fica livre.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "O enxame vira Enorme (cubo de 6m de lado) e ganha deslocamento de voo 18m."
  },
  {
    "id": "zerar-entropia",
    "nome": "Zerar Entropia",
    "elemento": "Morte",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Você zera completamente a entropia do alvo em relação ao ambiente, deixando-o paralisado. Se passar na resistência, em vez disso fica lento. No início de cada um de seus turnos, o alvo pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, encerra o efeito.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda o alvo para “1 ser”. Requer 4º círculo.",
    "adicionalPEVerdadeiro": 11,
    "descricaoPEVerdadeiro": "Muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade."
  },
  {
    "id": "esfolar",
    "nome": "Esfolar",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Reflexos parcial",
    "descricao": "Você usa seu corpo como passagem para o Sangue, projetando agulhas e lâminas rubras praticamente imperceptíveis que se projetam contra o alvo. O ser sofre 3d4+3 pontos de dano de corte e fica sangrando. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alcance para médio, o dano para 5d4+5 e o alvo para explosão com 6m de raio. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para longo, o dano para 10d4+10 e o alvo para explosão com 6m de raio. Passar no teste de resistência não evita a condição. Requer 3º círculo."
  },
  {
    "id": "sede-de-adrenalina",
    "nome": "Sede de Adrenalina",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "Reação",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Ninguém se surpreende com os feitos impossíveis de um cultista de Sangue. Trocar racionalidade por um físico sobrenatural é entorpecente e viciante, e permite viver experiências que inundam a mente de adrenalina. Quando você falha em um teste de Acrobacia ou Atletismo, pode conjurar esse ritual para repetir esse teste, usando Presença no lugar do atributo base daquela perícia. Alternativamente, quando sofre dano de impacto, você pode usar esse ritual para reduzir esse dano em 20. Em qualquer caso, você só pode usar este ritual uma vez por rodada. Quando conjura esse ritual você entra em um transe de Sangue momentâneo enquanto seu corpo extrapola seus limites, suas veias pulsando, os olhos arregalados, a língua para fora, saindo completamente do seu estado racional. Se usá-lo para reduzir dano, mesmo que reduza o dano a 0, logo após o impacto o Sangue retorce seus ossos e tendões, fazendo com que você passe 1 rodada atordoado enquanto se contorce em ângulos impossíveis.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a redução de dano de impacto para 40.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda a redução de dano de impacto para 70. Requer 4º círculo e afinidade."
  },
  {
    "id": "odor-da-cacada",
    "nome": "Odor da Caçada",
    "elemento": "Sangue",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Qualquer um com um livro de biologia sabe que emoções são feitas de hormônios e feromônios. Para a natureza, ferramentas importantíssimas, mas para a entidade de Sangue, pontos fracos que ela pode explorar para devorar as frágeis espécies da Realidade. Sendo um ocultista com alguma experiência, você também é capaz de se aproveitar dessa fragilidade. Enquanto estiver sob efeito desse ritual seu nariz enruga, suas pupilas dilatam e os odores ao seu redor se intensificam. Você recebe faro (OPRPG, p. 179). Além disso, essa nova camada de percepção inunda seu corpo com capacidades que você desconhecia. Em uma cena de perseguição (p. 90) você recebe +5 nos testes de Atletismo e não perde PV pela ação de esforço extra, desde que o caçador que está o perseguindo, ou a presa que você está caçando, emita odores. Todo esse consumo do seu corpo tem um preço. Na próxima cena, você está sob efeito de fome e sede (OPRPG, p. 292) como se tivesse falhado no teste de Fortitude do primeiro dia e precisa suprir essa necessidade ou continuará sofrendo com os efeitos como descrito na regra.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda o alcance para toque e o alvo para 1 ser.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o alcance para curto e o alvo para até 5 seres. Requer afinidade."
  },
  {
    "id": "martirio-de-sangue",
    "nome": "Martírio de Sangue",
    "elemento": "Sangue",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Veja texto",
    "resistencia": "Não possui",
    "descricao": "Você faz o sacrifício supremo e se entrega ao Sangue, sendo devorado em uma monstruosidade bestial por completo. Você fica mais forte, rápido e resistente, em troca de uma mente nublada pela raiva e uma aparência animalesca, sentindo os músculos rasgando, os ossos ficando protuberantes e a sua pele endurecendo em uma estrutura de couro rubro. Você recebe faro, visão no escuro, cura acelerada 10, +10 em testes de ataque e rolagens de dano corpo a corpo e na Defesa, 30 PV temporários e seus ataques desarmados causam 1 dado de dano adicional e são considerados letais (sendo de corte, impacto ou perfuração à sua escolha no momento em que atacar). Após invocar o ritual, você não pode fazer mais fazer ações que demandem foco e concentração (como conjurar um ritual). Além disso, devido a sua aparência e estado violento, você sofre –3O em testes de perícias para interação social, como Diplomacia e Enganação. Diferente de outros rituais, este não possui fim. A cada rodada, você sente um pedaço da sua mente sendo devorado. Todas as suas memórias, pensamentos e existência sendo mastigados e consumidos pela intensidade do Sangue. As palavras fazem cada vez menos sentido, assim como falar e compreender os outros se torna cada vez mais impossível no meio da tormenta dos sentimentos. Suas emoções se convertem em um oceano de Sangue, tudo é tão intenso, todo toque é dor extrema, todo ataque é euforia, todo movimento é adrenalina… e finalmente, quando a cena em que conjurou o ritual acaba, o mínimo controle que você tinha de suas ações também se vai e você se torna, permanentemente, uma criatura de Sangue, sacrificando seu personagem para o Outro Lado e o perdendo para sempre.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda os bônus para +20 e os PV temporários para 50. Requer afinidade.",
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "apagar-as-luzes",
    "nome": "Apagar as Luzes",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Poéticos são os textos que associam a Morte com a luz no fim do túnel. Entretanto, qualquer ocultista sabe que isso é um engodo. A Morte é fria, úmida, nojenta e escura. Estar acostumado à escuridão faz parte daqueles que escolhem abrir seus corpos para a Morte. Ao conjurar esse ritual, qualquer fonte de luz em alcance curto de você, natural ou paranormal, se apaga (criando um ambiente de penumbra ou escuridão, o que fizer mais sentido com a cena). A forma como isso acontece se assemelha às obras mais dramáticas de terror (lâmpadas estouram, janelas se fecham, nuvens densas bloqueiam a luz do sol, velas se dissipam, etc.). O efeito é instantâneo, mas no caso de eventos temporários, como nuvens cobrindo o sol em uma direção específica ou janelas que podem ser abertas, eles permanecem mantendo a escuridão, pelo menos, até o fim da cena (o vento não move a nuvem e a janela fica sobrenaturalmente impossível de ser aberta). Você, por outro lado, recebe visão no escuro, até o fim da cena.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alcance para determinar fontes de luz afetadas para longo. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Como Discente, e além de você, até cinco outros seres dentro desse alcance recebem visão no escuro. Requer 3º círculo."
  },
  {
    "id": "lingua-morta",
    "nome": "Língua Morta",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 cadáver",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "Todos sabem que mortos não falam, e ocultistas experientes sabem: “Nada que é levado pela Morte pode voltar ao que era antes”. Contudo, isso não significa que cadáveres não tenham mais nada a dizer. E você sabe como conversar com a Morte. Ao preparar um cadáver humano e conjurar esse ritual, o Lodo da Morte se espalha por dentro do cadáver, reanimando-o forçadamente. Não se engane, ele ainda está morto, mas o seu passado está te observando agora, permitindo que ele responda algumas perguntas sobre sua vida de maneiras diferentes. O cadáver é capaz de responder uma pergunta por rodada em que você mantém o ritual sustentado, até o limite de três rodadas. Se finalizar o ritual antes da terceira pergunta, o cadáver se desmancha em Lodo preto. Porém, ao final da terceira resposta, o cadáver é consumido pela Morte e se transforma em um esqueleto de Lodo (OPRPG, p. 217). Não há necessidade de testes para tirar as respostas do cadáver, mas a clareza e objetividade delas ficam a critério do mestre e dependem do estado do cadáver. Por exemplo, se está investigando um assassinato, falar o nome de um suspeito em voz alta pode resultar em uma série de espasmos violentos, simulando os movimentos das facadas que o corpo tomou para morrer. Ou se decidir mostrar algumas fotos de diferentes suspeitos, o crânio pode se virar lentamente para encarar seu assassino uma última vez. Se o corpo não estiver em um estado de decomposição avançada, e ainda conter os órgãos responsáveis pela fala, é possível até tentar discernir uma palavra invertida ou outra que será vomitada em resposta junto com o Lodo. Se necessário, os jogadores podem listar as perguntas que pretendem fazer e dar algum tempo para o mestre bolar as respostas, antes do jogo continuar.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Aumenta o limite para quatro rodadas. Ao final da quarta rodada, ao invés de um esqueleto de Lodo, o cadáver se transforma em um enraizado (OPRPG, p. 214).",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Aumenta o limite para cinco rodadas. Requer 4º círculo e afinidade. Ao final da quinta rodada, ao invés de um enraizado, o cadáver se transforma em uma marionete (OPRPG, p. 218)."
  },
  {
    "id": "fedor-putrido",
    "nome": "Fedor Pútrido",
    "elemento": "Morte",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "Por mais assustadora que seja a morte, você sabe que a melhor maneira de lidar com ela é aceitando o que ela tem a oferecer. Ao conjurar este ritual, você cobre o seu corpo com o fedor da Morte, parando suas funções biológicas e passando a cheirar como um cadáver apodrecendo. Seu coração para de bater, seus pulmões deixam de inflar, seu sangue cessa de fluir. Tudo fica, temporariamente, sendo sustentado pelo Lodo da Morte. Nesse estado, qualquer animal se afasta de você instintivamente, como se você fosse uma fonte de doenças pútridas, e você sofre –3O em Diplomacia. Além disso, você recebe +5 em Furtividade, por se parecer com um corpo qualquer no cenário, e +10 em testes de Enganação para se fingir de morto. Em uma cena de furtividade (p. 92), enquanto você ficar parado, sua visibilidade é considerada 1 ponto menor. Na prática, você não está morto nem é um morto-vivo, não está imune a doenças ou outros efeitos biológicos, ainda precisa dormir etc. Ter seu corpo sustentado pelo Lodo é terrível; para cada rodada em que mantêm esse ritual, você sofre 1d4 pontos de dano de Morte que ignora resistências.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda o alcance para toque e o alvo para 1 ser voluntário.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o alcance para curto e o alvo para até 5 seres voluntários. Requer afinidade."
  },
  {
    "id": "singularidade-temporal",
    "nome": "Singularidade Temporal",
    "elemento": "Morte",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 objeto não paranormal Médio",
    "duracao": "Instantânea",
    "resistencia": "Veja texto",
    "descricao": "Você distorce a Realidade em espirais capazes de alterar as condições temporais de um objeto para avançá-lo no tempo, fazendo com que ele atinja o estado de decomposição mais avançado que um objeto do seu tipo poderia alcançar. A definição exata do estado que o alvo pode alcançar depende da natureza do objeto e está sujeita a interpretação do mestre. Uma maçã, por exemplo, ficaria completamente apodrecida e decomposta, enquanto um diamante poderia não sofrer nenhum efeito. O pneu de um veículo poderia ressecar e rasgar (potencialmente fazendo seu motorista perder o controle). Em termos de regras, dependendo da natureza do objeto ele pode ficar danificado (o que impõe penalidades em seu uso, como –5 em testes em que ele seja empregado) ou pode ser completamente destruido. Um objeto em uso por alguém ainda pode ser afetado, mas o ser pode fazer um teste de Fortitude para proteger o objeto do ritual.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda o tamanho do objeto afetado para Grande.",
    "adicionalPEVerdadeiro": 10,
    "descricaoPEVerdadeiro": "Muda o tamanho do objeto afetado para Enorme."
  },
  {
    "id": "desfazer-sinapses",
    "nome": "Desfazer Sinapses",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Vontade parcial",
    "descricao": "Enganam-se aqueles que pensam que o Conhecimento Paranormal é incapaz de causar dano físico; inexistir é um dos processos mais terríveis que podem acontecer com alguém. A entidade do Conhecimento inexiste bilhões de neurônios de dentro do cérebro do alvo, causando a angústia inexplicável do vazio. O alvo sofre 2d6+2 pontos de dano de Conhecimento e fica frustrado por uma rodada. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição. O alvo precisa ter um cérebro; o efeito se reflete como uma dor de cabeça severa que faz sangrar levemente pelos olhos, narinas, orelhas e boca.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda o alcance para longo, o dano para 3d6+3 e o alvo para até 5 seres a sua escolha. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alcance para extremo, o dano para 8d6+8 e a condição para esmorecido. Se passar no teste de resistência, em vez de esmorecido, fica frustrado. Requer 3º círculo."
  },
  {
    "id": "aurora-da-verdade",
    "nome": "Aurora da Verdade",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "area": "esfera com 3m de raio",
    "duracao": "Sustentada",
    "resistencia": "Vontade parcial",
    "descricao": "Diante do Conhecimento Paranormal, ninguém pode manter seus segredos por muito tempo. Uma luz espectral como ondas de uma aurora boreal dourada surge na área do ritual, e qualquer ser dentro dessa área é obrigado a falar apenas a verdade, inclusive o conjurador. Se passar no teste de resistência, o ser pode mentir (o que ainda pode ser percebido com testes de Intuição). Além disso, qualquer ser que tente se esconder, obter camuflagem ou ficar invisível dentro da luz é imediatamente revelado por minúsculos sigilos que brilham ao seu redor.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alcance para médio e a área para esfera com 9m de raio e o conjurador não é mais afetado pelo efeito.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Como discente, mas muda o alcance para longo e a duração para cena. Além disso, independentemente da distância, você pode ouvir tudo que é falado na área, como se estivesse nela. Requer 4º círculo e afinidade."
  },
  {
    "id": "relembrar-fragmento",
    "nome": "Relembrar Fragmento",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 objeto",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você toca um objeto que, por alguma razão, está ilegível ou incompreensível por ter sido danificado pelo tempo ou outro fator. O objeto precisa ser uma fonte de conhecimento escrito, como um livro, caderno, papel, pergaminho ou outro texto impresso, e você só precisa ter um pedacinho do texto equivalente a um dedo mindinho para conseguir restaurá-lo. Após a conjuração, o objeto é completamente restaurado para o momento em que recebeu sua última anotação e permanece assim enquanto o conjurador tocá-lo. Se o conjurador soltá-lo, o objeto retorna ao seu estado danificado. O Conhecimento não consegue relembrar objetos destruídos por meios paranormais.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "O objeto permanece restaurado até o fim da missão.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Em vez da descrição original, o ritual pode ser usado para alterar o objeto de forma imperceptível, conforme a vontade do conjurador (transformando uma folha com um texto qualquer em um documento de permissão de porte de armas “legítimo”, por exemplo). Além disso, o objeto permanece alterado até o fim da missão. Requer afinidade."
  },
  {
    "id": "pronunciar-sigilo",
    "nome": "Pronunciar Sigilo",
    "elemento": "Conhecimento",
    "circulo": 4,
    "custoPE": 10,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "Instantânea/veja texto",
    "resistencia": "Vontade parcial",
    "descricao": "Você profana a Realidade, pronunciando um dos Sigilos do Conhecimento em voz alta, deturpando a natureza de um ser com o poder do Outro Lado. O sigilo é um som indescritível nunca escutado antes, e impossível de ser gravado ou lembrado. Ele causa um dos efeitos abaixo, à sua escolha: Esquecer: o alvo esquece quem é ou o que está fazendo e fica atordoado por 1d4+1 rodadas (apenas uma vez por cena). Se passar no teste de resistência, ou se já foi atordoado por este ritual, fica desprevenido por 1d4 rodadas. Cegar: o alvo fica cego. Se passar no teste de resistência, fica ofuscado por 1d4 rodadas. Inexistir: o alvo \"desaparece\" da Realidade brevemente, retornando após alguns instantes. Para todos os efeitos, ele deixa de existir por 1d4+1 rodadas, ou 1 rodada, se passar no teste de resistência. Ao final desse período, o alvo retorna para o espaço onde estava (ou um espaço adjacente, se o local original estiver ocupado). Se o alvo for uma criatura, em vez disso ela retorna para um ponto qualquer a escolha dela em um raio de 18m do espaço onde estava. Um ser só pode ser inexistido desta forma uma vez por cena.",
    "adicionalPEDiscente": 5,
    "descricaoDiscente": "Muda o alcance para extremo.",
    "adicionalPEVerdadeiro": 10,
    "descricaoPEVerdadeiro": "Muda o alvo para até cinco seres. Requer afinidade."
  },
  {
    "id": "overclock",
    "nome": "Overclock",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "Reação",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Até mesmo o caos proposto pela Energia pode ser um recurso. Ao fazer um teste de Tecnologia para lidar com um objeto eletrônico, você pode, após saber se passou no teste ou não, conjurar este ritual para receber as informações que buscava de outra forma, usando descargas de Energia para forçar o aparelho a seguir suas vontades. Esta outra forma precisa que o mestre tenha acesso a uma música, pois o jogador será desafiado em um jogo de “estátua”. Se não conhece o jogo, saiba que enquanto a música durar você deve mover os dedos no ar como se estivesse usando um teclado invisível — ou se mover aleatoriamente — mas quando o mestre interrompê-la, deve ficar completamente imóvel. O mínimo movimento errado, a critério do mestre, resulta em falha na aquisição da informação. O mestre pode interromper a música conforme preferir, mas se você não falhar até o fim dela, é bem-sucedido e descobre o que queria do aparelho eletrônico. O jogo de estátua pode ser substituído por outro jogo analógico de preferência da mesa. Contudo, após receber as informações — ou não — o objeto é tomado por flickering, chiados, sons de impressora, cores contrastantes, imagens invertidas e janelas aleatórias fazendo perguntas sem sentido, que tornam seu uso impossível, como se ele estivesse sob ataque de um vírus paranormal.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Você só falha no teste se errar duas vezes no jogo de estátua. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Você só falha no teste se errar três vezes no jogo de estátua. Requer 3º círculo."
  },
  {
    "id": "tremeluzir",
    "nome": "Tremeluzir",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Sustentada",
    "resistencia": "Não possui",
    "descricao": "Permitindo que a Energia corra pelo seu corpo, você reorganiza suas moléculas até que se deformem em fótons, fazendo sua matéria piscar como a de um monitor com a imagem oscilando. Enquanto estiver nesse estado, você e todo objeto que estiver carregando são capazes de atravessar objetos sólidos. Esse ritual não deixa você incorpóreo, pois ele depende da sua intenção ativa para funcionar. Para se mover através de cada objeto sólido, por menor que seja, você deve primeiro gastar uma ação de movimento. Sempre que fizer isso, há 25% (1 em 1d4) de você não atravessar, dando de cara com o objeto. Se usado em uma cena de perseguição (p. 90), permite que você use a ação de cortar caminho sem sofrer penalidade em Atletismo. Existir nesse estado de flickering é prejudicial para seu corpo. Para cada rodada em que esse ritual estiver ativo, a Energia desfragmenta sua matéria, fazendo com que sofra 1d4 pontos de dano de Energia que ignoram resistência. Se terminar sua rodada com parte do corpo, ou todo ele, em um objeto sólido, você sofre 1d4 pontos de dano de Energia adicional.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda o alcance para toque e o alvo para 1 ser voluntário.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alcance para curto e o alvo para até 5 seres voluntários. Requer 4º círculo."
  },
  {
    "id": "mutar",
    "nome": "Mutar",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Deixando que a Energia distorça as ondas ao seu redor, você inibe a emissão de qualquer som a partir de você. É como se a entidade isolasse você das frequências sonoras do universo. Por exemplo, seus passos não emitem mais barulho, uma arma disparada por você não tem estampido, o som da sua voz é emudecido. Por outro lado, esse isolamento também impede que qualquer som alcance você. Esse ritual concede +10 em testes de Furtividade e reduz qualquer ganho de visibilidade em cenas de furtividade (p. 92) em 1, a critério do mestre. Um jogador que tenha seu personagem sob efeito desse ritual só pode falar na mesa se tiver permissão do mestre (mesmo pra descrever suas ações). Caso contrário, deve tentar se comunicar sem usar a voz, como por mímica ou mensagens de celular. Se falar sem permissão, o ritual se esvai.",
    "adicionalPEDiscente": 4,
    "descricaoDiscente": "Muda o alcance para toque e o alvo para 1 ser.",
    "adicionalPEVerdadeiro": 9,
    "descricaoPEVerdadeiro": "Muda o alcance para curto e o alvo para até 5 seres. Requer afinidade com Energia."
  },
  {
    "id": "milagre-ionizante",
    "nome": "Milagre Ionizante",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "completa",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Muitos assumem que a radiação só existe para trazer destruição, sem fazer ideia de que grande parte dos tratamentos de saúde atuais dependem dessa assustadora forma de energia. A mesma alteração molecular que pode ser usada para desfragmentar a matéria também pode ser usada para devolvê-la ao seu estado natural. Como um ocultista experiente, você usa de todo seu esforço para que o caos embaralhe a Realidade com o intuito de destruir apenas uma estrutura maligna habitando um corpo. Você pode curar o ser de uma condição entre abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, ofuscado, paralisado, pasmo ou surdo, ou uma doença ou um veneno, a sua escolha. Este ritual afeta efeitos paranormais, exceto aqueles causados pela entidade de Energia e condições permanentes. Por mais caridosa que seja sua ação, a Energia do Outro Lado nunca vai deixar de pregar peças, e o caos é inevitável. Após curar o ser, este deve fazer um teste de Fortitude (DT 30). Se falhar, é incubado pelo vírus do infectcídio (OPRPG, p. 292).",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "hesitacao-forcada",
    "nome": "Hesitação Forçada",
    "elemento": "Sangue",
    "elementoSecundario": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "duracao": "Sustentada",
    "resistencia": "Vontade parcial",
    "descricao": "Você invade a mente da pessoa com fragmentos de dúvidas e inseguranças que já existiam em seu subconsciente. Todas elas são expandidas ao extremo sob a influência do Sangue, fazendo com que cada decisão pareça ser a errada. Enquanto o ritual estiver ativo, o alvo deve fazer um teste de Vontade no início de cada um de seus turnos. Se falhar, ele deverá rolar novamente o maior dado de qualquer teste feito até o fim de seu turno. Se o alvo passar no teste de resistência duas vezes seguidas, o efeito termina..",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Além do normal, um alvo que não tenha resistido ao ritual não pode realizar ações hostis contra o conjurador. Quando usado em criaturas, o ritual não desperta inseguranças (elas não possuem nada disso), mas seus movimentos são reescritos através do Conhecimento, resultando em efeitos similares. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "muda a resistência para “Vontade anula”. O efeito muda: em vez de alimentar dúvidas, o ritual fortalece as convicções, qualidades e certezas do alvo até extremos absurdos. Ele se torna extremamente confiante em suas próprias capacidades, convencido de que pode superar qualquer obstáculo ou proteger aqueles ao seu redor. Enquanto o ritual estiver ativo, o alvo rola novamente o menor dado de qualquer teste realizado, mantendo o novo resultado. Além disso, sempre que um aliado adjacente do alvo sofrer um ataque, aquele sobre o efeito do ritual deve gastar uma reação para se colocar no caminho do golpe, tornando- se o novo alvo do ataque (e acreditando ser invencível). Um alvo involuntário afetado ainda pode resistir ao ritual com um teste de Vontade no início de seus turnos. Requer 3 círculo e afinidade."
  },
  {
    "id": "sacrificio",
    "nome": "Sacrifício",
    "elemento": "Sangue",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você se corta como uma oferenda para a entidade de Sangue. Quando conjurar este ritual, você precisa ter uma faca ou outro objeto cortante e rolar 1d6 de dano para si mesmo, sem necessidade de teste de ataque, ignorando resistências. Você recebe +3m de deslocamento, +2 em rolagens de dano e +2 em testes de ataque corpo a corpo e de arremesso.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Os bônus de rolagens de dano e testes de ataque aumentam para +5, além dos ataques corpo a corpo e de arremesso aplicarem sangramento. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "O dano de sangramento se torna cumulativo. Requer 3 círculo."
  },
  {
    "id": "agonia-controlada",
    "nome": "Agonia Controlada",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "completa",
    "alcance": "médio",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "Você abre uma ferida de no mínimo 5cm no próprio corpo, perdendo 2d6 PV. Como parte da execução do ritual, você corre até um alvo (em alcance médio, mesmo que isso ultrapasse seu deslocamento) e faz um ataque corpo a corpo com +5d10 dano de Sangue. Você precisa de uma arma corpo a corpo para conjurar esse ritual.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Aumenta o dano da ferida para 2d8 e o dano no alvo para 6d12. Requer 3 círculo."
  },
  {
    "id": "transfusao-vital",
    "nome": "Transfusão Vital",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você toca no alvo e transfere sua própria energia vital para ele, podendo sofrer até 50 pontos de dano de Sangue para que o alvo recupere o dobro do dano sofrido por você em PV. Você não pode ficar com menos de 1 PV usando esse ritual. Além disso, remove qualquer condição física negativa relacionada a ferimentos.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Você pode sacrificar até 100 pontos de vida. Requer 3 círculo."
  },
  {
    "id": "corda-de-espinhos",
    "nome": "Corda de Espinhos",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser ou objeto",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você conjura uma corda espinhosa que se estende além da sua mão. Um alvo afetado leva 2d6 de dano de Perfuração e pode ser puxado ou empurrado em 6m in qualquer direção caso seja de tamanho Médio ou menor. A corda pode ser usada para escalar paredes altas e agarrar objetos.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 2,
    "descricaoPEVerdadeiro": "Muda a execução para movimento."
  },
  {
    "id": "visceras-carnivoras",
    "nome": "Vísceras Carnívoras",
    "elemento": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Reflexos anula/Fortitude parcial (veja o texto)",
    "descricao": "O Sangue temporariamente toma parte do seu corpo para se manifestar através de você. Cobras tomadas pelo sangue se formam no seu braço, que se estendem além da sua mão até um alcance de 1.5m. Mordidas são contadas como um dano só, que causa 4d6 (metade Sangue, metade Perfuração) e 1d8 de veneno durante 3 rodadas. O alvo afetado por veneno tem direito a um teste de Fortitude toda rodada para resistir ao veneno.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Aumenta o dano para 5d8 (metade Sangue, metade Perfuração) e 1d12 de veneno. Requer 3 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Aumenta o dano para 6d10 (metade Sangue, metade Perfuração) e 1d12 de veneno. Quando o efeito do veneno acabar, o alvo fica fatigado durante 3 rodadas. Requer 3 círculo e afinidade."
  },
  {
    "id": "ferver-sangue",
    "nome": "Ferver Sangue",
    "elemento": "Sangue",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser ou superfície",
    "duracao": "Sustentada",
    "resistencia": "Fortitude parcial",
    "descricao": "Quando conjurar este ritual, escolha um dos efeitos abaixo:\nSer. O sangue do alvo aquece até entrar em ebulição. Quando o ritual é conjurado, e no início de cada turno do alvo, ele deve fazer um teste de Fortitude. Se falhar, sofre 4d8 pontos de dano de Sangue e fica fraco; se passar, sofre metade do dano e não fica fraco nesta rodada. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.\nSuperfície. Uma superfície líquida é convertida em sangue fervente. Seres afetados sofrem 3d10 de dano de Sangue e a superfície se torna uma superfície de sangue, que é dissipada após 1 rodada, criando uma esfera de 3m de raio de fumaça, também dissipada após 1 rodada.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade."
  },
  {
    "id": "abalo-temporal",
    "nome": "Abalo Temporal",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "completa",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Um constante badalar de milhares de relógios começam a ecoar na mente do alvo, afetando sua mente. No início de cada turno do alvo, ele deve fazer um teste de Vontade. Se falhar, o tempo de execução das suas ações aumentam em um passo (de movimento para padrão, de padrão para completa). Se o alvo passar nesse teste dois turnos seguidos, o efeito termina e ele se torna imune ao ritual pelo resto do dia.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para “seres à sua escolha”. Requer 3 círculo e afinidade."
  },
  {
    "id": "retroceder-estado",
    "nome": "Retroceder Estado",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você escolhe uma condição que esteja te afetando para encerrar.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "trava-atemporal",
    "nome": "Trava Atemporal",
    "elemento": "Morte",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser ou objeto (leia o texto)",
    "duracao": "Sustentada/Instantânea (leia o texto)",
    "resistencia": "Fortitude anula (leia o texto)",
    "descricao": "Trave o alvo no tempo, fazendo assim com que sua percepção mude. O alvo perde 3m de deslocamento e sofre 1d4 de dano de Morte. Alternativamente, se for usado em um objeto ou superfície, ganha +20 PV ou +5 RD (escolha entre os dois).",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a duração para Instantânea e o alvo fica paralisado durante uma rodada, além de sofrer -2 em testes de ataque. Alternativamente, muda os PVs para +35 ou RD para +10. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Você trava o alvo completamente no tempo, mesmo que esteja em queda livre. Funciona apenas em objetos ou seres de tamanho médio ou menor e o ritual se dissipa após 1d6 rodadas. Você pode tocar no objeto ou ser novamente para dissipar o ritual quando quiser. Esse ritual só funciona em coisas sólidas. Requer 2 círculo."
  },
  {
    "id": "continuidade-retroativa",
    "nome": "Continuidade Retroativa",
    "elemento": "Morte",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você precisa de um relógio para usar esse ritual. Os ponteiros se movem em sentido anti-horário e marcam o momento exato de sua última ação neste turno ou do turno anterior (desconsiderando a conjuração do ritual). Você pode refazê-lá (do mesmo jeito ou diferentemente) com +1d20 no teste. Se envolver fazer uma ação que não pode ser feita denovo normalmente devido à passagem de eventos (algum item queimou, algo caiu, ou atirar de novo com uma arma que não tem mais munição, por exemplo) pode refazê-lá mesmo assim, porém com -1d20 no teste.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Você pode refazer uma ação de até 2 turnos anteriores, porém sem bônus no teste (caso haja um)."
  },
  {
    "id": "reanimar-corpos",
    "nome": "Reanimar Corpos",
    "elemento": "Morte",
    "elementoSecundario": "Sangue",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser morto",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você só pode conjurar esse ritual em seres mortos, porém a habilidade Explodir também pode ser conjurada nos seres reanimados.\n\nMORTE: Você usa a Morte para reanimar um corpo brevemente. Quando conjurar esse ritual, escolha entre os efeitos abaixo:\nReanimar: 1 turno após o ritual ser conjurado, o corpo é reanimado pelo lodo da Morte. O mestre deverá usar a ficha do esqueleto de lodo, porém com as seguintes modificações: 30 PV, garras x1, perde a habilidade Imortalidade. A criatura possui um foco especial em criaturas de Sangue e Energia.\nExplodir Lodo: O corpo explode em lodo preto e libera gases tóxicos. A superfície ao redor fica com resquícios de lodo e o custo em pontos de esforço das habilidades e rituais de personagens aumenta em +1 durante 3 rodadas. Criaturas de energia afetadas perdem seu turno. Seres em um raio de 3m da explosão tomam 1d8 de Morte.\n\nSANGUE: Você usa o Sangue para reanimar um corpo brevemente. Quando conjurar esse ritual, escolha entre os efeitos abaixo:\nReanimar: 1 turno após o ritual ser conjurado, o corpo é reanimado pelo sangue escarl",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "ampliar-efeito",
    "nome": "Ampliar Efeito",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 objeto, superfície ou ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você amplifica ou comprime um efeito à sua escolha, seja isso deixar um som mais alto, uma luz mais intensa, uma fonte de calor mais quente, frio mais frio, etc. Um ser escolhido tem a duração de uma condição ativa aumentada em 1 turno e dano de calor, frio e eletricidade é aumentado em +2d. Uma superfície escolhida é “ativada” - veja os efeitos abaixo.\nFogo: Fica mais intenso, causando +2d6 de fogo. Uma superfície de rochas em altas temperaturas sobre esse efeito tem uma chance de 1 em 6 de virar lava, causando 10d6 de dano de fogo quando em contato.\nGelo: Chance de 1 em 2 de deixar um alvo caído. Aumenta dano de frio em +2d.\nCondutora: Causa +2d de dano de Eletricidade. Eletrônicos em uma superfície metálica ou em contato com cabos são queimados.\nGás: Fica extremamente denso. Seres que atravessam esta superfície têm seu deslocamento reduzido em 3m e ficam asfixiados.\nVocê precisa ter contato visual com a fonte escolhida.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 2,
    "descricaoPEVerdadeiro": "muda o alcance para esfera de até 9m de raio. Todos os efeitos escolhidos na área são amplificados (como por exemplo, deixar os passos dos inimigos mais altos em um prédio). Além disso, você não precisa olhar para a fonte de efeito visualmente, apenas estar ciente e se concentrar nela. Requer 2 círculo."
  },
  {
    "id": "anular-atrito",
    "nome": "Anular Atrito",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 objeto",
    "duracao": "5 rodadas",
    "resistencia": "Não possui",
    "descricao": "Você transforma a superfície de um objeto de tamanho médio ou menor, o deixando perfeitamente liso. Ele não pode ser segurado, pois escorregará das mãos de qualquer um que tentar (isso pode variar, de acordo com o mestre). Além disso, qualquer ser que tentar manejar o objeto tem -2d20 no teste, mas tem +10 em testes para empurrá-lo, e se fizer isso, o move pelo dobro do normal. Um ser segurando o objeto tem direito a um teste de Vontade para anular o efeito.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 2,
    "descricaoPEVerdadeiro": "O ritual passa a afetar objetos grandes. Alternativamente, você pode tocar o chão com esse ritual, transformando todo o chão em um raio de 6 metros em uma superfície sem atrito. Tentar se mover de qualquer forma que não seja em uma linha reta requer um teste de Acrobacia. Em falha, o personagem cai. Requer 2 círculo."
  },
  {
    "id": "aplicar-energia",
    "nome": "Aplicar Energia",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma",
    "duracao": "1d4 turnos/varia",
    "resistencia": "Não possui",
    "descricao": "Aumenta o alcance de uma arma de fogo em um passo (de curto para médio, de médio para longo, de longo para extremo, não cumulativo) e ganha +1d4 de dano de Energia durante 1d4 turnos, porém diminui o teste de ataque em -3.\nSe usado em um objeto tecnológico, restaura a bateria durante uma cena.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "A duração do efeito muda para 1d6+1 turnos e o dano de Energia aumenta para 1d6. A penalidade do teste de ataque aumenta para -4. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "A duração do efeito muda para 1d6+3 turnos e o dano de Energia aumenta para 1d8. A penalidade do teste de ataque aumenta para -5. Requer 3 círculo."
  },
  {
    "id": "coincidencia-forcada",
    "nome": "Coincidência Forçada",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você manipula os caminhos do caos para que o alvo tenha mais (ou menos) sorte.\nQuando conjurar este ritual, escolha entre um dos efeitos abaixo:\nAliar. O alvo recebe +2 em testes de perícias.\nEnfraquecer. O alvo recebe -2 em testes de perícias.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "muda o alvo para alvos à sua escolha.\nAlternativamente, uma vez por cena, muda a duração para “instantânea” e eventos improváveis começam a acontecer ao seu redor. O alvo se mantém como “1 ser”, e, com aprovação do mestre, você pode declarar uma coincidência pequena ou sutil, como “tem algo aqui que me ajuda”, “ele tropeça” ou “a arma trava”. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "muda o alvo para aliados à sua escolha e o bônus para +5 e penalidade para -5. Requer 3º círculo e afinidade."
  },
  {
    "id": "chicotada-do-caos",
    "nome": "Chicotada do Caos",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "6m",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você forma uma espécie de chicote roxo feito puramente de energia, que se estende até 6m. Causa 2d6 de Energia + 1d4 de Fogo. Caso o alvo falhar no teste de resistência, perde -5 no seu próximo ataque.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Aumenta o dano pra 4d6+6 de Energia + 1d6 de dano de fogo. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Aumenta o dano pra 6d8+4 de Energia + 2d6 de dano de Fogo. Caso falhar por 5 ou mais no teste de resistência, o alvo fica paralizado por uma rodada. Requer 3 círculo."
  },
  {
    "id": "embalo-do-caos",
    "nome": "Embalo do Caos",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Joga 1d6. Cada resultado pode ter um efeito:\n1: Sua próxima rolagem ganha -1d6.\n2: Sua próxima rolagem ganha +1d6.\n3: Você desvia o próximo ataque que te acertar.\n4: Você ganha uma ação de movimento extra durante 1d4 rodadas.\n5: Você contra-ataca o próximo ataque que te acertar.\n6: Você toma 1d6 dano de Energia.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "1: Nada acontece. Você recebe 1 PE de volta.\n2: Sua próxima rolagem ganha +1d10.\n3: Você desvia o próximo ataque que te acertar, joga 1d10 e o mestre também. Se os dois resultados forem do mesmo tipo (par ou ímpar), você contra-ataca.\n4: Você ganha uma ação de movimento extra durante 1d4+2 rodadas.\n5: Você contra-ataca os dois próximos ataques que você bloquear ou esquivar.\n6: Você toma 1d6+2 dano de Energia. Requer 2 círculo.",
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "infortunio-caotico",
    "nome": "Infortúnio Caótico",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "veja o texto",
    "area": "3 esferas pequenas (1,5m cada)",
    "duracao": "cena (veja o texto)",
    "resistencia": "Reflexos anula",
    "descricao": "Você condensa Energia em esferas que explodem ao toque. Você cria 3 esferas de Energia e as coloca em um quadrado desocupado. O primeiro ser que passar pelo quadrado em que uma esfera esteja, faz com ela exploda, sofrendo 2d6 pontos de dano de Energia. Caso o alvo ative mais de uma esfera na mesma rodada, deve realizar um teste de resistência para cada esfera ativada. Os locais em que as esferas estão ocupando não podem ser identificados por outros seres, exceto pelo ritual Terceiro Olho. Elas desaparecem ao final da cena ou ao serem ativadas, o que acontecer primeiro.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "muda a quantidade de esferas para 4 e o dano para 3d6. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "muda a quantidade de esferas para 5 e aumenta o dano para 4d6+4. Requer 3 círculo."
  },
  {
    "id": "luz",
    "nome": "Luz",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 objeto",
    "duracao": "cena",
    "resistencia": "Vontade anula (veja o texto)",
    "descricao": "Quando conjurar este ritual, escolha um dos efeitos abaixo:\nIluminar. O alvo emite luz de cores alternadas e brilhantes (mas não produz calor) em uma área com 9m de raio. O objeto pode ser guardado (em um bolso, por exemplo) para interromper a luz, que voltará a funcionar caso o objeto seja revelado. Se o alvo for um objeto em posse de uma pessoa involuntária, ela tem direito a um teste de Vontade para anular o efeito. Este ritual anula Nuvem de Cinzas.\nCegar. Muda a duração para “instantânea”, área para “esfera de 6m de raio” e resistência para “Vontade parcial”. Todos os alvos afetados sofrem (ou não, à sua escolha) 1d6 de Energia e ficam cegos.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "muda o alcance para longo e o efeito para 4 esferas brilhantes. Cria esferas flutuantes de pura luz com 10cm de diâmetro, que você pode posicionar onde quiser dentro do alcance. Você pode enviar uma esfera à frente, outra para trás, outra para cima e manter uma perto de você, por exemplo. Uma vez por rodada, você pode mover as esferas com uma ação livre. Cada esfera ilumina uma área de 6m de raio, mas não produz calor. Se uma esfera ocupar o espaço de um ser, ele fica ofuscada e sua silhueta pode ser vista claramente (ela não recebe camuflagem por escuridão ou invisibilidade). O dano da forma “Cegar” aumenta para 4d6. Requer 2º círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "a luz é cálida como a do sol. Dentro da área seus aliados recebem +1d20 em testes de Vontade, e seus inimigos ficam ofuscados. Requer 3º círculo."
  },
  {
    "id": "polarizacao-caotica",
    "nome": "Polarização Caótica",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "você",
    "duracao": "sustentada",
    "resistencia": "Vontade anula",
    "descricao": "Você gera uma aura magnética sobrenatural. Escolha um dos efeitos a seguir:\nAtrair: você pode usar uma ação de movimento pra puxar um objeto metálico de espaço 2 ou menor dentro do alcance. Se o objeto estiver livre, voa para suas mãos (caso tenha mãos livres para apanhá-lo) ou para seus pés.\nRepelir: você repele objetos de espaço 2 ou menor (o que envolve quase todos os projéteis e armas de arremesso), recebendo resistência a balístico, corte, impacto e perfuração 5.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "nesta versão a energia magnética é expelida de uma única vez e arremessa até 10 objetos, ou um total de 10 espaços, o que for menor. Os objetos devem estar a até 3m uns dos outros. Objetos arremessados podem atingir seres em seu caminho, causando de 1 ponto de dano de impacto por espaço (objetos macios, sem pontas ou sem fio) até 1d6 pontos de dano por espaço (objetos duros, pontudos ou afiados). Seres atingidos têm direito a um teste de Reflexos para reduzir o dano à metade. Seres dentro da capacidade de carga do efeito podem ser arremessados, mas têm direito a um teste de Vontade para evitar o efeito (em si mesmos ou em objetos que estejam segurando). Um ser arremessado contra uma superfície sólida sofre 1d6 pontos de dano de impacto para cada 3m que “voou” no deslocamento (incluindo outros seres; nesse caso, ambos sofrem o dano).",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "muda o alcance para médio. Você pode usar uma ação de movimento para fazer com que a força magnética levite e mova um ser ou objeto de espaço 10 ou menor por até 9m em qualquer direção dentro do alcance. Um ser pode anular o efeito sobre ele, ou sobre um objeto que possua, passando num teste de Vontade. O alvo cai no chão se sair do alcance ou o efeito terminar. Além disso, você ganha acesso a mais dois efeitos:\nOnda. muda o alcance para “pessoal”, área para “Explosão com 6m de raio” e resistência para “Fortitude anula”. A onda empurra seres e objetos adjacentes para longe, e o dano de colisão aumenta para 6d6 independente da distância percorrida.\nSufocar. muda o alcance para curto e duração para “sustentada”. Você levita um ser levemente no ar e o deixa imóvel e vulnerável, infringindo uma pressão esmagadora. Um ser nesse estado perde 3d6 PV e tem direito a um teste de Vontade no início de cada um de seus turnos para anular o efeito. Para cada turno falhado, o alvo recebe um bônus cumulativo de +2 no teste de resistência que dura até o final da cena."
  },
  {
    "id": "sortear-apanagio",
    "nome": "Sortear Apanágio",
    "elemento": "Energia",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você tem o corpo ou mente transformado pela constante mudança da Energia. Escolha um de seus atributos, e então role 1d4. O resultado do dado de quatro lados será o novo valor do atributo pelo resto da cena. Você pode usar este ritual mais de uma vez para alterar mais de um atributo, mas não pode alterar o mesmo atributo mais de uma vez na mesma cena.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Muda para 1d4+1. Requer 3º círculo."
  },
  {
    "id": "campo-de-forca",
    "nome": "Campo de Força",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 ser",
    "duracao": "sustentada",
    "resistencia": "Não possui",
    "descricao": "Você gera um campo de força com aparência de sua escolha. Toda a área num raio de 3m do alvo é coberta por ele. Qualquer ataque à distância, projétil ou ser, tem a sua velocidade reduzida à metade ao passar pelo domo (ou barreira, à sua escolha), e seres que tentam atravessar o domo devem passar em um teste de Vontade, ou são repelidos pro lado de fora. Todo efeito que cause dano e tente atravessá-lo terão o dano reduzido pela metade contra todos os seres dentro do domo, e efeitos que causam menos dano que seu limite de PE+PRE são anulados.\nCaso ele seja afetado por algo que cause 50 pontos de dano ou mais de uma vez só, ou é afetado por um campo magnético forte, será dissipado.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "dissonancia-acustica",
    "nome": "Dissonância Acústica",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "area": "1 ser ou esfera com 6m de raio",
    "duracao": "sustentada",
    "resistencia": "Não possui",
    "descricao": "Você manipula a vibração do ar, criando uma área de dissonância sonora. Enquanto estiverem na área, todos os seres ficam surdos. Essa dissonância impede que seres dentro da área conjurem rituais. Ou, se preferir, pode escolher um ser específico para silenciar.",
    "adicionalPEDiscente": 1,
    "descricaoDiscente": "muda a área para “alvo: 1 objeto”. Em vez do normal, o alvo emana uma área de silêncio com 3m de raio. Se conjurar o ritual num objeto de um ser involuntário, ele tem direito a um teste de Vontade para anulá-lo.",
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "muda a duração para cena. Em vez do normal, nenhum som pode deixar a área, mas seres dentro da área podem falar, ouvir e conjurar rituais normalmente. Requer 3º círculo."
  },
  {
    "id": "reanimar",
    "nome": "Reanimar",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você energiza suas mãos, com o objetivo de reanimar pessoas. Quando usado em alguém no estado de morrendo, o alvo restaura 1 PV, sem necessidade de teste de medicina. Pode ser usado apenas uma vez por cena no mesmo alvo (ou seja, pode usar mais de uma vez, porém em pessoas diferentes).",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Pode ser usado até 3 vezes na mesma pessoa. O alvo restaura 1d6 PE. Requer 3 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "O alvo ganha uma ação de movimento extra no próximo turno. Requer 3 círculo e afinidade."
  },
  {
    "id": "ressecar",
    "nome": "Ressecar",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Fortitude anula",
    "descricao": "Você resseca um alvo, retirando parte da água em seu corpo. Para utilizar esse ritual é necessário um recipiente com água vinda de mares, oceanos, lagos, etc. A água presente no recipiente irá cercar o alvo e atrair os líquidos do corpo para si. O Alvo fica Exausto e Alquebrado.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a resistência para “Reflexos reduz à metade”. A água congela ao sair do alvo, tornando-se dezenas de lascas de gelo, que podem ficar paradas no ar durante até 3 rodadas. É possível lançá-las em um ser que esteja a alcance médio do alvo ao gastar uma ação de movimento. O ser atingido sofre 2d10 de dano de Perfuração e 2d6 de dano de Frio.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "O alcance muda para médio e o alvo para seres escolhidos. Você retira a água do corpo de diversos alvos e envia as lascas de gelo a um único alvo. Esse alvo tem direito a um teste de Reflexos para anular o efeito. Caso falhe, as células do corpo dele serão preenchidas com água, causando rompimento. O alvo sofre 1d10 de dano de sangramento e perde 1,5 metros de deslocamento até o fim da cena para cada ser de tamanho médio ou maior que sofreu o primeiro efeito do ritual. Após o fim da primeira rodada nesse estado, ele deve fazer um teste de Fortitude (DT do ritual +5), e caso falhe, fica Enjoado."
  },
  {
    "id": "tortura-eletrizante",
    "nome": "Tortura Eletrizante",
    "elemento": "Energia",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "duracao": "concentrada",
    "resistencia": "Fortitude reduz à metade",
    "descricao": "O alvo recebe uma onda de choque que infringe 2d8+6 de Energia + 1d6 de Eletricidade por rodada, porém o conjurador deve se concentrar no ritual, ou seja, não pode realizar movimentos ou outras ações. Levar dano enquanto esse ataque é ativo causa o conjurador a tomar 1d6 de dano de Energia e o ritual para.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Aumenta o dano para 2d12+4 de Energia + 2d8 de Eletricidade. Requer 3 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Aumenta o dano para 4d12+8 de Energia + 2d12 de Eletricidade. Requer 4 círculo."
  },
  {
    "id": "vortex-ionico",
    "nome": "Vórtex Iônico",
    "elemento": "Energia",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "pessoal",
    "area": "linha de 18m",
    "duracao": "instantânea",
    "resistencia": "Reflexos anula",
    "descricao": "Você libera das suas mãos um vórtex de energia pura, que suga todos os seres de tamanho Grande ou menor e objetos na área para o centro, arrastando eles até o final do percurso.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 4,
    "descricaoPEVerdadeiro": "Afeta seres escolhidos de tamanho Enorme ou menor. Requer afinidade."
  },
  {
    "id": "enfeitiçar",
    "nome": "Enfeitiçar",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "duracao": "cena",
    "resistencia": "Vontade anula",
    "descricao": "Este ritual torna o alvo prestativo (veja a página 45). Ele não fica sob seu controle, mas percebe suas palavras e ações da maneira mais favorável possível. Você recebe um bônus de +10 em testes de Persuasão com ele. Um alvo hostil ou que esteja envolvido em combate recebe +5 em seu teste de resistência. Se você ou seus aliados tomarem qualquer ação hostil contra o alvo, o efeito é dissipado e o alvo retorna à atitude que tinha antes (ou piorada, de acordo com o mestre). Além disso, você pode conjurar este ritual com uma forma diferente:\nBlecaute. Você fala palavras incompreensíveis do Conhecimento do Outro Lado para o alvo, deixando-o confuso. Caso o alvo passe na resistência, fica frustrado.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "em vez do normal, você sugere uma ação para o alvo e ele obedece. A sugestão deve ser feita de modo que pareça aceitável, a critério do mestre. Pedir que o alvo atire em seu companheiro, por exemplo, dissipa o efeito. Já sugerir a um guarda que descanse um pouco, de modo que você e seus aliados passem por ele, é aceitável. Quando o alvo executa a ação, o efeito termina. Você pode determinar uma condição específica para a sugestão: por exemplo, que o policial prenda a próxima pessoa de casaco verde que ele encontrar. Além disso, você pode conjurar este ritual com uma forma diferente:\nDerreter Mente. Você projeta uma onda de conhecimento que perfura a mente do alvo, derretendo e desmantelando os seus fragmentos de existência. O alvo sofre 6d6 pontos de dano de Conhecimento e fica abalado por 1 rodada (Vontade reduz o dano à metade e evita a condição).",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "afeta todos os alvos dentro do alcance ou escolhe um ser humano ou animal para se voltar contra seu próprio time em uma cena de combate durante uma rodada (escolha entre os dois). Requer 3º círculo."
  },
  {
    "id": "maldicao-de-midas",
    "nome": "Maldição de Midas",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 objeto",
    "duracao": "permanente",
    "resistencia": "Não possui",
    "descricao": "Você imbui o alvo com fagulhas de Conhecimento, fazendo-o parar de funcionar e se tornar apenas um item maciço feito de ouro. Em termos de regras, o item está quebrado até que o ritual seja revertido.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para “1 ser”, resistência para “Reflexos anula” e a duração para “Instantânea”. O alvo é envolto por uma membrana dourada de Conhecimento e fica petrificado, sofrendo 2d10 de Conhecimento. A membrana de ouro possui defesa 0, 10 PV e RD 5. Requer 3 círculo."
  },
  {
    "id": "memorando-vivo",
    "nome": "Memorando Vivo",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "veja texto",
    "duracao": "cena",
    "resistencia": "Vontade anula",
    "descricao": "As infinitas vozes sussurrantes do Conhecimento. Além de enlouquecerem mentes mais fracas, são capazes de ajudar a memorizar e lembrar informações se o conjurador escutar as vozes certas. Você recebe uma quantidade de d6 igual ao seu Intelecto e pode usar quantos desses quiser para somar seus resultados em quaisquer perícias baseadas em Intelecto ou Presença. Você pode dissipar esse ritual e conjurá-lo novamente para receber novamente os dados, mas nunca os acumulando. Porém, a cada dado com resultado 1 o conjurador sacrifica 1 ponto de Sanidade permanente pelas vozes estarem afetando fortemente o alvo. Alternativamente, este ritual pode ser conjurado como uma reação para fazer um alvo falhar automaticamente em um teste baseado em Intelecto, tendo direito a um teste de Vontade.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": 3,
    "descricaoPEVerdadeiro": "Como padrão, mas aumenta os dados de auxílio para d8. Requer 2 círculo."
  },
  {
    "id": "orientacao",
    "nome": "Orientação",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "O alvo ganha +1d6 para usar em testes. Esse ritual não pode ser usado em dois alvos ao mesmo tempo.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "teia",
    "nome": "Teia",
    "elemento": "Conhecimento",
    "circulo": 1,
    "custoPE": 1,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "esfera de até 6m de raio",
    "duracao": "cena",
    "resistencia": "Atletismo parcial",
    "descricao": "Você conjura uma teia de aranha extremamente resistente que aplica terreno difícil na sua superfície. Sempre que um ser entrar na área da teia, deve realizar um teste de Atletismo. Em caso de falha, fica Agarrado. Um ser Agarrado dessa forma pode repetir o teste no início de cada um de seus turnos, encerrando o efeito em caso de sucesso. A teia tem 5 PV e pode sustentar até 25 espaços de carga para segurar objetos. Fogo e Eletricidade se espalham por toda sua superfície quando aplicados.",
    "adicionalPEDiscente": 2,
    "descricaoDiscente": "Muda a duração para “1 dia”. Requer 2 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda a duração para “permanente”. Requer 2 círculo."
  },
  {
    "id": "corvos-de-odin",
    "nome": "Corvos de Odin",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "você",
    "duracao": "cena",
    "resistencia": "Não possui",
    "descricao": "Você programa dois corvos dourados com formas espectrais (a escolha do usuário, esses corvos também podem assumir as formas de corvos normais), que te alertam sobre perigo.\nCada corvo te garante +2 de defesa (para um total de +4), possuem 5 PV e te tornam imune à condição Desprevenido. Você pode controlar esses corvos e ver através da visão deles para te ajudar a encontrar pistas e ampliar sua visão.",
    "adicionalPEDiscente": null,
    "descricaoDiscente": null,
    "adicionalPEVerdadeiro": null,
    "descricaoPEVerdadeiro": null
  },
  {
    "id": "reescrever-feridas",
    "nome": "Reescrever Feridas",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "duracao": "Instantânea",
    "resistencia": "Não possui",
    "descricao": "Você reescreve as feridas do alvo, curando 3d10+6 de PV. No local da ferida o alvo fica com uma leve cicatriz de sigilos de conhecimento (que pode ser facilmente apagada). Caso a cura seja 16 ou maior, o alvo recebe 1d4 em sanidade.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a cura para 4d10+8 e Alvo para “até 3 seres”. O dano de sanidade aumenta para 1d6+1. Requer 3 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "Muda o alvo para esfera de 4.5m de raio, alcance para pessoal e duração para sustentada. Você cria um domo de cura ao seu redor. Todos os seres dentro da área de alcance curam 2d10+8 PV por turno."
  },
  {
    "id": "santuario",
    "nome": "Santuário",
    "elemento": "Conhecimento",
    "circulo": 2,
    "custoPE": 3,
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "esfera (3m de raio)",
    "duracao": "sustentada",
    "resistencia": "Não possui",
    "descricao": "Você cria uma aura translúcida e dourada de proteção num raio de 3 metros. A barreira possui milhares de sigilos dourados de Conhecimento quase invisíveis, dando o poder de reescrever parte do dano tomado. Todos os personagens de dentro da aura recebem resistência a dano 10, exceto dano de Sangue.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "Muda a execução para “reação” e duração para “Instantânea”. Você conjura o Santuário como uma barreira, escudo ou domo de proteção sólido em posição fixa, com 5 PV e RD 25. Alternativamente, essa forma também pode ser conjurada com execução “padrão” e duração “sustentada”.",
    "adicionalPEVerdadeiro": 7,
    "descricaoPEVerdadeiro": "Muda o alvo para até 5 alvos e RD 15. Requer 3 círculo e afinidade."
  },
  {
    "id": "paraiso-maldito",
    "nome": "Paraíso Maldito",
    "elemento": "Conhecimento",
    "circulo": 3,
    "custoPE": 6,
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "duracao": "até 3 rodadas",
    "resistencia": "Vontade anula",
    "descricao": "Seu toque faz com que seu alvo entre em um transe e tenha vislumbres de um local de nuvens com flechas douradas o atingindo a todo instante. O alvo deve fazer um teste de Vontade em cada turno que estiver lá, e se falhar sofre 3d8 de Conhecimento e fica fascinado. Um alvo que passa no teste fica imune ao ritual até o resto da cena.",
    "adicionalPEDiscente": 3,
    "descricaoDiscente": "A duração aumenta para até 5 rodadas e o dano aumenta para 5d8. Requer 4 círculo.",
    "adicionalPEVerdadeiro": 5,
    "descricaoPEVerdadeiro": "O alvo fica paralizado e o dano aumenta para 6d10+7. Requer 4 círculo e afinidade."
  }
];


/* --------------------------------------------------------------------------
   7. CONDIÇÕES (para a aba "Condições e Efeitos")
   -------------------------------------------------------------------------- */
const CONDICOES = [
  "Abalado", "Agarrado", "Apavorado", "Atordoado", "Caído", "Cego",
  "Confuso", "Desprevenido", "Enredado", "Exausto", "Fascinado",
  "Fatigado", "Ferimento Debilitante", "Enjoado", "Envenenado",
  "Imóvel", "Inconsciente", "Insano", "Surdo", "Vulnerável",
];


/* --------------------------------------------------------------------------
   COMO ADICIONAR CONTEÚDO — GUIA RÁPIDO
   --------------------------------------------------------------------------

   ➤ ADICIONAR UM RITUAL NOVO:
   Copie e cole dentro do array RITUAIS (item 6 acima), entre dois objetos
   existentes, e edite os valores:

     {
       id: "meu-ritual-novo",              // único, sem espaços/acentos
       nome: "Nome do Ritual",
       elemento: "Sangue",                 // Sangue, Morte, Conhecimento, Energia, Medo, Fúria...
       circulo: 2,                         // 1 a 4
       custoPE: 4,
       execucao: "Ação padrão",
       alcance: "Curto",
       duracao: "1 cena",
       resistencia: "Vontade nega",
       descricao: "Efeito do ritual aqui.",
     },

   ➤ ADICIONAR UMA ORIGEM NOVA:
   Copie e cole dentro do array ORIGENS (item 3):

     {
       id: "minha-origem",
       nome: "Nome da Origem",
       descricao: "Frase curta descrevendo a origem.",
       pericias: ["intuicao", "vontade"],   // ids de PERICIAS (veja item 2)
       poder: { nome: "Nome do Poder", descricao: "O que o poder faz." },
     },

   ➤ ADICIONAR UM PODER GERAL DE CLASSE (o "Poder de Combatente/Especialista/
     Ocultista" que o jogador escolhe nos NEX marcados como "escolha"):
   Vá até CLASSES.<classe>.poderes (item 4) e adicione:

     { nome: "Nome do Poder", preRequisito: "Ex: For 3", descricao: "O que faz." },

   Se não houver pré-requisito, use preRequisito: null.

   ➤ ADICIONAR UMA TRILHA NOVA (subclasse):
   Vá até CLASSES.<classe>.trilhas (item 4) e adicione um novo objeto de trilha:

     {
       id: "minha-trilha",
       nome: "Nome da Trilha",
       descricao: "Frase curta sobre o estilo da trilha.",
       poderes: [
         { nex: 10, nome: "Poder Inicial", descricao: "O que faz." },
         { nex: 40, nome: "Poder Intermediário", descricao: "O que faz." },
         { nex: 65, nome: "Poder Avançado", descricao: "O que faz." },
         { nex: 99, nome: "Poder Final", descricao: "O que faz." },
       ],
     },

   ➤ MUDAR A PROGRESSÃO DE UMA CLASSE (sua homebrew):
   Edite diretamente CLASSES.<classe>.tabelaNex (item 4). Cada linha é:

     { nex: 20, tipo: "fixo", texto: "O que o personagem ganha automaticamente." }
     { nex: 20, tipo: "escolha", texto: "Descrição — o jogador escolhe um poder da lista 'poderes'." }
     { nex: 20, tipo: "trilha", texto: "Descrição — o jogador escolhe um poder da trilha." }

   Você também pode mudar PV/PE/SAN base e por-NEX em CLASSES.<classe>.pv/pe/san.

   ➤ ADICIONAR UMA PERÍCIA NOVA (caso sua homebrew tenha uma):
   Copie e cole dentro do array PERICIAS (item 2):

     { id: "minha-pericia", nome: "Minha Perícia", atributo: "int" },

   Lembre-se: o "id" precisa ser único e é usado internamente; o "nome" é o
   que aparece na ficha.

   ========================================================================== */

export { ATRIBUTOS, PERICIAS, ORIGENS, PODERES_GERAIS, CLASSES, PODERES_PARANORMAIS, RITUAIS, CONDICOES };
