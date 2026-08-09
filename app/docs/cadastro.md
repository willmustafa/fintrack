# O que falta para o cadastro funcionar de verdade

Hoje o app roda em **modo mock** (`isMockMode`, quando `EXPO_PUBLIC_API_URL` está vazia). O
formulário de cadastro valida tudo, mas `api.signUp` devolve uma sessão falsa e o `/snapshot`
entrega os dados de exemplo da Ana. Este documento lista o que precisa existir para uma pessoa
criar uma conta de verdade — separado entre o que é do backend em Go e o que ainda falta no app.

---

## 1. Backend em Go — endpoints obrigatórios

Os cinco primeiros já são consumidos pelo app; os demais foram adicionados junto com a tela de
configurações. Todos devolvem os tipos de `src/types/index.ts`.

| Método | Rota                        | Corpo                                        | Resposta        | Usado em                  |
| ------ | --------------------------- | -------------------------------------------- | --------------- | ------------------------- |
| POST   | `/auth/signup`              | `{ name, email, password }`                  | `Session`       | `(auth)/cadastro`         |
| POST   | `/auth/login`               | `{ email, password }`                        | `Session`       | `(auth)/login`            |
| GET    | `/snapshot`                 | —                                            | `Snapshot`      | store, no primeiro load   |
| PATCH  | `/me`                       | `{ name, email }`                            | `Person`        | `perfil/editar`           |
| POST   | `/me/password`              | `{ currentPassword, newPassword }`           | `204`           | `perfil/seguranca`        |
| PUT    | `/me/preferences`           | `Preferences`                                | `Preferences`   | `perfil/notificacoes`     |
| PATCH  | `/members/:id`              | `{ access: "total" \| "leitura" }`           | `Person`        | `perfil` (menu do membro) |
| DELETE | `/members/:id`              | —                                            | `204`           | `perfil` (menu do membro) |
| PUT    | `/accounts/:id/sharing`     | `{ shared: boolean }`                        | `Account`       | `perfil/compartilhados`   |
| POST   | `/invites`                  | `{ email, accountIds }`                      | `Invite`        | `perfil/convidar`         |
| POST   | `/invites/:id/resend`       | —                                            | `Invite`        | `perfil` (menu do convite)|
| DELETE | `/invites/:id`              | —                                            | `204`           | `perfil` (menu do convite)|

**Formato de erro.** `src/services/api.ts` lê `{ "message": "..." }` do corpo de qualquer resposta
não-2xx e mostra essa mensagem direto na tela (`ApiError`). Então a mensagem precisa vir pronta em
pt-BR — ex.: `409 { "message": "Este e-mail já tem conta." }`.

**Ainda não existem no app, mas o cadastro depende deles:**

| Método | Rota                        | Para quê                                                       |
| ------ | --------------------------- | -------------------------------------------------------------- |
| POST   | `/auth/verify-email`        | Confirmar o e-mail com o código/token enviado após o signup     |
| POST   | `/auth/resend-verification` | Reenviar o código                                               |
| POST   | `/auth/forgot-password`     | Disparar o e-mail de recuperação ("Esqueci minha senha")        |
| POST   | `/auth/reset-password`      | Trocar a senha com o token do e-mail                            |
| POST   | `/auth/refresh`             | Renovar o token sem pedir senha de novo                         |
| POST   | `/auth/logout`              | Invalidar o token no servidor (hoje o app só apaga o estado)    |
| GET    | `/invites/:code`            | Mostrar quem convidou antes de a pessoa aceitar                 |
| POST   | `/invites/:code/accept`     | Vincular a conta nova ao convite                                |

---

## 2. Regras de validação

O app já aplica estas regras em `src/lib/validation.ts` — **o servidor precisa aplicar as mesmas**,
porque o cliente é só a primeira barreira:

- **Nome**: mínimo de 2 caracteres depois do `trim`.
- **E-mail**: `algo@algo.tld`, normalizado para minúsculas, único por conta.
- **Senha**: mínimo de 8 caracteres, com pelo menos uma letra e um número. Trocar a senha exige
  informar a atual e a nova precisa ser diferente dela.
- **Termos**: o app só habilita "Criar conta" com o aceite marcado. Vale gravar `acceptedTermsAt`
  no signup para ter registro.

---

## 3. Pendências no app

Em ordem de importância.

### 3.1 `OwnerId` é uma união fechada — bloqueia qualquer conta nova

`src/types/index.ts` define `type OwnerId = 'ana' | 'marcelo' | 'casal'`. Um id vindo do backend
(`usr_01H…`) não cabe nesse tipo, e por isso `api.signUp` no modo mock precisa devolver `id: 'ana'`.
Enquanto isso não mudar, **toda conta criada é a Ana**.

O que precisa mudar junto:

- `src/types/index.ts` — `OwnerId` vira `string`.
- `src/theme/tokens.ts` — `ownerColors` deixa de ser um mapa fixo e vira uma função que escolhe
  a cor a partir do id (hash) com fallback.
- `src/components/avatar.tsx` — o `INITIALS: Record<OwnerId, string>` sai; a inicial passa a vir
  de `Person.initial` (já existe no tipo).
- `src/app/transacao/nova.tsx` — a lista fixa `OWNERS` passa a vir de `snapshot.people`.
- `src/app/financiamento/amortizacao.tsx` — `ViewMode` deixa de assumir `'casal'` como constante.
- A noção de "casal" precisa virar um conceito explícito (um `householdId`, ou um `Person` com
  `kind: 'household'`) em vez do id mágico `'casal'`, que hoje aparece em `perfil/index`,
  `perfil/convidar`, `perfil/compartilhados` e `services/api`.

### 3.2 A sessão não sobrevive ao fechamento do app

`FintrackProvider` guarda `session` só em memória. Fechou o app, volta para o login. Falta:

- `expo-secure-store` (não está no `package.json`) para guardar o token;
- ler o token no boot e restaurar a sessão antes de decidir a rota — hoje `Stack.Protected` decide
  no primeiro render, então precisa de um estado `restoring` para não piscar a tela de login;
- enviar `Authorization: Bearer <token>` em `request()` — a função em `services/api.ts` ainda não
  manda header nenhum;
- tratar `401` renovando pelo `/auth/refresh` e, se falhar, deslogar.

### 3.3 Conta nova cai em cima dos dados de exemplo

Mesmo com 3.1 resolvido, `api.snapshot()` no modo mock sempre devolve o seed. Uma conta recém-criada
deveria começar vazia — o que também serve para testar os estados vazios de cada tela (Início,
Transações, Cartões, Investimentos e Metas ainda não foram vistos sem dados).

### 3.4 Fluxos de auth que não existem

- **"Continuar com Google"** (`(auth)/login.tsx`): o botão está lá sem `onPress`. Precisa de
  `expo-auth-session` + client id, e de um `POST /auth/google` no backend.
- **"Esqueci minha senha"** (`(auth)/login.tsx`): idem, `Pressable` sem ação. Falta a tela e as
  duas rotas de reset.
- **Verificação de e-mail**: não há tela nem estado "conta não verificada".
- **Aceitar convite**: `perfil/convidar` gera `fintrack.app/convite/8x2fq` (constante do seed), mas
  não existe rota `/convite/[code]` nem configuração de deep link no `app.json` para abrir o app
  quando alguém clica no link.
- **Termos de uso e Política de Privacidade**: o cadastro exige o aceite, mas os textos não existem
  e não há para onde levar a pessoa.

### 3.5 Menores

- `POST /auth/logout` não é chamado: `signOut` só limpa o estado local.
- `Invite.sentDaysAgo` vem como número pronto do servidor. Um `sentAt` em ISO seria mais honesto —
  hoje o valor congela enquanto o app está aberto.
- Não há registro de push (`expo-notifications`), então as preferências de `perfil/notificacoes`
  ficam salvas mas nada é entregue.
- Sem rate limit no cliente: dá para apertar "Reenviar convite" à vontade.

---

## 4. Ordem sugerida

1. `OwnerId` como `string` + fim do id mágico `'casal'` (destrava tudo).
2. `POST /auth/signup` e `/auth/login` reais + token no header + `expo-secure-store`.
3. Estados vazios das telas, com o snapshot de uma conta nova.
4. Verificação de e-mail e recuperação de senha.
5. Deep link e tela de aceitar convite.
6. Google Sign-In e push.
