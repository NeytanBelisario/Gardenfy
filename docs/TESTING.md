# Validação do Gardenfy

## Checks automatizados

```bash
npm ci
npm run check
npx expo install --check
npx expo export --platform android
```

`npm run check` executa TypeScript e ESLint, com zero avisos permitidos. A configuração de lint segue o [guia oficial do Expo](https://docs.expo.dev/guides/using-eslint/), com exceção pontual documentada para o asset GLB nativo.

O workflow `.github/workflows/checks.yml` executa instalação pelo lockfile, checks, compatibilidade dos pacotes Expo e export do bundle Android em PRs para `develop`/`main` e pushes nessas bases. O export valida JavaScript/assets; não produz APK nem substitui teste nativo.

## Roteiro manual — situação atual

Execute com build nativo Android e registre versão do sistema, modelo do dispositivo, commit e resultado. Os resultados abaixo ainda não foram executados em dispositivo nesta sessão.

| Passo | Comportamento a verificar | Limitação conhecida antes da persistência |
| --- | --- | --- |
| Abrir pela primeira vez | Home vazia e acesso à criação de jardim. | Store começa vazio. |
| Criar jardim | Nome, ambiente e ícone aparecem na listagem/detalhes. | Não persiste após reinício. |
| Adicionar pelo catálogo | Busca/filtro funcionam; planta aparece e contagem aumenta. | Catálogo estático; métricas iniciais são placeholders. |
| Analisar uma foto | Pedir permissão; mostrar carregamento, resultado e permitir adicionar/atualizar planta. | Requer rede/chave local; modelos precisam de validação real. |
| Cancelar seleção / negar câmera | Permitir continuar navegando sem travar. | Registrar falhas encontradas para a etapa de análise. |
| Abrir perfil | Contagens acompanham jardins/plantas. | Usuário e badges fixos; configurações/sair sem ação. |
| Abrir preview AR | Detectar plano, posicionar, girar, redimensionar e reposicionar. | Requer aparelho AR compatível. |
| AR indisponível | Mostrar fallback e permitir voltar. | Não equivale a validar toda a experiência web. |
| Encerrar e reabrir o app | Comparar jardins/plantas com a sessão anterior. | Perda esperada no código atual; é o problema a resolver em M1. |

Não use dados pessoais reais nas fotos de teste. Uma execução sem chave valida apenas o tratamento dessa ausência, não o serviço de IA.

## Registro da sessão de 01/10/2026

Ambiente: Linux/WSL2, Node `22.22.2`, npm `10.9.7`. Esta máquina não possui Java, Android SDK/adb, emulador ou dispositivo configurados. Portanto, instalação e checks JS podem ser executados, mas compilação/instalação de APK, câmera e AR continuam pendentes de máquina/dispositivo preparados.

A instalação limpa, typecheck/lint, compatibilidade Expo, export Android e prebuild Android passaram nesta sessão. O lockfile final também passou em instalação dry-run após a atualização de `shell-quote`. A compilação de APK e os testes manuais continuam pendentes. O detalhe dos resultados e alertas restantes de dependências fica em `docs/HANDOFF.md`. Ao implementar persistência, adicionar testes de reinício, leitura/escrita com falha e recuperação antes de marcar a etapa concluída.
