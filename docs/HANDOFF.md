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
- **PR:** [#6 — métricas desconhecidas e médias com zero](https://github.com/NeytanBelisario/Gardenfy/pull/6), integrado pelo usuário em `develop` em 02/10/2026 (`c144c97`).
- **Etapas publicadas:** `29adb19` (domínio, migração e regressões), `692d74d` (interface e catálogo), `30d7991` (documentação e roteiro).
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub.
- **Entrega:** desconhecido usa `null` nas métricas/agregados; vitalidade/crescimento da planta permanecem opcionais. Zero conhecido entra nas médias e aparece como zero; jardim sem valores conhecidos mostra “Sem análise”. Indicadores compactos mostram “—” com explicação e rótulos acessíveis. Home/detalhes/resultados identificam estimativas da IA; detalhes informam cobertura das análises. Catálogo estático renomeado de `mocks.ts` para `catalog.ts`.
- **Migração:** schema v2 valida e lê v1, remove zeros de placeholder das plantas sem vitalidade e recalcula agregados; preserva análises reais, fotos, datas e nomes. Migração em memória sem gravação na leitura; próxima operação bem-sucedida salva v2. Falha mantém o JSON original.
- **Checks:** `npm run check` (TypeScript, lint sem avisos e 40 testes), export Android e `git diff --check` aprovados.
- **Limites:** nenhuma compilação de APK, execução da interface/adapters no aparelho ou chamada real à IA. Roteiro de métricas, acessibilidade/texto ampliado e migração em instalação existente aguarda dispositivo; bundle Android não substitui esses testes.
- **Backup:** commits por etapas publicados em `origin/fix/unknown-plant-metrics`; este registro do PR também é publicado no encerramento.
- **Próximo passo:** revisar/integrar este PR e executar os roteiros de M1 no aparelho. Após integração, atualizar `develop` e criar branch para detalhes da planta, cuidados e histórico (M2), conforme escopo combinado.

## Sessão de 02/10/2026 — M2: planta, cuidados e histórico

- **Branch:** `feat/plant-care-history`, criada de `develop` atualizado após integrar o PR #6 (`c144c97`).
- **PR:** [#7 — detalhes da planta, cuidados e histórico](https://github.com/NeytanBelisario/Gardenfy/pull/7), integrado pelo usuário em `develop` em 02/10/2026 (`3b660ff`).
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub.
- **Etapas publicadas:** `04e71ba` (domínio, schema v3 e 13 regressões), `1483722` (detalhes, navegação e diálogos de cuidado), `7450156` (documentação e roteiro).
- **Entrega:** detalhes da planta com cards de hidratação/luz, origem/data e ausência de análise; ações Regar/Adubar; histórico cronológico misto, incluindo retratos das análises; correção de tipo/data/hora e exclusão confirmada de cuidados. Carregamento é tratado pelo bootstrap existente; alvo ausente, foto indisponível, salvamento e falhas têm feedback. Toques repetidos são bloqueados enquanto salva.
- **Regras:** cuidados registram ações do usuário sem alterar estimativas, data da análise, fotos ou contagens. Reanálise adiciona retrato sem apagar cuidados/análises anteriores. Histórico mantém valores, não fotos antigas; a foto atual usa a mesma limpeza existente.
- **Migração:** schema v3 lê v1/v2 sem gravação; histórico vazio ou última análise conhecida com data e ID determinístico. Análises anteriores/cuidados não armazenados nos formatos antigos não são recuperáveis. Próxima gravação confirmada salva v3; falha preserva o original.
- **Checks:** `npm run check` (TypeScript, lint sem avisos e 53 testes), 53 testes com `TZ=America/Sao_Paulo`, export Android, links locais e `git diff --check` aprovados.
- **Limites:** nenhum APK, teste em dispositivo ou chamada real à IA. Roteiro M2 em `TESTING.md` aguarda aparelho, incluindo migração de instalação existente, teclado, acessibilidade, navegação e adapters nativos. M1 também mantém validações manuais pendentes.
- **Backup:** commits por etapas publicados em `origin/feat/plant-care-history`; este registro do PR também é publicado no encerramento.
- **Próximo passo:** revisar/integrar este PR e validar jornadas M1/M2 no aparelho. Após integração, atualizar `develop` para a etapa M3 de unificação do serviço/parser e tratamento de falhas de análise. Backend/chamada pelo servidor ainda requer definição de escopo e serviço.

## Sessão de 02/10/2026 — M3: análise compartilhada e falhas locais

- **Branch:** `fix/unified-plant-analysis`, criada de `develop` atualizado após integrar o PR #7 (`3b660ff`).
- **PR:** [#8 — análise compartilhada, revisão e falhas](https://github.com/NeytanBelisario/Gardenfy/pull/8), aberto para `develop`; aguarda integração.
- **CI remoto:** workflow disparado pelo PR; consultar o resultado dos checks no GitHub.
- **Etapas publicadas:** `b69e0cc` (serviço/parser, seleção, erros e regressões), `7ff0506` (tela/hook compartilhados e revisão antes de salvar), `354f61d` (documentação e limites locais).
- **Entrega:** os três caminhos usam o mesmo fluxo; câmera/galeria com feedback e bloqueio de toques repetidos; erro de configuração, conexão, quota, indisponibilidade, timeout (30s), resposta inválida e cancelamento. Rascunho exige confirmação para incluir/reanalisar; nome escolhido é separado da identificação da IA. Divergência de identificação gera aviso para revisão. Scan geral é consulta sem persistência.
- **Regras:** respostas inválidas não viram métricas via clamp; zeros válidos são mantidos. Erros não expõem payload/URL/credenciais. Cancelar/sair da tela aborta a espera e ignora resposta atrasada; trocar alvo reinicia a tela. Falha de análise não escreve no store; falha de gravação conserva rascunho para retry sem outra chamada à IA. Schema permanece v3.
- **Modelo:** configurável por `EXPO_PUBLIC_GEMINI_MODEL`, padrão `gemini-3.5-flash-lite`, com seleção revisada na documentação oficial (links em `ANALYSIS.md`). Removida a cadeia de modelos antigos; uma chamada por tentativa. SDK existente mantido, sem dependências novas.
- **Checks:** `npm run check` (TypeScript, lint sem avisos e 87 testes), export Android, links locais e `git diff --check` aprovados. 34 novas regressões, usando transporte/seletor simulados.
- **Limites:** nenhuma chamada real à IA, câmera/galeria/UI em dispositivo ou APK. A revisão documental não comprova acesso/quota/qualidade do modelo na conta; adapters nativos e SDK em rede aguardam roteiro manual. Cancelamento no cliente não garante evitar processamento/cobrança no serviço.
- **Backup:** commits por etapas publicados em `origin/fix/unified-plant-analysis`; este registro do PR também é publicado no encerramento.
- **Próximo passo:** revisar/integrar este PR e validar análise/Jornadas M1/M2 no aparelho. M3 continua parcial: definir e implementar chamada no servidor com credencial protegida, controle de acesso e limites, antes de distribuir. Serviço/backend ainda não escolhido.

## Sessão de 02/10/2026 — configuração inicial do Supabase

- **Branch:** `chore/setup-supabase`, criada de `develop` atualizado após integrar o PR #8 (`f864678`).
- **Etapa concluída:** CLI Supabase `2.119.0` fixada como dependência de desenvolvimento; projeto local inicializado em `supabase/config.toml`; autenticação salva validada pela listagem de projetos.
- **Projeto remoto:** `Gardenfy` (`ukqsiclooawiqmttdobu`, região `us-west-2`) localizado com a credencial existente.
- **Bloqueio atual:** o projeto remoto está pausado. `supabase link` retornou `ProjectPausedError`; a documentação atual exige retomá-lo pelo Dashboard antes de concluir o vínculo.
- **Segurança:** nenhum token, senha de banco ou segredo foi adicionado ao repositório. Arquivos temporários e ambientes locais do Supabase continuam ignorados.
- **Próximo passo:** retomar o projeto no Dashboard, repetir `npx supabase link --project-ref ukqsiclooawiqmttdobu` e validar o vínculo antes de implementar a Edge Function da análise.

## Modelo para próximas sessões

- Data e branch:
- PR / item do roadmap:
- Etapas concluídas:
- Validação executada e resultado:
- Limitações / pendências:
- Próximo passo concreto:
- Backup remoto (último commit enviado ou motivo de falha):
