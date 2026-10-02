# Continuidade do trabalho

Atualize este arquivo ao encerrar sessões que mudem o estado do projeto. Não armazene credenciais ou configurações privadas.

## Sessão de 01/10/2026 — documentação inicial

- **Branch:** `docs/mvp-development-guide`, criada a partir de `develop`.
- **PR:** [#2 — documentação do MVP e desenvolvimento](https://github.com/NeytanBelisario/Gardenfy/pull/2), integrado em `develop` nesta sessão por autorização do usuário.
- **Backup remoto:** commits das etapas publicados em `origin/docs/mvp-development-guide`; a atualização deste handoff também deve ser publicada ao encerrar.
- **Base:** `develop` criada a partir de `origin/main` e publicada no remoto.
- **Entrega:** regras para agentes, guia de ambiente/troca de PC, roadmap proposto, README, exemplo de ambiente, versão inicial de Node e template de PR.
- **Validação:** revisão dos scripts, rotas e stores existentes; `git diff --check` e verificação dos links locais. Nenhuma instalação, compilação, lint ou execução em dispositivo realizada; esta tarefa altera documentação e arquivos de apoio.
- **Estado do produto:** nenhuma feature do aplicativo foi implementada nesta sessão. O roadmap aguarda os detalhes adicionais do usuário.
- **Próximo passo:** revisar o escopo proposto com os próximos detalhes; depois do merge deste PR, atualizar `develop` e criar uma nova branch para a tarefa escolhida.

## Sessão de 01/10/2026 — M0: ambiente reproduzível

- **Branch:** `chore/reproducible-development`, criada a partir de `develop` atualizado após integrar o PR #2.
- **PR:** [#3 — ambiente reproduzível e CI](https://github.com/NeytanBelisario/Gardenfy/pull/3), integrado pelo usuário em `develop` em 02/10/2026.
- **Backup remoto:** commits por etapas publicados em `origin/chore/reproducible-development`; este registro também será publicado.
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub. O sucesso local não substitui essa execução.
- **Entrega:** ESLint Expo flat config, scripts `typecheck`/`check`, versão de Node/npm, extensão ESLint recomendada, workflow de checks, guia Android e roteiro manual.
- **Dependências:** patches compatíveis com Expo 55/React Native 0.83, mantendo React 19.2.0. `@expo/log-box` foi declarado diretamente para resolver conflito de peer do Expo Router; o override de React usa versão explícita para contornar erro de resolução `$react` no npm. Lockfile preservado e atualizado.
- **Checks locais aprovados:** `npm ci --no-audit --no-fund`, `npm run check` (types/lint sem avisos), `npx expo install --check`, export Android, prebuild Android sem instalação e `git diff --check`. Após a atualização de `shell-quote`, o lockfile também passou em `npm ci --dry-run`.
- **Segurança:** atualização de `shell-quote` eliminou o alerta crítico identificado. `npm audit` ainda reporta 23 alertas (1 baixo, 16 moderados e 6 altos) em dependências. A correção automática falhou por erro do endpoint de auditoria; triagem/correções restantes devem ser feitas antes da distribuição, sem forçar upgrades incompatíveis.
- **Limites:** não há JDK, Android SDK/adb ou dispositivo nesta máquina. Nenhum APK foi compilado/instalado e câmera/AR/jornada não foram testados em dispositivo. O prebuild avisou sobre Nova Arquitetura, mas `android/gradle.properties` gerado contém `newArchEnabled=true`.
- **Infraestrutura:** CLIs Supabase/Vercel e conectores não disponíveis nesta sessão. Nenhum serviço externo foi criado; persistência local continua sendo a proposta inicial.
- **Próximo passo:** revisar e integrar o PR M0; criar branch a partir de `develop` atualizado para persistência de jardins/plantas e fotos duráveis. Usar armazenamento local versionado, hidratação inicial e testes de falha/recuperação; não sobrescrever dados válidos quando leitura falhar.

## Sessão de 02/10/2026 — M1: persistência local

- **Branch:** `feat/persistent-gardens`, criada a partir de `develop` atualizado após o merge do PR #3 (`a91f8df`).
- **PR:** [#4 — persistência local](https://github.com/NeytanBelisario/Gardenfy/pull/4), integrado pelo usuário em `develop` em 02/10/2026 (`343d44e`).
- **CI remoto:** workflow disparado pelo PR, incluindo os 24 testes; consultar o resultado no GitHub.
- **Entrega:** AsyncStorage com schema v1 validado, hidratação inicial com retry, fila de gravação e memória atualizada somente após confirmação. Criação, inclusão pelo catálogo e resultados de análise/reanálise persistem.
- **Fotos:** cópia nativa para o diretório de documentos do app, referências relativas resolvidas no sandbox atual e limpeza em falhas/reanálise. Implementação web converte object URLs em data URI; não houve validação do app web nesta sessão.
- **Interface:** estados de carregamento/salvamento, feedback de falhas e bloqueio de toques repetidos. Navegação e resultado salvo aguardam gravação. O catálogo não inicializa mais o store por efeito colateral; nome de jardim é obrigatório.
- **Commits por etapas:** armazenamento/fotos/testes; integração às telas; documentação e continuidade. Publicados em `origin/feat/persistent-gardens`.
- **Checks locais aprovados:** instalação limpa com `npm ci --no-audit --no-fund`, `npm run check` (typecheck, lint e 24 testes), `npx expo install --check`, export Android, prebuild Android sem instalação, instalação dry-run após alinhar `@types/node` ao Node 22, links locais e `git diff --check`.
- **Cobertura:** novo store recupera dados salvos; falhas de leitura/escrita/cópia preservam estado anterior; operações simultâneas são serializadas; fotos sobrevivem à remoção do cache e à realocação de diretório em teste com arquivos reais. Os adapters nativos são separados do domínio e não foram executados em dispositivo.
- **Limites:** JDK/adb/dispositivo não disponíveis; nenhum APK foi compilado ou instalado, nenhuma câmera/AR ou chamada real ao Gemini foi testada. Novas dependências nativas exigem reconstruir o app para teste no aparelho.
- **Estado de M1:** persistência, hidratação e fotos implementadas/testadas no domínio. Edição/exclusão e representação de métricas desconhecidas continuam pendentes. Não há conta, sincronização nem backend nesta entrega.
- **Próximo passo:** revisar/integrar o PR da persistência, testar o roteiro no aparelho e criar nova branch a partir de `develop` atualizado para edição/exclusão de jardins e plantas. A etapa de cuidados/histórico vem depois.

## Sessão de 02/10/2026 — M1: edição e exclusão

- **Branch:** `feat/edit-delete-gardens-plants`, criada de `develop` atualizado após integrar o PR #4 (`343d44e`).
- **PR:** [#5 — edição e exclusão de jardins e plantas](https://github.com/NeytanBelisario/Gardenfy/pull/5), integrado pelo usuário em `develop` em 02/10/2026 (`892475f`).
- **Etapas publicadas:** `3a151bc` (operações persistentes e regressões), `fdc3b00` (formulários e confirmações). `828ff25` (validação de ordem da exclusão e documentação).
- **Entrega:** edição de nome/ambiente/ícone do jardim e nome/descrição da planta; exclusão com confirmação e aviso de remoção em conjunto no jardim; retorno à home após excluir jardim. Dados/análises/fotos preservados nas edições; nomes obrigatórios; feedback de falha e bloqueio durante gravação.
- **Persistência:** mesma fila/schema v1, sem dependências novas. Exclusão grava antes de limpar fotos sem uso, preserva referências compartilhadas e recalcula agregados/contagens. Falha de gravação não muda memória/fotos; falha de limpeza pode deixar órfãos. IDs excluídos não são recriados por operações atrasadas.
- **Checks:** `npm run check` (TypeScript, lint sem avisos e 35 testes), export Android e `git diff --check` aprovados. Roteiro manual atualizado em `TESTING.md`.
- **Limites:** sem JDK/adb/SDK/dispositivo; não houve compilação de APK nem execução da interface no aparelho. Cancelamento, teclado, acessibilidade, navegação e adapters nativos precisam de validação manual. Métricas desconhecidas continuam pendentes; esta etapa não altera sua representação.
- **Backup:** commits das etapas publicados em `origin/feat/edit-delete-gardens-plants`; atualização final do handoff também publicada ao encerrar.
- **Próximo passo:** revisar/integrar este PR e executar roteiro no aparelho. Após integração, atualizar `develop` e criar nova branch para diferenciar métricas desconhecidas de zero, última entrega funcional pendente de M1. Cuidados/histórico seguem depois.

## Sessão de 02/10/2026 — M1: métricas desconhecidas

- **Branch:** `fix/unknown-plant-metrics`, criada de `develop` atualizado após integrar o PR #5 (`892475f`).
- **PR:** [#6 — métricas desconhecidas e médias com zero](https://github.com/NeytanBelisario/Gardenfy/pull/6), aberto para `develop`; aguarda integração.
- **Etapas publicadas:** `29adb19` (domínio, migração e regressões), `692d74d` (interface e catálogo), `30d7991` (documentação e roteiro).
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub.
- **Entrega:** desconhecido usa `null` nas métricas/agregados; vitalidade/crescimento da planta permanecem opcionais. Zero conhecido entra nas médias e aparece como zero; jardim sem valores conhecidos mostra “Sem análise”. Indicadores compactos mostram “—” com explicação e rótulos acessíveis. Home/detalhes/resultados identificam estimativas da IA; detalhes informam cobertura das análises. Catálogo estático renomeado de `mocks.ts` para `catalog.ts`.
- **Migração:** schema v2 valida e lê v1, remove zeros de placeholder das plantas sem vitalidade e recalcula agregados; preserva análises reais, fotos, datas e nomes. Migração em memória sem gravação na leitura; próxima operação bem-sucedida salva v2. Falha mantém o JSON original.
- **Checks:** `npm run check` (TypeScript, lint sem avisos e 40 testes), export Android e `git diff --check` aprovados.
- **Limites:** nenhuma compilação de APK, execução da interface/adapters no aparelho ou chamada real à IA. Roteiro de métricas, acessibilidade/texto ampliado e migração em instalação existente aguarda dispositivo; bundle Android não substitui esses testes.
- **Backup:** commits por etapas publicados em `origin/fix/unknown-plant-metrics`; este registro do PR também é publicado no encerramento.
- **Próximo passo:** revisar/integrar este PR e executar os roteiros de M1 no aparelho. Após integração, atualizar `develop` e criar branch para detalhes da planta, cuidados e histórico (M2), conforme escopo combinado.

## Modelo para próximas sessões

- Data e branch:
- PR / item do roadmap:
- Etapas concluídas:
- Validação executada e resultado:
- Limitações / pendências:
- Próximo passo concreto:
- Backup remoto (último commit enviado ou motivo de falha):
