# Análise por foto

O scan geral, a inclusão no jardim e a reanálise da planta usam `PlantAnalysisScreen`, o hook `usePlantPhotoAnalysis` e o mesmo serviço/parser em `src/features/plant-analysis`. Não há chamada duplicada nem salvamento automático ao receber uma resposta.

## Seleção, revisão e salvamento

A tela explica que a foto de uma única planta será enviada ao Google Gemini e que os resultados são estimativas. Câmera e galeria pedem a permissão correspondente e tratam negativa, cancelamento, ausência de imagem/base64 e falhas ao abrir o seletor. O bloqueio começa antes de pedir permissão, evitando abrir dois seletores por toques rápidos.

O resultado fica em revisão, sem alterar o jardim. Na inclusão, a pessoa pode corrigir o nome antes de confirmar; o nome escolhido fica separado da identificação sugerida pela IA, inclusive no retrato histórico. Na reanálise, uma identificação diferente gera aviso para revisão, sem impedir a confirmação explícita. Nome/descrição já cadastrados são preservados. É possível descartar o resultado.

O scan geral é uma consulta sem persistência, agora também com identificação e acesso à câmera. Para incluir uma planta, use o fluxo do jardim. Confirmar inclusão/reanálise usa o store existente: memória/histórico/fotos só mudam após gravação confirmada. Falha ao salvar mantém o rascunho para tentar novamente sem outra chamada à IA. Não há mudança de schema nesta entrega (permanece v3).

## Parser e falhas

O parser exige os seis campos completos (`Nome`, `Saude`/`Saúde`, `Vitalidade`, `Rega`, `Luz`, `Crescimento`). Normaliza acentos/caixa da saúde e nome comum. Aceita linhas vazias e unidades previstas, mas rejeita duplicatas, texto extra, números negativos, decimais, valores fora das faixas e inteiros de crescimento inseguros. Não transforma resposta inválida em métricas válidas por truncamento ou clamp. Zero válido é preservado.

Vitalidade fica em 0–100; água/luz em 0–10; crescimento é um inteiro não negativo de dias. Água/luz são estimativas visuais solicitadas à IA, não sensores nem registros de rega. Uma foto não garante a identificação correta ou a estimativa de hidratação.

O app faz uma única chamada à Edge Function `analyze-plant`, que então faz uma única chamada ao modelo configurado. Mensagens distinguem configuração ausente/inválida, falha de conexão, limite de uso, indisponibilidade, timeout e resposta inválida/bloqueada. Resposta bruta, URLs do provedor e credenciais não são mostradas nem registradas no console.

Para investigar falhas no servidor, os logs registram somente status HTTP e modelo em respostas de erro do provedor; falhas de transporte registram modelo, cancelamento e nome da classe do erro. Falhas inesperadas registram apenas o nome da classe. Foto, Base64, resposta bruta, mensagem da exceção e credenciais permanecem fora dos logs.

HTTP 402 do Gemini é tratado como falha de configuração do serviço. Na validação de 03/10/2026, a chave cadastrada alcançou o provedor, mas o modelo respondeu 402; a análise bem-sucedida ficou pendente de regularizar o faturamento/créditos no projeto associado à chave. A [documentação de faturamento](https://ai.google.dev/gemini-api/docs/billing#prepay) explica esse status; não basta cadastrar uma chave para comprovar acesso ao modelo.

Após 30 segundos, o cliente encerra a espera e sinaliza abort ao transporte. É possível cancelar durante a análise e repetir a mesma foto após falha, ou escolher outra. Sair da tela cancela a análise e ignora resultados atrasados; mudar jardim/planta reinicia a sessão da tela. A tentativa de nova análise não apaga o resultado anterior nem escreve no store. O cancelamento é do cliente; não garante interromper processamento/cobrança já iniciados no provedor. Uma gravação já confirmada não é desfeita por sair da tela.

## Configuração e seleção do modelo

O cliente precisa somente dos valores públicos do projeto:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

A função lê `GEMINI_API_KEY`, `GEMINI_MODEL` e `ANALYSIS_RATE_LIMIT_SALT` dos secrets do Supabase. `GEMINI_MODEL` usa `gemini-3.5-flash-lite` por padrão. A seleção foi revisada em 02/10/2026 pela [lista oficial de modelos](https://ai.google.dev/gemini-api/docs/models) e pela [política de descontinuação](https://ai.google.dev/gemini-api/docs/deprecations): a documentação recomenda 3.5 Flash-Lite ou 3.8 Flash para novos projetos, limita o acesso aos modelos 2.5 a usuários anteriores e lista o desligamento de 2.0 Flash. Não há fallback para outro modelo nem segunda chamada automática.

Essa revisão documental não comprova acesso, quota, qualidade ou compatibilidade do modelo com uma conta específica. Nenhuma requisição real ao Gemini foi feita nesta sessão porque a chave não estava disponível nesta máquina. A função usa o endpoint REST oficial e mantém a credencial fora do bundle do app; o SDK `@google/generative-ai` foi removido do cliente.

## Controle de acesso e uso

A função exige uma chave publicável válida no header `apikey` e valida essa chave no próprio runtime com `@supabase/server`. `verify_jwt` fica desativado porque a chave publicável atual não é um JWT. A chave identifica o aplicativo, mas pode ser extraída de um cliente distribuído e não substitui autenticação de usuário.

Cada origem pode iniciar até 10 análises por janela de uma hora. A função usa o último endereço encaminhado pelo gateway, combina-o com um salt secreto e persiste somente SHA-256. A atualização é atômica no Postgres; tabela e RPC têm RLS/privilégios fechados para `anon` e `authenticated` e execução apenas por `service_role`. Registros com mais de dois dias são removidos durante o consumo da cota. Redes compartilhadas dividem a mesma cota e clientes capazes de trocar de origem podem contorná-la; uma futura conta permitirá limite por usuário.

A função aceita JPEG, PNG, WebP, HEIC e HEIF, com Base64 limitado a 8 MiB, timeout de 25 segundos no provedor e resposta sem detalhes internos. O cliente mantém timeout de 30 segundos e parser estrito. Cancelar no cliente ainda não garante interromper uma requisição já iniciada no provedor.

## Validação

`npm run check` passou com TypeScript, lint sem avisos e 92 testes. As regressões novas cobrem payload/tamanho/formato no servidor, hash da origem, resposta Gemini, categorias seguras e transporte Supabase no cliente. A migração foi aplicada no projeto remoto; onze consumos numa transação revertida aceitaram os dez primeiros e recusaram o décimo primeiro. `anon` não conseguiu executar a RPC. A função implantada recusou chamada sem `apikey` com 401 e, com chave publicável, respondeu com erro seguro de configuração enquanto `GEMINI_API_KEY` permanece ausente.

Não foram executados câmera/galeria no aparelho, React Native em dispositivo, chamadas reais à IA ou compilação de APK. Testes de serviço/seletor usam adapters simulados e não executam a interface React Native. O advisor remoto reportou avisos anteriores na função `public.rls_auto_enable()`, fora desta entrega; a nova tabela/função não gerou aviso. O roteiro de [TESTING.md](TESTING.md) continua obrigatório para validar os pontos pendentes.
