# Gardenfy 1.0 — preparação da primeira versão estável

Escopo aprovado em 04/10/2026. A preparação `feat/release-v1`, baseada em `develop` (`80d0750`), foi integrada pelo PR #14 (`2d99498`). A distribuição de avaliação é a [1.0.0-beta.1](releases/1.0.0-beta.1.md), com tag no código do APK (`1a9190e`). Este documento define o aceite da versão estável, ainda não lançada.

## Experiência principal

Uso individual no Android, com jardins, plantas e cuidados salvos neste aparelho. A jornada é: criar jardim → adicionar planta pelo catálogo ou foto → consultar orientações → registrar rega/adubação → consultar/corrigir histórico → fechar e reabrir sem perder dados.

- AR fica em **Em breve**, sem câmera, sessão nativa ou dependência de suporte AR na versão 1.0.
- Identificação por foto usa Pl@ntNet através do Supabase. O usuário confirma a espécie antes de salvar. Cadastro pelo catálogo funciona sem esse serviço.
- Detalhes de cuidados vêm de fichas locais com fontes botânicas; espécie sem ficha recebe estado explícito de informações ainda indisponíveis.
- A foto não gera percentuais de hidratação, luz, vitalidade ou previsão exata de crescimento. Análises antigas são preservadas como histórico legado, sem serem apresentadas como medições atuais.
- Sem conta, sincronização, gamificação, notificações ou perfil editável nesta versão.

## Forma de trabalhar

Preparação inicial concluída na branch `feat/release-v1`, com commits pequenos por etapas funcionais: escopo, modelo/persistência, backend, identificação, experiência de cuidados, validação e documentação. Após a integração, novas tarefas partem de `develop` atualizado em branches próprias. Publicar cada etapa relevante. Não criar commits vazios nem dividir mudanças arbitrariamente.

Abrir PR de cada tarefa para `develop` com evidências e pendências reais. Após os aceites restantes, preparar o PR `develop` → `main`. Merge e publicação estável dependem de instrução específica. A publicação da beta foi solicitada pelo usuário; não chamar o resultado de estável enquanto os critérios abaixo estiverem pendentes.

## Critérios de liberação

- [x] Jornada principal por galeria/catálogo validada em Android, incluindo encerramento completo e reabertura.
- [x] Edição/exclusão de jardins/plantas e correção/exclusão de cuidados validadas, com confirmação e persistência. Limpeza do jardim de teste preservou os dois jardins/duas plantas anteriores após reinício.
- [x] Cadastro e cuidados utilizáveis sem internet; fotos remotas indisponíveis têm fallback.
- [x] Pl@ntNet configurado no servidor; identificação real por galeria, espécie sem ficha, falhas, permissões e cancelamento validados.
- [x] Captura nova de uma planta pela câmera e jornada com TalkBack validadas. Conclusão informada pelo usuário em 28/10/2026, após os testes da beta.1 ([#15](https://github.com/NeytanBelisario/Gardenfy/issues/15)).
- [x] AR informa Em breve e permite retornar, sem inicializar recurso nativo.
- [x] Telas pequenas, teclado, áreas seguras, texto ampliado e navegação Android por três botões revisados. Larguras lógicas ajustadas no mesmo celular; não equivalem a tablet físico.
- [x] TypeScript, lint, testes automatizados (93 após a remoção do Gemini), compatibilidade Expo, runtime Deno e exports Android/web aprovados; consultar o CI do PR de lançamento.
- [x] Alertas triados e correções compatíveis aplicadas. Restam 23 entradas altas de duas ferramentas sem patch publicado, ausentes nos bundles inspecionados; exposição/monitoramento documentados em TESTING.md.
- [x] APK autônomo de avaliação instalado e testado sem Metro; atualização preserva dados existentes.
- [x] Assinatura de produção pelo EAS Build (credenciais gerenciadas pela Expo), pacote definitivo `br.com.gardenfy.app` e distribuição por APK na release do GitHub. A beta usava o keystore debug do modelo Expo; a 1.0.0 é instalada como app novo.

## Fora do escopo

Diagnóstico de doenças por foto, IA generativa e AR ficam para versões futuras. A API de doenças do Pl@ntNet tem cobertura limitada e não entra automaticamente nesta entrega. Publicação em loja também exige preparação e instrução própria.

## Configuração do serviço

A chave `PLANTNET_API_KEY` deve existir somente nos secrets do Supabase. O passo a passo está em [ANALYSIS.md](ANALYSIS.md#configurar-plantnet). Nenhuma chave deve ser enviada por chat ou adicionada ao Git. A cota gratuita do Pl@ntNet pertence à conta usada pelo backend, compartilhada por todas as instalações do Gardenfy.

Secret configurado e identificação real validada em 04/10/2026. Resultados e limites do aceite em [TESTING.md](TESTING.md).
