# Plano: "Game feel" da ficha Ordem II (Vigília) — efeitos interativos

## Contexto

O objetivo do projeto é que a ficha **pareça um jogo**. O efeito do Dado de Pavor (raios + dados estilhaçando, commit `cbaf77d`, arquivos `src/dice-dread-fx.js` + `src/dice3d.js`) ficou bom e virou a referência de qualidade. Este plano implementa as 8 ideias aprovadas pelo usuário, seguindo o mesmo padrão técnico (Three.js para o palco 3D; Web Audio sintetizado; DOM + CSS/WAAPI para a ficha).

Público: um modelo implementador (Gemini). Cada fase é independente, testável e deve ser entregue com um resumo do que foi feito. **Não commitar**; o usuário revisa.

---

## Mapa do código existente (leia antes de começar)

| O quê | Onde |
|---|---|
| Palco 3D, física, cálculo do resultado | `src/dice3d.js` — `rollDice3d()` (l.261), `computeOutcome()` (l.189), `showResult()` (l.209), `closeDice3d()` |
| FX do pavor (modelo a seguir) | `src/dice-dread-fx.js` — `createDreadSequence()` retorna `{update(now), finish()}`; primitivas `createShards`, `createDust`, `createShockwave`, `createBolt`, `getDotTexture`; sons `playCharge/playShatter/...` |
| Detecção de crítico (hoje só visual) | `showResult()` em `dice3d.js` l.225-240: sem d20, ≥2 dados, ≥2 dados com o maior valor e RA≥6 = crítico; todos =1 = falha crítica |
| Função de rolagem da ficha | `src/app.js` `async function roll(name,sides,modifier,rollMode)` (~l.4558). Injeta o dado de pavor (`dread:true`) ou o bônus de pavor abraçado |
| Dock do pavor (HTML) | `src/systems/vigilia/vigilia-view.js` ~l.894 (`.dock-pavor-active`, `.pavor-dock-die`, botões `data-pavor-action`) |
| Handlers do pavor | `src/app.js` ~l.3708 (`trigger` / `control` / `embrace` / `clear`) |
| Regras do passo do pavor | `src/systems/vigilia/vigilia-mechanics.js` `stepUpPavor` / `stepDownPavor` |
| PV/PD na Vigília | `vigilia-view.js` l.305-345 (`.vigilia-resource-block.resource-pv/pd`, `.res-num`, `.vigilia-pip`) |
| Atualização incremental de PV/PD | `src/app.js` `updateResourceUi(key)` (~l.4869) — também usado nas visões cinematic/dossier (`.pip`) |
| Mudanças de PV/PD com `render()` completo | `data-resource-adjust`, `data-consume-temp`, pavor, prontidão, `applyLesaoChoice/applyTraumaChoice`, `data-threat-pv-delta` |
| Som de recurso | `app.js` `playResourceSound(increased)`, `getUiAudioContext()` (~l.4697) |
| Tabelas Lesão/Trauma | dados em `vigilia-mechanics.js` (`LESOES_TABLE`, `TRAUMAS_TABLE`, flags `fatal`, `insane`, `maxPvPenalty`, `skillPenalties`, `stepPenalty`, `pvBonus`, `pdBonus`, `pavor`, `stunned`...); handlers `data-roll-table` (~l.3934) e `data-select-lesao/trauma` (~l.3908) → `applyLesaoChoice/applyTraumaChoice` (terminam com `alert()`) |
| Toggles de efeitos | `app.js` `criticalEffects` + `CRITICAL_EFFECTS_KEY` (l.409), `renderCriticalSettings()` (l.537), `appSettings`/`saveAppSettings()` (l.432) |
| CSS | `src/styles.css` (link em `index.html` l.17). Bloco do pavor ~l.5971-6090 e `@media (prefers-reduced-motion)` |

**Armadilha importante:** `render()` reconstrói o HTML do app inteiro (inclusive `#dice-stage`, gerado em `app.js` l.1137). Qualquer animação DOM presa a um elemento da ficha morre num `render()`. Por isso:
- efeitos que "voam" pela tela vivem numa camada própria anexada ao `document.body` (fora do container do app);
- efeitos que precisam de um elemento novo (dado do dock, pips) são aplicados **depois** do `render()`, a partir de uma fila de efeitos pendentes.
- nunca chamar `render()` enquanto o palco de dados está ativo (o código atual já adia com `setTimeout(render, 4300)`).

---

## Regras gerais para todas as fases

1. **Estilo de código:** seguir o arquivo onde está editando. `dice3d.js`/`dice-dread-fx.js` são legíveis, com comentários curtos em português; `app.js` tem muitas funções de uma linha — mantenha esse estilo nas edições dentro de `app.js`, mas coloque lógica nova em **módulos novos** e só chame-os de `app.js`.
2. **Acessibilidade:** respeitar `prefers-reduced-motion` (já existe `reducedMotionQuery` em `dice3d.js`). Com movimento reduzido: sem tremor de câmera, sem zoom, contagem mais curta, partículas reduzidas; o resultado final sempre aparece.
3. **Toggle global:** adicionar `appSettings.gameFx` (default `true`) com um botão em `renderCriticalSettings()` ("ANIMAÇÕES DE JOGO"). Helper `fxEnabled()` = `appSettings.gameFx && !reducedMotion`. Com FX desligado, o comportamento deve ser idêntico ao atual.
4. **Áudio é opcional:** todo som em `try { } catch { }` como em `dice-dread-fx.js`. Volume baixo (gain ≤ .06 para ticks/blips).
5. **Sem dependências novas.** Three.js, cannon-es, CSS e Web Animations API (`element.animate`) bastam.
6. **Limpeza:** todo FX 3D implementa `dispose()`/`finish()`; todo nó DOM criado na camada de FX é removido no `onfinish`.

---

## Fase 0 — Infraestrutura compartilhada

**Arquivos novos**
- `src/fx/dice-fx-primitives.js`: mover de `dice-dread-fx.js` (e exportar) `getDotTexture`, `createShards`, `createDust`, `createShockwave`, `noise`, helpers de easing (`clamp01`, `easeOutCubic`, `easeInCubic`, `easeInOutCubic`, `rand`) e `FLOOR_Y`. `dice-dread-fx.js` passa a importar daqui (sem mudar comportamento).
- `src/fx/ui-fx.js` (efeitos DOM da ficha):
  - `getFxLayer()`: cria uma vez `<div id="fx-layer">` em `document.body` (`position:fixed; inset:0; pointer-events:none; z-index: 140` — acima da ficha, abaixo do `#dice-stage` cujo z-index é 45/150; ajuste conferindo `styles.css` l.182 e l.300).
  - `floatText(rect, text, { color, size })`: número flutuante (`−3`, `+2`) que sobe ~40px, escala 1.25→1 e some em ~900ms.
  - `burst(rect, { color, count, spread, life })`: partículas DOM (divs circulares com `radial-gradient`), usadas como fumaça/faíscas.
  - `flyParticles(fromRect, toRect, { count, color, duration, curve })` → `Promise` resolvida quando a primeira partícula chega. Trajetória: bezier quadrática com ponto de controle aleatório acima da linha; amostrar ~14 pontos e passar como keyframes para `el.animate`, com `delay` escalonado por partícula.
  - `countUp(el, to, { duration, from = 0, onTick })`: anima o `textContent` inteiro a inteiro via `requestAnimationFrame` com easing out; chama `onTick` a cada mudança de número (máx. ~20 ticks; se `to` for grande, pula valores).
  - `queuePostRenderFx(fn)` + `runPostRenderFx()`: fila de funções executadas no fim de `render()`. Adicionar a chamada `runPostRenderFx()` no final de `render()` em `app.js`.
  - `rectOf(selector)`: `document.querySelector(selector)?.getBoundingClientRect()` — capturar **antes** de `render()`.
- `src/fx/fx.css`: estilos de todos os efeitos novos. Incluir via `<link rel="stylesheet" href="/src/fx/fx.css" />` em `index.html` logo após `styles.css`. Terminar com um bloco `@media (prefers-reduced-motion: reduce)` desligando animações decorativas.

**Verificação:** `npm run dev`; rolar um teste com pavor → o efeito do pavor continua idêntico ao atual (regressão zero).

---

## Fase 1 — Total contando com "tick"

**Onde:** `showResult()` em `src/dice3d.js`.

1. Renderizar `<strong data-total="${total}">0</strong>` (em vez do valor direto).
2. Após adicionar `.visible`, chamar `countUp(strong, total, { duration, onTick: playTick })`.
   - `duration`: `Math.min(650, 220 + total * 25)` ms; crítico usa 900ms (Fase 3).
   - Total negativo/zero: mostrar direto, sem contagem.
3. `playTick(progress)` (no próprio `dice3d.js`, junto de `playDiceImpact`): oscilador `square` 15–25ms, frequência `900 + progress * 900` Hz, gain .02→.0001, usando `getAudioContext()`.
4. No fim da contagem: classe `.landed` no `strong` → keyframe "punch" (scale 1.18→1, 180ms) em `fx.css`.
5. Se `fxEnabled()` for falso, escrever o total direto (comportamento atual).

**Verificação:** rolar 2d6 → número sobe de 0 com ticks e "pula" no fim; com `prefers-reduced-motion` (DevTools → Rendering → Emulate) aparece direto.

---

## Fase 2 — PV/PD: rastro "fantasma" + números flutuantes

**Estratégia (pega todos os caminhos de mudança de uma vez):** em vez de tocar cada handler, comparar o valor mostrado com o valor anterior.

1. Em `src/fx/resource-fx.js` criar `trackResources(state)`:
   - Guarda `last = { sheetId, pv, pd }` (módulo).
   - Se `state.id !== last.sheetId` (troca de ficha) ou primeira chamada → só atualiza `last`, sem efeito.
   - Para `pv` e `pd`: se `state[key] !== last[key]`, chamar `playResourceFx(key, last[key], state[key])` e atualizar `last`.
2. Chamar `trackResources(state)` no final de `updateResourceUi(key)` e dentro de `runPostRenderFx()` (final de `render()`). Assim cliques em pips (sem render) e ajustes com render completo são cobertos.
3. `playResourceFx(key, prev, next)`:
   - **Pips (Vigília `.vigilia-pip`, cinematic/dossier `.pip`):** para perda, os pips no intervalo `[next, prev)` recebem a classe `.ghost` (ficam claros/brancos, ainda "cheios"); após 380ms um `setTimeout` adiciona `.ghost-drain` com `transition: opacity/background .45s` escalonado (`transition-delay: calc(var(--i) * 40ms)` com `--i` definido via `style.setProperty`), e por fim remove as classes. Para ganho: pips novos recebem `.pip-pop` (scale 0.4→1.15→1 com brilho, escalonado).
   - **Barras** (se houver `.progress-track` de ameaça): adicionar/atualizar um `<i class="ghost-bar">` atrás do preenchimento com a largura antiga, que transiciona para a nova após 380ms (efeito "jogo de luta").
   - **Número flutuante:** `floatText(rect de .res-num ou do badge, '−3' / '+2')`. Cores: dano PV `#ff4d5e`, cura PV `#4ade80`, perda PD `#a855f7`, ganho PD `#c4b5fd`. Agrupar mudanças que acontecem em < 250ms numa única etiqueta (somar delta) — cliques rápidos não devem gerar 5 números.
   - **Tremidinha:** perda de PV → `.res-shake` (150ms) no bloco do recurso.
4. Não duplicar som: `playResourceSound` continua onde já é chamado.

**Verificação:** Vigília, clicar num pip 3 posições abaixo → 3 pips ficam brancos e esvaziam atrasados + "−3" sobe; usar `MÁX/TEMP` em modo edição e o botão de Controlar Pavor → também anima; trocar de ficha → nenhum número aparece.

---

## Fase 3 — Sucesso crítico 3D

1. **Extrair a classificação** de `showResult()` para `classifyRoll(dice, outcome)` em `dice3d.js` retornando `{ crit, fumble, ra, rb, critIndices, fumbleIndices }`, com exatamente a mesma regra atual (sem d20, ≥2 dados, contando só `outcome.counted`). `critIndices` = índices contados com valor `ra` (no máximo 2 primeiros para a animação). `showResult` passa a usar essa função.
2. **Novo módulo `src/fx/dice-crit-fx.js`** exportando `createCritSequence({ scene, camera, dice, indices, lights, audio, reducedMotion, onReveal })` com a mesma interface `{ update(now), finish() }` de `createDreadSequence`. Linha do tempo (ms, multiplicar por `speed` como no pavor):
   - 0–450: os dois dados sobem levemente (+0.35 y) e deslizam um em direção ao outro até ficarem a ~1.1 unidades (lerp das posições até o ponto médio menos metade da distância). Preservar a rotação (girar só em Y, igual ao pavor, para manter a face de cima).
   - 450: "clink" — `createShockwave` dourado no ponto médio, `PointLight` dourado com flash, som (dois `triangle` agudos 1568/2093 Hz + brilho com ruído highpass).
   - 450–1300: faíscas douradas — `createDust` com cores `#fde68a/#fbbf24/#fffbeb`, `rise` negativo (caem como faíscas), `speed` alto; emissive dourado pulsando nos dois dados.
   - 0–900: zoom de câmera: guardar `camera.position` e `fov`; interpolar `fov` 34→29 e mover levemente em direção ao ponto médio (`camera.position.lerp(alvo, .12)`), chamando `camera.updateProjectionMatrix()`. Volta em 900–1400. Sem zoom com movimento reduzido.
   - ~700: `onReveal()`; 1500: fim (dados assentam de volta no chão).
3. **Encadear sequências em `rollDice3d()`:** trocar a variável única `sequence` por uma fila `sequences = []`. Montar: `[dread?] → [crit ou fumble?]`. Quando há fila, o `onReveal` só é passado à **última** sequência; a sequência do pavor recebe `onReveal: undefined`. Quando `update()` de uma retorna `false`, chamar `finish()` e iniciar a próxima (as primitivas precisam das posições atuais das malhas, não da física). Atenção: dados destruídos pelo pavor não podem ser alvos do crítico (`classifyRoll` já usa só `counted`). `activeDreadSequence` vira `activeSequence` (finish em `closeDice3d`).
4. Em `showResult` com crítico: classe `.crit-result` no `#dice-stage-result` (borda/glow dourado em `fx.css`), contagem de 900ms começando do 0 e escala final maior. Estender `cleanupTimer` para 5200ms no crítico.

**Verificação:** ver "Modo de teste" no fim. Forçar `[6,6]` → dados se aproximam, faíscas, zoom, total conta; com pavor + crítico → pavor primeiro, crítico depois, sem travar.

---

## Fase 4 — Falha crítica (1 e 1)

**Novo:** `createFumbleSequence(...)` em `src/fx/dice-crit-fx.js` (mesma interface).

- 0–250: dados tremem (igual ao "medo" das vítimas do pavor) e escurecem: lerp de `material.color` para `#3a3a3f`, `emissive` para preto, linhas de aresta (`LineSegments` filho) para `#111`.
- 250: rachaduras — trocar o mapa do material por uma `CanvasTexture` de rachaduras (gerar uma vez: linhas pretas aleatórias ramificadas num canvas 256×256) **ou**, mais simples e robusto, adicionar um `LineSegments` extra com segmentos aleatórios sobre as faces (pontos de `faceData`), cor preta. Som: estalo seco (ruído bandpass 1200Hz, 60ms) + rangido grave descendente.
- 250–1300: afundar na mesa — habilitar `renderer.localClippingEnabled = true` (passar `renderer` para a sequência) e dar aos materiais do dado (e dos rótulos filhos) `clippingPlanes: [new THREE.Plane(new THREE.Vector3(0,1,0), -FLOOR_Y)]`; descer `mesh.position.y` 0.9 unidades com easeInCubic e leve inclinação. Partículas de poeira cinza (`createDust` com cores cinzas, `rise` baixo).
- Tela dessaturada: classe `.fumble-desat` no `#dice-stage`; em `fx.css`: `#dice-stage.fumble-desat::before { backdrop-filter: saturate(.25) brightness(.85); opacity:1; transition: .5s }` (o `::before` já existe para o pavor, l.5971 — criar regra que não conflite, ex. usar um `<div class="stage-desat">` filho). Remover a classe em `closeDice3d()`.
- `onReveal` em ~900ms; resultado com `.fumble-result` (cinza/vermelho apagado).
- O resultado final mostrado continua com os valores (os dados somem visualmente, não do resultado).

**Verificação:** forçar `[1,1]` → dados racham, ficam cinza, afundam no chão (cortados pelo plano), tela fica sem cor e volta ao fechar.

---

## Fase 5 — Dado de pavor no dock: materializar e trocar de passo

1. **Dock com forma real:** em `vigilia-view.js`, substituir `<span class="pavor-dock-die">d${dadoPavor}</span>` por um SVG do dado + o rótulo, reaproveitando o helper de ícones de dado já usado em `app.js` (`die(sides,'micro',true)`, ver `renderResourceCard`; o README fala dos SVGs facetados d4–d20). Se o helper não estiver disponível em `vigilia-view.js`, passá-lo por `options` como já é feito com `safeUrl`. Adicionar `data-sides="${dadoPavor}"` e a classe `embraced` quando `sheet.pavorEmbraced` (hoje o estado abraçado não aparece no dock).
2. **Fila pós-render:** no handler `trigger` (app.js ~l.3708), guardar `const from = state.dadoPavor` antes de `stepUpPavor`, e antes do `render()` chamar `queuePostRenderFx(() => pavorStepFx(from, state.dadoPavor))`.
3. `pavorStepFx(from, to)` em `src/fx/pavor-fx.js`:
   - `from == null` (ganhou o dado): `burst` roxo tipo fumaça (`#7c3aed`, `#a855f7`, `#1a0b2e`, partículas grandes 18–34px com `filter: blur(4px)`, sobem e expandem) no rect do dado; o dado entra com classe `.materialize` (opacity 0, scale .3, `blur(6px)` → normal, 650ms, com `drop-shadow` roxo pulsando). Som: reutilizar a ideia de `playGrowl` (exportar de `dice-dread-fx.js`).
   - `from` → `to` maior (subiu de passo): clonar o SVG antigo (gerar com o mesmo helper para `from`) sobreposto ao novo; antigo faz `rotateY(0→90deg)` + scale .8 e some; novo faz `rotateY(-90→0)` + scale 1.25→1 (efeito de troca de forma); `burst` roxo pequeno; rótulo `d6 → d8` com `.pip-pop`.
4. O toast atual pode continuar.

**Verificação:** clicar `+ PAVOR` → fumaça e d6 se materializa; Lesão/Trauma "Pânico" (`pavor: true`) também deve passar pelo mesmo efeito — conferir onde `applyTraumaChoice` aplica `stepUpPavor` e enfileirar o mesmo FX.

---

## Fase 6 — Controlar / Abraçar o pavor com partículas

No handler `data-pavor-action` (app.js ~l.3708), para `control` e `embrace`:

1. **Antes** de alterar o estado: `const fromRect = rectOf('.vigilia-resource-block.resource-pd .res-num')`, `const toRect = rectOf('.pavor-dock-die')`, `const prevSides = state.dadoPavor`.
2. Alterar estado, `save`, `render()` (como hoje).
3. `flyParticles(fromRect, toRect, { count: control ? 6 : 16, color: '#c4b5fd', duration: 600 })` (as partículas vivem em `#fx-layer`, sobrevivem ao render). A perda de PD já gera o "−1"/"−5" pela Fase 2.
4. Quando a Promise resolve:
   - **Controlar** e o dado ainda existe: no novo `.pavor-dock-die`, animação de encolher (scale 1→.6→1) + troca de forma `prevSides → state.dadoPavor` (reusar a função da Fase 5 no sentido inverso) + `burst` lilás pequeno.
   - **Controlar** e o dado sumiu (`stepDownPavor(6) === null`): `burst` de fumaça dissipando no `toRect` antigo; som suave descendente.
   - **Abraçar**: o dado ganha `.embraced` (já vem do render): transição para vermelho `#f43f5e` com flash, pulso de brilho vermelho contínuo e leve (`@keyframes embraced-pulse`, 1.6s infinite) enquanto `pavorEmbraced` for verdadeiro. Som: grave + acorde menor curto.
5. Remover os `alert()` de PD insuficiente desse handler e trocar por um "shake" vermelho no botão + toast (manter a mensagem).

**Verificação:** com d8 e PD ≥ 5: Controlar → partículas saem do PD e voam até o dado, que encolhe e vira d6; Abraçar → dado fica vermelho e pulsando; ao rolar um teste, o bônus é consumido e o dado volta ao normal no próximo render.

---

## Fase 7 — Tabelas de Lesão e Trauma: roleta + carta virando

**Novo:** `src/fx/table-reveal.js` exportando `revealTableResult({ table: 'lesao'|'trauma', rows, row, rollLabel, rolled: boolean }) → Promise`.

1. **Gravidade** (`severityOf(row)`):
   - `fatal` (fatal/insane) → preto + vermelho sangue;
   - `grave` (perdas permanentes: `maxPvPenalty`, `maxPdPenalty`, `stepPenalty`, `skillPenalties` com valor negativo, `handLost`, `footLost`, `extraDamage`) → vermelho;
   - `moderada` (temporárias: `tempStepPenalty`, `stunned`, `pavor`) → âmbar;
   - `alivio` (`pvBonus`/`pdBonus` sem `fatal`) → verde-azulado/dourado.
2. **Modal próprio** anexado ao `document.body` (não ao app, por causa do `render()`), com backdrop escuro:
   - Se `rolled` (veio do d20): **roleta** vertical tipo caça-níquel com os nomes da tabela em loop; desacelera (≈1.6s, easeOutCubic sobre um `translateY`) e para no resultado; cada passagem de nome toca um tick (pitch descendo); cor da faixa central muda para a cor de gravidade ao parar.
   - Em seguida, **carta** com frente = verso decorado (estética da Vigília, cores do sistema) que faz `rotateY(180deg)` (CSS 3D: `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`) revelando: faixa do d20 (`rollLabel`), nome, descrição e efeito aplicado. `fatal` treme a carta e escurece a tela; `alivio` brilha.
   - Botão "APLICAR À FICHA" resolve a Promise (também Enter/Esc → aplica; não deixar o usuário fugir sem aplicar, mantendo o comportamento atual que sempre aplica).
   - Se escolhido manualmente (`data-select-*`): pular a roleta, só virar a carta.
3. **Integração** (app.js ~l.3908 e ~l.3934): `await revealTableResult(...)` e só então `applyLesaoChoice/applyTraumaChoice`. Remover o `setTimeout(700)` (o palco de dados ainda está aberto ao resolver — aguardar ~900ms ou `closeDice3d()` antes de abrir o modal). Remover o `alert()` do final de `applyLesaoChoice`/`applyTraumaChoice` (a informação já foi mostrada na carta; manter só o toast "LESÃO APLICADA").
4. Com `fxEnabled()` falso: sem roleta, carta já virada.

**Verificação:** rolar na Tabela de Traumas → d20 3D, roleta para no resultado certo (conferir com o valor do histórico), carta vira com a cor certa; aplicar adiciona a habilidade como hoje; escolher linha manualmente → só a carta.

---

## Fase 8 — Mesa de dados: a rolagem vira uma cena

Referência: Baldur's Gate 3. Em vez de os dados caírem soltos sobre a ficha, uma **bandeja** entra na tela, os dados são jogados dentro dela e cada valor **voa até um placar**, somando com rótulo de origem ("d8 PERÍCIA 5 → + d6 FÍSICO 3 → + EXTRA 2 = 10"). A cena deve ser **mais rápida que no BG3** e é **opcional** (configuração própria). Sem verificação contra DT: a cena termina no total.

A fase é dividida em quatro subfases, nesta ordem. Cada uma é entregue e testada separadamente.

| Subfase | Entrega | Depende de |
|---|---|---|
| 8.1 | Rótulos de origem em cada dado/bônus | — |
| 8.2 | Bandeja 3D + configuração "CENA DE ROLAGEM" + pular/fechar | 8.1 (só para o modo da cena) |
| 8.3 | Soma cinemática (valores voando até o placar) | 8.1, 8.2 |
| 8.4 | Rolar arrastando para dentro da bandeja | 8.2 |

### Orçamento de tempo (vale para 8.2–8.3)

A cena inteira não deve passar de ~3,5 s numa rolagem comum de 2 dados (BG3 leva ~5 s).

| Trecho | Duração |
|---|---|
| Bandeja entra | 220 ms (em paralelo com os dados caindo) |
| Física até assentar | a atual (~1,2–1,8 s; teto de 4,2 s já existe) |
| Sequências de pavor/crítico/falha | as atuais (Fases 3–4) |
| Soma | 450–1000 ms (ver 8.3) |
| Total em destaque | 1,4 s |
| Bandeja sai | 220 ms |

Pular é sempre possível (ver 8.2).

---

### Fase 8.1 — Rótulos de origem (fundação)

Hoje `roll(name, sides, modifier, rollMode)` (`app.js` l.4656) recebe o modificador como um número só, e o `data-roll` das perícias da Vigília (`nome|dadoPerícia,dadoAtributo|extra`) perde a informação de qual dado é qual. Esta subfase só carrega essa informação até o resultado — sem animação nova.

1. **Assinatura:** `roll(name, sides, modifier = 0, rollMode = 'sum', meta = {})` com
   - `meta.dieLabels`: array alinhado com `sides` (ex. `['PERÍCIA', 'FÍSICO']`);
   - `meta.modifierParts`: `[{ label: 'TREINO', value: 5 }, { label: 'EXTRA', value: 2 }]`. Se a soma das partes não bater com `modifier`, acrescentar a diferença como `{ label: 'BÔNUS' }`; se `meta.modifierParts` não vier, usar `[{ label: 'BÔNUS', value: modifier }]` quando `modifier ≠ 0`;
   - `meta.scene`: `'full' | 'quick'` (usado na 8.3; default `'quick'`).
   Copiar `dieLabels[i]` para `diceConfigs[i].label` (o campo `label` já existe para o pavor). O dado de pavor e o "Bônus Pavor" abraçado mantêm os rótulos atuais, mas curtos: `PAVOR` e `PAVOR ABRAÇADO`.
2. **Passar adiante:** `rollDice3d(diceConfigs, name, modifier, soundContext, rollMode, options = {})` com `options.modifierParts` e `options.scene`. (A 8.4 acrescenta `options.throw` no mesmo objeto.)
3. **Chamadores** (procurar `roll(` e `rollExpression(` em `app.js`):
   - Handler `[data-roll]` (l.5095): ler um novo atributo `data-roll-labels="PERÍCIA|FÍSICO"`; `scene: 'full'`. Adicionar `data-roll-labels` onde o `data-roll` é gerado: atributos e perícias em `vigilia-view.js` (l.267–289, l.381), `renderTraditional` e `renderCinematic` em `app.js`. Atributo sozinho → `[nomeDoAtributo]`; perícia → `['PERÍCIA', skill.attribute]`. O valor do campo extra → `modifierParts: [{ label: 'EXTRA', value }]`.
   - `rollOriginalSkill` (l.4706): `modifierParts` = treino / extra / poder (`totalMod` já é a soma deles, l.4716); `scene: 'full'`. Mesmo tratamento para atributo, resistência, sentidos e ataque (`scene: 'full'`).
   - Dano, `rollExpression`, ações de cards, invocações, tabelas de Lesão/Trauma, "Preencher Espaço": `scene: 'quick'`. Nas expressões, a parte fixa vira `{ label: 'BÔNUS' }`.
4. **`showResult`** (`dice3d.js` l.260): em cada `roll-die-tag`, mostrar o rótulo abaixo do valor (`<b>5</b><small>PERÍCIA</small>`, 8px, maiúsculas, `letter-spacing:.12em`) e trocar o `modifierLabel` único por um chip por parte (`+5 TREINO`). As tags passam a ter `roll-die-tag` sempre que houver rótulo.
5. **Histórico:** incluir `label` em cada item de `dice` passado para `addRollLogEntry` e as `modifierParts`; o render do histórico mostra os rótulos se existirem (entradas antigas continuam funcionando sem eles).

**Verificação:** rolar perícia na Vigília → a pílula mostra "5 PERÍCIA + 3 FÍSICO + 2 EXTRA"; perícia no Ordem 1 → "TREINO"/"EXTRA" separados; pavor continua com o rótulo e o visual atuais; histórico antigo abre sem erro.

---

### Fase 8.2 — Bandeja 3D e configuração

1. **Configuração:** `appSettings.rollScene` (default `true`) com `appRow('rollScene', 'CENA DE ROLAGEM', 'Bandeja de dados e soma animada dos bônus. Desligada, os dados rolam soltos sobre a ficha.')` em `renderCriticalSettings()`, logo abaixo de "ANIMAÇÕES DE JOGO". Helper em `ui-fx.js`: `rollSceneEnabled()` = `fxEnabled() && rollScene` (registrar o getter como em `setFxEnabledGetter`). **Com ela desligada, o comportamento tem de ser idêntico ao atual.**
2. **Módulo novo `src/fx/dice-tray.js`:** `createTray({ scene, boundsX, boundsZ, floorY, accent })` → `{ group, enter(), exit() → Promise, update(now), dispose() }`.
   - Fundo: `PlaneGeometry(boundsX*2, boundsZ*2)` com `MeshStandardMaterial` escuro (`#14121b`, `roughness .95`), `receiveShadow`, e uma `CanvasTexture` gerada uma vez (256×256): ruído sutil de feltro + um selo circular apagado no centro (traço `accent` com alpha .08). Substitui o `ShadowMaterial` atual (l.391) **só no modo cena**.
   - Borda: moldura com `Shape` retangular arredondada + furo (`ExtrudeGeometry`, `depth .28`, `bevelEnabled`), cor `#1d1b24`, com um filete fino no topo (`LineSegments` ou um segundo extrude fino) na cor `accent` com `emissive` leve. A borda interna deve coincidir com `boundsX`/`boundsZ`: as paredes da física (l.380–389) **não mudam**, a bandeja só as torna visíveis.
   - `enter()`: `group.position.y` de −2,5 → 0 e `scale` .92 → 1 em 220 ms (easeOutCubic). Os dados são lançados ao mesmo tempo: a bandeja chega antes do primeiro contato.
   - `exit()`: desce e some (opacity dos materiais → 0) em 220 ms; resolve a Promise ao fim.
   - `dispose()`: libera geometrias, materiais e a textura.
3. **Integração em `rollDice3d`:** `const sceneMode = rollSceneEnabled()`. No modo cena:
   - `#dice-stage.scene-mode`: fundo `#05060b8c` com `backdrop-filter: blur(2px)` (transição de 180 ms) e `pointer-events: auto` (para o pular). Sem `scene-mode`, manter o estilo atual (l.300 do `styles.css`).
   - Câmera mais alta para enxergar o fundo da bandeja (ponto de partida: `position(0, 5.4, 7.6)`, `lookAt(0, -.7, 0)`; ajustar até a bandeja ocupar ~70% da largura em 1440×900 e caber inteira em 390×844 retrato). As sequências de crítico (zoom) devem partir da câmera atual, não de valores fixos.
   - Fechamento automático: 1,4 s depois do total final (8.3) em vez dos 4,2 s atuais; `closeDice3d` vira `closeDice3d({ immediate = false })`: no modo cena chama `tray.exit()` e só então limpa; `immediate` (nova rolagem começando) limpa na hora.
4. **Pular / fechar** (só modo cena): clique no palco, `Espaço` ou `Esc`.
   - 1º gesto antes do resultado: acelerar — `world.step` com passo 3× até assentar, chamar `finish()` na sequência ativa e nas da fila, e mostrar a soma já no valor final (8.3: `skipToEnd()`).
   - Gesto depois do resultado: fecha (`exit()`).
   - O clique no botão "HISTÓRICO" da pílula não conta como gesto.
   - Listener de teclado instalado só enquanto o palco está ativo; removido em `closeDice3d`.
5. **Movimento reduzido:** bandeja aparece/sai sem deslocamento (só opacidade, 120 ms).

**Verificação:** com a configuração ligada → bandeja entra, dados quicam nas bordas visíveis, fecha sozinha ~1,4 s após o total; clicar acelera e um segundo clique fecha; Esc idem. Desligada → igual a hoje. Desktop e celular retrato: a bandeja cabe. 10 rolagens seguidas: `renderer.info.memory` estável.

---

### Fase 8.3 — Soma cinemática

**Módulo novo `src/fx/dice-sum-fx.js`:** `createSumSequence({ camera, canvasRect, dice, outcome, modifierParts, title, rollMode, reducedMotion, onDone })` → `{ update(now), finish(), skipToEnd() }`, mesma interface das outras sequências. Os elementos DOM vivem em `getFxLayer()` (sobrevivem a `render()`; conferir que o z-index do `#fx-layer` fica acima do `#dice-stage` no modo cena).

1. **Quando roda:** só com `rollSceneEnabled()` e `options.scene === 'full'`. Entra **no fim da fila** de sequências (`pavor → crítico/falha → soma`); o `onReveal` passa a ser dela. Com `scene: 'quick'`, nada muda (contagem da Fase 1).
2. **Placar:** aparece acima da bandeja (posição = borda de trás da bandeja projetada para a tela), com o título da rolagem em cima e o total em `0`. Entra com fade + `translateY(-8px → 0)`, 160 ms.
3. **Ordem dos itens:** dados contados na ordem do `diceConfigs` (perícia, atributo, pavor abraçado...), depois as `modifierParts`. Ritmo: `step = clamp(600 / nItens, 110, 220)` ms entre o início de cada item, sobrepostos.
4. **Cada dado:**
   - Posição na tela: `mesh.position.clone().project(camera)` → pixels via `canvasRect`.
   - Um chip (`<b>5</b><small>PERÍCIA</small>`, cor de fundo = cor do dado) surge sobre o dado (scale .4 → 1, 120 ms) e voa até o placar (bezier como `flyParticles`, 260 ms, easeInCubic).
   - Ao chegar: `countUp` do total parcial anterior para o novo (`duration: 140`), tick (`playTick`), "punch" no placar e um brilho curto no dado 3D (emissive na cor do dado, 200 ms).
5. **Casos especiais:**
   - **Dado destruído pelo pavor:** o chip sai roxo e, no meio do caminho, racha e se desfaz (`burst` roxo pequeno); não soma.
   - **Dado de pavor que não destruiu nada:** não voa (o pavor não soma); só pulsa uma vez.
   - **`highest`/`lowest` (Ordem 1):** todos os chips surgem; os descartados ficam cinza e caem 20 px com fade; só o escolhido voa. O placar mostra "MAIOR"/"MENOR" no lugar do título por 400 ms.
   - **`modifierParts`:** chips `+5 TREINO` entram pela lateral do placar (slide 160 ms) e somam; valores negativos em vermelho (`−2 PENALIDADE`).
   - **Crítico/falha:** depois do último item, o placar recebe `.crit` (brilho dourado + punch maior) ou `.fumble` (dessaturado); os sons já são das Fases 3–4.
6. **Fim:** `onDone()` → `showResult` com o total já final (passar `skipCount: true` para não contar de novo) e o placar se funde na pílula: o placar faz fade enquanto a pílula aparece; a pílula mantém o botão de histórico. O fechamento automático (8.2) conta a partir daqui.
7. **`skipToEnd()`:** remove chips em voo e escreve o total final direto no placar.
8. **Movimento reduzido:** sem voo; os chips aparecem já no placar em sequência rápida (60 ms) e o total é escrito direto.
9. **Limpeza:** todo nó criado é removido no `finish()`; `closeDice3d` chama `finish()` da sequência ativa (já acontece com `activeSequence`).

**Verificação:** `window.__forceDice = [5,3]` numa perícia com extra 2 → "5 PERÍCIA", "3 FÍSICO", "+2 EXTRA" voam, placar 0 → 5 → 8 → 10; `[6,6]` → crítico primeiro, depois a soma com placar dourado; pavor destruindo um dado → chip roxo se desfaz; perícia do Ordem 1 com 3d20 → 2 descartados caem, 1 voa; dano de arma (`quick`) → sem soma cinemática; clicar no meio → total final na hora. Cronometrar uma perícia comum: ≤ 3,5 s do clique ao fechamento.

---

### Fase 8.4 — Rolar arrastando (força e direção)

1. **Captura do gesto** em `src/fx/drag-roll.js`, instalado uma vez com listeners no `document` (sobrevive ao `render()`):
   - Seletor de gatilhos de rolagem: `[data-roll], [data-expression], [data-roll-table], [data-roll-lesao-check], [data-roll-trauma-check], [data-threat-roll-pericia]` (procure em `app.js` por outros `data-*roll*` e inclua; ignore os excluídos pelo próprio handler de `[data-roll]`, ex. `.custom-select`, inputs).
   - `pointerdown` num gatilho: guardar ponto inicial e tempo. Mouse/caneta: entra em modo "mira" ao mover > 12px. Toque: só entra em mira após segurar 250ms sem mover (não quebrar o scroll no celular).
   - Em mira: desenhar em `#fx-layer` uma seta/linha do ponto inicial até o ponteiro, com anel de força preenchendo (`power = clamp(dist / 220, .15, 1)`), cor do dado (`state.diceColor`). Adicionar `.drag-aiming` ao `body` (cursor `grabbing`, `user-select:none`).
   - `pointerup`: guardar `pendingThrow = { dx, dy, power }` (normalizado em pixels de tela; `dy` positivo = para cima) e disparar `trigger.click()` manualmente; suprimir o click nativo seguinte (flag + `click` capture com `stopImmediatePropagation` uma vez). `pointercancel`/Esc cancela sem rolar.
   - Exportar `takePendingThrow()` (retorna e zera).
2. **`roll()` em app.js:** `const throwVec = takePendingThrow()` e incluir em `options.throw` (o mesmo objeto de opções criado na 8.1).
3. **`dice3d.js`:** se `options.throw`, colocar `world.throwVec`; em `createDie`, quando existir:
   - direção no mundo: `dir = normalize(dx, 0, -dy)` (arrastar para cima = jogar para o fundo da bandeja);
   - posição inicial: junto da borda oposta à direção, **dentro da bandeja** (`-dir * boundsX*.7` em x, `-dir * boundsZ*.7` em z), altura 1.8–2.6, espalhando por `offset` perpendicular a `dir`;
   - velocidade: `dir * (3.5 + power * 7)` + `y = -2.5 - power * 2`; `angularVelocity` escalado por `.6 + power * .8`;
   - a trava de segurança dos limites (já existente em `animate`) continua valendo.
   - Sem `throw`: manter os 4 lançamentos aleatórios atuais.
4. **Com a cena ligada:** um arremesso forte faz a bandeja dar um tranco curto no primeiro impacto contra a borda (`group.position` ±0,04 em 120 ms, sem tremor de câmera com movimento reduzido).

**Verificação:** clicar normalmente → igual a hoje; arrastar para a direita forte → dados vêm da esquerda rápidos e batem na borda direita da bandeja; arrasto curto → fraco; no celular, rolar a página não dispara mira; segurar e arrastar dispara; com a cena desligada o arrasto funciona igual (sem bandeja visível).

---

## Modo de teste (dev) — necessário para as fases 3, 4, 6, 7 e 8.3

Em `dice3d.js`, apenas com `import.meta.env.DEV`: se `window.__forceDice` for um array (ex. `[6,6]`, `[1,1]`, `[3,5,4]` com pavor no último), usar esses valores no lugar de `dice.map(topFace)` e, para coerência visual, rotacionar cada malha/corpo para que a face com o valor forçado fique para cima (quaternion de `face.normal` → `(0,1,0)` multiplicado por uma rotação aleatória em Y) **antes** de iniciar as sequências. Limpar após uso (`window.__forceDice = null`). Nunca ativo no build.

## Verificação geral (ao fim de cada fase)

1. `npm run dev` e abrir uma ficha da Vigília (pasta "Personagens Vigília") e uma ficha cinematic/original.
2. Testar o caso da fase + regressão: rolagem simples, rolagem com pavor (destrói/vence/resiste), clique em pips, troca de ficha, modo apresentação.
3. DevTools → Rendering → `prefers-reduced-motion: reduce` e toggle "ANIMAÇÕES DE JOGO" desligado: tudo funciona, sem animações decorativas.
4. Console sem erros; após 10 rolagens seguidas a memória/FPS não degrada (conferir `renderer.info.memory` para vazamento de geometrias).
5. `npm run build` passa.
6. Entregar um resumo da fase (o que mudou, arquivos, como testar). Não commitar.

## Ordem recomendada

0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.1 → 8.2 → 8.3 → 8.4. As fases 1–2 são as de maior impacto com menor risco; 3–4 dependem da fila de sequências; 6 depende de 2 e 5. Na Fase 8, a 8.1 é independente e já melhora a pílula de resultado; 8.3 depende de 8.1 e 8.2; 8.4 só depende de 8.2.
