# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# FinTrack

App em React Native + Expo SDK 57 com expo-router (rotas em `src/app`). Detalhes de estrutura,
telas e contrato do backend estão no `README.md`.

Convenções deste projeto:

- Estilo vem de `src/theme/tokens.ts` (extraído do board de wireframes) — não invente cores ou
  tamanhos avulsos.
- Textos usam `<Text>` de `@/components/text` (Hanken Grotesk, prop `weight`/`size`), nunca o
  `Text` do react-native direto.
- Toda leitura/escrita de dados passa por `src/services/api.ts`; telas não conhecem `fetch` nem o
  seed. Cálculos derivados ficam em `src/lib/finance.ts` (funções puras).
- UI e conteúdo em pt-BR; formatação de moeda/data em `src/lib/format.ts` (sem depender de `Intl`).
- Tabs usam `Tabs` de `expo-router/js-tabs` com a `TabBar` customizada — `Tabs` de `expo-router`
  está deprecado.
