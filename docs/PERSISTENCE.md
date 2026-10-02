# Persistência de jardins e plantas

A entrega de persistência usa [AsyncStorage compatível com Expo 55](https://docs.expo.dev/versions/v55.0.0/sdk/async-storage/) para os dados e [Expo FileSystem](https://docs.expo.dev/versions/v55.0.0/sdk/filesystem/) para fotos no aplicativo nativo. O cadastro pelo catálogo continua independente da análise por IA e de uma conexão de rede; as imagens remotas do catálogo podem ficar indisponíveis sem rede.

## Formato e carregamento

A chave `@gardenfy/gardens` contém um JSON com `version: 3` e `gardens`. A validação verifica jardins, plantas, métricas, histórico, referências de fotos e IDs duplicados antes de carregar ou gravar.

O store é carregado uma vez na abertura do app. `GardensBootstrap` mostra carregamento e libera as rotas quando a leitura termina. Sem dados salvos, o estado inicial é vazio. Falha de leitura, JSON inválido ou versão desconhecida mostra um erro com opção de tentar novamente; o conteúdo existente não é substituído por um estado vazio.

Dados v1 são validados pelo formato original e migrados em memória: água/luz de plantas sem vitalidade (cadastro sem análise) tornam-se `null`; análises, inclusive zeros, fotos, nomes e datas permanecem. Os agregados são recalculados incluindo zeros conhecidos e excluindo valores desconhecidos. Dados v1/v2 recebem um histórico vazio ou um registro da última análise quando há data salva. Os formatos antigos só guardavam a última análise, portanto não é possível recuperar análises anteriores nem cuidados que nunca foram registrados. IDs desse registro migrado são determinísticos. A leitura não grava nada: o formato v3 é salvo na próxima operação bem-sucedida. Se essa gravação falhar, o JSON original permanece. Mudanças futuras de schema devem ter migração explícita e testes antes de alterar a versão. Dados incompatíveis/corrompidos ainda não têm ferramenta de reparo no app; a tentativa de leitura não apaga esses dados.

## Gravação

As operações de criação de jardim, inclusão pelo catálogo, inclusão por foto, reanálise, edição, exclusão e registro/correção/exclusão de cuidados são assíncronas. Uma fila serializa mudanças, e a memória só é atualizada quando a gravação confirma sucesso. Falhas são apresentadas na tela e a operação pode ser repetida. Uma falha não impede as próximas operações da fila.

A criação exige nome preenchido. O antigo `createMockGarden` foi substituído por `createGarden`; o catálogo estático não inicializa mais o store por efeito colateral. As telas aguardam o salvamento antes de navegar ou apresentar resultado salvo.

Esse armazenamento é local, sem conta, sincronização ou backup em servidor. Os dados sobrevivem ao reinício normal do app; limpar dados, desinstalar ou perder o aparelho pode removê-los. AsyncStorage não é armazenamento criptografado de credenciais. O Git transfere o código entre PCs, não os jardins de quem usa o aplicativo.

## Fotos

No Android/iOS, a foto selecionada é copiada para `Paths.document/gardenfy-photos` antes da gravação dos dados. O JSON guarda uma referência relativa (`gardenfy-photo:<nome>`), resolvida para o caminho atual ao exibir a planta; não depende do caminho absoluto do sandbox ou do cache do picker.

Se a cópia falhar, a inclusão/atualização não é confirmada. Se a gravação dos dados falhar, a nova cópia é removida quando possível. Na reanálise bem-sucedida, a foto anterior é removida somente se nenhuma planta a referencia. Falha de limpeza não transforma um salvamento já confirmado em erro. Encerramento abrupto entre cópia e gravação pode deixar uma foto órfã; não há coleta automática dessas sobras nesta entrega.

Na implementação web, fotos `blob:` são convertidas para data URI antes de gravar, evitando referências que expiram ao recarregar. Limites de armazenamento do navegador podem impedir uma gravação, que será tratada como falha. Essa adaptação não comprova compatibilidade do app inteiro com web.

Novas dependências nativas exigem reconstruir o app com `npm run android` ou `npm run ios`. Apenas reiniciar Metro não instala o módulo de armazenamento.

## Testes e próximo passo

`npm test` executa testes com Node/tsx para reinício do store, schema inválido, bloqueio durante carregamento, falhas de leitura/escrita/cópia, fila de operações e substituição de fotos. Um teste usa dados e fotos em arquivos reais e verifica leitura após remover o cache e realocar o diretório. Os adapters nativos ainda precisam de validação em um aparelho; veja [TESTING.md](TESTING.md).

Cuidados/histórico estão implementados no domínio e na interface; validação em dispositivo continua pendente. A persistência não transforma as estimativas da IA em medições de sensores.

## Edição e exclusão

Na tela de detalhes, as ações Editar/Excluir aparecem para o jardim e cada planta. Jardins permitem alterar nome, ambiente e ícone; plantas permitem alterar nome e descrição opcional. Nomes vazios são rejeitados. As edições preservam IDs, análises, datas e fotos; reanalisar também preserva o nome/descrição editados.

Excluir exige confirmação explícita, com opção de cancelar. Excluir um jardim remove suas plantas e análises; excluir uma planta recalcula contagens e agregados do jardim. A navegação volta à home após excluir o jardim. Salvamento/exclusão bloqueiam novas ações no diálogo e mostram falhas com opção de repetir.

Os dados são gravados antes de limpar fotos que perderam todas as referências. Fotos compartilhadas, inclusive usadas na capa de outro jardim, são preservadas. Falha de gravação mantém dados e fotos anteriores; falha de limpeza após sucesso pode deixar uma foto órfã e não desfaz a exclusão. A fila rejeita ações para IDs já excluídos, evitando recriar registros por uma operação atrasada. As operações usam o schema v3 descrito acima, sem novas dependências.

## Métricas e ausência de análise

Métricas de água/luz e agregados do jardim usam `null` para desconhecido. Vitalidade e crescimento da planta continuam opcionais quando não há análise. Zero é uma estimativa válida e participa da média; não equivale a ausência de informação. Um jardim vazio ou só com plantas sem análise tem agregados desconhecidos.

Home e detalhes mostram “Sem análise”; os indicadores compactos da planta mostram “—” com texto explicativo e rótulos acessíveis. Crescimento conhecido de zero dias aparece como `0d`. Resultados e médias são identificados como estimativas da IA, e o detalhe informa quantas plantas foram analisadas. Cada média usa apenas os valores conhecidos daquele indicador; o catálogo estático não fabrica métricas.

## Cuidados e histórico da planta

Cada planta tem `history`, uma lista de registros com ID, tipo e instante ISO em UTC. Rega/adubação (`kind: care`) são registros feitos pelo usuário. Análises (`kind: analysis`) guardam um retrato de identificação, saúde, vitalidade, água/luz e crescimento estimado na data da análise. Uma reanálise adiciona outro registro sem sobrescrever resultados históricos; editar nome/descrição preserva o histórico.

Regar/Adubar salva o instante atual, mostra sucesso após confirmação e bloqueia toques repetidos durante a gravação. Registrar, corrigir ou excluir cuidado não muda métricas, vitalidade, data da última análise, contagens ou fotos. Falhas de escrita preservam memória e armazenamento anteriores e permitem tentar novamente. Operações para plantas/jardins excluídos são rejeitadas.

A tela de detalhes é acessível pelo botão “Ver detalhes e cuidados” no jardim. Ela mostra hidratação e luz como estimativas da IA, com data e estado sem análise, permite abrir a análise existente e apresenta histórico do mais recente para o mais antigo. Em instantes iguais, a inserção mais recente vem primeiro. Datas são exibidas no horário local do aparelho.

Cuidados permitem corrigir tipo, data e hora (`DD/MM/AAAA`, `HH:mm`) ou excluir com confirmação. Datas/horas inválidas são rejeitadas, e corrigir somente o tipo preserva os segundos do instante original. A posição no histórico acompanha a data corrigida. Registros de análise não são editáveis/excluíveis individualmente nesta entrega.

O histórico conserva valores, não cópias das fotos antigas: apenas a foto atual continua armazenada, com a mesma limpeza de reanálise. Excluir a planta/jardim remove seu histórico junto dos demais dados. Não há agendamento, lembretes, sincronização ou medição automática de hidratação.
