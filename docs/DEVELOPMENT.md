# Desenvolvimento e troca de máquina

## Preparação

O projeto usa Expo 55, React Native 0.83, React 19 e TypeScript estrito, conforme `package.json`. O gerenciador é npm, com `package-lock.json` versionado.

A versão de Node em `.nvmrc` é `22.22.2`, com npm `10.9.7` registrado em `package.json`. A instalação limpa foi verificada em Linux/WSL2. A validação de compilação nativa ainda exige uma máquina com Android SDK/JDK; não confunda export do bundle com geração de APK.

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

### Continuar sem Gemini

O fluxo local não exige os valores de Supabase nem o segredo Gemini: criação/edição/exclusão de jardins e plantas do catálogo, detalhes e registros/correções/exclusões de cuidados usam AsyncStorage. Não é necessário alterar o `.env` existente ou remover secrets remotos para trabalhar nesses fluxos.

Abra um jardim, use a inclusão pelo catálogo e entre em “Ver detalhes e cuidados” para regar/adubar. Evite scan, inclusão por foto e reanálise enquanto a integração estiver adiada. As telas de análise permanecem expostas; esta decisão não introduz um bloqueio de chamadas no código. As imagens do catálogo são remotas e podem exibir fallback sem rede. Os dados são deste aparelho, sem conta ou sincronização.

Use o [roteiro local em TESTING.md](TESTING.md#continuar-a-validação-sem-gemini) para as próximas verificações. O build debug ainda precisa de Metro e conexão com o computador.

### Configurar análise quando for retomada

A análise no app lê `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, em `src/constants/env.ts`. Preencha esses valores no `.env`; ambos identificam o backend público e não concedem privilégios administrativos. Sem eles, a tela informa que o serviço está indisponível. Veja [ANALYSIS.md](ANALYSIS.md) para o fluxo, timeout, revisão, cota e limites ainda pendentes.

A credencial Gemini fica apenas nos secrets da Edge Function. Nunca use uma chave secreta em variável `EXPO_PUBLIC_*`. `.env.example` contém somente nomes de variáveis públicas; em outro PC, recupere os valores pelo ambiente de desenvolvimento autorizado.

Comandos existentes:

| Comando | Uso |
| --- | --- |
| `npm start` | Iniciar o servidor Expo. |
| `npm run android` | Gerar/compilar e executar o app Android; requer Android SDK e dispositivo/emulador configurado. |
| `npm run ios` | Gerar/compilar e executar o app iOS; requer macOS e Xcode. |
| `npm run web` | Tentar executar a versão web; a compatibilidade completa ainda precisa de validação. |
| `npm run typecheck` | Verificar os tipos (`tsc --noEmit`). |
| `npm run lint` | Executar ESLint com configuração Expo versionada; avisos também falham o check. |
| `npm test` | Executar testes de persistência, cuidados, histórico e análise com Node/tsx. |
| `npm run check` | Executar typecheck, lint e testes. |
| `npx supabase --version` | Conferir a CLI Supabase fixada no projeto. |
| `npx expo install --check` | Conferir compatibilidade de versões com o SDK instalado. |
| `npx expo export --platform android` | Gerar bundle JS/assets em `dist/`; não compila APK. |

A visualização AR usa `@reactvision/react-viro`, um modelo GLB e módulos nativos. O próprio código exige build nativo compatível e dispositivo com suporte; Expo Go não executa esse recurso. A tela tem fallback para indisponibilidade, mas isso não comprova que todo o app funciona na web. As pastas `android/` e `ios/` são geradas e ignoradas pelo Git.

Os dados e fotos de plantas são locais; veja [PERSISTENCE.md](PERSISTENCE.md) para formato, comportamento em falhas e necessidade de reconstruir o app após instalar as dependências nativas de armazenamento.

Não use `npm run reset-project` no fluxo habitual: o script é de reset do projeto, não um comando de instalação.

## Supabase

A CLI Supabase fica fixada como dependência de desenvolvimento e deve ser executada com `npx supabase`. A configuração local versionada está em `supabase/config.toml`; arquivos temporários de vínculo e ambientes locais permanecem ignorados pelo Git.

Para vincular uma nova máquina ao projeto remoto, autentique a CLI com um token pessoal de escopo mínimo e execute:

```bash
npx supabase login
npx supabase link --project-ref ukqsiclooawiqmttdobu
```

O projeto remoto precisa estar ativo para concluir o vínculo. Não versione o token, a senha do banco ou segredos usados por Edge Functions.

A função `analyze-plant` aceita a chave publicável do projeto e limita cada origem a 10 tentativas por janela de uma hora. O IP é transformado em hash com salt antes de ser persistido; clientes públicos ainda podem extrair a chave publicável, portanto essa proteção limita abuso, mas não identifica uma pessoa. Autenticação individual exigirá Supabase Auth numa etapa futura.

Configure os secrets diretamente no projeto remoto, sem prefixo `EXPO_PUBLIC_`:

```bash
npx supabase secrets set GEMINI_API_KEY=<valor> GEMINI_MODEL=gemini-3.5-flash-lite
npx supabase functions deploy analyze-plant --use-api
```

Não passe o valor real por chat, documentação, commit ou histórico do shell compartilhado. A migração de quota fica em `supabase/migrations`; aplique-a com `npx supabase db push --linked` e confira `npx supabase migration list --linked`.

## Preparar Android

Instale JDK 17, Android Studio e os pacotes do SDK Android necessários ao SDK 55 (incluindo Platform 36, Build-Tools e Platform-Tools). Configure `JAVA_HOME` e `ANDROID_HOME` apontando para as instalações locais e inclua `platform-tools` no `PATH`. O [guia oficial de ambiente Android do Expo](https://docs.expo.dev/workflow/android-studio-emulator/) detalha os passos por sistema operacional.

Confira o ambiente antes de compilar:

```bash
java -version
adb --version
adb devices
npm run android
```

Use um aparelho físico compatível para validar AR. A compilação gera `android/`, ignorado pelo Git. Mudanças em plugins/dependências nativas exigem novo build; reiniciar Metro sozinho não atualiza os módulos instalados. Use `npm start` para iniciar Metro nas sessões seguintes, com o build nativo instalado.

No WSL2, não presuma acesso automático a SDK, JDK ou USB do Windows. Configure todas as ferramentas no ambiente em que executará a compilação, ou execute o projeto no host já preparado.

### Windows e conexão USB

No PowerShell, use `npm.cmd`/`npx.cmd` se a política de execução bloquear `npm.ps1`/`npx.ps1`, com Node e npm nas versões indicadas acima. Não é necessário mudar a política de execução do sistema.

Para servir o build debug por USB, abra Metro em um terminal:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1'
npm.cmd start -- --lan --port 8081 --max-workers 2
```

Em outro terminal, com um único aparelho autorizado conectado:

```powershell
$taskAdb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
& $taskAdb devices -l
& $taskAdb reverse tcp:8081 tcp:8081
npm.cmd run android -- --device --no-bundler
```

`--device` permite escolher o aparelho. Quando informado diretamente, o parâmetro espera o nome exibido pelo Expo (por exemplo `SM_G781B`), não o número de série do ADB. Depois do build, confira que Metro responde em `http://127.0.0.1:8081/status` antes de abrir o app. Neste Windows, `--localhost` vinculou Metro somente a `::1`; o encaminhamento USB não alcançou o servidor por IPv4. `--lan` com o hostname acima resolveu o acesso por USB. O build debug depende de Metro; não é um APK autônomo para distribuição.

Consulte [TESTING.md](TESTING.md) para os checks, roteiro manual e limites do que foi validado.

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
