# Gardenfy

Aplicativo de jardins e cuidados com plantas feito com Expo, React Native e TypeScript. Já inclui criação, edição e exclusão de jardins e plantas, catálogo de plantas, detalhes da planta, registros de rega/adubação com histórico, análise por foto com Gemini e visualização em realidade aumentada.

O projeto está em desenvolvimento: jardins, plantas e análises têm persistência local; métricas sem análise são desconhecidas e os resultados são identificados como estimativas da IA; o perfil usa dados fixos e algumas ações ainda são apenas visuais. A persistência está coberta por testes automatizados e teve validação básica em dispositivo; o roteiro completo permanece pendente. A existência das telas não significa que o MVP esteja pronto.

## Documentação

- [Roadmap do MVP](docs/ROADMAP.md): estado atual, prioridades propostas e critérios de aceite.
- [Guia de desenvolvimento](docs/DEVELOPMENT.md): instalação, ambiente, branches, PRs e troca de PC.
- [Instruções para agentes](AGENTS.md): regras obrigatórias de trabalho e commits.
- [Análise por foto](docs/ANALYSIS.md): fluxo compartilhado, revisão, falhas e limites do uso local.
- [Persistência local](docs/PERSISTENCE.md): armazenamento, fotos e recuperação de falhas.
- [Validação e testes](docs/TESTING.md): checks automatizados e roteiro manual.
- [Continuidade entre sessões](docs/HANDOFF.md): estado do trabalho e próximo passo.

## Começar

Com Node na versão de `.nvmrc` e npm:

```bash
npm ci
cp .env.example .env
npm start
```

Leia o guia para preparar builds nativos. O recurso AR exige módulos nativos e não roda no Expo Go. Para continuar sem Gemini, crie um jardim, adicione plantas pelo catálogo e registre cuidados nos detalhes da planta. Esses fluxos usam armazenamento local e dispensam configuração Supabase/Gemini; imagens remotas do catálogo dependem de rede. Água/luz permanecem “Sem análise” e registrar um cuidado não altera essas estimativas.

A análise por foto usa uma Edge Function Supabase, com a credencial Gemini somente no servidor. A primeira requisição real recebeu HTTP 402; por decisão do usuário, a análise e a regularização do faturamento ficam adiadas. As telas de análise continuam disponíveis e podem retornar erro de configuração ao serem usadas. Build debug Android, cadastro pelo catálogo, cuidados e recuperação após recarregar JavaScript foram validados no aparelho; o roteiro nativo completo continua pendente.

O fluxo de trabalho usa branches a partir de `develop`, commits frequentes por etapas no formato `🌱 | feat: mensagem` e PR para `develop` ao finalizar cada feature. As ideias anteriores de moedas, ranks, cards da planta, regar, adubar e histórico foram preservadas no roadmap.
