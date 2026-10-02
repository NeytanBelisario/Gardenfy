# Validação do Gardenfy

## Checks automatizados

```bash
npm ci
npm run check
npx expo install --check
npx expo export --platform android
```

`npm run check` executa TypeScript, ESLint (com zero avisos permitidos) e testes de persistência. `npm test` permite executar só os testes. A configuração de lint segue o [guia oficial do Expo](https://docs.expo.dev/guides/using-eslint/), com exceção pontual documentada para o asset GLB nativo.

O workflow `.github/workflows/checks.yml` executa instalação pelo lockfile, checks e testes, compatibilidade dos pacotes Expo e export do bundle Android em PRs para `develop`/`main` e pushes nessas bases. O export valida JavaScript/assets; não produz APK nem substitui teste nativo.

## Roteiro manual — situação atual

Execute com build nativo Android e registre versão do sistema, modelo do dispositivo, commit e resultado. Os resultados abaixo ainda não foram executados em dispositivo nesta sessão.

| Passo | Comportamento a verificar | Limitação / validação pendente |
| --- | --- | --- |
| Abrir pela primeira vez | Home vazia e acesso à criação de jardim. | Store começa vazio. |
| Criar jardim | Nome, ambiente e ícone aparecem após salvar; nome vazio gera feedback. | Persistência implementada; testar no aparelho. |
| Adicionar pelo catálogo | Busca/filtro funcionam; planta aparece após salvar e contagem aumenta. | Catálogo estático; métricas iniciais são placeholders. |
| Analisar uma foto | Pedir permissão; mostrar carregamento, resultado e permitir adicionar/atualizar planta. | Requer rede/chave local; modelos precisam de validação real. |
| Cancelar seleção / negar câmera | Permitir continuar navegando sem travar. | Registrar falhas encontradas para a etapa de análise. |
| Abrir perfil | Contagens acompanham jardins/plantas. | Usuário e badges fixos; configurações/sair sem ação. |
| Abrir preview AR | Detectar plano, posicionar, girar, redimensionar e reposicionar. | Requer aparelho AR compatível. |
| AR indisponível | Mostrar fallback e permitir voltar. | Não equivale a validar toda a experiência web. |
| Encerrar e reabrir o app | Recuperar jardins, plantas, análises e fotos da sessão anterior. | Implementado e testado no domínio; teste nativo pendente. |

Não use dados pessoais reais nas fotos de teste. Uma execução sem chave valida apenas o tratamento dessa ausência, não o serviço de IA.

## Registro da sessão de 01/10/2026

Ambiente: Linux/WSL2, Node `22.22.2`, npm `10.9.7`. Esta máquina não possui Java, Android SDK/adb, emulador ou dispositivo configurados. Portanto, instalação e checks JS podem ser executados, mas compilação/instalação de APK, câmera e AR continuam pendentes de máquina/dispositivo preparados.

A instalação limpa, typecheck/lint, compatibilidade Expo, export Android e prebuild Android passaram nesta sessão. O lockfile final também passou em instalação dry-run após a atualização de `shell-quote`. A compilação de APK e os testes manuais continuam pendentes. O detalhe dos resultados e alertas restantes de dependências fica em `docs/HANDOFF.md`. Os testes de reinício, falhas de leitura/escrita e recuperação foram adicionados na entrega de persistência; a validação nativa continua pendente.

## Roteiro adicional — persistência

1. Reconstruir o app nativo para instalar AsyncStorage/FileSystem; criar jardim e adicionar uma planta pelo catálogo.
2. Encerrar completamente o app e reabrir; conferir nome, ambiente, ícone, planta e contagens.
3. Com a análise configurada, adicionar uma foto, reiniciar e conferir imagem, métricas e data.
4. Reanalisar e repetir a verificação; sem rede, confirmar erro de análise e preservação do resultado anterior.
5. Sem rede, criar jardim e adicionar pelo catálogo; reiniciar e conferir dados (fotos remotas podem não carregar).
6. Conferir feedback de carregamento/salvamento e que toques rápidos não repetem a mesma inclusão.

Os testes automatizados injetam falhas de leitura, escrita e cópia; não é necessário corromper dados reais para esses cenários. Erros de quota e integração nativa devem ser avaliados em um ambiente de teste dedicado.

## Registro da sessão de 02/10/2026

Instalação limpa, `npm run check` (typecheck, lint e 24 testes), compatibilidade Expo, export Android e prebuild Android passaram. Os testes de fotos usam um adapter de arquivos no Node, incluindo leitura após remoção do cache; isso não equivale à execução do Expo FileSystem ou do AsyncStorage em um aparelho. O roteiro manual acima ainda deve ser executado com um novo build nativo.
