# Ficha Ordem Paranormal II

Reprodução local e responsiva da ficha do playtest Alpha de Ordem Paranormal RPG 2, seguindo a estética de **A Maldição do Ídolo de Pedra**. Funcionalidade inspirada no Mini Kraken.

## Incluído

- layout de três colunas com faixas rasgadas, tipografia editorial;
- Atributos de Físico, Mente e Emoção apresentados em SVGs facetados próprios para d4, d6, d8, d10, d12 e d20;
- PV e PD em marcadores individuais, sólidos e editáveis;
- tabela de perícias com treinamento, atributo e dados;
- painéis de História, Itens e Habilidades;
- editor de cards customizáveis com coleção, título, tipo, ícone, cor, imagem, apresentação, conteúdo, cargas e botão de rolagem;
- cards reordenáveis por controles ou arrastar e soltar, recolhíveis e duplicáveis;
- persistência local e resultado de dados em modal.

# Ficha-Ordem-II

## Integração com a mesa

`src/mesa.js` liga a Ficha à plataforma da campanha (contrato em `Atlas/docs/PLATAFORMA.md`): publica as personagens (não as ameaças) com o retrato, emite `ficha.rolagem` e `ficha.recursos` e atende `ficha.abrir`. Só age com uma campanha ativa (`mesa:campanha-ativa`) e com `BroadcastChannel` e IndexedDB; sem eles, a Ficha funciona como antes. `vendor/mesa-core/` é cópia de `Atlas/mesa-core/dist` (`npm run build:core` no Atlas). Para testar junto com o Atlas: `npm run dev:mesa` aqui e `node scripts/mesa-dev.ts Atlas=5190 Ficha=5173` no Atlas. `npm test` roda o teste do módulo.
