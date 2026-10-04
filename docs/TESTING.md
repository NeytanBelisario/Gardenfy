# Validação do Gardenfy

## Checks automatizados

```bash
npm ci
npm run check
npx expo install --check
npx expo export --platform android
```

`npm run check` executa TypeScript, ESLint (com zero avisos permitidos) e testes de persistência. `npm test` permite executar só os testes. A configuração de lint segue o [guia oficial do Expo](https://docs.expo.dev/guides/using-eslint/), com exceção pontual documentada para o asset GLB nativo.

O workflow `.github/workflows/checks.yml` executa instalação pelo lockfile, checks e testes, compatibilidade dos pacotes Expo e export do bundle Android em PRs para `develop`/`main` e pushes nessas bases. O export valida JavaScript/assets; não produz APK nem substitui teste nativo.

## Roteiro manual — situação atual

Execute com build nativo Android e registre versão do sistema, modelo do dispositivo, commit e resultado. Os resultados abaixo ainda não foram executados em dispositivo nesta sessão.

| Passo | Comportamento a verificar | Limitação / validação pendente |
| --- | --- | --- |
| Abrir pela primeira vez | Home vazia e acesso à criação de jardim. | Store começa vazio. |
| Criar jardim | Nome, ambiente e ícone aparecem após salvar; nome vazio gera feedback. | Persistência implementada; testar no aparelho. |
| Adicionar pelo catálogo | Busca/filtro funcionam; planta aparece após salvar e contagem aumenta. | Catálogo estático; métricas iniciais desconhecidas aparecem como “—”/“Sem análise”. |
| Analisar uma foto | Pedir permissão; mostrar carregamento, resultado para revisão e confirmar adicionar/atualizar planta. | Requer rede, configuração pública do Supabase no app e segredo Gemini no servidor; validação real pendente. |
| Cancelar seleção / negar câmera | Permitir continuar navegando sem travar. | Registrar falhas encontradas para a etapa de análise. |
| Abrir perfil | Contagens acompanham jardins/plantas. | Usuário e badges fixos; configurações/sair sem ação. |
| Abrir preview AR | Detectar plano, posicionar, girar, redimensionar e reposicionar. | Requer aparelho AR compatível. |
| AR indisponível | Mostrar fallback e permitir voltar. | Não equivale a validar toda a experiência web. |
| Encerrar e reabrir o app | Recuperar jardins, plantas, análises e fotos da sessão anterior. | Implementado e testado no domínio; teste nativo pendente. |

Não use dados pessoais reais nas fotos de teste. Uma execução sem segredo Gemini valida apenas o tratamento dessa ausência, não o serviço de IA.

## Registro da sessão de 01/10/2026

Ambiente: Linux/WSL2, Node `22.22.2`, npm `10.9.7`. Esta máquina não possui Java, Android SDK/adb, emulador ou dispositivo configurados. Portanto, instalação e checks JS podem ser executados, mas compilação/instalação de APK, câmera e AR continuam pendentes de máquina/dispositivo preparados.

A instalação limpa, typecheck/lint, compatibilidade Expo, export Android e prebuild Android passaram nesta sessão. O lockfile final também passou em instalação dry-run após a atualização de `shell-quote`. A compilação de APK e os testes manuais continuam pendentes. O detalhe dos resultados e alertas restantes de dependências fica em `docs/HANDOFF.md`. Os testes de reinício, falhas de leitura/escrita e recuperação foram adicionados na entrega de persistência; a validação nativa continua pendente.

## Roteiro adicional — persistência

1. Reconstruir o app nativo para instalar AsyncStorage/FileSystem; criar jardim e adicionar uma planta pelo catálogo.
2. Encerrar completamente o app e reabrir; conferir nome, ambiente, ícone, planta e contagens.
3. Com a análise configurada, adicionar uma foto, reiniciar e conferir imagem, métricas e data.
4. Reanalisar e repetir a verificação; sem rede, confirmar erro de análise e preservação do resultado anterior.
5. Sem rede, criar jardim e adicionar pelo catálogo; reiniciar e conferir dados (fotos remotas podem não carregar).
6. Conferir feedback de carregamento/salvamento e que toques rápidos não repetem a mesma inclusão.

Os testes automatizados injetam falhas de leitura, escrita e cópia; não é necessário corromper dados reais para esses cenários. Erros de quota e integração nativa devem ser avaliados em um ambiente de teste dedicado.

## Registro da sessão de 02/10/2026

Instalação limpa, `npm run check` (typecheck, lint e 24 testes), compatibilidade Expo, export Android e prebuild Android passaram. Os testes de fotos usam um adapter de arquivos no Node, incluindo leitura após remoção do cache; isso não equivale à execução do Expo FileSystem ou do AsyncStorage em um aparelho. O roteiro manual acima ainda deve ser executado com um novo build nativo.

## Roteiro adicional — edição e exclusão

Execução no aparelho pendente. Usar o build nativo com armazenamento já instalado e registrar dispositivo, sistema e commit:

1. Editar nome, ambiente e ícone do jardim; cancelar um rascunho e confirmar que os dados não mudam. Salvar, reiniciar e conferir detalhes e home.
2. Editar nome e descrição de uma planta analisada; conferir que foto, identificação, data e estimativas permanecem. Reanalisar e verificar que nome/descrição editados continuam.
3. Salvar nome vazio em ambos os formulários; conferir feedback e possibilidade de corrigir. Verificar teclado, rolagem, botão voltar do Android e texto ampliado em uma tela pequena.
4. Abrir exclusão de planta e cancelar; repetir e confirmar. Conferir contagem, perfil, agregados e demais plantas após reinício. Excluir a última planta e verificar o estado vazio.
5. Abrir exclusão de jardim com plantas; conferir aviso de exclusão em conjunto e cancelar. Confirmar depois, verificar retorno à home, contagens do perfil e ausência do jardim após reinício.
6. Repetir edição/exclusão sem rede; testar toques rápidos e bloqueio de cancelamento durante gravação. As imagens remotas do catálogo podem ficar indisponíveis.

Checks desta entrega: `npm run check` (TypeScript, lint e 35 testes) e export Android aprovados. Regressões automatizadas cobrem reinício, preservação da análise ao editar, falhas das quatro operações, limpeza após confirmação da gravação, fotos compartilhadas, falha de limpeza e ações atrasadas para registros excluídos. Nenhum APK ou teste manual em aparelho foi executado.

## Roteiro adicional — métricas desconhecidas

Execução no aparelho pendente:

1. Criar jardim vazio e conferir “Sem análise” na home e nos detalhes, sem percentual inventado.
2. Adicionar pelo catálogo: indicadores da planta mostram “—”, texto “Sem análise” e crescimento desconhecido. Reiniciar e conferir o mesmo estado.
3. Analisar uma planta: conferir identificação como estimativas da IA, data e indicadores. Num jardim misto, conferir quantidade de plantas analisadas e médias sem incluir as plantas sem análise.
4. Em dados de teste com análise zero, conferir `0%` e crescimento `0d`, distinguindo-os dos desconhecidos. Com outra análise positiva, conferir que zero participa das médias.
5. Abrir dados v1 existentes e conferir preservação de nomes, fotos, datas e análises; placeholders sem análise passam a desconhecidos. Salvar uma edição e reiniciar para conferir persistência v2.
6. Excluir a última planta analisada mantendo uma do catálogo: agregados voltam a “Sem análise”. Verificar também tela pequena, texto ampliado e leitura dos rótulos de vitalidade/luz/água com TalkBack.

Checks automatizados desta entrega: `npm run check` (TypeScript, lint e 40 testes), export Android e `git diff --check`. Cinco novas regressões cobrem valores desconhecidos, zeros nas médias, reanálise, migração sem gravação na leitura, gravação v2, recuperação após falha e rejeição de v1 inválido. Nenhum APK ou teste em dispositivo foi executado.

## Roteiro adicional — planta, cuidados e histórico (M2)

Execução no aparelho pendente. Registrar dispositivo, sistema, commit e resultados:

1. Abrir “Ver detalhes e cuidados” de uma planta do catálogo. Conferir nome, descrição, foto/fallback, cards sem análise e histórico vazio. Testar volta ao jardim e rota para ID indisponível.
2. Tocar Regar e Adubar; conferir confirmação após salvar, tipo e data/hora no histórico. Tocar rapidamente e conferir bloqueio durante gravação. Reiniciar e verificar ambos os registros.
3. Conferir que os cuidados não mudam hidratação/luz/vitalidade, data da análise, fotos ou contagens, tanto antes quanto depois de analisar a planta.
4. Analisar pela tela da planta e voltar: conferir origem/data dos cards e registro de análise. Reanalisar: conferir preservação dos retratos anteriores e atualização somente das estimativas atuais/foto atual. Reiniciar e verificar o histórico misto.
5. Corrigir um cuidado: mudar tipo e data/hora no horário local, salvar e conferir ordem cronológica. Tentar 31/04 e 24:00; conferir erro e possibilidade de corrigir. Cancelar e conferir que nada muda.
6. Excluir um cuidado: cancelar a confirmação, depois confirmar e reiniciar. Conferir remoção apenas daquele cuidado e preservação das análises/estimativas.
7. Abrir instalação com dados v1/v2: verificar dados/fotos e recuperação da última análise com data no histórico. Registros anteriores não existiam nesses schemas. Salvar cuidado e reiniciar para verificar migração v3.
8. Sem rede, registrar/corrigir/excluir cuidados e reiniciar. Fotos remotas podem exibir fallback; análise nova depende de rede. Verificar texto ampliado, tela pequena, TalkBack, teclado, rolagem e voltar do Android nos diálogos.

Checks desta entrega: `npm run check` (TypeScript, lint sem avisos e 53 testes), os mesmos 53 testes com `TZ=America/Sao_Paulo`, export Android e `git diff --check` aprovados. As 13 novas regressões cobrem cuidados sem fabricar medições, retratos históricos, correção/exclusão, falhas das três operações, concorrência, confirmação de gravação, alvo excluído, v2→v3, schema inválido, ordenação e datas locais. Testes anteriores também continuam cobrindo migração de v1 e falhas de análise. Nenhum APK, chamada real à IA ou execução em dispositivo foi realizado.

## Roteiro adicional — análise compartilhada, servidor e falhas (M3)

Execução no aparelho/serviço real pendente. Registrar dispositivo, sistema, modelo configurado, commit e resultados, sem credenciais:

1. Abrir scan geral, inclusão por foto no jardim e reanálise da planta. Conferir explicação do envio ao Google e indicação de estimativas. Sem configuração Supabase no app ou sem segredo Gemini no servidor, tocar câmera/galeria e conferir feedback, sem travar a navegação.
2. Autorizar/negar câmera e galeria (incluindo acesso limitado às fotos, quando disponível). Conferir alternativas indicadas na negativa; cancelar o seletor e conferir preservação do resultado/dados anteriores. Tocar rapidamente e conferir um seletor por vez.
3. Analisar com serviço configurado: scan geral mostra identificação e indicadores sem salvar. Inclusão permite revisar/corrigir o nome e exige confirmação. Conferir que a identificação sugerida permanece separada do nome escolhido.
4. Reanalisar uma planta: conferir dados salvos anteriores enquanto o resultado novo está em revisão. Se identificação divergir, conferir aviso e confirmação explícita. Descartar e reiniciar: dados antigos continuam. Confirmar e reiniciar: estimativas atuais, data/foto e histórico são atualizados, mantendo nome/descrição e cuidados.
5. Sem rede, tentar analisar: conferir mensagem de conexão e possibilidade de repetir a mesma foto ou escolher outra. Restaurar rede e repetir. Conferir também falha de quota/configuração/indisponibilidade em ambiente de teste do serviço.
6. Cancelar durante a análise e navegar para fora antes da resposta. Conferir ausência de salvamento atrasado. Simular atraso acima de 30 segundos e resposta inválida/bloqueada por adapter de teste: conferir timeout/resposta inválida e recuperação. Não afirmar que abortar no cliente evita cobrança do provedor.
7. Simular falha de armazenamento ao confirmar em ambiente dedicado: rascunho permite repetir o salvamento sem nova análise e mantém dados/fotos anteriores. Voltar ao jardim e confirmar contagens/estado.
8. Verificar teclado e nome vazio na revisão, TalkBack, texto ampliado, telas pequenas e IDs indisponíveis. Câmera/galeria reais, permissões e aborto no SDK ainda exigem execução nativa.

Checks acumulados: `npm run check` (TypeScript, lint sem avisos e 92 testes), além das validações remotas descritas em `ANALYSIS.md`. Os adapters simulam transporte/seletor e as regressões novas cobrem a fronteira cliente/servidor; não executam UI, câmera/galeria ou permissões do sistema. Nenhum APK, chamada real ao Gemini ou teste em aparelho foi realizado.

## Continuar a validação sem Gemini

Decisão do usuário em 03/10/2026: seguir pelo catálogo e pelos cuidados locais. Não é necessário configurar ou chamar Supabase/Gemini para este roteiro. Usar um jardim de teste separado; o jardim `Validacao 03-10` criado na sessão anterior pode ser reutilizado.

1. Criar jardim e incluir uma planta pelo catálogo. Conferir contagens, detalhes e água/luz “Sem análise”. Essa parte passou na sessão anterior.
2. Editar nome/ambiente/ícone do jardim e nome/descrição da planta; cancelar um rascunho e testar nome vazio. Conferir preservação dos demais dados.
3. Registrar rega/adubação, corrigir tipo/data/hora e testar data inválida. Cancelar e confirmar a exclusão de um cuidado; conferir ordem do histórico e métricas desconhecidas. Registro dos dois tipos e ordenação passaram; correção/exclusão ainda pendentes.
4. Encerrar o app manualmente e reabrir com Metro acessível; conferir dados e cuidados. O `Reload` anterior passou, mas não substitui encerramento completo do processo.
5. Cancelar e confirmar exclusão da planta de teste, conferir jardim vazio e contagens; repetir com o jardim de teste e conferir retorno à home. Preservar jardins pessoais.
6. Repetir operações locais sem rede no aparelho; conferir recuperação dos dados e fallback das fotos remotas. O build debug deve continuar alcançando Metro pelo USB.

Registrar dispositivo, commit e resultado de cada passo. Em 03/10/2026, na retomada após integrar o PR #11, o ADB não encontrou aparelho conectado; nenhum novo teste nativo foi executado. Câmera/galeria, fotos duráveis, análise bem-sucedida e AR mantêm seus roteiros separados e continuam pendentes.

## Registro da sessão de 03/10/2026 — Windows, APK e análise real

- Node `22.22.2`, npm `10.9.7`, JDK 17 e SDK Android 36 no Windows; aparelho Samsung `SM-G781B`, Android 13 / API 33, ARM64.
- Build debug com Nova Arquitetura aprovado por `expo run:android --device SM_G781B --no-bundler`. APK em `android/app/build/outputs/apk/debug/app-debug.apk`, instalado como atualização; nenhuma limpeza de dados ou desinstalação. É um build dependente de Metro, não uma versão distribuível autônoma.
- Metro inicialmente ficou acessível somente via `::1`, impedindo acesso do aparelho pelo encaminhamento USB. Reiniciado com `--lan` e `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1`; `/status` respondeu 200 por IPv4 e `adb reverse tcp:8081 tcp:8081` foi configurado. Após o diálogo de aplicativo sem resposta inicial, a home abriu pela rota `gardenfy:///` e mostrou os dados existentes.
- Jornada executada no aparelho: criar `Validacao 03-10`, adicionar Monstera pelo catálogo, abrir detalhes, registrar rega/adubação e conferir histórico ordenado. Água/luz permaneceram desconhecidas. Após `Reload` no menu de desenvolvimento, o armazenamento nativo recuperou jardim, planta e ambos os cuidados. Esse teste reinicializa o JavaScript; encerramento completo do processo e reinício do aparelho ainda não foram validados. Jardim de teste preservado para revisão.
- Requisição real com a imagem pública da Monstera usada no catálogo, sem dados pessoais, alcançou o Gemini. Logs mostraram HTTP 402 para `gemini-3.5-flash-lite`; validação de sucesso depende de regularizar faturamento/créditos do projeto da chave. Após corrigir a classificação, a função respondeu `500 / configuration`, sem detalhes internos.
- `npm run check` aprovou TypeScript, lint sem avisos e 94 testes. As duas novas regressões verificam HTTP 402 no serviço e a propagação de erro do provedor pelo transporte Supabase sem retry. Compatibilidade Expo, export Android e `git diff --check` passaram.
- Ainda não validados: encerramento/reabertura completos, fotos duráveis, edição/exclusão, câmera/galeria, análise bem-sucedida, acessibilidade e AR.
