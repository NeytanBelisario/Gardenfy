# Roadmap — Gardenfy MVP

Referência inicial: 01/10/2026. Este documento separa o que existe no código das entregas propostas. Prioridades e funcionalidades adicionais podem mudar conforme os próximos detalhes do produto; nenhuma escolha de backend ou regra de pontuação está fechada.

## Objetivo

Permitir que uma pessoa crie seus jardins, cadastre plantas, consulte informações e registre cuidados no dia a dia, sem perder os dados ao fechar o aplicativo. A análise por foto complementa esse fluxo. A experiência AR existente deve continuar acessível em aparelhos compatíveis.

Proposta inicial: um MVP de uso individual, com persistência local e Android como primeira plataforma de validação. Login, sincronização entre dispositivos do usuário e publicação em lojas precisam de definição de escopo. Trocar de PC para desenvolver é resolvido pelo fluxo Git e pelo guia de ambiente; isso não sincroniza os dados de quem usa o app.

Prioridade combinada em 03/10/2026: continuar usando jardins, plantas do catálogo e cuidados sem Gemini. A validação de sucesso da análise e a regularização de faturamento ficam adiadas; M3 permanece parcial. Seguir o roteiro local de `TESTING.md`; esta decisão não conclui M3/M5 nem amplia o escopo para novas features.

## Estado atual observado no código

| Área | O que já existe | Limitação / próximo trabalho |
| --- | --- | --- |
| Navegação | Expo Router, home, menu, perfil, scan e preview. Barra inferior com Jardins/Criar/AR/Perfil; aba sem rota removida. | Validar jornada completa, leitura com texto ampliado e navegação no aparelho. |
| Jardins | Criação, edição, exclusão, listagem e detalhes com persistência local versionada. Criação/listagem validadas em Samsung Android 13. | Edição/exclusão, encerramento/reabertura completos e cenários de falha ainda pendentes no aparelho. |
| Plantas | Catálogo estático, inclusão e análise persistidas, com fotos guardadas fora do cache no app nativo. Inclusão pelo catálogo, detalhes, cuidados/histórico e recuperação após recarregar JavaScript validados no aparelho. | Fotos duráveis, edição/exclusão e demais cenários nativos ainda pendentes. |
| Análise | Foto/câmera, integração Gemini, adição e reanálise de plantas nas rotas de jardins. | Serviço/parser e tela compartilhados; Edge Function e segredo configurados. Primeira requisição real recebeu HTTP 402 do Gemini; faturamento/créditos, sucesso da análise e validação em aparelho pendentes. |
| Métricas | Vitalidade e indicadores de água/luz, com agregação no jardim. | São estimativas/valores do modelo, não sensores; valores desconhecidos são distintos de zero; validação visual em aparelho pendente. |
| AR | Modelo GLB, posicionamento em plano, rotação, escala e reposicionamento. Fallback web separado do módulo nativo; export web aprovado. | Precisa de build nativo e aparelho compatível; interação/execução AR não validada nesta revisão. |
| Perfil | Resumo com contagens derivadas dos jardins/plantas e atalhos úteis. Nome/e-mail fictícios, rank/conquistas estáticos e ações sem handler removidos da interface. | Perfil local editável ainda não implementado; interação e contagens na interface aguardam validação. |
| Qualidade | TypeScript, lint, testes de persistência e CI com export Android. Build debug e jornada local básica validados em Samsung Android 13. | Roteiro manual completo e análise bem-sucedida ainda pendentes; build debug depende de Metro. |

Fontes principais: `src/features/gardens/store.ts`, `types.ts` e `catalog.ts`; `src/features/plant-analysis`; `src/features/ar/PlantArScreen.tsx`; `src/app/profile.tsx`; `package.json`.

## Entregas propostas

Cada item abaixo pode gerar uma ou mais branches/PRs pequenos. Dentro de cada feature, fazer commits por etapas: dados/estrutura, lógica, interface e validação/documentação, conforme fizer sentido.

### M0 — Base para desenvolvimento reproduzível

- [x] Validar instalação limpa com `npm ci` e registrar ambiente Android necessário. Evidência: sessão M0 em `docs/HANDOFF.md`.
- [x] Confirmar/ajustar a versão de Node de `.nvmrc` após instalação e build. Node `22.22.2` validado com checks e build debug Android no Windows em 03/10/2026.
- [x] Configurar lint reproduzível, comando de typecheck e CI com checks adequados. Workflow versionado; execução remota registrada no PR.
- [x] Documentar um roteiro de teste manual da jornada atual e registrar problemas encontrados. Ver `docs/TESTING.md`; execução em dispositivo ainda pendente.

Aceite: outro PC consegue preparar o projeto seguindo o guia; checks executam sem configuração manual não documentada; limitações nativas ficam registradas. Instalação e export Android validados em Linux/WSL2; build debug e jornada local básica validados no Windows/Android em 03/10/2026. Roteiro completo em dispositivo ainda pendente.

### M1 — Jardins e plantas que sobrevivem ao reinício

- [x] Escolher armazenamento local e definir schema versionado e hidratação inicial do store. AsyncStorage, schema v3 com migração de v1/v2 e bootstrap com retry; ver `docs/PERSISTENCE.md`.
- [x] Persistir criação/inclusão e resultados de análise; tratar falhas de leitura/escrita. Fila de gravação e confirmação após sucesso; testes de reinício e falhas passaram.
- [x] Preservar fotos em armazenamento durável, sem depender de URIs temporárias do picker. Implementação nativa e teste com arquivos reais; validação do adapter no aparelho ainda pendente.
- [x] Permitir editar e excluir jardins e plantas com confirmação nas exclusões. Persistência e regressões testadas; interface aguarda validação no aparelho.
- [x] Diferenciar ausência de análise de valor zero e remover referências a mock do fluxo real. Schema v2 com migração de v1; médias incluem zeros conhecidos; testes de regressão passaram. Interface aguarda validação em aparelho.

Estado: a primeira entrega de M1 cobre persistência, hidratação e fotos. A segunda entrega adiciona edição/exclusão com confirmação. A terceira diferencia métricas desconhecidas de zero e identifica estimativas da IA. Em 03/10/2026, criação/inclusão pelo catálogo e recuperação após recarregar JavaScript passaram no aparelho; fotos duráveis, encerramento completo e demais cenários continuam pendentes.

Aceite: criar jardim, adicionar planta, reiniciar e recuperar dados/fotos; editar/excluir persiste; falhas não sobrescrevem silenciosamente dados válidos. Sem rede, o cadastro manual continua utilizável.

### M2 — Tela da planta, cuidados e histórico

Preserva as ideias do README anterior: hidratação, luz, regar, adubar e histórico.

- [x] Criar tela de detalhes da planta acessível pelo jardim. Botão “Ver detalhes e cuidados”; validação da navegação no aparelho pendente.
- [x] Mostrar cards de hidratação e luz com origem/data da informação e estado sem análise. Identificados como estimativas da IA.
- [x] Criar ações rápidas **Regar** e **Adubar**, registrando data/hora e tipo do cuidado. Persistência/falhas testadas; não altera estimativas.
- [x] Mostrar histórico persistente de cuidados e análises, com ordem cronológica e estado vazio. Reanálises preservam retratos anteriores; migração recupera somente a última análise conhecida com data.
- [x] Permitir corrigir/remover um registro de cuidado lançado por engano. Tipo, data/hora e exclusão com confirmação; reinício e falhas testados.

Estado: entrega funcional implementada, com 94 testes acumulados aprovados. Detalhes, rega/adubação, ordenação do histórico e recuperação após recarregar JavaScript foram validados no aparelho em 03/10/2026. Correção/exclusão, encerramento completo, acessibilidade e demais cenários continuam pendentes. Histórico não mantém fotos antigas.

Aceite: registrar rega/adubação, consultar histórico e reencontrá-lo após reinício. Registrar um cuidado não fabrica uma nova medição de hidratação ou vitalidade.

### M3 — Análise por foto pronta para distribuição

- [x] Unificar serviço/parser usados pelo scan geral e pelas rotas de jardins. Mesma tela/hook, uma chamada por tentativa e testes do parser/serviço.
- [x] Tratar permissão negada, cancelamento, ausência de chave, falta de rede, timeout e resposta inválida com feedback na interface. Adapters simulados testados; integração nativa/serviço real pendente.
- [ ] Revisar a seleção de modelos com base no serviço efetivamente disponível. Revisão documental concluída em 02/10/2026: modelo configurável com padrão `gemini-3.5-flash-lite`, sem fallbacks antigos; acesso/quota e requisição real na conta ainda pendentes (ver `ANALYSIS.md`).
- [x] Propor e implementar uma chamada pelo servidor antes da distribuição, mantendo a credencial fora do app; definir controle de acesso, limites de uso e configuração de ambiente. Edge Function Supabase exige chave publicável, limita 10 análises/hora por origem com hash salgado e mantém Gemini nos secrets.
- [x] Explicar envio da foto ao serviço de IA e apresentar resultados como estimativas; permitir revisar a identificação antes de salvar. Confirmação explícita e nome revisável na inclusão; navegação/teclado aguardam aparelho.
- [x] Preservar dados anteriores quando uma reanálise falhar. Análise produz rascunho; somente confirmação salva. Persistência mantém dados em falhas de escrita; timeout/cancelamento/respostas tardias testados.

Estado: unificação e tratamento local implementados; backend Supabase implantado e protegido, com 94 testes aprovados. Segredo Gemini cadastrado; primeira requisição real respondeu HTTP 402, agora classificado como configuração do serviço. M3 continua parcial: regularizar faturamento/créditos, confirmar sucesso/qualidade do modelo e validar em aparelho.

Aceite: sucesso salva análise e data; falhas têm feedback e permitem tentar novamente sem perder a planta. Build distribuído não contém chave secreta do provedor.

### M4 — Perfil e experiência diária

- [ ] Substituir usuário fixo por perfil local editável e persistente.
- [ ] Implementar apenas configurações necessárias ao MVP; ocultar ações indisponíveis, inclusive sair enquanto não houver sessão.
- [ ] Padronizar idioma e identidade Gardenfy, incluindo textos restantes de “Folium & Fern”.
- [ ] Revisar navegação, teclado, estados vazios, acessibilidade básica e dispositivos pequenos.
- [ ] Validar AR em dispositivo compatível e fallback/retorno em dispositivo sem suporte.

Etapa de front em 03/10/2026: home, catálogo e perfil revisados para uso local; cadastro de jardim e textos dos detalhes em português; botões sem ação e a rota inexistente de tarefas removidos. Catálogo tem contagem real, estado de busca vazia, fallback de fotos e uma coluna em telas estreitas/texto ampliado. Análise permanece acessível como opção secundária. Perfil editável, conferência visual, acessibilidade com leitor de tela e validação nativa continuam pendentes; M4 permanece parcial.

Aceite: perfil salvo sobrevive ao reinício; todas as ações expostas têm comportamento útil; indisponibilidade de AR não impede cuidar do jardim.

### M5 — Validação do MVP

- [ ] Executar jornada: primeiro acesso → jardim → planta → detalhe → cuidado → histórico → reinício.
- [ ] Executar análise com sucesso e falha, além de edição/exclusão e uso sem rede.
- [ ] Cobrir com testes as regras críticas de persistência, histórico e parsing, junto das respectivas features.
- [ ] Registrar dispositivo, sistema, build e resultados; corrigir bloqueios encontrados.
- [ ] Preparar build instalável para avaliação e instruções para o grupo de teste.

Aceite: fluxo principal utilizável sem perda de dados, checks passando e limitações documentadas. Publicação em loja e promoção para `main` dependem de instrução específica.

## Backlog adicional

As ideias abaixo permanecem documentadas, mas ainda não bloqueiam o MVP proposto:

- **Moedas:** definir como ganhar, gastar e persistir saldo, evitando recompensas duplicadas.
- **Ranks:** Iniciante 🌱, Cuidador 🌿, Jardineiro 🌳 e Especialista 🌴; definir critérios de progressão antes de implementar.
- **Conquistas reais:** substituir badges estáticos por eventos e critérios verificáveis.
- **Lembretes/notificações:** definir frequência, permissões e relação com cuidados registrados.
- **Conta e sincronização:** autenticação, isolamento por usuário, backup/restauração e conflitos entre dispositivos.
- **Catálogo e AR ampliados:** conteúdo revisado e modelos adicionais.

## Decisões ainda abertas

- Android primeiro atende ao público inicial? iOS/web entram no aceite do MVP?
- Uso individual com armazenamento local basta inicialmente, ou conta e sincronização são essenciais?
- Quais novas funcionalidades entram antes da primeira versão utilizável?
- Gamificação é requisito de lançamento ou uma entrega posterior?
- Qual serviço executará a análise no servidor e como limitar custos/uso?

Até essas definições, seguir este documento como proposta e não iniciar implementações fora da tarefa pedida.

## Como acompanhar

Use os checkboxes para entregas verificadas; associe PR e evidência ao concluir cada item. Atualize escopo/aceite quando houver decisão de produto. O estado de uma sessão e o próximo passo ficam em [HANDOFF.md](HANDOFF.md); o fluxo de desenvolvimento fica em [DEVELOPMENT.md](DEVELOPMENT.md).
