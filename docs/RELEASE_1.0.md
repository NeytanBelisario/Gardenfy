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

- [ ] Jornada principal completa validada em Android, incluindo encerramento completo e reabertura.
- [ ] Edição/exclusão de jardins/plantas e correção/exclusão de cuidados validadas, com confirmação e persistência.
- [ ] Cadastro e cuidados utilizáveis sem internet; fotos remotas indisponíveis têm fallback.
- [ ] Pl@ntNet configurado no servidor; identificação real, espécie sem ficha, falhas, permissões e cancelamento validados.
- [ ] AR informa Em breve e permite retornar, sem inicializar recurso nativo.
- [ ] Telas pequenas, teclado, áreas seguras, texto ampliado e navegação Android revisados.
- [ ] TypeScript, lint, testes, compatibilidade Expo e exports aprovados na revisão final.
- [ ] APK autônomo de avaliação instalado e testado sem Metro; atualização preserva dados existentes.
- [ ] Configuração de assinatura/distribuição e resultados manuais documentados antes de publicar.

## Fora do escopo

Diagnóstico de doenças por foto, IA generativa e AR ficam para versões futuras. A API de doenças do Pl@ntNet tem cobertura limitada e não entra automaticamente nesta entrega. Publicação em loja também exige preparação e instrução própria.

## Configuração pendente

A chave `PLANTNET_API_KEY` deve existir somente nos secrets do Supabase. O passo a passo está em [ANALYSIS.md](ANALYSIS.md#configurar-plantnet). Nenhuma chave deve ser enviada por chat ou adicionada ao Git. A cota gratuita do Pl@ntNet pertence à conta usada pelo backend, compartilhada por todas as instalações do Gardenfy.
