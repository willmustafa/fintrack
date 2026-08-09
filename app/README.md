# FinTrack · app

App de finanças pessoais em React Native + Expo (SDK 57, expo-router), implementado a partir do
board **FinTrack — Wireframes** do Claude Design.

O backend será escrito em Go depois; hoje todos os dados vêm de `src/data/seed.ts` através da
camada `src/services/api.ts`.

## Rodando

```bash
npm install
npm start          # escolha Android / iOS / web no menu do Expo
npm run android
npm run typecheck
```

## Estrutura

```
src/
  app/                      rotas (expo-router)
    (auth)/login|cadastro   Auth · V2 do board (hero + bottom-sheet)
    (tabs)/                 Início, Transações, Cartões, Investimentos, Mais
    transacao/nova          modal de lançamento (Nova transação · V1)
    metas/                  lista + comparação de orçamentos
    financiamento/          visão geral + amortização
    perfil/                 configurações, editar perfil, notificações,
                            segurança, compartilhados e convite
  components/               Text, Card, Button, Field, Chip, Picker, ActionSheet, gráficos, TabBar…
  data/seed.ts              dados de exemplo (mesmos números do board)
  lib/                      formatação pt-BR, validação e cálculos financeiros (puros)
  services/api.ts           acesso a dados — ponto de troca para o backend Go
  store/fintrack-store.tsx  sessão + snapshot em memória
  theme/tokens.ts           cores, espaçamentos, tipografia extraídos do board
  types/                    modelo de domínio (contrato esperado da API)
```

## Telas x wireframes

| Tela            | Variação implementada                                                    |
| --------------- | ------------------------------------------------------------------------ |
| Auth            | V2 — hero roxo + bottom-sheet; cadastro em tela própria                   |
| Início          | V1 — saldo consolidado, 50/30/20, receitas × gastos, atalhos              |
| Transações      | V1 — busca, filtros e agrupamento por dia, com o resumo entradas/saídas da V2 |
| Nova transação  | V1 — tipo em abas, valor, conta, categoria, data, pago por, recorrência   |
| Investimentos   | V1 (blocos por classe) + gráfico de evolução da V2                        |
| Metas           | V1 (cards com progresso) + tela de comparação de orçamentos               |
| Financiamento   | Visão geral e Amortização, com rateio entre Ana e Marcelo                 |
| Perfil          | Configurações + modal de convite, com as subtelas de edição, notificações, segurança e compartilhamento |
| Cartões         | **Não existe no board** (só na barra de navegação) — montada com os mesmos componentes |

## Conectando ao backend Go

`src/services/api.ts` decide entre dados de exemplo e HTTP pela variável de ambiente:

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

Sem a variável, `isMockMode` fica `true` e nada é chamado pela rede. Com ela definida, o app
espera estes endpoints devolvendo os tipos de `src/types/index.ts`:

| Método | Rota                    | Resposta                                              |
| ------ | ----------------------- | ----------------------------------------------------- |
| POST   | `/auth/login`           | `Session`                                             |
| POST   | `/auth/signup`          | `Session`                                             |
| GET    | `/snapshot`             | `Snapshot` (contas, transações, investimentos, metas, financiamentos, convites, preferências) |
| POST   | `/transactions`         | `Transaction`                                         |
| POST   | `/goals/:id/quote`      | `Goal`                                                |
| PATCH  | `/me`                   | `Person`                                              |
| POST   | `/me/password`          | `204`                                                 |
| PUT    | `/me/preferences`       | `Preferences`                                         |
| PATCH  | `/members/:id`          | `Person`                                              |
| DELETE | `/members/:id`          | `204`                                                 |
| PUT    | `/accounts/:id/sharing` | `Account`                                             |
| POST   | `/invites`              | `Invite`                                              |
| POST   | `/invites/:id/resend`   | `Invite`                                              |
| DELETE | `/invites/:id`          | `204`                                                 |

Valores monetários trafegam como número em reais (ex.: `156.30`) e datas como `YYYY-MM-DD`.
Respostas de erro devolvem `{ "message": "..." }` em pt-BR — a mensagem vai direto para a tela.

O levantamento do que ainda falta para alguém criar uma conta de verdade (verificação de e-mail,
persistência de sessão, deep link de convite, o bloqueio do tipo `OwnerId`) está em
[`docs/cadastro.md`](docs/cadastro.md).
