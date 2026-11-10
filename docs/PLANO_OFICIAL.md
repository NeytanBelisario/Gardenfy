# Plano oficial de desenvolvimento — Gardenfy

> Fonte única dos próximos desenvolvimentos, a partir de 09/11/2026. Visualização: [plano-oficial.html](plano-oficial.html) (abrir no navegador). Os dois arquivos são atualizados juntos.
>
> O [ROADMAP.md](ROADMAP.md) continua como histórico do que já foi entregue até a 1.1. Daqui em diante, ordem de versões, escopo e ideias novas ficam aqui.

## 1. Como usar este plano

- **Ideia nova:** entra primeiro na [Caixa de ideias](#7-caixa-de-ideias) com o status `ideia`. Só ganha versão depois de passar pela análise (valor, custo, dependências e riscos).
- **Status possíveis:** `ideia` → `analisada` → `planejada (versão)` → `em andamento` → `entregue` | `descartada`.
- **Uma versão só começa** quando o usuário pedir explicitamente. Este plano não autoriza implementar antecipadamente (regra do AGENTS.md).
- **Mudança de ordem ou de escopo:** atualize este arquivo e o HTML no mesmo commit, registrando a data e o motivo em [Histórico de decisões](#9-histórico-de-decisões).
- **Ao entregar:** marque como `entregue`, ligue o PR e as notas em `docs/releases/`, e mantenha [HANDOFF.md](HANDOFF.md) como diário das sessões.

## 2. Versionamento

A sugestão original era `1.x` (feature) → `1.x.x` (ajuste da feature) → `1.x.x.x` (ajuste mínimo). A intenção está mantida, mas **o quarto número não é usado**:

- `package.json`/npm exige semver de três partes, e `1.1.1.1` quebra `npm`.
- No iOS, `CFBundleShortVersionString` aceita no máximo três números.
- O `runtimeVersion` segue `appVersion`: um update OTA só chega a quem tem a mesma versão. Por isso o "ajuste mínimo" já tem um lugar natural, que é o OTA.

| Nível | Formato | Quando | Como sai |
|---|---|---|---|
| **Marco** | `X.0.0` | Mudança grande de produto ou incompatível (ex.: lançamento público na Play Store) | Build novo (AAB/APK) |
| **Feature** | `1.X.0` | Uma feature nova do plano, ou um conjunto coerente de features | Build novo, `versionCode` +1 |
| **Ajuste** | `1.x.Y` | Ajustes e correções de features que já existem, inclusive quando muda código nativo ou dependência | Build novo, `versionCode` +1 |
| **Ajuste mínimo** | `1.x.y · OTA n` | Texto, cor, layout, correção só em JavaScript | `eas update --channel production`, sem mudar a versão; registrado nas notas da versão como "OTA n" |

Regras complementares:

- `versionCode` do Android aumenta a cada build distribuído, nunca volta.
- Features ficam numa `feat/<nome>` (ou `release/1.X.0`, como na 1.1.0) com PR para `develop`. A promoção para `main` acontece por versão.
- Um ajuste mínimo que precisa de dependência nativa deixa de ser OTA e vira `1.x.Y`.

## 3. Linha do tempo

| Versão | Tema | Status | Tamanho |
|---|---|---|---|
| **1.1.0** | Dia a dia: Para hoje, rega rápida, barras, sequência, lembretes | `entregue` em `develop` (validação no celular na 1.6) | — |
| **1.1.1** | Ajustes da 1.1: telas estreitas, avisos do web | `entregue` em `develop` | P |
| **1.2.0** | Cuidados para qualquer espécie (estimativa por IA + catálogo maior) | `entregue` em `develop`, função ativa em produção | M |
| **1.3.0** | Interface e base de produto (design system, onboarding, acessibilidade, privacidade, monitoramento) | `em andamento` (monitoramento e privacidade na 1.3.1) | M |
| **1.4.0** | Conta e sincronização (login, backup na nuvem, exclusão de conta) | `planejada (1.4.0)` | G |
| **1.5.0** | Moedas, conquistas e perfil | `planejada (1.5.0)` | G |
| **1.6.0** | Saúde da planta (análise por foto) | `planejada (1.6.0)` | G |
| **2.0.0** | Lançamento na Play Store + Gardenfy Plus (planos pagos, teste grátis) | `planejada (2.0.0)` | G |
| **2.1.0** | Ranks e ligas | `planejada (2.1.0)` | M |
| **2.2.0** | Floriculturas parceiras (piloto de kits e pedidos) | `analisada` | G |

Tamanho: **P** é cerca de uma semana de trabalho, **M** de duas a três semanas e **G** um mês ou mais, com sessões no ritmo atual. É uma ordem de grandeza para comparar as versões, não um prazo.

### Por que essa ordem

1. **A IA de cuidados (1.2) vem primeiro** porque reaproveita a infraestrutura Supabase que já existe e faz as barras funcionarem para qualquer espécie. Sem isso, moedas e rotina recompensam só quem tem uma das quatro espécies com ficha.
2. **A interface (1.3) vem antes da conta** porque login, perfil, loja de moedas e planos são muitas telas novas. Com componentes e onboarding prontos, elas saem consistentes e mais rápido.
3. **A conta (1.4) é a base de quase tudo:** moedas e ranks precisam de saldo no servidor (no aparelho dá pra manipular), planos pagos precisam associar a compra a alguém, e a sincronização evita perder dados ao trocar de celular.
4. **Moedas (1.5) antes da Saúde (1.6):** uma economia que já está rodando dá à análise de saúde uma forma de controlar o custo (créditos e moedas) sem depender de pagamento.
5. **Play Store e planos pagos juntos (2.0):** o Google Play Billing só funciona com o app distribuído pela Play. O teste fechado deve começar já na 1.4 (ver [requisitos da Play](#61-play-store)).
6. **Ranks (2.1) e floriculturas (2.2) depois do lançamento:** ranking precisa de base de usuários para ter graça, e floricultura exige parceria, logística e questões legais. Os dois dependem de usuários reais.

## 4. Fechamento da 1.1

### 1.1.0 — `entregue` em `develop`

Integrada em `develop` pelo [PR #26](https://github.com/NeytanBelisario/Gardenfy/pull/26) (detalhes em [releases/1.1.0.md](releases/1.1.0.md)). APK, validação no celular e promoção para `main` ficam para a 1.6 (ver [testes adiados](#testes-adiados-até-a-16)).

### 1.1.1 — `entregue` em `develop`

Branch `release/1.1.1`, notas em [releases/1.1.1.md](releases/1.1.1.md).

- [x] Layout em celulares estreitos: `useCompactLayout` (largura lógica < 380, considerando fonte ampliada), paddings menores, botão da barra virando ícone, título e estado menores, botões de registro empilhados.
- [x] Limpeza dos avisos `shadow*` (agora `boxShadow`) e `pointerEvents` (agora estilo) no web.
- [x] Adubação: a frase "Última adubação" fica como está; frequência própria volta para a Caixa de ideias (avaliar depois da 1.2).

### Testes adiados até a 1.6

Decisão de 10/11/2026: as versões 1.1.0 a 1.5.0 seguem sem APK nem validação no celular. Cada versão continua passando por `npm run check` (typecheck, lint e testes automatizados); a validação completa no aparelho acontece na 1.6, cobrindo tudo o que foi entregue desde a 1.1.0. Até lá, nada é promovido para `main` nem publicado como release.

## 5. Features planejadas

Cada feature tem objetivo, escopo da primeira entrega, o que fica fora, arquitetura, riscos e o que é preciso do usuário.

### 1.2.0 — Cuidados para qualquer espécie

> **Status (10/11/2026): `entregue` em `develop` ([PR #29](https://github.com/NeytanBelisario/Gardenfy/pull/29)).** Código (notas em [releases/1.2.0.md](releases/1.2.0.md)): função `estimate-care`, tabela `care_estimates`, `CareEstimate` salvo na planta, sincronização em segundo plano, selo "Estimativa da IA" e 30 fichas curadas. Deploy feito em 10/11/2026: migração `care_estimates` aplicada, função `estimate-care` publicada e testada com chamadas reais (espécie conhecida, resposta vinda do cache e espécie inexistente com `known: false`). Diferença do escopo original: em vez de um cache separado no AsyncStorage, a estimativa fica salva na própria planta (`careEstimate`), o que faz Para hoje, lista do jardim e lembretes usarem a estimativa sem nova chamada.

**Objetivo:** as barras de Água e Luz funcionarem para qualquer espécie identificada pelo Pl@ntNet, não só para as quatro que têm ficha.

**Escopo:**
- Tipo `CareEstimate` (`scientificName`, `wateringDays {min,max}`, `lightFit`, `source: 'ai'`, `model`, `generatedAt`) e parser validador: dias inteiros de 1 a 60, `min ≤ max`, só `ideal|ok|poor`.
- Edge Function `estimate-care`: recebe só `{ scientificName, commonName? }`. Reaproveita `consumeQuota` com orçamento diário próprio (`gemini-global:<dia>`). Usa Gemini Flash-Lite com `responseSchema` e temperatura 0, e pode responder "desconhecida". A resposta é validada de novo no servidor.
- Tabela `care_estimates` como cache compartilhado por espécie: cada espécie custa uma chamada no total, não uma por usuário.
- Cliente: `careEstimateService.ts`, cache em AsyncStorage e `getCareReference(plant)` usada em `watering.ts`, `light.ts` e `LightSpotDialog.tsx`.
- **Prioridade na barra:** intervalo definido pelo usuário → ficha curada → estimativa da IA → "sem dados".
- Selo **"Estimativa da IA"** e o texto "referência da espécie, não medição".
- Ampliar as fichas curadas com as espécies mais comuns (meta inicial: 20 a 30).

**Fora:** a IA não gera texto de cuidado e não lê a foto (a foto continua só identificando a espécie).

**Riscos:** a IA errar a faixa (mitigado pelo intervalo editável e pelo selo), cota do plano free e mudança nos termos do Gemini.

**Precisa do usuário:** chave Gemini do AI Studio num projeto sem faturamento, cadastrada como secret `GEMINI_API_KEY`; ok para `supabase db push` e para o deploy da função; aceitar que o plano free pode usar as requisições para treino (só vai o nome da espécie).

### 1.3.0 — Interface e base de produto

> **Status (10/11/2026): `em andamento`** na branch `release/1.3.0`, mantendo a identidade visual atual (decisão do usuário). Feito: tokens e componentes base ([DESIGN.md](DESIGN.md)), primeiros passos na tela inicial, alvos de 48 dp, toast de Desfazer adaptado ao leitor de tela e animações leves que respeitam "reduzir movimento". Monitoramento e política de privacidade dependem do usuário e viram uma 1.3.1. Notas em [releases/1.3.0.md](releases/1.3.0.md).

**Objetivo:** deixar o app com cara de produto antes de crescer em número de telas, e cumprir o básico que a loja exige.

**Escopo:**
- **Design system:** tokens de cor, espaçamento e tipografia num só lugar e componentes base (botão, card, chip, sheet, estado vazio, estado de erro), migrando as telas atuais.
- **Onboarding** em três passos: criar o primeiro jardim, adicionar uma planta (foto ou catálogo) e ativar lembretes.
- **Acessibilidade:** passada com TalkBack, alvos de 48 dp, contraste e fonte ampliada (pendências que vêm da 1.0).
- **Monitoramento:** relatório de falhas (ex.: Sentry, que tem plano free) e métricas de uso anônimas e mínimas (retenção D1/D7, plantas por usuário, regas por semana) para saber se o app está funcionando.
- **Privacidade:** política de privacidade publicada (URL obrigatória na Play) e tela "Seus dados".
- Animações leves de feedback: rega, sequência e conclusão do Para hoje.

**Fora:** tema escuro completo (avaliar), tablet e iOS.

**Precisa do usuário:** direção visual (referências, paleta, se a logo segue igual), conta no serviço de monitoramento e texto/aceite da política de privacidade.

### 1.4.0 — Conta e sincronização

**Objetivo:** dados que não se perdem e uma identidade para moedas, perfil e compras.

**Escopo:**
- **Supabase Auth:** login com Google (o mais simples no Android) e e-mail com link mágico. Login **opcional**: o app continua funcionando localmente sem conta.
- **Modelo:** tabelas `profiles`, `gardens`, `plants`, `care_events` e `plant_photos` (Storage) com RLS por `auth.uid()`.
- **Sincronização offline-first:** o aparelho continua sendo a fonte da verdade no uso. As mudanças vão para uma fila e sobem quando há rede. Conflito resolvido por `updatedAt` (último a gravar vence), com eventos de cuidado só acrescentados, nunca sobrescritos.
- **Migração:** ao criar a conta, o que já está no aparelho sobe para a nuvem sem perda (com teste de migração).
- **Exclusão de conta** dentro do app e por um link na web (exigência da Play).
- Notificações continuam locais.

**Riscos:** é a mudança mais delicada do plano (persistência). Pede testes de migração e de conflito e um plano de rollback. No Supabase free, o projeto pausa depois de uma semana sem atividade e os limites de banco e Storage são baixos. Para produção, avaliar o plano Pro.

**Precisa do usuário:** projeto OAuth no Google Cloud (SHA-1 da assinatura de produção), decidir os métodos de login e confirmar a assinatura definitiva do Android (pendência que vem da 1.0).

**Paralelo:** criar a conta de desenvolvedor da Play e começar o **teste fechado** nesta versão.

### 1.5.0 — Moedas, conquistas e perfil

**Objetivo:** recompensar o cuidado constante e trazer a pessoa de volta todo dia.

**Escopo:**
- **Duas moedas, papéis diferentes:**
  - **XP** (não se gasta): define o nível do perfil.
  - **Sementes** 🌱 (se gastam): a moeda de troca.
- **Como ganhar (regras do servidor, com limite diário):**
  - Regar uma planta que **estava devida** hoje. Regar fora do dia não dá nada, para não recompensar regar demais.
  - Concluir o Para hoje.
  - Marcos de sequência (7, 30 e 100 dias).
  - Primeiro jardim, primeira planta, espécie nova no jardim.
  - Missões semanais simples.
- **Livro-razão no servidor:** tabela `coin_transactions` só de inserção, gravada por uma Edge Function que valida a regra e o limite. Saldo é a soma. Offline, os eventos vão para a fila e a recompensa é confirmada ao sincronizar.
- **Onde gastar (necessário para a moeda ter valor):** temas de jardim, vasos ilustrados, molduras de perfil, créditos extras de análise de saúde (1.6) e, no futuro, cupons de parceiros (2.2).
- **Conquistas e perfil:** medalhas, nível, sequência, número de plantas, "jardineiro desde".
- **Sementes não são vendidas** na primeira entrega. Vender moeda virtual obriga a usar o Play Billing e aproxima de regras de loot box. Fica para avaliar depois do 2.0.

**Riscos:** fraude (regas falsas). Mitigação: só a rega devida rende, há teto diário e a regra está no servidor. Também existe o risco de a recompensa substituir a motivação real: a moeda deve reforçar o cuidado, não virar o objetivo.

**Precisa do usuário:** valores da economia (quanto vale cada ação e quanto custa cada item), a lista de itens cosméticos e a arte dos itens.

### 1.6.0 — Saúde da planta

**Objetivo:** uma aba **Saúde** onde a pessoa fotografa qualquer planta (inclusive uma que achou na rua) e recebe possíveis problemas e como ajudar.

**Escopo:**
- Fluxo separado da identificação: foto → possíveis problemas (pragas, fungos, falta ou excesso de água, queimadura de sol, deficiência de nutrientes) → confiança **qualitativa** (provável, possível) → o que fazer → quando procurar ajuda.
- **Provedor (decidir no início da versão):**
  - **Gemini com visão:** barato, genérico, risco maior de alucinação.
  - **Kindwise plant.health:** especializado, pago por chamada.
  - Verificar se o Pl@ntNet oferece algo para doenças.
  - Comparar qualidade com um conjunto de 20 a 30 fotos reais antes de escolher.
- Edge Function `analyze-health` com cota por usuário (exige conta, 1.4). Sem conta, a cota fica bem pequena.
- Histórico de análises por planta. Opção de vincular a uma planta do jardim.
- **Cota:** algumas análises grátis por mês, Plus com mais, e moedas compram créditos extras.
- Aviso claro de que é estimativa da IA e não diagnóstico definitivo, seguindo a regra do AGENTS.md de separar estimativa de medição.

**Mudança de decisão:** a 1.0 tirou o diagnóstico de doenças e os percentuais derivados da foto. Esta versão traz o diagnóstico de volta como **feature explícita e opcional**, sem reintroduzir os percentuais de água e luz tirados da foto. Atualizar a regra correspondente no AGENTS.md quando a versão começar.

**Precisa do usuário:** escolha do provedor (depois do comparativo), orçamento mensal de IA e fotos reais para o teste.

### 2.0.0 — Play Store + Gardenfy Plus

**Objetivo:** lançamento público e primeira receita.

**Escopo:**
- **Loja:** AAB pelo EAS, ficha da loja (textos, capturas, ícone, vídeo opcional), formulário de Segurança de dados, classificação etária, política de privacidade, link de exclusão de conta e `targetSdk` exigido no ano.
- **Gardenfy Plus:** assinatura mensal e anual com **teste grátis de 7 dias** (oferta do Play Billing).
- **Integração:** RevenueCat (`react-native-purchases`, com plano free até um teto de receita) ou `react-native-iap`. Webhook grava o direito (`entitlements`) no Supabase, e o servidor é quem decide o que está liberado.
- **O que o Plus libera (proposta):** mais análises de saúde, temas exclusivos, mais fotos por planta e estatísticas avançadas. **Não colocar atrás do pagamento:** cuidados, lembretes, barras, sincronização básica. Isso é o que faz a pessoa ficar.
- Tela de planos, restaurar compras e gerenciar assinatura.

**Riscos:** reprovação na revisão da Play (dados e permissões), taxa da Play (15% no primeiro milhão anual, conferir na época) e obrigações fiscais da receita.

**Precisa do usuário:** conta de desenvolvedor da Play (taxa única), perfil de pagamentos (merchant), testadores para o teste fechado, preços e o que entra no Plus.

### 2.1.0 — Ranks e ligas

**Escopo:**
- **Ligas semanais** por XP em grupos pequenos (cerca de 30 pessoas parecidas), com subida e descida de divisão. Evita o ranking global, onde só os primeiros se motivam.
- **Amigos:** seguir por código ou link e ver a sequência dos amigos.
- **Perfil público opcional:** desligado por padrão (LGPD e menores de idade), com apelido e sem nome real obrigatório.
- Prêmio semanal em sementes e medalhas de liga.

**Riscos:** trapaça (mitigada pelas regras de XP do 1.5), moderação de apelidos e avatares, e privacidade.

**Precisa do usuário:** confirmar se quer o aspecto social (amigos) ou só ligas anônimas.

### 2.2.0 — Floriculturas parceiras (`analisada`)

**Objetivo:** do "quero essa planta" ao "pedido pronto": kits com planta, vaso e substrato montados por uma floricultura parceira.

**Em três fases, para validar antes de investir:**
1. **Piloto sem pagamento no app:** uma ou duas floriculturas locais, um catálogo curado de kits (tabela `partner_kits`) e um botão "Pedir" que abre o WhatsApp do parceiro com a mensagem pronta. Medir cliques e pedidos.
2. **Catálogo dos parceiros:** painel simples para o parceiro cadastrar kits, cupons pagos com sementes e comissão por pedido.
3. **Checkout no app:** só se a fase 2 der certo. Envolve intermediação de pagamento (ex.: split de pagamento), nota fiscal, logística e responsabilidade de marketplace (CNPJ, termos).

**Precisa do usuário:** contatos de floriculturas, modelo de ganho (comissão ou assinatura do parceiro) e, a partir da fase 3, estrutura jurídica.

### Contínuo — Melhorias de interface

Cada versão `1.x.Y` e cada OTA pode trazer ajustes de interface. Itens grandes (redesenho de tela, navegação nova) entram na feature mais próxima. A base dessas melhorias é a 1.3.

## 6. Requisitos transversais

### 6.1 Play Store

- Contas pessoais novas precisam de **teste fechado com pelo menos 12 testadores por 14 dias seguidos** antes de liberar a produção (regra vigente desde 2023, conferir na época). Por isso o teste fechado começa na 1.4.
- O Play Billing só funciona com o app instalado pela Play (faixa interna ou fechada para testar).
- Itens obrigatórios: política de privacidade, Segurança de dados, exclusão de conta (no app e na web), classificação de conteúdo e `targetSdk` atualizado.

### 6.2 Privacidade e LGPD

- Mínimo de dados: apelido, e-mail (login) e dados do jardim. Foto só quando a pessoa envia.
- Consentimento para métricas, perfil público desligado por padrão, exportação e exclusão de dados.

### 6.3 Custos (conferir na época)

| Serviço | Plano inicial | Atenção |
|---|---|---|
| Supabase | Free | Pausa por inatividade e limites de banco e Storage. Pro quando houver usuários reais. |
| Pl@ntNet | Free (500 identificações/dia) | Cota compartilhada pelo app (limite interno de 450/dia) |
| Gemini | Free (Flash-Lite) | Limites por minuto e por dia. Requisições podem ser usadas para treino. |
| Análise de saúde | A definir | Custo por chamada se for um provedor especializado |
| RevenueCat | Free até um teto de receita | — |
| Play Console | Taxa única | — |

### 6.4 Segurança

- Nenhuma chave no app (`EXPO_PUBLIC_*` é pública). Toda IA ou API paga passa por Edge Function, com cota.
- Regras de moedas, XP e direitos do Plus ficam sempre no servidor.

## 7. Caixa de ideias

Toda ideia nova entra aqui. Depois da análise, ganha versão na linha do tempo.

| Data | Ideia | Status | Versão | Notas |
|---|---|---|---|---|
| 08/11/2026 | Estimativa de cuidados por IA a partir do Pl@ntNet | `entregue` | 1.2.0 | Função ativa em produção desde 10/11 |
| 09/11/2026 | Login / conta persistente | `planejada` | 1.4.0 | Base de moedas, ranks e planos |
| 09/11/2026 | Sistema de moedas e recompensas | `planejada` | 1.5.0 | XP + Sementes, livro-razão no servidor |
| 09/11/2026 | Planos pagos e teste grátis | `planejada` | 2.0.0 | Depende da Play Store |
| 09/11/2026 | Ranks e engajamento do perfil | `planejada` | 1.5.0 (perfil) / 2.1.0 (ligas) | Perfil e medalhas antes, ligas depois do lançamento |
| 09/11/2026 | Aba de saúde da planta | `planejada` | 1.6.0 | Muda a decisão da 1.0 sobre diagnóstico |
| 09/11/2026 | Integração com floriculturas (kits prontos) | `analisada` | 2.2.0 | Piloto via WhatsApp primeiro |
| 09/11/2026 | Melhorias de interface | `planejada` | 1.3.0 + contínuo | — |
| — | Frequência própria de adubação | `ideia` | depois da 1.2 | 10/11: mantida só a frase "Última adubação"; avaliar com a referência por espécie da 1.2 |

Modelo para uma ideia nova:

```text
| dd/mm/aaaa | <ideia em uma frase> | ideia | — | <origem, contexto, dúvidas> |
```

## 8. Pendências do usuário (visão geral)

| Quando | O que |
|---|---|
| 1.3.1 | Conta de monitoramento (ex.: Sentry) e texto/aceite da política de privacidade (visual: manter o atual) |
| 1.4.0 | OAuth Google, assinatura Android definitiva, conta Play Console e 12+ testadores |
| 1.5.0 | Valores da economia e itens cosméticos |
| 1.6.0 | Escolha do provedor de saúde, orçamento de IA e validação no celular de tudo desde a 1.1.0 |
| 2.0.0 | Merchant da Play, preços e conteúdo do Plus |
| 2.2.0 | Floriculturas parceiras e modelo de comissão |

## 9. Histórico de decisões

- **09/11/2026** — Plano criado. Versionamento em três números, com ajuste mínimo via OTA. Ordem: 1.2 IA de cuidados → 1.3 interface → 1.4 conta → 1.5 moedas → 1.6 saúde → 2.0 Play + Plus → 2.1 ligas → 2.2 floriculturas. Ranks divididos entre perfil (1.5) e ligas (2.1). Floriculturas depois do lançamento, começando por um piloto sem pagamento no app.
- **10/11/2026** — Testes no celular e APKs adiados até a 1.6, que valida tudo desde a 1.1.0; até lá cada versão passa só pelos checks automatizados. Versões seguem em sequência, com pergunta ao usuário sobre o PR para `develop` ao fim de cada uma. PRs #26 (1.1.0) e #27 (este plano) integrados em `develop`.
- **10/11/2026** — Adubação na 1.1.1: mantida a frase "Última adubação"; frequência própria fica como ideia para depois da 1.2.
- **10/11/2026** — 1.2.0: a estimativa da IA é salva na própria planta (`careEstimate`) em vez de um cache local separado; o cache compartilhado por espécie continua no Supabase (`care_estimates`). Modelo padrão `gemini-3.1-flash-lite`, configurável por `GEMINI_MODEL`.
- **10/11/2026** — 1.3.0 mantém a identidade visual atual. Onboarding como checklist "Primeiros passos" na tela inicial, derivado dos dados (nada é marcado à mão). Monitoramento e política de privacidade saem da 1.3.0 e vão para uma 1.3.1, quando o usuário tiver a conta e o texto.
- **10/11/2026** — Deploy da 1.2.0: chave Gemini cadastrada pelo painel do Supabase (o cadastro pela CLI no PowerShell gravou um valor diferente da chave), migração aplicada e `estimate-care` publicada e testada.
