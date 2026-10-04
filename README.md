# Gardenfy

Aplicativo Expo / React Native / TypeScript para manter jardins e acompanhar os cuidados com plantas. A primeira versão estável, 1.0, está em preparação na branch `feat/release-v1`.

A experiência inclui criação, edição e exclusão de jardins/plantas, catálogo, fichas locais de cuidados e histórico persistente de rega/adubação. A identificação por foto usa Pl@ntNet via Supabase e exige confirmação da espécie antes de salvar. AR aparece como **Em breve**, sem módulo nativo de realidade aumentada.

Os dados ficam neste aparelho, sem conta ou sincronização. Orientações de luz/rega são informações da espécie, não medições da foto. Análises antigas do Gemini são preservadas no histórico; novas fotos não geram percentuais de água, luz, vitalidade ou prazo exato de crescimento.

## Documentação

- [Preparação da versão 1.0](docs/RELEASE_1.0.md): escopo aprovado e critérios de liberação.
- [Roadmap](docs/ROADMAP.md): decisões atuais e histórico das entregas.
- [Desenvolvimento](docs/DEVELOPMENT.md): ambiente, comandos, branches e troca de PC.
- [Instruções para agentes](AGENTS.md): regras de trabalho e commits.
- [Identificação por foto](docs/ANALYSIS.md): Pl@ntNet, configuração e limites.
- [Persistência local](docs/PERSISTENCE.md): schema, fotos e recuperação de falhas.
- [Validação](docs/TESTING.md): checks e roteiro da versão 1.0.
- [Continuidade](docs/HANDOFF.md): resultados, pendências e próximo passo.

## Começar

Com Node na versão de `.nvmrc` e npm:

```bash
npm ci
cp .env.example .env
npm start
```

Jardins, cadastro pelo catálogo, fichas de cuidados e histórico funcionam sem Supabase/Pl@ntNet. Imagens remotas do catálogo dependem de rede e têm fallback. Para usar fotos, configure apenas URL/chave pública Supabase no app e `PLANTNET_API_KEY` nos secrets do servidor, conforme [o passo a passo](docs/ANALYSIS.md#configurar-plantnet).

Build Android autônomo, testes de atualização, permissões e jornada nativa completa são critérios de liberação. Consulte o handoff para os resultados efetivamente realizados; código implementado ou bundle exportado não significa versão estável lançada.

Commits por etapas são publicados na branch de preparação, com PR para `develop`. Após integração e aceite, a promoção será `develop` → `main`; merge e publicação exigem instrução específica.
