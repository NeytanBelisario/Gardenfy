# Identificação por foto · Pl@ntNet

## Experiência da versão 1.0

As rotas `/scan`, inclusão por foto e revisão da espécie usam a mesma tela `PlantIdentificationScreen`, o mesmo hook de seleção/cancelamento e o endpoint `identify-plant`. A pessoa escolhe um jardim, tira ou seleciona uma foto, revisa até três espécies sugeridas e confirma o cadastro. O nome pessoal da planta fica separado da espécie. Ao identificar novamente, nome, descrição e cuidados existentes são preservados.

A tela informa o envio ao Pl@ntNet antes de abrir a câmera/galeria. A pontuação indica confiança do modelo na identificação; não representa saúde ou vitalidade. A confirmação é obrigatória, inclusive quando a primeira sugestão tem pontuação alta. Abaixo de 50%, a interface recomenda conferir a espécie ou refazer a foto; este limiar é uma orientação do Gardenfy, não garantia de precisão do provedor.

Depois de confirmar, o app guarda a foto e a espécie e abre os detalhes/cuidados. Sem ficha local para a espécie, permite cadastrar e registrar cuidados, com informações específicas explicitamente indisponíveis. Sem serviço ou internet, o catálogo permanece utilizável.

## Detalhes e origem dos dados

As quatro fichas iniciais correspondem a Monstera deliciosa, Pilea peperomioides, Goeppertia orbifolia (sinônimo Calathea orbifolia) e Dracaena trifasciata (sinônimo Sansevieria trifasciata). Os textos são resumos editoriais, com fonte consultável na própria tela, armazenados em `src/features/gardens/careProfiles.ts`.

- [Monstera · NC State Extension](https://plants.ces.ncsu.edu/plants/monstera-deliciosa/).
- [Pilea · NC State Extension](https://plants.ces.ncsu.edu/plants/pilea-peperomioides/).
- [Orbifolia · NC State Extension](https://plants.ces.ncsu.edu/plants/goeppertia-orbifolia/).
- [Espada-de-são-jorge · NC State Extension](https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/).

Não usamos IA generativa para completar espécies desconhecidas nem produzimos percentuais de hidratação/luz/vitalidade ou dias exatos de crescimento. As fichas orientam necessidades gerais da espécie. Diagnóstico de doenças fica fora da 1.0.

## Configurar Pl@ntNet

1. Crie uma conta em [Pl@ntNet para desenvolvedores](https://my.plantnet.org/) e conclua a verificação/aceitação dos termos no próprio site.
2. Entre na conta e obtenha sua API key. Não envie a chave pelo chat, não salve no repositório e não use prefixo `EXPO_PUBLIC_`.
3. Abra o projeto Gardenfy no [painel Supabase](https://supabase.com/dashboard/project/ukqsiclooawiqmttdobu/functions). Em **Edge Functions → Secrets**, adicione `PLANTNET_API_KEY` com o valor da chave. O nome diferencia maiúsculas/minúsculas.
4. No app, configure somente `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env` ignorado. O projeto existente já tem a configuração local e `ANALYSIS_RATE_LIMIT_SALT` no servidor; em outro PC, recrie apenas os valores públicos autorizados.
5. Confira que a migração da cota e a função `identify-plant` foram implantadas. Se estiver configurando outro ambiente, com a CLI autenticada e vinculada:

```bash
npx supabase db push --linked
npx supabase functions deploy identify-plant --use-api
```

6. Abra um jardim de teste, escolha **Identificar por foto** e use uma foto de planta sem pessoas/dados pessoais. Confirme a espécie, confira a ficha ou o estado sem ficha e reabra o app. Registrar sucesso real exige essa execução; testes simulados não comprovam a chave ou a qualidade do reconhecimento.

A [documentação Supabase sobre secrets](https://supabase.com/docs/guides/functions/secrets) descreve a configuração pelo painel. Depois de salvar um secret, a função pode lê-lo sem reconstruir o app. Não é necessário criar outra chave Gemini nem regularizar seu faturamento para este fluxo.

## Backend, limites e falhas

A função exige chave publicável válida com `withSupabase({ auth: 'publishable' })`; `verify_jwt` fica desativado porque essa chave não é JWT. A chave pública identifica o app, não um usuário. A credencial Pl@ntNet existe apenas no servidor e vai somente ao endpoint oficial do provedor.

A API aceita JPG/PNG, até 8 MiB de Base64, validando MIME e assinatura inicial do arquivo. Envia uma imagem multipart, idioma português, no máximo três sugestões e sem fotos similares do banco do provedor. Resultado é JSON validado, sem texto livre gerado.

Reutilizamos a RPC atômica `consume_analysis_quota`, restrita a `service_role`: até 10 tentativas/hora por origem e até 450 tentativas/dia UTC compartilhadas por todas as instalações. A nova migração permite limite de até 500 na RPC; o limite usado pelo app é 450. Tentativas que chegam ao provedor podem consumir cota mesmo se falharem. IPs são armazenados apenas como hashes com salt; redes compartilhadas dividem o limite por origem. As entradas expiram na limpeza após dois dias.

O [plano gratuito oficial](https://my.plantnet.org/pricing) oferece 500 identificações/dia por conta. Uso da mesma chave em outras aplicações também consome a cota do provedor. O limite do Gardenfy não garante reserva para essas aplicações nem disponibilidade do serviço. Incluímos o crédito e o logo oficial conforme os [termos do Pl@ntNet](https://my.plantnet.org/terms_of_use); imagem em `assets/images/powered-by-plantnet.png`, fornecida nessa página, sem alterações.

Cliente espera até 30 segundos; servidor até 25. Cancelar/sair da tela aborta a espera e ignora respostas tardias; não garante recuperar cota consumida no provedor. Falhas de permissão, imagem, rede, configuração, quota, indisponibilidade e resposta inválida permitem continuar pelo catálogo. Falha ao salvar mantém a revisão para repetir apenas a gravação, sem nova chamada.

## Compatibilidade com o trabalho anterior

O endpoint Gemini `analyze-plant` e helpers legados permanecem para compatibilidade/histórico, mas as rotas da versão 1.0 não os chamam. Não removemos secrets remotos nem reescrevemos análises antigas. O histórico exibe esses registros como estimativas antigas do Gemini, sem tratá-los como medidas atuais. AR e doenças ficam para versões futuras.

## Validação

Checks e resultados atuais estão em [TESTING.md](TESTING.md) e [HANDOFF.md](HANDOFF.md). O runtime Supabase deve ser verificado com Deno, além de TypeScript/lint do app. Parsing, transporte, limites de imagem e preservação dos cuidados/fotos têm regressões automatizadas; câmera, qualidade de identificação e permissões reais exigem teste no aparelho.

Em 04/10/2026, após configurar o secret, uma foto pública de Monstera foi identificada com sucesso pelo servidor e pela galeria Android. O MIME enviado agora vem da assinatura do arquivo retornado pelo seletor: a compressão pode produzir JPEG mesmo quando o asset original informa PNG. Abertura/cancelamento e negativa de câmera foram testados; não houve captura nova de planta pela câmera nesta sessão.
