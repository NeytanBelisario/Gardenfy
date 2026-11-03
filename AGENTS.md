# Instruções de desenvolvimento — Gardenfy

Estas regras valem para todo o repositório e para qualquer agente que trabalhe nele.

## Contexto e documentação

- Aplicativo Expo / React Native / TypeScript, com rotas em `src/app`.
- Consulte `README.md`, `docs/DEVELOPMENT.md` e `docs/ROADMAP.md` antes de implementar uma tarefa.
- O roadmap é uma proposta evolutiva. Implemente apenas o escopo solicitado; não inicie novas features só porque estão listadas nele.
- Na preparação da versão 1.0, consulte `docs/RELEASE_1.0.md`: manutenção local de jardins/plantas, identificação Pl@ntNet com fichas de cuidados e AR em breve. Gemini, diagnóstico de doenças e percentuais derivados de foto não fazem parte da experiência nova.
- Atualize a documentação afetada junto da implementação. Não marque como concluído algo apenas planejado ou sem validação.
- Comunique-se com o usuário em português. Mantenha identificadores e convenções existentes no código.

## Branches e pull requests

- `develop` é a base de integração; `main` fica reservada para versões estáveis.
- Antes de começar, confira `git status`, faça fetch e atualize `develop` com `git pull --ff-only origin develop`.
- Crie uma branch nova a partir de `develop` atualizado para cada feature, correção ou tarefa: `feat/<descricao>`, `fix/<descricao>`, `chore/<descricao>` ou `docs/<descricao>`.
- Não implemente nem faça commits diretamente em `develop` ou `main`.
- A preparação autorizada da primeira versão usa `feat/release-v1`, com etapas coerentes na mesma branch e commits frequentes publicados. O PR de preparação tem base em `develop`; depois de integrado e validado, a promoção é `develop` → `main`. Não iniciar features adicionais durante a preparação.
- Ao terminar cada feature, publique a branch e abra um PR com base em `develop`, incluindo objetivo, mudanças, validações e pendências reais.
- Aguarde a integração do PR antes de criar uma feature dependente. A próxima branch deve partir de `develop` atualizado, nunca da branch anterior.
- Abrir PRs faz parte do fluxo automático autorizado. Não faça merge de PRs nem publique releases sem uma instrução específica.
- Não reescreva histórico publicado, não use force push e não descarte alterações de terceiros.

## Commits frequentes e backup

- Faça commits automaticamente por etapas coerentes da feature, sem pedir confirmação a cada commit. Exemplos de etapas: estrutura/modelos, lógica, interface e validação/documentação.
- Mantenha commits pequenos e revisáveis, sem criar commits vazios ou dividir linhas arbitrariamente para aumentar a quantidade.
- Publique os commits da branch ao concluir etapas relevantes e antes de encerrar a sessão: commit local sozinho não é backup entre PCs.
- Adicione somente os arquivos da tarefa; confira o diff staged antes de commitar. Não inclua segredos, artefatos gerados ou alterações alheias.
- Formato obrigatório: `<emoji> | <tipo>: <mensagem>`.
- Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci` e `revert`.
- Use uma mensagem curta que descreva a mudança. Inglês é permitido e segue o histórico existente; mantenha consistência dentro da tarefa.
- Varie emojis e evite repetir o emoji do commit imediatamente anterior. Consulte o último commit antes de escolher.

Exemplos:

```text
🌱 | feat: add persistent garden storage
💧 | feat: record plant watering events
🛠️ | fix: handle denied camera permission
📚 | docs: document development setup
🧭 | chore: organize feature configuration
```

## Implementação e validação

- Respeite TypeScript estrito e a organização existente: rotas em `src/app`, domínio em `src/features`, componentes compartilhados em `src/components` e hooks em `src/hooks`.
- Reutilize lógica de domínio; evite duplicar chamadas de análise entre telas.
- Diferencie dados simulados, estimativas da IA e registros feitos pelo usuário. Não apresente estimativas de água/luz como medições reais.
- Trate carregamento, ausência de dados, erros e permissões nos fluxos alterados.
- Nunca versione `.env` ou chaves. Variáveis `EXPO_PUBLIC_*` ficam expostas no cliente; não são um armazenamento de segredos.
- Preserve o lockfile e use npm. Não introduza serviços, dependências ou mudanças amplas de arquitetura sem necessidade para o escopo.
- Rode validações proporcionais à mudança. Para código TypeScript, use `npx tsc --noEmit`; execute lint quando houver configuração reproduzível e valide o fluxo alterado no dispositivo/plataforma relevante.
- Escreva testes para regras e regressões relevantes, especialmente persistência, cuidados e parsing de análise. Não crie testes que apenas repetem a implementação.
- Para documentação, revise comandos, links, consistência com o código e `git diff --check`; não é necessário instalar o app só para editar texto.
- Registre claramente checks não executados e bloqueios. Não declare testes ou execução em dispositivo que não aconteceram.

## Encerramento e troca de PC

- Atualize `docs/HANDOFF.md` em sessões que mudem o estado do trabalho: branch, etapas concluídas, checks, pendências e próximo passo.
- Faça commit e push das etapas antes de trocar de máquina. Não use stash local como única forma de transferência.
- Informe branch, commits, PR e resultado das verificações no encerramento.
- Se push ou abertura de PR falhar por acesso ou ferramenta indisponível, preserve os commits e informe a limitação e como continuar, sem afirmar que o backup remoto foi feito.
