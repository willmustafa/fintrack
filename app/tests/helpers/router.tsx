/**
 * Mock do `expo-router` compartilhado pelos testes de tela.
 *
 * Use assim no topo do arquivo de teste:
 *
 * ```ts
 * jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);
 * ```
 *
 * e leia as chamadas por `router.push`, `router.back`, etc.
 */
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canGoBack: jest.fn(() => true),
};

/** Parâmetros de rota lidos por `useLocalSearchParams` (ex.: `metas/[id]`). */
export const routeParams: Record<string, string> = {};

export function setRouteParams(params: Record<string, string>) {
  for (const key of Object.keys(routeParams)) delete routeParams[key];
  Object.assign(routeParams, params);
}

export function resetRouter() {
  router.push.mockClear();
  router.replace.mockClear();
  router.navigate.mockClear();
  router.back.mockClear();
  router.dismiss.mockClear();
  router.canGoBack.mockClear();
  router.canGoBack.mockReturnValue(true);
  setRouteParams({});
}

/** `<Link>` vira um botão que empurra a rota — dá para testar a navegação. */
function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)}>
      {children}
    </Pressable>
  );
}

export const expoRouterMock = {
  useRouter: () => router,
  useLocalSearchParams: () => routeParams,
  usePathname: () => '/',
  useSegments: () => [],
  useFocusEffect: () => {},
  router,
  Link,
};
