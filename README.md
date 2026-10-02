# Gardenfy

Aplicativo de jardins e cuidados com plantas feito com Expo, React Native e TypeScript. Já inclui criação, edição e exclusão de jardins e plantas, catálogo de plantas, detalhes da planta, registros de rega/adubação com histórico, análise por foto com Gemini e visualização em realidade aumentada.

O projeto está em desenvolvimento: jardins, plantas e análises têm persistência local; métricas sem análise são desconhecidas e os resultados são identificados como estimativas da IA; o perfil usa dados fixos e algumas ações ainda são apenas visuais. A persistência está coberta por testes automatizados e aguarda validação em dispositivo. A existência das telas não significa que o MVP esteja pronto.

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

Leia o guia para preparar builds nativos. O recurso AR exige módulos nativos e não roda no Expo Go. A análise local lê `EXPO_PUBLIC_GEMINI_API_KEY` e permite configurar o modelo com `EXPO_PUBLIC_GEMINI_MODEL`; essa variável é pública no cliente e sua utilização será revista antes da distribuição.

O fluxo de trabalho usa branches a partir de `develop`, commits frequentes por etapas no formato `🌱 | feat: mensagem` e PR para `develop` ao finalizar cada feature. As ideias anteriores de moedas, ranks, cards da planta, regar, adubar e histórico foram preservadas no roadmap.
