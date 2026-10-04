# Continuidade do trabalho

Atualize este arquivo ao encerrar sessões que mudem o estado do projeto. Não armazene credenciais ou configurações privadas.

## Sessão de 04/10/2026 — publicação da beta e apresentação no GitHub

- **Base/branch/PR:** PR #14 já integrado pelo usuário; `develop` atualizado com `git pull --ff-only origin develop` em `2d99498`. Nova tarefa em `docs/mvp-beta-release`, [PR #16](https://github.com/NeytanBelisario/Gardenfy/pull/16) aberto para `develop`, com labels `documentation`/`release`; nenhum merge realizado nesta sessão.
- **Release:** [1.0.0-beta.1](https://github.com/NeytanBelisario/Gardenfy/releases/tag/v1.0.0-beta.1) publicada por solicitação do usuário, como pre-release. Tag anotada no código `1a9190e`; as mudanças entre esse código e a integração são somente documentação.
- **APK:** `Gardenfy-1.0.0-beta.1-android.apk`, 90.564.805 bytes, e `.sha256` anexados. Hash local e digest GitHub iguais: `b3f36fdd87f95031f3c3db6d822d81b2100d93f9476be5a99c423fabef3ab7ff`. É o APK autônomo já instalado/validado na sessão anterior, com assinatura de avaliação/debug; não houve novo build ou novo teste no celular nesta tarefa.
- **Commits/README:** `4910882` apresentação simples, download e três capturas reais; `3f6bbaf` notas da beta, distribuição e guias atualizados. Ambos publicados no remoto; fechamento com registro de CI/PR e link de distribuição também publicado na mesma branch. Apenas barras do sistema recortadas e redução de tamanho; nomes de teste e imagem pública de Monstera, sem fotos da galeria/configurações.
- **GitHub:** release `app` preservada e identificada como histórica, com link para a beta. Label `release`, [milestone 1](https://github.com/NeytanBelisario/Gardenfy/milestone/1) e [issue #15](https://github.com/NeytanBelisario/Gardenfy/issues/15) criados para acompanhar câmera, TalkBack e assinatura de produção.
- **Limitação de acesso:** credencial com escrita/triagem, sem administração/manutenção. Alteração de descrição/tópicos retornou 404 e não foi aplicada. Texto, tópicos e passos para o administrador prontos em [GITHUB_RELEASE.md](GITHUB_RELEASE.md).
- **Documentação:** notas da beta, forma de distribuir e guias atualizados para a preparação já integrada. A versão estável continua pendente; este trabalho não promove `develop` para `main`.
- **Verificações desta tarefa:** tag/commit, tamanho e SHA-256 do APK, estado `uploaded` de ambos os anexos e publicação `draft=false`/`prerelease=true` conferidos. Downloads públicos e três imagens com HTTP 200; checksum público igual ao local. Capturas finais inspecionadas e `git diff --check` aprovado; links locais sem destinos ausentes. [CI da documentação](https://github.com/NeytanBelisario/Gardenfy/actions/runs/37237571661) aprovado em `3f6bbaf`; consultar checks do PR após o push de encerramento. Não houve execução local de testes do app nesta tarefa de documentação.
- **Próximo passo:** integrar a documentação em `develop` após revisão e concluir os aceites da issue #15. A página inicial continua mostrando o README de `main` até a promoção; administrador pode atualizar About desde já. Densidade do celular ainda precisa da restauração registrada na sessão anterior quando o aparelho reconectar.

## Sessão de 04/10/2026 — Supabase e validação no celular

- **Branch/PR:** `feat/release-v1`, [PR #14](https://github.com/NeytanBelisario/Gardenfy/pull/14) para `develop`, ainda não integrado. `develop` permanece em `80d0750`; nenhum merge, tag ou release realizado.
- **Etapas publicadas:** `7a13ad7` formulários/contraste; `6c92623` MIME real da imagem Android; `d7a00e9` ações acessíveis/navegação; `0c01c1d` decoder e dependências; `0e5b1d8` teclado; `9071c47` revisão preservada e rolagem; `4b8acb7` área dos botões Android em todas as telas; `96fb031` navegação da foto fora do redimensionamento do teclado; `1a9190e` rótulos ampliados e texto de confirmação. São 19 commits de preparação até o código final, com backup em `origin/feat/release-v1`; documentação desta validação publicada na etapa de encerramento.
- **Supabase:** chave Pl@ntNet configurada pelo usuário e reconhecimento real validado no servidor e no celular. Não é necessário novo token. Cota compartilhada continua 450/dia UTC e 10/origem/hora; tentativas canceladas também podem consumir quota.
- **Dispositivo:** Samsung SM-G781B, Android 13. APK autônomo instalado como atualização preservou os dois jardins e duas plantas anteriores. Foto pública de Monstera usada por escolha do usuário; nenhuma foto pessoal enviada. Cadastro, cuidados, reidentificação, edição, exclusão de planta/jardim, ausência de rede, cancelamentos e persistência após limpar cache foram exercitados. Jardim desta sessão removido após cancelar/confirmar exclusão; reinício manteve os dois jardins/duas plantas anteriores. Evidências e limites em [TESTING.md](TESTING.md).
- **Interface:** revisão visual em 320/390/768 lógicos no mesmo celular, fonte 1,4, teclado, menu, espaço local e AR Em breve. Corrigidos formato da foto, contraste, rótulos, scroll, rascunho e navegação. Fonte/rede/permissão restauradas; falta apenas restaurar a densidade após reconectar o celular, conforme registro abaixo.
- **Checks:** 112 testes, TypeScript, lint sem avisos, compatibilidade Expo, Deno e exports aprovados. [CI com instalação limpa do código final](https://github.com/NeytanBelisario/Gardenfy/actions/runs/37185848291) verde em `1a9190e`; checks da documentação final no PR. `npm ci` Windows encontrou lock de arquivo nativo; `npm install` recuperou o ambiente e checks passaram.
- **APK final:** `%LOCALAPPDATA%/Gardenfy/builds/Gardenfy-1.0-evaluation-1a9190e.apk`, 90.564.805 bytes; SHA-256 `B3F36FDD87F95031F3C3DB6D822D81B2100D93F9476BE5A99C423FABEF3AB7FF`. Build e assinatura v2 verificados, instalado no celular. Fonte 1,4 manteve rótulos em uma linha; abrir/fechar teclado na revisão manteve navegação ancorada e oculta durante digitação.
- **Conexão ao encerrar:** aparelho desconectou após o último teste, antes de restaurar densidade 443 para o valor original 540. Fonte já voltou a 1,0; rede, câmera e serviços de acessibilidade anteriores foram conferidos/restaurados. Ao reconectar, executar `adb -s RXCTA0B0TPZ shell wm density 540` e reabrir Gardenfy. Última revisão é rascunho não salvo; nenhum cadastro extra feito nos jardins anteriores. Foto pública de Monstera permanece na galeria para facilitar novos testes; imagem sintética do logo foi removida.
- **Dependências:** correções compatíveis aplicadas sem alterar versões principais de Expo/RN. Restam 23 alertas altos derivados de duas dependências de ferramentas sem patch disponível (`braces`/`node-forge`), ausentes nos bundles inspecionados. Triagem e monitoramento documentados em TESTING.md; auditoria não está zerada.
- **Pendências reais:** captura nova de planta pela câmera e jornada com TalkBack não comprovadas; assinatura/canal de distribuição de produção ainda não definidos. APK usa assinatura de avaliação. Não houve teste nativo iOS/tablet/gestos. Não declarar cobertura de 100% nem versão publicada.
- **Próximo passo:** revisar o PR e os critérios de [RELEASE_1.0.md](RELEASE_1.0.md), concluir aceite específico de câmera/acessibilidade e definir distribuição. Integração e promoção `develop` → `main` exigem instrução específica.

Os registros abaixo preservam o histórico anterior a esta validação.

## Sessão de 04/10/2026 — preparação da versão 1.0

- **Branch:** `feat/release-v1`, criada de `develop` atualizado em `80d0750`; árvore limpa na abertura.
- **Escopo autorizado:** manutenção de jardins/plantas, experiência fluida, identificação Pl@ntNet e fichas locais de cuidados. AR em breve, sem execução nativa. Ver `RELEASE_1.0.md`.
- **Entrega:** AR substituído por Em breve e Viro removido; navegação Jardins/Criar/Foto/Espaço; cadastro abre detalhes, cuidados e últimas datas têm destaque, busca encontra nomes com/sem acentos, imagens têm fallback. Identificação compartilhada usa Pl@ntNet com revisão explícita da espécie e fichas locais de quatro espécies, com fontes. Sem percentuais novos de saúde/água/luz da foto.
- **Persistência:** schema v4 com espécie e histórico de identificação; v1/v2/v3 continuam migrando sem descartar cuidados/análises. Nome pessoal, descrição e cuidados são preservados na reidentificação. Retry de gravação não repete o provedor.
- **Etapas publicadas:** `dcb2893` escopo/docs; `b2e6334` domínio/fichas; `9dc731d` backend; `9acbd68` AR/navegação; `cf79e17` revisão da foto; `9dc2bcd` cuidados/UX; `7233a18` textos/permissões/crédito; `030edc3` cota compartilhada/CI/regressões. Todos em `origin/feat/release-v1`.
- **Documentação:** `6fbe0dc` publicou setup Pl@ntNet, persistência v4, roteiro de aceite e continuidade. Resultados finais e triagem de dependências registrados na etapa de encerramento.
- **PR:** [#14 — preparar Gardenfy 1.0](https://github.com/NeytanBelisario/Gardenfy/pull/14), rascunho com base em `develop`; não integrado. [CI remoto](https://github.com/NeytanBelisario/Gardenfy/actions/runs/37180890829) aprovado no commit `6fbe0dc`; consultar checks do PR após a atualização final.
- **Checks:** `npm run check` aprovado (TypeScript, lint sem avisos, 109 testes); Deno 2.9.6 com imports congelados e compatibilidade Expo aprovados. Exports finais Android/web aprovados, com 12 rotas estáticas. Links locais e `git diff --check` aprovados. CI inclui Deno e export web.
- **Dependências:** `npm audit --omit=dev` reportou 42 entradas (29 altas, 12 moderadas, 1 baixa, nenhuma crítica), incluindo ferramentas Expo/Metro. Triagem preliminar do sourcemap e prioridade concreta para `decode-uri-component` em [TESTING.md](TESTING.md). Não houve upgrade forçado/incompatível; correções e avaliação de exposição permanecem como critério de distribuição.
- **Supabase:** função `identify-plant` implantada via CLI autenticada e migração `20261004120000` aplicada; lint remoto do banco sem erros. RPC continua restrita a `service_role`, permite limite até 500; app usa 10/origem/hora + 450 compartilhadas/dia UTC. Saúde remota: sem chave pública → 401; com chave pública → 500/configuration, pois ainda falta `PLANTNET_API_KEY`. Nenhuma identificação real bem-sucedida foi registrada.
- **Android:** prebuild novo sem Viro e `assembleRelease` aprovados (JDK 17/SDK 36, 571 tarefas, 28m44s). APK em `android/app/build/outputs/apk/release/app-release.apk` (90.554.333 bytes), com bundle embarcado, quatro ABIs e assinatura v2 verificada. Pacote `com.anonymous.Gardenfy`, versão 1.0.0/code 1, mínimo API 24/target 36. Manifesto sem permissão de microfone e arquivo sem entradas Viro. Mesmo keystore de avaliação anterior; atualização ainda não instalada/testada.
- **Arquivos locais preservados:** nativo anterior em `%LOCALAPPDATA%/Gardenfy/native-backups/android-before-release-v1-20261004-022912`; cópia do APK em `%LOCALAPPDATA%/Gardenfy/builds/Gardenfy-1.0-evaluation-6fbe0dc.apk`, com hash igual ao original. Pastas nativas e APK não estão no Git. ADB sem dispositivo e navegador de automação indisponível, portanto nenhuma interação/inspeção visual nova ocorreu. Preview temporário da tarefa na porta 8083 encerrado.
- **Pendências reais:** configurar chave Pl@ntNet conforme [ANALYSIS.md](ANALYSIS.md#configurar-plantnet), identificação real e roteiro Android da 1.0, instalar/testar APK sem Metro como atualização, preparar assinatura de distribuição e concluir triagem/correções de dependências. Não há declaração de lançamento nem autorização de merge.
- **Próximo passo:** usuário configurar a chave no painel, conectar Android e executar o roteiro vigente com o APK; seguir pela triagem de dependências. Revisar/integrar PR somente com instrução. A promoção `develop` → `main` aguarda os critérios de [RELEASE_1.0.md](RELEASE_1.0.md).

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
- **PR:** [#8 — análise compartilhada, revisão e falhas](https://github.com/NeytanBelisario/Gardenfy/pull/8), integrado em `develop` (`f864678`).
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
- **PR:** [#9 — configurar Supabase CLI](https://github.com/NeytanBelisario/Gardenfy/pull/9), integrado em `develop` (`26cfc11`).
- **Etapa concluída:** CLI Supabase `2.119.0` fixada como dependência de desenvolvimento; projeto local inicializado em `supabase/config.toml`; autenticação salva validada pela listagem de projetos.
- **Projeto remoto:** `Gardenfy` (`ukqsiclooawiqmttdobu`, região `us-west-2`) localizado com a credencial existente.
- **Vínculo remoto:** o projeto foi retomado pelo usuário e `npx supabase link --project-ref ukqsiclooawiqmttdobu --yes` concluiu com sucesso. A listagem da CLI confirmou `ACTIVE_HEALTHY` e `linked: true`; a listagem remota de Edge Functions respondeu sem funções cadastradas.
- **Checks locais:** `npm run check` aprovou TypeScript, lint sem avisos e 87 testes; `git diff --check` também passou. O `npm install` reportou 25 alertas de dependências (1 baixo, 13 moderados e 11 altos), sem correção automática aplicada nesta tarefa.
- **Segurança:** nenhum token, senha de banco ou segredo foi adicionado ao repositório. Arquivos temporários e ambientes locais do Supabase continuam ignorados.
- **Próximo passo:** revisar/integrar o PR de configuração. Depois, criar uma branch a partir de `develop` atualizado para implementar a Edge Function da análise, segredo Gemini, autenticação e limites de uso.

## Sessão de 02/10/2026 — M3: análise pelo servidor

- **Branch:** `feat/server-plant-analysis`, criada de `develop` atualizado após integrar o PR #9 (`26cfc11`).
- **PR:** [#10 — proteger análise por foto no Supabase](https://github.com/NeytanBelisario/Gardenfy/pull/10), integrado por `yDiony` em `develop` em 02/10/2026, às 15h43 (America/Sao_Paulo), no commit `6d1b1f5`. Integração conferida no GitHub em 03/10/2026; check remoto aprovado.
- **Entrega:** cliente envia somente foto/mime para a Edge Function `analyze-plant`; chave Gemini saiu do bundle e o SDK cliente foi removido. A função valida chave publicável, método, formato/tamanho, aplica timeout e chama uma única vez o endpoint REST do modelo.
- **Controle de uso:** migração cria tabela com RLS e RPC `security invoker`, acessíveis apenas por `service_role`. Limite de 10 análises por hora por origem; somente hash SHA-256 com salt secreto é salvo, com limpeza após dois dias.
- **Remoto:** migração `20261002174522` aplicada; secrets `ANALYSIS_RATE_LIMIT_SALT` e `GEMINI_MODEL` configurados; função versão 2 ativa. Chamada sem chave publicável retorna 401 e chamada autenticada retorna erro seguro de configuração enquanto falta `GEMINI_API_KEY`.
- **Checks:** `npm run check` aprovou TypeScript, lint sem avisos e 92 testes. Migração dry-run/aplicação/listagem passaram; teste transacional da cota aceitou 10 e recusou a 11ª chamada; `anon` recebeu permissão negada na RPC; lint remoto sem erro. Advisor encontrou dois avisos preexistentes em `public.rls_auto_enable()`, fora do escopo desta entrega.
- **Limitações:** nenhuma chave Gemini disponível nesta máquina, chamada real ao modelo, app em dispositivo ou APK. URL/chave publicável do Supabase foram configuradas no `.env` local ignorado; outros ambientes precisam recriar esses valores. Limite por origem é uma proteção provisória enquanto não há autenticação de usuário.
- **Próximo passo:** cadastrar `GEMINI_API_KEY` diretamente nos secrets do projeto, executar chamada real com foto não sensível e validar o fluxo no aparelho. Depois revisar/integrar o PR desta branch.

## Sessão de 03/10/2026 — Android e diagnóstico da análise real

- **Branch:** `chore/android-analysis-validation`, criada de `develop` atualizado em `6d1b1f5`, após confirmar a integração do PR #10. Não havia PRs abertos na retomada.
- **PR:** [#11 — faturamento da análise e validação Android](https://github.com/NeytanBelisario/Gardenfy/pull/11), integrado em `develop` em 03/10/2026 (horário de São Paulo), commit `56749e2`.
- **Etapas publicadas:** `47520dc` (diagnósticos seguros do servidor), `0936ecf` (HTTP 402 tratado como configuração, com regressões) e `0c2268d` (build, jornada local e documentação).
- **Ambiente:** Windows, Node `22.22.2` e npm `10.9.7` portáteis em `%LOCALAPPDATA%\Gardenfy\tools`; arquivo oficial conferido por SHA-256. Dependências instaladas pelo lockfile; dry-run confirmado com as versões fixadas. `.env` público preenchido pelo usuário e ignorado pelo Git; CLI Supabase `2.119.0` autenticada e vinculada ao projeto existente.
- **Android:** JDK 17, Platform/Build Tools 36 e NDK `27.1.12297006`; aparelho Samsung `SM-G781B`, Android 13 / API 33, ARM64. `expo run:android --device SM_G781B --no-bundler` compilou o APK debug com Nova Arquitetura e instalou como atualização do aplicativo existente. Nenhuma desinstalação ou limpeza de dados executada.
- **Abertura:** Metro inicialmente ficou vinculado somente a `::1`; o app não alcançou o bundle pelo USB e mostrou diálogo de aplicativo sem resposta. Metro foi reiniciado com `--lan`, hostname `127.0.0.1`, e o encaminhamento `adb reverse` está ativo; `/status` respondeu 200 por IPv4. O app voltou a responder e a home abriu pela rota `gardenfy:///`, exibindo os dados anteriores. Nenhum reinício forçado do processo executado.
- **Jornada local:** criado jardim separado `Validacao 03-10`, adicionada Monstera pelo catálogo e registrados uma rega e uma adubação. Detalhes e histórico apresentaram os dois eventos, em ordem correta, com água/luz ainda desconhecidas. Após `Reload` no menu de desenvolvimento (reinicialização do JavaScript), jardim, planta e ambos os cuidados foram recuperados do armazenamento nativo. Não equivale a testar encerramento completo do processo, reinício do aparelho ou fotos duráveis.
- **Servidor:** usuário cadastrou `GEMINI_API_KEY`. Requisições com imagem pública do catálogo passaram pela autenticação e alcançaram o Gemini, que respondeu HTTP 402 para `gemini-3.5-flash-lite`. Logs agora registram apenas status/modelo e tipo da falha, sem foto, payload, resposta bruta ou credenciais. Função atualizada no Supabase; nova requisição retornou `500 / configuration`, comprovando a classificação corrigida.
- **Checks:** `npm run check` aprovado com TypeScript, lint sem avisos e 94 testes; compatibilidade Expo e export Android aprovados na preparação; build APK debug e instalação aprovados nesta etapa. `git diff --check` aprovado.
- **Pendências:** regularizar faturamento/créditos do projeto Gemini e repetir a análise; validar encerramento/reabertura completos, fotos duráveis, edição/exclusão, câmera/galeria, acessibilidade e AR no aparelho. Não há análise bem-sucedida nem roteiro nativo completo validado nesta sessão. O jardim de teste permanece no aparelho para revisão.
- **Backup:** código e documentação publicados em `origin/chore/android-analysis-validation`; este registro do PR também será publicado no encerramento. Não fazer merge sem instrução específica.
- **Próximo passo:** regularizar o projeto da chave Gemini e repetir uma chamada real com imagem não sensível; depois validar o fluxo no aparelho e os cenários manuais restantes. Metro permanece ativo por USB neste PC.

## Sessão de 03/10/2026 — continuidade sem Gemini

- **Branch:** `docs/local-work-continuation`, criada de `develop` atualizado em `56749e2`, após confirmar o merge do PR #11.
- **PR:** [#12 — continuidade pelo catálogo e cuidados sem Gemini](https://github.com/NeytanBelisario/Gardenfy/pull/12), integrado em `develop`, commit `1f1919d`.
- **Decisão do usuário:** continuar sem Gemini. Usar catálogo e cuidados locais; análise por foto e faturamento ficam adiados, com M3 ainda parcial. Nenhuma nova chamada ao provedor ou alteração de secrets/configuração realizada nesta retomada.
- **Entrega:** README e guia explicam o uso local; roteiro prioriza edição/exclusão, correção de cuidados, encerramento/reabertura e uso sem rede. As telas de análise continuam disponíveis, sem bloqueio novo no código.
- **Checks:** `npm run check` aprovado na base integrada: TypeScript, lint sem avisos e 94 testes. Os 13 links locais, a âncora do roteiro e `git diff --check` passaram. Metro respondeu em `/status`; ADB não encontrou aparelho conectado. Nenhum novo teste nativo realizado.
- **Próximo passo:** com aparelho conectado, seguir “Continuar a validação sem Gemini” em `TESTING.md`. Escolha de nova feature permanece aberta; o roadmap não autoriza implementá-la automaticamente.
- **Backup:** `3d0fd79` (roteiro e decisão de uso local) publicado em `origin/docs/local-work-continuation`; este registro do PR também será publicado no encerramento.

## Sessão de 03/10/2026 — ajustes do front sem celular

- **Branch:** `feat/local-ui-polish`, criada de `develop` atualizado em `1f1919d`, após confirmar a integração do PR #12.
- **PR:** [#13 — melhora do front local e preview web](https://github.com/NeytanBelisario/Gardenfy/pull/13), aberto para `develop`; integração pendente.
- **Escopo autorizado:** melhorar o front e a experiência dos fluxos locais sem depender do celular ou Gemini.
- **Entrega:** home com resumo e cards compactos; barra com rotas existentes e estado ativo; catálogo priorizado, quantidade real, busca vazia, fallback de fotos e layout de uma coluna em tela estreita/texto ampliado; cadastro e detalhes com textos em português. Perfil mostra contagens e atalhos reais; identidade fixa, conquistas/rank fictícios e botões sem ação foram retirados da interface. Perfil editável continua pendente.
- **Web:** o preview inicialmente falhou ao importar Viro nativo (`requireNativeComponent` ausente). Adicionado `PlantArScreen.web.tsx`, sem importar Viro, com explicação e retorno aos jardins. Export estático web aprovado após a correção; isso não comprova interação ou compatibilidade web completa.
- **Etapas publicadas:** `a394f67` (telas e navegação), `01f600a` (fallback web, métricas parciais e responsividade) e `e4ff997` (documentação/validação) em `origin/feat/local-ui-polish`. Este registro do PR também será publicado ao encerrar.
- **Checks:** `npm run check` aprovado com TypeScript, lint sem avisos e 94 testes; export conjunto Android/web aprovado com 12 rotas estáticas; 13 links locais e `git diff --check` passaram. Novo APK não foi compilado: alterações são de interface/JS, sem módulos nativos novos.
- **Preview local:** Metro web ativo em `http://localhost:8082`. Requisições HTTP para home, perfil, AR e criação responderam 200 após reiniciar o servidor com o novo arquivo por plataforma. Isso valida a resposta do servidor; bootstrap/hidratação e interações do cliente não foram verificados em navegador.
- **Limites:** nenhum aparelho conectado nem navegador disponível pela ferramenta de automação; inspeção visual, cliques/toques, teclado e leitor de tela não executados. Nenhuma chamada Gemini, mudança de schema, dependência ou segredo.
- **Próximo passo:** revisar/integrar o PR e executar “Roteiro dos ajustes de front — uso local” em `TESTING.md`, no navegador disponível ao usuário e depois no Android.

## Modelo para próximas sessões

- Data e branch:
- PR / item do roadmap:
- Etapas concluídas:
- Validação executada e resultado:
- Limitações / pendências:
- Próximo passo concreto:
- Backup remoto (último commit enviado ou motivo de falha):
