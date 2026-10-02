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
- **PR:** [#3 — ambiente reproduzível e CI](https://github.com/NeytanBelisario/Gardenfy/pull/3), aberto para `develop`; merge depende de instrução específica.
- **Backup remoto:** commits por etapas publicados em `origin/chore/reproducible-development`; este registro também será publicado.
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub. O sucesso local não substitui essa execução.
- **Entrega:** ESLint Expo flat config, scripts `typecheck`/`check`, versão de Node/npm, extensão ESLint recomendada, workflow de checks, guia Android e roteiro manual.
- **Dependências:** patches compatíveis com Expo 55/React Native 0.83, mantendo React 19.2.0. `@expo/log-box` foi declarado diretamente para resolver conflito de peer do Expo Router; o override de React usa versão explícita para contornar erro de resolução `$react` no npm. Lockfile preservado e atualizado.
- **Checks locais aprovados:** `npm ci --no-audit --no-fund`, `npm run check` (types/lint sem avisos), `npx expo install --check`, export Android, prebuild Android sem instalação e `git diff --check`. Após a atualização de `shell-quote`, o lockfile também passou em `npm ci --dry-run`.
- **Segurança:** atualização de `shell-quote` eliminou o alerta crítico identificado. `npm audit` ainda reporta 23 alertas (1 baixo, 16 moderados e 6 altos) em dependências. A correção automática falhou por erro do endpoint de auditoria; triagem/correções restantes devem ser feitas antes da distribuição, sem forçar upgrades incompatíveis.
- **Limites:** não há JDK, Android SDK/adb ou dispositivo nesta máquina. Nenhum APK foi compilado/instalado e câmera/AR/jornada não foram testados em dispositivo. O prebuild avisou sobre Nova Arquitetura, mas `android/gradle.properties` gerado contém `newArchEnabled=true`.
- **Infraestrutura:** CLIs Supabase/Vercel e conectores não disponíveis nesta sessão. Nenhum serviço externo foi criado; persistência local continua sendo a proposta inicial.
- **Próximo passo:** revisar e integrar o PR M0; criar branch a partir de `develop` atualizado para persistência de jardins/plantas e fotos duráveis. Usar armazenamento local versionado, hidratação inicial e testes de falha/recuperação; não sobrescrever dados válidos quando leitura falhar.

## Modelo para próximas sessões

- Data e branch:
- PR / item do roadmap:
- Etapas concluídas:
- Validação executada e resultado:
- Limitações / pendências:
- Próximo passo concreto:
- Backup remoto (último commit enviado ou motivo de falha):
