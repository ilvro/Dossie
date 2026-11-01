# Plano de Implementação — Contos da Vigília (Ordem Paranormal II • Playtest Beta)

Este documento descreve o plano completo para implementar as mecânicas do playtest **Contos da Vigília**, as **6 fichas oficiais** e a réplica **1:1 do Layout "A Vigília" (Frente e Verso)** com as mesmas imagens, cores, ornamentos celtas e posições exatas do PDF oficial (`Playtest_beta_-_fichas_de_personagens.pdf`).

---

## ✅ Etapa 0 (Já Concluída) — Poderes de Perfil + Otimização de Transições

1. **Poderes de Perfil Atualizados (`src/app.js` e `sheets.json`):**
   - **Executor (`ÍMPETO`):** Barra de **5 espaços**; preenche 1 espaço ao falhar em um teste; ação livre para gastar **1 espaço** (`+d4` em um teste), **3 espaços** (`+1 passo` em um atributo até o fim da cena) ou **3 espaços** (**ação extra** em cenas de conflito); esvazia no fim da cena.
   - **Analista (`ANÁLISE`):** Gasta **1 ação** para receber **2 marcadores de análise** (máx. **4 espaços**); após rolar os dados, gasta quantos quiser para mudar o resultado de um dado em **+1 ou –1** (até o máximo do dado); perde no fim da cena.
   - **Vigilante (`PRONTIDÃO`):** **1x por rodada**, quando você ou outro ser em alcance curto faz um teste, gasta **2 PD** para **rolar novamente um dos dados** cujo resultado **não tenha sido 1**; em combates, pode agir **na fase da sua ação ou em fases posteriores**, após qualquer ação daquela fase já ter sido rolada.
2. **Correção de Performance nas Transições de Ficha (`src/app.js` e `src/workspace/workspace-sidebar.js`):**
   - Removido o disparo desnecessário de `save(false)` / `persistSheetsNow()` ao apenas trocar de ficha (`switchToSheet`), que serializava 16.7 MB de JSON 3 vezes na thread principal exatamente aos `300ms` (no meio da animação de transição).
   - Adiado qualquer `persistSheetsNow()` pendente enquanto `_glitchActive` estiver ativo.
   - Mantidos os bitmaps dos tokens decodificados em memória (`decodedBitmapHolders`) para evitar piscadas durante o `app.innerHTML`.
   - Evitada a renderização da árvore oculta de 106 fichas do Navegador quando o painel lateral está fechado (`!open && !pinned`).

---

## Fase 1 — Extração das Imagens e Assets Originais do PDF (`public/assets/vigilia/`)

O PDF `Playtest_beta_-_fichas_de_personagens.pdf` possui todas as camadas gráficas originais embutidas como objetos de imagem independentes (150 DPI, com máscaras alpha `smask` separadas). Vamos extrair via script (`pdfimages -png` + composição de máscara alpha) e salvar em `public/assets/vigilia/`:

| Arquivo a Extrair | Objeto no PDF | Resolução Original | Uso no Layout "A Vigília" |
| :--- | :--- | :--- | :--- |
| `vigilia-bg.webp` | Object `2066` (pág. 1–12) | `1624 × 1211 px` | Textura de fundo verde-ardósia escuro (`#081410` → `#12261e`) com vinheta original |
| `vigilia-frame.webp` | Object `2085` + `smask` (pág. 1–12) | `1587 × 1163 px` | Moldura retangular prateada com entrelaces celtas nos 4 cantos e bordas |
| `vigilia-banners.svg` / `.webp` | Vetores/ribbons das págs. 1 e 2 | Vetorial / HD | Faixas de nós celtas (`ATRIBUTOS`, `PERÍCIAS`, barra de título de poderes, barra larga de `RELAÇÕES`, medalhões circulares de `PV`, `PD` e `NÍVEL`) |
| `token-rhiona.webp` | Object `2089` + `smask` (pág. 1) | `827 × 1087 px` | Retrato recortado com transparência de **Rhiona Mac Tuirenn** |
| `token-rowan.webp` | Object `10` + `smask` (pág. 3) | `663 × 986 px` | Retrato recortado com transparência de **Rowan Lobo Castanho** |
| `token-muirenn.webp` | Object `21` + `smask` (pág. 5) | `735 × 983 px` | Retrato recortado com transparência de **Muirenn da Lua Pálida** |
| `token-cavan.webp` | Object `31` + `smask` (pág. 7) | `627 × 881 px` | Retrato recortado com transparência de **Irmão Cavan** |
| `token-malik.webp` | Object `41` + `smask` (pág. 9) | `738 × 986 px` | Retrato recortado com transparência de **Malik ibn Qamar** |
| `token-sira.webp` | Object `51` + `smask` (pág. 11) | `849 × 1024 px` | Retrato recortado com transparência de **Sira Cissé** |

---

## Fase 2 — Anatomia Visual 1:1 do Layout "A Vigília" (Cores, Posições e Tipografia Exatas do PDF)

O usuário poderá alternar no seletor de visualização entre **`TRADICIONAL`**, **`CINEMATOGRÁFICO`**, **`A VIGÍLIA`** e **`APRESENTAÇÃO`**. Quando em **`A VIGÍLIA`**, a ficha replica exatamente as páginas do PDF em proporção paisagem (`1624 : 1211`, ou preenchendo a tela mantendo as coordenadas percentuais exatas), com botão para **virar entre Frente e Verso**.

### 2.1. Paleta de Cores Exata (Extraída do PDF)
Diferente do modo moderno (que usa vermelho/azul/verde saturados), todas as fichas de **A Vigília** usam a mesma paleta celta sombria e sóbria:
- **Fundo de Pedra/Ardósia:** `#07120e` (sombra profunda) → `#0d1e18` (tom médio) → `#162d24` (iluminação atrás do personagem).
- **Moldura e Entrelaces Celtas (Knotwork):** Prata envelhecido `#9aa49e` com sombras `#3d4742` e preenchimento interno das faixas em `#111a16`.
- **Tipografia Principal (Títulos, Nomes, Perícias, Números de PV/PD/Nível):** Branco puro `#ffffff` com leve sombra projetada (`0 2px 4px rgba(0,0,0,0.85)`).
- **Texto Corrido de Poderes, Equipamento e História:** Branco suave `#e6ece9` com destaques em **negrito `#ffffff`**.
- **Ícones de Dados (`▲4`, `■6`, `◆8`, `⬟10`, `⬢12`):**
  - Preenchimento sólido em cinza-esverdeado metálico **`#8c9791`** (dado de atributo e perícia) e número interno vazado em verde-quase-preto **`#0b1410`** (font-weight `900`).
- **Rótulos de Atributo ao lado das Perícias (`FÍSICO`, `MENTE`, `EMOÇÃO`) e sinal `+`:** Cinza-esverdeado médio **`#6e7d75`**.
- **Quadradinhos de PV, PD e Barra de Ímpeto:** Paralelogramos inclinados (`transform: skewX(-12deg)`), preenchidos em branco `#ffffff` (quando cheios/ativos) ou contorno `#7d8983` com fundo escuro `rgba(10,18,14,0.75)` (quando gastos).

### 2.2. Posições Exatas — FRENTE DA FICHA (`1624 × 1211`)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [Moldura Celta Superior]                                                             │
│                                                                                      │
│  RHIONA MAC TUIRENN            [══ ANALISTA ══] • FERREIRA • NÍVEL ( 3 )             │
│  ──────────────────────────────────────────────────────────────────────────          │
│                                                                                      │
│                   FÍSICO ⬟10       [PV](22) ▱▱▱▱▱▱▱▱▱▱▱   ┌────────────────────────┐ │
│  [═ ATRIBUTOS ═]  MENTE  ■6                 ▱▱▱▱▱▱▱▱▱▱▱   │                        │ │
│   (inclinado 4°)  EMOÇÃO ■6        [PD](12) ▱▱▱▱▱▱        │                        │ │
│                                             ▱▱▱▱▱▱        │                        │ │
│                                                           │                        │ │
│  [══ PERÍCIAS ══]         [══ ANÁLISE / ÍMPETO ════════]  │   RETRATO RECORTADO    │ │
│        ACROBACIA ▲4+⬟10 FÍSICO  Texto do poder de perfil  │    DO PERSONAGEM       │ │
│          ANIMAIS ▲4+■6  EMOÇÃO  • Marcadores / tópicos    │   (left: 61%..97%,     │ │
│          APTIDÃO ▲4+■6  MENTE                             │    top: 12%..97%)      │ │
│        ATLETISMO ◆8+⬟10 FÍSICO  [══ HABILIDADE 2 ══════]  │                        │ │
│            CRIME ▲4+⬟10 FÍSICO  Texto da habilidade...    │                        │ │
│       DISCIPLINA ■6+■6  EMOÇÃO                            │                        │ │
│        ENGANAÇÃO ▲4+■6  EMOÇÃO  [══ HABILIDADE 3 ══════]  │                        │ │
│      FURTIVIDADE ▲4+⬟10 FÍSICO  Texto da habilidade...    │                        │ │
│      INSPECIONAR ▲4+■6  MENTE                             │                        │ │
│        INTIMIDAR ▲4+■6  EMOÇÃO  [══ EQUIPAMENTO ═══════]  │                        │ │
│         INTUIÇÃO ▲4+■6  EMOÇÃO  Martelo de forja (arma    │                        │ │
│             LUTA ⬟10+⬟10 FÍSICO corpo a corpo, dano RA+3) │                        │ │
│         ... (20 linhas)                                   │                        │ │
│ [Moldura Celta Inferior]                                  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Cabeçalho (`top: 7.5%`, `left: 8%`, `right: 11%`):**
   - **Nome:** Primeiro nome em `Cinzel` `700` `52px` (`RHIONA`, `ROWAN`, `MUIRENN`, `CAVAN`, `MALIK`, `SIRA`), sobrenome/título ao lado em `27px` (`MAC TUIRENN`, `LOBO CASTANHO`, `DA LUA PÁLIDA`, `IBN QAMAR`, `CISSÉ`; para Cavan: `IRMÃO` `27px` antes de `CAVAN` `52px`, e subtítulo `DO MOSTEIRO DO OLMO CINZENTO` `14px` logo abaixo).
   - **Identidade à direita:** Banner celta retangular com o Perfil (`ANALISTA` / `VIGILANTE` / `EXECUTOR`) + `• VOCAÇÃO • NÍVEL` + **Medalhão Celta Circular** com o número do nível (`3`) em `34px`.
   - **Linha Divisória:** Linha branca de `1.5px` ligando a base do nome até o medalhão do nível.
2. **Bloco de Atributos (`top: 18%` a `32%`, `left: 8%` a `38%`):**
   - **Banner `ATRIBUTOS`:** Posicionado à esquerda (`left: 8%`, `top: 23%`), inclinado em `+4deg`, com entrelaces celtas nas pontas.
   - **Três linhas escalonadas (`left: 21%`):**
     - Linha 1 (`FÍSICO` + ícone do dado `30px`): `margin-left: 14px`
     - Linha 2 (`MENTE` + ícone do dado `30px`): `margin-left: 0px`
     - Linha 3 (`EMOÇÃO` + ícone do dado `30px`): `margin-left: 22px`
3. **Bloco de PV e PD (`top: 19%` a `32%`, `left: 40%` a `68%`):**
   - **Layout Dinâmico Fiel ao PDF:**
     - Nas fichas de Rhiona, Rowan, Malik e Sira, `PV` fica na linha superior e `PD` logo abaixo (`left: 40%`).
     - Nas fichas de Muirenn e Irmão Cavan (onde a coluna central tem mais texto), `PV` e `PD` ficam lado a lado na mesma faixa horizontal (`PV` em `left: 41%`, `PD` em `left: 58%`).
   - Cada monitor tem: **Faixa Celta `PV`/`PD`** + **Medalhão Circular Celta** com o número (`22`, `20`, `15`...) + **Grade de 2 fileiras de paralelogramos brancos clicáveis** (`Math.ceil(max/2)` em cima, `Math.floor(max/2)` embaixo).
4. **Coluna Esquerda Inferior — `PERÍCIAS` (`top: 35%` a `90%`, `left: 6.5%` a `26.5%`):**
   - Banner `PERÍCIAS` com entrelaces celtas.
   - 20 linhas compactas (`height: 22px`), cada uma clicável para rolar os 2 dados (`Perícia + Atributo`):
     - Nome alinhado à direita (`font-weight: 800`, branco)
     - Ícone do dado da perícia (`18px`, `#8c9791` com número escuro)
     - `+`
     - Ícone do dado do atributo (`18px`, `#6e7d75` com número escuro)
     - Nome do atributo base (`FÍSICO`, `MENTE`, `EMOÇÃO` em `#6e7d75`, `9.5px`).
5. **Coluna Central — Habilidades e Equipamento (`top: 34%` a `90%`, `left: 28.5%` a `63.5%`):**
   - Cada habilidade é renderizada com seu **Banner de Título Celta** (`ANÁLISE`, `ÍMPETO`, `PRONTIDÃO`, etc.) e texto direto sobre o fundo.
   - No poder **`ÍMPETO`**, os **5 retângulos brancos inclinados** são renderizados **dentro do próprio banner do título**, exatamente à direita da palavra `ÍMPETO` (como nas págs. 5 e 9 do PDF!).
   - No poder **`ANÁLISE`**, exibimos os **4 retângulos** de marcadores de análise no banner para controle de mesa.
   - A seção **`EQUIPAMENTO`** encerra a coluna central com o mesmo estilo de banner celta e botões diretos para rolar o ataque/dano `RA+X`.
6. **Coluna Direita — Retrato (`left: 60%` a `97.5%`, `top: 11%` a `97.5%`):**
   - Exibe o retrato transparente em alta definição do personagem, sobrepondo sutilmente a borda inferior direita da moldura celta, idêntico ao PDF.

### 2.3. Posições Exatas — VERSO DA FICHA (`1624 × 1211`)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [Moldura Celta Superior]                                                             │
│                                                                                      │
│        RHIONA                                                                        │
│            MAC TUIRENN     Filha do ferreiro, detém o raro conhecimento da           │
│                            metalurgia e prestígio na comunidade. Idade 23.           │
│        ────────────────────────────────────────────────────────────────────          │
│                                                                                      │
│        Filha do ferreiro da vila, Rhiona Mac Tuirenn (RÍ-o-na Mac TÚR-en) é          │
│        versada nos segredos místicos do ferro e do fogo...                           │
│                                                                                      │
│        Trabalha batendo o martelo na bigorna e testando em combate as próprias       │
│        armas que faz...                                                              │
│                                                                                      │
│        [═══ RELAÇÕES ═════════════════════════════════════════════════════]          │
│             ROWAN  ◉ ○ ○  CONFIANÇA. É QUEM LHE TRAZ O MINÉRIO DE FERRO DO PÂNTANO.  │
│           MUIRENN  ○ ○ ○  NEUTRO. SOUBE DE ENFERMOS QUE FORAM TRATADOS...            │
│             CAVAN  ◉ ◉ ○  AMIZADE. PASSAM HORAS DEBATENDO CONTABILIDADE.             │
│             MALIK  ◉ ○ ○  ADMIRAÇÃO. GOSTA DE OUVIR AS HISTÓRIAS...                  │
│              SIRA  ○ ○ ○  NEUTRO. AGUARDA ELA SE RECUPERAR DO NAUFRÁGIO...           │
│            SORCHA  ◉ ○ ○  RESPEITO. RECONHECE A IMPORTÂNCIA DE SUA VIGILÂNCIA.       │
│            CORMAC  ◉ ○ ○  CURIOSIDADE. PERGUNTA-SE DE ONDE VEM A ESPADA...           │
│                                                                                      │
│ [Moldura Celta Inferior]                                                             │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Cabeçalho do Verso (`top: 9%`, `left: 11%` a `88%`):**
   - Nome escalonado em duas linhas (`RHIONA` em `56px` / `MAC TUIRENN` logo abaixo deslocado à direita em `28px`).
   - Ao lado direito do nome: resumo descritivo + **`Idade XX.`** em negrito.
   - Linha horizontal branca fina (`1.5px`) abaixo.
2. **História / Biografia (`top: 25%` a `58%`, `left: 9%` a `90%`):**
   - Parágrafos espaçados com pronúncia em itálico, editáveis no Modo Edição.
3. **Seção `RELAÇÕES` (`top: 61%` a `89%`, `left: 8%` a `91%`):**
   - **Banner Largo de Nós Celtas** atravessando toda a largura (`83%` da página) com o título `RELAÇÕES` à esquerda.
   - **7 linhas de Relações**, cada uma com:
     - **Nome alinhado à direita** (`ROWAN`, `MUIRENN`, `CAVAN`, `MALIK`, `SIRA`, `SORCHA`, `CORMAC`).
     - **3 Círculos Concêntricos Clicáveis (`◉` / `○`):** Círculo externo branco (`16px`) com ponto central branco sólido (`8px`) quando preenchido.
     - **`SENTIMENTO.`** em negrito + descrição em *small-caps* (`font-variant: small-caps` / caixa-alta).
     - Botão discreto à direita de cada relação com Grau $\ge 1$ para **Invocar na Missão** (`+1d6` / `+1d8` / `+1d12` / Motivar PD).

---

## Fase 3 — Mecânicas de Jogo de *Contos da Vigília*

### 3.1. Sistema de Relações (`sheet.relations`)
- Suporte completo aos **Graus 0 a 3**:
  - **Grau 1 (Afinidade — `◉ ○ ○`):** Invocar 1x/missão para **`+1d6`** em um teste relacionado à pessoa ou na ação *Ajudar*.
  - **Grau 2 (Vínculo — `◉ ◉ ○`):** Invocar 1x/missão para **`+1d8`** em teste/ajuda, ou gastar 1 ação para motivar (**recupera `2d4 PD`**).
  - **Grau 3 (Devoção — `◉ ◉ ◉`):** Invocar 1x/missão para **`+1d12`** em teste/ajuda, motivar (**recupera `2d6 PD`**) ou fazer **1 ação extra** para proteger a pessoa em perigo.

### 3.2. Ferimentos, Moribundo, Lesões (`1d20`), Sustos, Traumas (`1d20`) e Dado de Pavor
- **Ao cair a 0 PV:** Assistente de **Teste de Lesão (`Físico + Vigor` vs DT 7, +3 por teste anterior na cena)**, estado **Moribundo**, rolagem na **Tabela de Lesões (`1d20` + patamar)** e aplicação automática das sequelas na ficha (*Morte Súbita, Morte Lenta, Laceração Profunda -2 PV, Sem Olho -1 Percepção/Pontaria, Sem Mão, Sem Pé, Tendão -2 Acrobacia, Músculo -2 Atletismo, Órgão Interno -2 Vigor, Órgão Sensorial -2 Percepção, Cicatriz -2 Persuasão/+1 Intimidar, Contusão -1 passo Físico, Surto de Adrenalina +1 PV*).
- **Ao cair a 0 PD:** Assistente de **Teste de Trauma (`Emoção + Disciplina` vs DT 7, +3 por teste anterior na cena)**, rolagem na **Tabela de Traumas (`1d20` + patamar)** e aplicação automática (*Colapso Total, TEPT +1 dano emocional, Degradação -1 Mente, Mácula -1 Emoção, Chaga da Alma -2 PD máx, Retração -2 Persuasão/Intuição, Pânico -> Dado de Pavor, Estupor Catatônico, Injeção de Ânimo +1 PD*).
- **Dado de Pavor (`d6 → d8 → d10 → d12`):** Rolado junto nos testes (anula dados menores; se cair `1`, vence o pavor; botões rápidos para *Controlar o Pavor* `-1 PD` e *Abraçar o Pavor* `-5 PD`).

### 3.3. Rolagem Alta (`RA`), Passo de Dados, Crítico/Falha Crítica e Pontos de Armadura
- Exibição automática de **`RA` (Rolagem Alta)** e **`RB` (Rolagem Baixa)** no banner de resultado dos dados 3D.
- Cálculo automático de dano de armas no formato **`RA + X`** (`RA+0`, `RA+1`, `RA+2`, `RA+3`), somando as **duas maiores rolagens (`RA1 + RA2 + X`)** em caso de **Sucesso Crítico** (2+ dados iguais $\ge 6$).
- Detecção de **Falha Crítica** (todos os dados = `1`) com botão para rolar **`1d8` na Tabela de Falhas Críticas**.
- Tracker de **Pontos de Armadura** (gastar 1 ponto = reduz dano em 10).

---

## Fase 4 — As 6 Fichas Prontas Oficiais (Dados Exatos do PDF)

Criar na pasta **"Contos da Vigília"** as 6 fichas completas com seus retratos extraídos do PDF:

1. **Rhiona Mac Tuirenn** (*Analista • Ferreira • Nível 3*):
   - `Físico d10, Mente d6, Emoção d6` | `PV 22, PD 12`
   - Perícias treinadas: `Atletismo d8`, `Disciplina d6`, `Luta d10`, `Ofício (Metalurgia) d8`, `Percepção d6`, `Persuasão d6`, `Vigor d8`.
   - Poderes: `Análise`, `Leitura de Combate`, `Segredo do Aço`.
   - Equipamento: `Martelo de forja (dano RA+3), tenaz de ferreiro`.
   - Relações: `Rowan (1 - Confiança)`, `Muirenn (0 - Neutro)`, `Cavan (2 - Amizade)`, `Malik (1 - Admiração)`, `Sira (0 - Neutro)`, `Sorcha (1 - Respeito)`, `Cormac (1 - Curiosidade)`.
2. **Rowan Lobo Castanho** (*Vigilante • Adestrador • Nível 3*):
   - `Físico d8, Mente d8, Emoção d6` | `PV 20, PD 12`
   - Perícias treinadas: `Acrobacia d6`, `Animais d6`, `Atletismo d6`, `Furtividade d6`, `Luta d6`, `Medicina d6`, `Percepção d8`, `Pontaria d10`, `Sobrevivência d8`, `Vigor d6`.
   - Poderes: `Prontidão`, `Esquiva`, `Espectro, o Lobo (+d6 ataque corpo a corpo)`.
   - Equipamento: `Arco curto de teixo (dano RA+1), lança de javali (dano RA+2; +1 passo no 1º ataque da cena)`.
   - Relações: `Rhiona (1 - Dever)`, `Muirenn (2 - Cumplicidade)`, `Cavan (0)`, `Malik (0)`, `Sira (0)`, `Sorcha (0)`, `Cormac (1 - Tranquilidade)`.
3. **Muirenn da Lua Pálida** (*Executor • Herborista • Nível 3*):
   - `Físico d8, Mente d8, Emoção d8` | `PV 15, PD 17`
   - Perícias treinadas: `Aptidão (Folclore) d8`, `Atletismo d6`, `Disciplina d6`, `Inspecionar d6`, `Intimidar d6`, `Intuição d6`, `Medicina d8`, `Ocultismo d8`, `Pontaria d6`, `Sobrevivência d8`, `Vigor d6`.
   - Poderes: `Ímpeto (5 espaços)`, `Arsenal de Herborista (Tônico de urtiga-feroz, Bálsamo de confrei 2d4 PV, Pote de vespa RA+1)`.
   - Equipamento: `Faca ritualística (dano RA+0), maleta de medicamentos`.
   - Relações: `Rhiona (0)`, `Rowan (2 - Amizade)`, `Cavan (0)`, `Malik (0)`, `Sira (0)`, `Sorcha (0)`, `Cormac (0)`.
4. **Irmão Cavan do Mosteiro do Olmo Cinzento** (*Analista • Professor • Nível 3*):
   - `Físico d6, Mente d10, Emoção d6` | `PV 15, PD 15`
   - Perícias treinadas (com atributos customizados da ficha!): `Acrobacia d6 (Físico)`, `Aptidão (Erudição) d6 (Mente)`, `Atletismo d10 (Físico)`, `Disciplina d8 (Emoção)`, `Inspecionar d8 (Emoção)`, `Intuição d6 (Físico)`, `Luta d8 (Mente)`, `Medicina d6 (Mente)`, `Ocultismo d6 (Mente)`, `Percepção d6 (Emoção)`, `Persuasão d4 (Mente)`, `Vigor d6 (Físico)`.
   - Poderes: `Análise`, `Curandeiro (2 PD, Medicina DT 7 -> cura PV = RA)`, `Mentoria (Ajudar DT 7 -> substitui dado pela sua RA)`.
   - Equipamento: `Porrete (dano RA+1)`.
   - Relações: `Rhiona (3 - Grande Afeição)`, `Rowan (0)`, `Muirenn (0)`, `Malik (1 - Admiração)`, `Sira (0)`, `Sorcha (0)`, `Cormac (1 - Discrição)`.
5. **Malik ibn Qamar** (*Executor • Explorador • Nível 3*):
   - `Físico d6, Mente d6, Emoção d10` | `PV 15, PD 19`
   - Perícias treinadas: `Aptidão (Erudição) d8`, `Atletismo d6`, `Disciplina d6`, `Inspecionar d6`, `Percepção d10`, `Persuasão d6`, `Pontaria d8`, `Sobrevivência d6`.
   - Poderes: `Ímpeto (5 espaços)`, `Ímpeto Fervilhante (no início de cada cena, preenche 1 espaço de ímpeto)`.
   - Equipamento: `Arco composto de Al-Andalus (dano RA+1), diário de viagem`.
   - Relações: `Rhiona (0)`, `Rowan (0)`, `Muirenn (1 - Admiração)`, `Cavan (1 - Admiração)`, `Sira (1 - Curiosidade)`, `Sorcha (0)`, `Cormac (1 - Curiosidade)`.
6. **Sira Cissé** (*Vigilante • Viking • Nível 3*):
   - `Físico d8, Mente d6, Emoção d8` | `PV 20, PD 12`
   - Perícias treinadas (com atributos customizados da ficha!): `Acrobacia d6 (Físico)`, `Aptidão (Erudição) d6 (Mente)`, `Atletismo d6 (Físico)`, `Crime d8 (Físico)`, `Furtividade d10 (Físico)`, `Intuição d4 (Físico)`, `Luta d8 (Mente)`, `Percepção d6 (Emoção)`, `Vigor d6 (Físico)`.
   - Poderes: `Prontidão`, `Antecipação Tática (2 PD no início do combate -> rodada extra antes de todos)`, `Sorrateiro (3 PD em Crime ou Furtividade -> +d8)`.
   - Equipamento: `Machado de batalha nórdico (dano RA+3)`.
   - Relações: `Rhiona (1 - Anseio)`, `Rowan (0)`, `Muirenn (1 - Gratidão)`, `Cavan (1 - Anseio)`, `Malik (0)`, `Sorcha (1 - Respeito)`, `Cormac (1 - Empatia)`.

