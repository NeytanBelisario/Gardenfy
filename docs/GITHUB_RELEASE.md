# Apresentação e distribuição no GitHub

## Estado atual

- [Beta 1.0.0-beta.1](https://github.com/NeytanBelisario/Gardenfy/releases/tag/v1.0.0-beta.1) publicada como pre-release, com APK Android e arquivo SHA-256.
- Tag anotada `v1.0.0-beta.1` no código do APK (`1a9190e`), da preparação integrada em `develop` pelo PR #14.
- [Release antiga](https://github.com/NeytanBelisario/Gardenfy/releases/tag/app) identificada como histórica, com link para a beta. Seu APK e tag foram preservados.
- [Milestone 1.0.0](https://github.com/NeytanBelisario/Gardenfy/milestone/1) e [issue #15](https://github.com/NeytanBelisario/Gardenfy/issues/15) acompanham câmera, TalkBack e assinatura de produção. Label `release` criada para organizar essas entregas.
- README com três capturas reais preparado em `docs/mvp-beta-release`, com PR para `develop`. O README exibido na página inicial do repositório só muda após integração em `main`, que continua sendo a branch padrão.

## About: alteração pelo administrador

O acesso GitHub disponível nesta sessão tem permissão de escrita, mas não de administração/manutenção. As tentativas de alterar descrição e tópicos pela API retornaram 404; esses campos não foram atualizados.

Quem administra o repositório pode abrir [Gardenfy](https://github.com/NeytanBelisario/Gardenfy), clicar na engrenagem de **About**, preencher os campos abaixo e salvar. Não é necessário compartilhar um token ou mudar o código.

**Descrição sugerida:**

```text
Aplicativo Android para organizar jardins e plantas, identificar espécies por foto com Pl@ntNet e registrar regas e adubações. Expo / React Native, com dados locais.
```

**Website:**

```text
https://github.com/NeytanBelisario/Gardenfy/releases/tag/v1.0.0-beta.1
```

**Topics:**

```text
android, expo, react-native, typescript, supabase, plantnet, plant-care, gardening
```

Preserve tópicos adicionais que ainda descrevam o projeto. A descrição anterior menciona AR, avaliação de saúde e cuidados remotos; o escopo atual é manutenção local com identificação de espécie.

## Próximas distribuições

1. Concluir a tarefa em branch própria e documentar checks e limites; integrar o PR em `develop` antes de iniciar trabalho dependente.
2. Compilar e validar o APK do código que será marcado. Conferir pacote, versão/código Android, assinatura, instalação e preservação de dados em atualização.
3. Usar uma nova tag para cada entrega; não mover tags publicadas nem substituir arquivos de uma beta para representar outro código.
4. Criar a release em rascunho com origem, notas, instruções e pendências. Anexar o APK e checksum, conferir tamanho/digest e publicar quando solicitado.
5. Identificar distribuições de avaliação como pre-release. Antes da estável, concluir [RELEASE_1.0.md](RELEASE_1.0.md), preparar assinatura de produção e revisar/incrementar o código de versão Android.

O APK é um anexo da release, não um arquivo do Git. Não incluir credenciais nas notas, capturas ou artefatos. O link de download no README aponta para a beta explicitamente: `/releases/latest` continua podendo abrir a versão histórica, pois a beta é uma pre-release.
