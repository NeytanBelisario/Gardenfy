# Roadmap — Gardenfy MVP

Referência inicial: 01/10/2026. Este documento separa o que existe no código das entregas propostas. Prioridades e funcionalidades adicionais podem mudar conforme os próximos detalhes do produto; nenhuma escolha de backend ou regra de pontuação está fechada.

## Objetivo

Permitir que uma pessoa crie seus jardins, cadastre plantas, consulte informações e registre cuidados no dia a dia, sem perder os dados ao fechar o aplicativo. A análise por foto complementa esse fluxo. A experiência AR existente deve continuar acessível em aparelhos compatíveis.

Proposta inicial: um MVP de uso individual, com persistência local e Android como primeira plataforma de validação. Login, sincronização entre dispositivos do usuário e publicação em lojas precisam de definição de escopo. Trocar de PC para desenvolver é resolvido pelo fluxo Git e pelo guia de ambiente; isso não sincroniza os dados de quem usa o app.

## Estado atual observado no código

| Área | O que já existe | Limitação / próximo trabalho |
| --- | --- | --- |
| Navegação | Expo Router, home, menu, perfil, scan e preview. | Validar jornada completa e padronizar textos. |
| Jardins | Criação, edição, exclusão, listagem e detalhes com persistência local versionada. | Validação em dispositivo pendente, incluindo confirmação de exclusão. |
| Plantas | Catálogo estático, inclusão e análise persistidas, com fotos guardadas fora do cache no app nativo. | Edição/exclusão implementadas; não há tela dedicada de cuidados ou histórico. Adapters nativos aguardam teste em dispositivo. |
| Análise | Foto/câmera, integração Gemini, adição e reanálise de plantas nas rotas de jardins. | Chamada no cliente, parser textual e lógica duplicada no scan geral. Disponibilidade dos modelos não foi verificada. |
| Métricas | Vitalidade e indicadores de água/luz, com agregação no jardim. | São estimativas/valores do modelo, não sensores; valores desconhecidos são distintos de zero; validação visual em aparelho pendente. |
| AR | Modelo GLB, posicionamento em plano, rotação, escala e reposicionamento. | Precisa de build nativo e aparelho compatível; execução não validada nesta revisão. |
| Perfil | Tela, contagens derivadas de jardins/plantas e conquistas visuais. | Usuário fixo; configurações e sair sem handlers; rank/conquistas estáticos. |
| Qualidade | TypeScript, lint, testes de persistência e CI com export Android. | Build e jornada em dispositivo ainda pendentes. |

Fontes principais: `src/features/gardens/store.ts`, `types.ts` e `catalog.ts`; `src/features/plant-analysis`; `src/features/ar/PlantArScreen.tsx`; `src/app/profile.tsx`; `package.json`.

## Entregas propostas

Cada item abaixo pode gerar uma ou mais branches/PRs pequenos. Dentro de cada feature, fazer commits por etapas: dados/estrutura, lógica, interface e validação/documentação, conforme fizer sentido.

### M0 — Base para desenvolvimento reproduzível

- [x] Validar instalação limpa com `npm ci` e registrar ambiente Android necessário. Evidência: sessão M0 em `docs/HANDOFF.md`.
- [ ] Confirmar/ajustar a versão de Node de `.nvmrc` após instalação e build.
- [x] Configurar lint reproduzível, comando de typecheck e CI com checks adequados. Workflow versionado; execução remota registrada no PR.
- [x] Documentar um roteiro de teste manual da jornada atual e registrar problemas encontrados. Ver `docs/TESTING.md`; execução em dispositivo ainda pendente.

Aceite: outro PC consegue preparar o projeto seguindo o guia; checks executam sem configuração manual não documentada; limitações nativas ficam registradas. Instalação e export Android validados em Linux/WSL2; a etapa permanece parcialmente concluída até compilar e testar em dispositivo.

### M1 — Jardins e plantas que sobrevivem ao reinício

- [x] Escolher armazenamento local e definir schema versionado e hidratação inicial do store. AsyncStorage, schema v2 com migração de v1 e bootstrap com retry; ver `docs/PERSISTENCE.md`.
- [x] Persistir criação/inclusão e resultados de análise; tratar falhas de leitura/escrita. Fila de gravação e confirmação após sucesso; testes de reinício e falhas passaram.
- [x] Preservar fotos em armazenamento durável, sem depender de URIs temporárias do picker. Implementação nativa e teste com arquivos reais; validação do adapter no aparelho ainda pendente.
- [x] Permitir editar e excluir jardins e plantas com confirmação nas exclusões. Persistência e regressões testadas; interface aguarda validação no aparelho.
- [x] Diferenciar ausência de análise de valor zero e remover referências a mock do fluxo real. Schema v2 com migração de v1; médias incluem zeros conhecidos; testes de regressão passaram. Interface aguarda validação em aparelho.

Estado: a primeira entrega de M1 cobre persistência, hidratação e fotos. A segunda entrega adiciona edição/exclusão com confirmação. A terceira diferencia métricas desconhecidas de zero e identifica estimativas da IA. Validação em aparelho continua pendente.

Aceite: criar jardim, adicionar planta, reiniciar e recuperar dados/fotos; editar/excluir persiste; falhas não sobrescrevem silenciosamente dados válidos. Sem rede, o cadastro manual continua utilizável.

### M2 — Tela da planta, cuidados e histórico

Preserva as ideias do README anterior: hidratação, luz, regar, adubar e histórico.

- [ ] Criar tela de detalhes da planta acessível pelo jardim.
- [ ] Mostrar cards de hidratação e luz com origem/data da informação e estado sem análise.
- [ ] Criar ações rápidas **Regar** e **Adubar**, registrando data/hora e tipo do cuidado.
- [ ] Mostrar histórico persistente de cuidados e análises, com ordem cronológica e estado vazio.
- [ ] Permitir corrigir/remover um registro de cuidado lançado por engano.

Aceite: registrar rega/adubação, consultar histórico e reencontrá-lo após reinício. Registrar um cuidado não fabrica uma nova medição de hidratação ou vitalidade.

### M3 — Análise por foto pronta para distribuição

- [ ] Unificar serviço/parser usados pelo scan geral e pelas rotas de jardins.
- [ ] Tratar permissão negada, cancelamento, ausência de chave, falta de rede, timeout e resposta inválida com feedback na interface.
- [ ] Revisar a seleção de modelos com base no serviço efetivamente disponível no momento da implementação.
- [ ] Propor e implementar uma chamada pelo servidor antes da distribuição, mantendo a credencial fora do app; definir controle de acesso, limites de uso e configuração de ambiente.
- [ ] Explicar envio da foto ao serviço de IA e apresentar resultados como estimativas; permitir revisar a identificação antes de salvar.
- [ ] Preservar dados anteriores quando uma reanálise falhar.

Aceite: sucesso salva análise e data; falhas têm feedback e permitem tentar novamente sem perder a planta. Build distribuído não contém chave secreta do provedor.

### M4 — Perfil e experiência diária

- [ ] Substituir usuário fixo por perfil local editável e persistente.
- [ ] Implementar apenas configurações necessárias ao MVP; ocultar ações indisponíveis, inclusive sair enquanto não houver sessão.
- [ ] Padronizar idioma e identidade Gardenfy, incluindo textos restantes de “Folium & Fern”.
- [ ] Revisar navegação, teclado, estados vazios, acessibilidade básica e dispositivos pequenos.
- [ ] Validar AR em dispositivo compatível e fallback/retorno em dispositivo sem suporte.

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
