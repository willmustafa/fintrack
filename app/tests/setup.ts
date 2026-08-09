/**
 * Setup global do Jest.
 *
 * Mocka só o que depende de código nativo (fontes, splash, clipboard, router).
 * Componentes e lógica do app rodam de verdade.
 */
// `GestureHandlerRootView` (layout raiz) precisa do módulo nativo instalado.
import 'react-native-gesture-handler/jestSetup';

// Fontes: `useFonts` resolveria via rede/nativo — no teste já está pronto.
jest.mock('@expo-google-fonts/hanken-grotesk', () => ({
  useFonts: () => [true, null],
  HankenGrotesk_400Regular: 'HankenGrotesk_400Regular',
  HankenGrotesk_500Medium: 'HankenGrotesk_500Medium',
  HankenGrotesk_600SemiBold: 'HankenGrotesk_600SemiBold',
  HankenGrotesk_700Bold: 'HankenGrotesk_700Bold',
  HankenGrotesk_800ExtraBold: 'HankenGrotesk_800ExtraBold',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// `console.error` do React vira falha: pega prop inválida, key faltando, etc.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0] ?? '');
    // Avisos conhecidos e inofensivos no ambiente de teste.
    if (
      message.includes('useNativeDriver') ||
      message.includes('not wrapped in act') ||
      message.includes('deprecated')
    ) {
      return;
    }
    originalError(...(args as Parameters<typeof console.error>));
  };
});
afterAll(() => {
  console.error = originalError;
});
