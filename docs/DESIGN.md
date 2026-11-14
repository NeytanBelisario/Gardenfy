# Design system do Gardenfy

Introduzido na 1.3.0, sem mudar a identidade visual: os mesmos valores que já estavam espalhados pelas telas passaram a ter nome.

## Tokens (`src/theme/tokens.ts`)

- **`colors`**: `ink` (verde-escuro da marca: títulos, botão principal, hero), `text`/`textSoft`/`textLead` (textos secundários), `accent`/`accentStrong` (verde de ações e ícones), `background`, `surface*`, `border*`, `danger`, pares temáticos `water`/`waterTint`, `sun`/`sunTint`, `leafTint`, `ai`/`aiTint` (selo "Estimativa da IA") e `onInk` (texto sobre fundo escuro).
- **`space`**, **`radius`**, **`font`**: escalas de espaçamento, cantos e tamanhos de fonte para telas novas.
- **`minTouch`**: 48 dp, o alvo mínimo de toque.

Use os tokens em código novo. Os valores literais que sobraram (tons pontuais do hero, chips e estados de erro do toast) aparecem uma ou duas vezes e podem virar token quando ganharem um segundo uso.

## Componentes (`src/components/ui`)

- **`Button`**: `primary`, `secondary` ou `soft`, com ícone opcional, estados desabilitado/ocupado anunciados e altura mínima de 52 dp.
- **`Card`**: superfície branca com borda (`default`) ou verde-clara (`muted`).
- Já existente: `PlantPhoto`.
- Rega (`src/features/gardens`): `CycleTimer` (timer de dias em segmentos, com modo compacto) e `waterPresentation` (texto da próxima rega, cores por estado e selo de situação), usados na página da planta e no card do jardim.

## Acessibilidade

- Alvos de toque de pelo menos 48 dp (ou 44 dp com `hitSlop` para ícones dentro de cartões).
- `useAccessibilityPrefs` (`src/hooks`) informa se o leitor de tela e o "reduzir movimento" estão ativos. O toast de Desfazer fica três vezes mais tempo com leitor de tela, e as animações (`usePopOnTrue`) não rodam com "reduzir movimento".
- Telas estreitas: `useCompactLayout` (largura lógica < 380 dp, considerando a fonte ampliada).
