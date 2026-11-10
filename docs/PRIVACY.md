# Política de privacidade do Gardenfy

> **Rascunho para revisão (versão 1.3.1).** Antes de publicar na Play Store, confira se o texto continua batendo com o app.

Última atualização: 10 de novembro de 2026.

O Gardenfy é um app para cuidar de plantas: você organiza jardins, registra regas e recebe lembretes. Esta política explica quais dados o app usa, para quê, com quem eles são compartilhados e como você pode apagá-los. Ela segue a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).

**Responsável pelos dados:** Diony Rinker
**Contato:** [dionyrinker40@gmail.com](mailto:dionyrinker40@gmail.com)

## Resumo

- Não há conta, login, anúncios nem rastreamento de uso. Nada é vendido.
- Seus jardins, plantas, fotos, histórico de cuidados e lembretes ficam **só no seu aparelho**.
- Só saem do aparelho, e só quando você usa o recurso:
  - a **foto** que você manda identificar, sem os dados de localização;
  - o **nome da espécie**, para buscar a referência de cuidados.

## 1. Dados que ficam no seu aparelho

| Dado | Para quê |
|---|---|
| Jardins, plantas, apelidos e descrições | Organizar suas plantas |
| Fotos das plantas | Mostrar a foto de cada planta |
| Regas, adubações e identificações | Histórico, barras de água e luz e o "Para hoje" |
| Preferências de lembrete | Agendar a notificação diária |

Esses dados não são enviados ao Gardenfy nem a terceiros. Eles são apagados quando você exclui o jardim ou a planta, limpa os dados do app nas configurações do Android ou desinstala o app. Como não há conta nem backup na nuvem, também não há cópia em outro lugar: perder o aparelho significa perder esses dados.

## 2. Dados enviados quando você usa um recurso

### Identificação por foto (Pl@ntNet)

- **O que é enviado:** a foto que você tirou ou escolheu.
- **Caminho:** a foto passa pelo servidor do Gardenfy (Supabase) e segue para o serviço [Pl@ntNet](https://plantnet.org), mantido por instituições de pesquisa francesas.
- **Metadados removidos:** antes de a foto sair do nosso servidor, apagamos localização (GPS), modelo do aparelho, datas e comentários gravados na imagem.
- **Retenção:** o servidor do Gardenfy não guarda a foto. O Pl@ntNet a processa conforme os [termos e a política de privacidade dele](https://my.plantnet.org/).
- **Para quê:** sugerir a espécie da planta.
- **Base legal:** execução do serviço que você pediu (LGPD, art. 7º, V).

### Referência de cuidados (estimativa da IA)

- **O que é enviado:** só o nome científico e, se houver, o nome popular da espécie. Nunca a foto, o apelido da planta ou qualquer dado seu.
- **Quando:** só para espécies que não têm ficha própria no app.
- **Caminho:** o pedido vai ao servidor do Gardenfy e, se a espécie ainda não estiver salva, ao Gemini (Google).
- **Retenção:** a resposta fica salva por espécie no nosso servidor, sem ligação com quem pediu, para não consultar a IA de novo.
- **Uso pelo Google:** no plano gratuito, o Google pode usar o conteúdo enviado (o nome da espécie) para melhorar os serviços dele.
- **Para quê:** estimar a frequência de rega e a luz adequada. O app sempre mostra isso como "Estimativa da IA", não como medição.
- **Base legal:** execução do serviço (art. 7º, V).

### Proteção contra abuso

Para limitar o número de pedidos e proteger as cotas gratuitas, o servidor usa o endereço IP de quem faz o pedido.

- **Como é guardado:** só um código derivado do IP (hash com chave secreta) e um contador. O IP em si não é guardado.
- **Retenção:** esse registro é apagado automaticamente em até 2 dias.
- **Registros do provedor:** a Supabase, que hospeda o servidor, mantém registros técnicos de acesso (como IP e horário) por um período curto, conforme a política dela.
- **Base legal:** legítimo interesse em manter o serviço disponível e seguro (art. 7º, IX).

### Atualizações do app

O app consulta os servidores da Expo para baixar correções. Essa consulta revela dados técnicos: endereço IP, versão do app e sistema operacional.

## 3. Permissões do aparelho

- **Câmera e fotos:** só quando você toca em "Tirar foto" ou "Galeria" para identificar uma planta.
- **Notificações:** só se você ativar os lembretes. Os lembretes são agendados no próprio aparelho; não usamos notificações enviadas por servidor.

## 4. Compartilhamento e transferência internacional

Os dados enviados (foto sem metadados, nome da espécie e dados técnicos de acesso) são processados por:

- **Supabase:** hospedagem do servidor.
- **Pl@ntNet:** França.
- **Google:** Gemini.
- **Expo:** atualizações.

Esses fornecedores podem tratar os dados fora do Brasil. Não compartilhamos dados com outros terceiros, não fazemos publicidade e não vendemos dados.

## 5. Crianças

O app não coleta nome, e-mail, idade ou outros dados de identificação. Crianças podem usá-lo com acompanhamento de um responsável, que deve conhecer os recursos de identificação por foto descritos acima.

## 6. Seus direitos

Pela LGPD, você pode pedir confirmação, acesso, correção, anonimização ou eliminação dos seus dados, além de informações sobre compartilhamento.

- **Dados no aparelho:** você tem controle direto, pelo app (editar ou excluir plantas e jardins) ou pelas configurações do Android.
- **Dados no servidor:** não são ligados à sua identidade, mas você pode falar com o contato acima.
- **Reclamações:** você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).

## 7. Mudanças nesta política

Quando o app passar a tratar dados de outro jeito, esta política será atualizada antes da mudança, com nova data no topo. A criação de conta e a sincronização na nuvem, previstas para versões futuras, vão exigir uma nova versão desta política.
