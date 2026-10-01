# Desenvolvimento e troca de máquina

## Preparação

O projeto usa Expo 55, React Native 0.83, React 19 e TypeScript estrito, conforme `package.json`. O gerenciador é npm, com `package-lock.json` versionado.

A versão inicial de Node em `.nvmrc` é `22.22.2`, disponível na máquina em que esta documentação foi criada. A instalação e o build ainda precisam ser validados em uma máquina limpa; alterações nessa base devem atualizar este guia.

```bash
git clone https://github.com/NeytanBelisario/Gardenfy.git
cd Gardenfy
nvm install
nvm use
npm ci
cp .env.example .env
```

Se não usar nvm, instale a versão indicada em `.nvmrc` pelo seu gerenciador de Node. Configure sua identidade Git e acesso de escrita ao remoto. Nunca copie tokens para arquivos versionados.

## Ambiente e execução

A única variável lida atualmente pelo app é `EXPO_PUBLIC_GEMINI_API_KEY`, em `src/constants/env.ts`. Preencha-a no `.env` apenas para experimentar a análise local; sem ela, a análise não fica habilitada. A interface e os fluxos sem IA devem ser verificados separadamente.

Essa chave é incorporada ao cliente. Antes de distribuir o MVP, o roadmap prevê mover a chamada para um serviço que mantenha a credencial no servidor. `.env.example` contém somente o nome da variável, nunca uma chave real. Em outro PC, recupere configurações locais pelo seu gerenciador de segredos.

Comandos existentes:

| Comando | Uso |
| --- | --- |
| `npm start` | Iniciar o servidor Expo. |
| `npm run android` | Gerar/compilar e executar o app Android; requer Android SDK e dispositivo/emulador configurado. |
| `npm run ios` | Gerar/compilar e executar o app iOS; requer macOS e Xcode. |
| `npm run web` | Tentar executar a versão web; a compatibilidade completa ainda precisa de validação. |
| `npx tsc --noEmit` | Verificar os tipos. |
| `npm run lint` | Invocar `expo lint`; falta configuração de ESLint versionada e reproduzível. |

A visualização AR usa `@reactvision/react-viro`, um modelo GLB e módulos nativos. O próprio código exige build nativo compatível e dispositivo com suporte; Expo Go não executa esse recurso. A tela tem fallback para indisponibilidade, mas isso não comprova que todo o app funciona na web. As pastas `android/` e `ios/` são geradas e ignoradas pelo Git.

Não use `npm run reset-project` no fluxo habitual: o script é de reset do projeto, não um comando de instalação.

## Fluxo de uma tarefa

Com a árvore limpa, inicie a partir da base atualizada:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feat/plant-care-history
```

Faça commits por etapas revisáveis e envie a branch ao remoto:

```bash
git diff
git add <arquivos-da-etapa>
git diff --cached
git commit -m "💧 | feat: record plant watering events"
git push -u origin feat/plant-care-history
```

Repita commit/push nas etapas seguintes. Ao finalizar, abra PR para `develop`, usando o template do repo. Se GitHub CLI estiver instalado e autenticado:

```bash
gh pr create --base develop --head feat/plant-care-history --fill
```

Revise o título e a descrição para explicar a feature completa, além dos checks realizados. Também é possível abrir o PR pelo GitHub. O agente deve fazer commits, push e abertura de PR automaticamente quando tiver acesso. Merge é uma ação separada e depende de instrução específica.

Após integrar o PR, volte para `develop`, atualize-a e só então crie a próxima branch. Preserve os commits de cada etapa ao integrar, preferindo merge que mantenha esse histórico. A promoção de `develop` para `main` ocorre quando uma versão estável for aprovada.

## Retomar em outro PC

Antes de sair, atualize `docs/HANDOFF.md`, faça commit e push. Em uma máquina nova, clone e prepare o ambiente; em uma máquina já preparada, confira alterações locais antes de atualizar.

```bash
git status
git fetch origin
# Se a branch ainda não existe localmente:
git switch --track origin/feat/plant-care-history
# Se já existe, use git switch feat/plant-care-history.
git pull --ff-only
npm ci
```

Leia `AGENTS.md`, o handoff e o PR antes de continuar. Recrie `.env` fora do Git. Se houver alterações locais ou divergência de histórico, preserve-as e resolva a situação antes de atualizar; não use reset ou force push para contornar o problema.

## Critério de conclusão

Uma tarefa termina com os critérios de aceite atendidos, validação relevante registrada, documentação atualizada, commits publicados e PR aberto para `develop`. Sem acesso ao remoto, informe explicitamente o que ficou apenas local. Não marque a entrega como integrada antes do merge.
