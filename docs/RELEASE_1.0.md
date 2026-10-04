# Gardenfy 1.0 — preparação da primeira versão estável

Escopo aprovado em 04/10/2026. Branch de preparação: `feat/release-v1`, baseada em `develop` (`80d0750`). Este documento define a entrega; não declara a versão lançada.

## Experiência principal

Uso individual no Android, com jardins, plantas e cuidados salvos neste aparelho. A jornada é: criar jardim → adicionar planta pelo catálogo ou foto → consultar orientações → registrar rega/adubação → consultar/corrigir histórico → fechar e reabrir sem perder dados.

- AR fica em **Em breve**, sem câmera, sessão nativa ou dependência de suporte AR na versão 1.0.
- Identificação por foto usa Pl@ntNet através do Supabase. O usuário confirma a espécie antes de salvar. Cadastro pelo catálogo funciona sem esse serviço.
- Detalhes de cuidados vêm de fichas locais com fontes botânicas; espécie sem ficha recebe estado explícito de informações ainda indisponíveis.
- A foto não gera percentuais de hidratação, luz, vitalidade ou previsão exata de crescimento. Análises antigas são preservadas como histórico legado, sem serem apresentadas como medições atuais.
- Sem conta, sincronização, gamificação, notificações ou perfil editável nesta versão.

## Forma de trabalhar

Concentrar a preparação na branch `feat/release-v1`, com commits pequenos por etapas funcionais: escopo, modelo/persistência, backend, identificação, experiência de cuidados, validação e documentação. Publicar cada etapa relevante. Não criar commits vazios nem dividir mudanças arbitrariamente.

Abrir PR da branch para `develop` com evidências e pendências reais. Depois da integração, atualizar `develop` e preparar o PR `develop` → `main`. Merge, tag e publicação dependem de instrução específica. Não chamar o resultado de estável enquanto os critérios abaixo estiverem pendentes.

## Critérios de liberação

- [x] Jornada principal por galeria/catálogo validada em Android, incluindo encerramento completo e reabertura.
- [x] Edição/exclusão de jardins/plantas e correção/exclusão de cuidados validadas, com confirmação e persistência. Limpeza do jardim de teste preservou os dois jardins/duas plantas anteriores após reinício.
- [x] Cadastro e cuidados utilizáveis sem internet; fotos remotas indisponíveis têm fallback.
- [x] Pl@ntNet configurado no servidor; identificação real por galeria, espécie sem ficha, falhas, permissões e cancelamento validados.
- [ ] Captura nova de uma planta pela câmera e jornada com TalkBack validadas. Abertura/cancelamento/negativa de câmera aprovados; usuário optou por foto pública.
- [x] AR informa Em breve e permite retornar, sem inicializar recurso nativo.
- [x] Telas pequenas, teclado, áreas seguras, texto ampliado e navegação Android por três botões revisados. Larguras lógicas ajustadas no mesmo celular; não equivalem a tablet físico.
- [x] TypeScript, lint, 112 testes, compatibilidade Expo, runtime Deno e exports Android/web aprovados; consultar último CI do PR #14.
- [x] Alertas triados e correções compatíveis aplicadas. Restam 23 entradas altas de duas ferramentas sem patch publicado, ausentes nos bundles inspecionados; exposição/monitoramento documentados em TESTING.md.
- [x] APK autônomo de avaliação instalado e testado sem Metro; atualização preserva dados existentes.
- [ ] Configuração de assinatura/distribuição e resultados manuais documentados antes de publicar.

## Fora do escopo

Diagnóstico de doenças por foto, IA generativa e AR ficam para versões futuras. A API de doenças do Pl@ntNet tem cobertura limitada e não entra automaticamente nesta entrega. Publicação em loja também exige preparação e instrução própria.

## Configuração do serviço

A chave `PLANTNET_API_KEY` deve existir somente nos secrets do Supabase. O passo a passo está em [ANALYSIS.md](ANALYSIS.md#configurar-plantnet). Nenhuma chave deve ser enviada por chat ou adicionada ao Git. A cota gratuita do Pl@ntNet pertence à conta usada pelo backend, compartilhada por todas as instalações do Gardenfy.

Secret configurado e identificação real validada em 04/10/2026. Resultados e limites do aceite em [TESTING.md](TESTING.md).
