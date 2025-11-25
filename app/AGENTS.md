# Fintrack Frontend Agent Notes

## Projeto
Este front-end combina React Native (via Expo), React Native Web, Tamagui e TypeScript para oferecer um painel unificado de finanças pessoais (despesas, receitas, orçamentos, metas, sonhos, investimentos, contas compartilhadas, etc.) para mobile e web. As pastas abaixo devem refletir essa responsabilidade.

## Estrutura sugerida

- **/src**
  - Entrada única de código compartilhado. Contém todas as pastas listadas abaixo e o `App.tsx` (ou `App.web.tsx` se precisar de ajustes específicos para a web).
  - Pipelines de build (Expo + web) devem apontar para esse diretório como src principal.

- **/src/assets**
  - Imagens, fontes (caso use Tamagui customizado), ícones SVG e outros recursos estáticos reutilizáveis.
  - Separar em subpastas (`images/`, `fonts/`, `icons/`) ajuda a manter o Tamagui Theme limpo.

- **/src/components**
  - Componentes atômicos ou compostos: botões, cards, etiquetas, listas de transação, etc.
  - Deve conter variações específicas para mobile/web via `Component.native.tsx`, `Component.web.tsx`, ou centralizar com Tamagui responsivo.

- **/src/screens**
  - Telas principais por fluxo (Dashboard, Transações, Metas, Orçamentos, Investimentos, Compartilhamento).
  - Cada tela combina componentes e hooks/contextos para montar a UI.
  - Nomear como `DashboardScreen.tsx` e exportar via `screens/index.ts`.

- **/src/navigation**
  - Configurações do React Navigation (stacks, tabs, drawers).
  - Adaptar rotas mobile/web (Stack+Drawer) e exportar o provedor raiz.
  - Manter um `navigation/constants.ts` para nomes.

- **/src/hooks**
  - Hooks personalizados (useTransactions, useBudget, useResponsive).
  - Permitem centralizar lógica e reutilizar nos componentes e telas.

- **/src/contexts**
  - Providers globais (Autenticação, Tema/Tamagui, Financeiro, Compartilhamento).
  - Exportar `FinanceContext`, `ThemeProvider`, etc., e combinar no `AppProviders`.

- **/src/services**
  - Abstrações de acesso a dados (API, storage local via `expo-secure-store`, mocks).
  - Incluir clientes de API, adaptadores para `swr`/`react-query`, e qualquer integração com Expo (notificações, localização).

- **/src/modules** *(opcional, mas útil para domínios)*
  - Direcionado por feature: `/modules/budgets`, `/modules/investments` com telas, hooks e serviços co-localizados.
  - Cada módulo pode expor componentes públicos reutilizáveis.

- **/src/config**
  - Configurações compartilhadas (env, endpoints, constantes de orçamento), além de temas Tamagui e tokens de design.

- **/src/utils**
  - Funções puras (formatadores, conversores de moeda, calculadoras de projeção).
  - Preferir composição e tipagem clara.

- **/src/styles**
  - Tokens Tamagui, temas claros/escuros e utilitários globais.
  - Se Tamagui já estiver integrado no `/config`, essa pasta pode ser enxuta.

- **/src/tests**
  - Utilitários e mocks para testes unitários/integrados (sem precisar rodar Jest se ainda não configurado).

- **/assets**
  - (fora de src) Caso o Expo exija recursos públicos (manifestos, icon.png, splash.png). Manter `app.json`/`app.config.ts` na raiz.

- **/scripts**
  - Scripts auxiliares, como gerar ícones, limpar caches ou sincronizar Tokens Tamagui.

## Observações
- Manter `tsconfig.json`, `package.json` e outros arquivos de configuração na raiz.
- Adotar Tamagui com tokens e componentes compartilhados facilita a manutenção multi-plataforma.
- Modularizar por feature reduz retrabalho ao adicionar novas metas, investimentos ou compartilhamento de contas.
