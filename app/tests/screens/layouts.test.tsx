/**
 * Layouts do expo-router.
 *
 * `Stack`/`Tabs` são substituídos por versões que apenas imprimem o nome de
 * cada rota — assim o teste enxerga quais telas o layout registrou e o que o
 * guard de sessão deixa passar.
 */
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

// O layout raiz monta o próprio `SafeAreaProvider`, que só renderiza os filhos
// depois de medir os insets — o mock oficial já entrega valores fixos.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => {
  const { Text, View } = require('react-native');

  const Stack = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  Stack.Screen = ({ name }: { name: string }) => <Text>{`rota:${name}`}</Text>;
  Stack.Protected = ({ guard, children }: { guard: boolean; children?: ReactNode }) =>
    guard ? <View>{children}</View> : null;

  return {
    Stack,
    DefaultTheme: { colors: {} },
    ThemeProvider: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    useRouter: () => require('../helpers/router').router,
  };
});

jest.mock('expo-router/js-tabs', () => {
  const { Text, View } = require('react-native');

  const Tabs = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  Tabs.Screen = ({ name, options }: { name: string; options?: { title?: string } }) => (
    <Text>{`aba:${name}:${options?.title ?? ''}`}</Text>
  );

  return { Tabs };
});

import AuthLayout, { unstable_settings as authSettings } from '@/app/(auth)/_layout';
import RootLayout from '@/app/_layout';
import TabsLayout, { unstable_settings as tabsSettings } from '@/app/(tabs)/_layout';

const PROTEGIDAS = [
  '(tabs)',
  'transacao/nova',
  'metas/index',
  'metas/[id]',
  'financiamento/index',
  'financiamento/amortizacao',
  'perfil/index',
  'perfil/editar',
  'perfil/notificacoes',
  'perfil/seguranca',
  'perfil/compartilhados',
  'perfil/convidar',
];

describe('RootLayout', () => {
  it('sem sessão libera apenas o grupo de autenticação', async () => {
    await render(<RootLayout />);
    await waitFor(() => expect(screen.getByText('rota:(auth)')).toBeOnTheScreen());
  });

  it('as telas internas ficam fora do ar enquanto não há sessão', async () => {
    await render(<RootLayout />);
    await waitFor(() => expect(screen.getByText('rota:(auth)')).toBeOnTheScreen());

    for (const rota of PROTEGIDAS) {
      expect(screen.queryByText(`rota:${rota}`)).toBeNull();
    }
  });

  it('esconde a splash quando as fontes carregam', async () => {
    const SplashScreen = require('expo-splash-screen');
    await render(<RootLayout />);
    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
  });
});

describe('TabsLayout', () => {
  it('declara as cinco abas com os títulos do board', async () => {
    await render(<TabsLayout />);
    expect(screen.getByText('aba:index:Início')).toBeOnTheScreen();
    expect(screen.getByText('aba:transacoes:Transações')).toBeOnTheScreen();
    expect(screen.getByText('aba:cartoes:Cartões')).toBeOnTheScreen();
    expect(screen.getByText('aba:investimentos:Investimentos')).toBeOnTheScreen();
    expect(screen.getByText('aba:mais:Mais')).toBeOnTheScreen();
  });

  it('ancora o grupo no Início', () => {
    expect(tabsSettings).toEqual({ anchor: 'index' });
  });
});

describe('AuthLayout', () => {
  it('renderiza a pilha de autenticação', async () => {
    await render(<AuthLayout />);
    expect(screen.root).not.toBeNull();
  });

  it('ancora o grupo no login', () => {
    expect(authSettings).toEqual({ anchor: 'login' });
  });
});

describe('rotas protegidas declaradas', () => {
  it('o layout raiz registra todas as telas internas', () => {
    const fonte: string = require('fs').readFileSync(
      require('path').join(__dirname, '../../src/app/_layout.tsx'),
      'utf8',
    );
    for (const rota of PROTEGIDAS) {
      expect(fonte).toContain(`name="${rota}"`);
    }
  });
});
