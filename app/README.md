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

## Testes

```bash
npm test               # unidade + integração (Jest + React Native Testing Library)
npm run test:watch
npm run test:coverage  # falha abaixo de 80% em statements/branches/functions/lines
npm run test:e2e       # fluxos ponta a ponta no navegador (Playwright)
```

```
tests/
  lib/          funções puras: formatação pt-BR, cálculos e validação
  services/     contrato da API nos dois modos (seed em memória e HTTP)
  store/        sessão e coerência do snapshot depois de cada mutação
  components/   Text, Card, Button, Field, Picker, ActionSheet, gráficos, TabBar…
  screens/      cada rota de `src/app` renderizada com o store real
  helpers/      wrappers de render e mock do expo-router
e2e/            Playwright sobre o build web
```

**`tests/services/api-http-mode.test.ts` é a rede de segurança da troca do mock
pelo backend em Go**: fixa método, rota, corpo e headers de cada endpoint da
tabela acima, além do formato de erro. Se o Go divergir do contrato, esse
arquivo acusa antes de qualquer tela quebrar.

Os testes de tela rodam com a `api` em modo mock sobre o seed, exercitando o
caminho completo tela → store → api. Para simular a recusa do backend basta um
`jest.spyOn(api, '...').mockRejectedValue(...)`.

### E2E

O Playwright exporta o app para `dist/` (`expo export --platform web`) e sobe o
servidor de produção do Expo — é o mesmo bundle que iria para o ar, sem
emulador no caminho. Na primeira vez, instale o navegador e as bibliotecas de
sistema:

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium   # libatk, libnss3, libgbm…
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
| Cartões e contas | **Não existe no board** — lista contas e cartões com criar/editar/excluir, seletor de banco brasileiro e "conta conjunta"; o cartão junta fatura, limite e datas num bloco só (os lançamentos ficam no extrato) |

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
| POST   | `/accounts`             | `Account`                                             |
| PUT    | `/accounts/:id`         | `Account`                                             |
| DELETE | `/accounts/:id`         | `204`                                                 |
| POST   | `/invites`              | `Invite`                                              |
| POST   | `/invites/:id/resend`   | `Invite`                                              |
| DELETE | `/invites/:id`          | `204`                                                 |

Valores monetários trafegam como número em reais (ex.: `156.30`) e datas como `YYYY-MM-DD`.
Respostas de erro devolvem `{ "message": "..." }` em pt-BR — a mensagem vai direto para a tela.

O levantamento do que ainda falta para alguém criar uma conta de verdade (verificação de e-mail,
persistência de sessão, deep link de convite, o bloqueio do tipo `OwnerId`) está em
[`docs/cadastro.md`](docs/cadastro.md).
