# Análise por foto — fluxo local

O scan geral, a inclusão no jardim e a reanálise da planta usam `PlantAnalysisScreen`, o hook `usePlantPhotoAnalysis` e o mesmo serviço/parser em `src/features/plant-analysis`. Não há chamada duplicada nem salvamento automático ao receber uma resposta.

## Seleção, revisão e salvamento

A tela explica que a foto de uma única planta será enviada ao Google Gemini e que os resultados são estimativas. Câmera e galeria pedem a permissão correspondente e tratam negativa, cancelamento, ausência de imagem/base64 e falhas ao abrir o seletor. O bloqueio começa antes de pedir permissão, evitando abrir dois seletores por toques rápidos.

O resultado fica em revisão, sem alterar o jardim. Na inclusão, a pessoa pode corrigir o nome antes de confirmar; o nome escolhido fica separado da identificação sugerida pela IA, inclusive no retrato histórico. Na reanálise, uma identificação diferente gera aviso para revisão, sem impedir a confirmação explícita. Nome/descrição já cadastrados são preservados. É possível descartar o resultado.

O scan geral é uma consulta sem persistência, agora também com identificação e acesso à câmera. Para incluir uma planta, use o fluxo do jardim. Confirmar inclusão/reanálise usa o store existente: memória/histórico/fotos só mudam após gravação confirmada. Falha ao salvar mantém o rascunho para tentar novamente sem outra chamada à IA. Não há mudança de schema nesta entrega (permanece v3).

## Parser e falhas

O parser exige os seis campos completos (`Nome`, `Saude`/`Saúde`, `Vitalidade`, `Rega`, `Luz`, `Crescimento`). Normaliza acentos/caixa da saúde e nome comum. Aceita linhas vazias e unidades previstas, mas rejeita duplicatas, texto extra, números negativos, decimais, valores fora das faixas e inteiros de crescimento inseguros. Não transforma resposta inválida em métricas válidas por truncamento ou clamp. Zero válido é preservado.

Vitalidade fica em 0–100; água/luz em 0–10; crescimento é um inteiro não negativo de dias. Água/luz são estimativas visuais solicitadas à IA, não sensores nem registros de rega. Uma foto não garante a identificação correta ou a estimativa de hidratação.

O serviço faz uma única chamada ao modelo configurado. Mensagens distinguem configuração ausente/inválida, falha de conexão, limite de uso, indisponibilidade, timeout e resposta inválida/bloqueada. Resposta bruta, URLs do provedor e credenciais não são mostradas nem registradas no console.

Após 30 segundos, o cliente encerra a espera e sinaliza abort ao transporte. É possível cancelar durante a análise e repetir a mesma foto após falha, ou escolher outra. Sair da tela cancela a análise e ignora resultados atrasados; mudar jardim/planta reinicia a sessão da tela. A tentativa de nova análise não apaga o resultado anterior nem escreve no store. O cancelamento é do cliente; não garante interromper processamento/cobrança já iniciados no provedor. Uma gravação já confirmada não é desfeita por sair da tela.

## Configuração e seleção do modelo

Para desenvolvimento local:

```dotenv
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_GEMINI_MODEL=gemini-3.5-flash-lite
```

`EXPO_PUBLIC_GEMINI_MODEL` é opcional; o padrão é `gemini-3.5-flash-lite`. A seleção foi revisada em 02/10/2026 pela [lista oficial de modelos](https://ai.google.dev/gemini-api/docs/models) e pela [política de descontinuação](https://ai.google.dev/gemini-api/docs/deprecations): a documentação recomenda 3.5 Flash-Lite ou 3.8 Flash para novos projetos, limita o acesso aos modelos 2.5 a usuários anteriores e lista o desligamento de 2.0 Flash. A cadeia antiga de fallbacks foi removida; erros não disparam novas chamadas a outros modelos.

Essa revisão documental não comprova acesso, quota, qualidade ou compatibilidade do modelo com uma conta específica. Nenhuma requisição real ao Gemini foi feita nesta sessão. O adapter mantém o SDK existente `@google/generative-ai`, cuja declaração local de tipos suporta `AbortSignal`; nenhuma dependência foi adicionada. O nome pode ser ajustado localmente para um modelo de análise de imagens disponível na conta.

A chave continua pública no cliente, restrita ao fluxo de desenvolvimento local descrito no projeto. M3 ainda não está pronto para distribuição: serviço no servidor, credencial protegida, controle de acesso e limites de uso precisam ser definidos e implementados em uma entrega posterior.

## Validação

`npm run check` passou com TypeScript, lint sem avisos e 87 testes. As 34 novas regressões cobrem parser, números/zeros, normalização de fotos, transporte simulado, mensagens seguras, timeout/cancelamento, respostas tardias, seleção/permissões e nome revisado salvo atomicamente. O export Android também passou.

Não foram executados câmera/galeria no aparelho, React Native em dispositivo, chamadas reais à IA ou compilação de APK. Testes de serviço/seletor usam adapters simulados e não executam a interface React Native. O roteiro de [TESTING.md](TESTING.md) continua obrigatório para validar esses pontos.
