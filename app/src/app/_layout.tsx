import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FintrackProvider, useFintrack } from '@/store/fintrack-store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.surface,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
  },
};

function RootNavigator() {
  const { session } = useFintrack();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transacao/nova" options={{ presentation: 'modal' }} />
        <Stack.Screen name="metas/index" />
        <Stack.Screen name="metas/[id]" />
        <Stack.Screen name="financiamento/index" />
        <Stack.Screen name="financiamento/amortizacao" />
        <Stack.Screen name="perfil/index" />
        <Stack.Screen name="perfil/editar" />
        <Stack.Screen name="perfil/notificacoes" />
        <Stack.Screen name="perfil/seguranca" />
        <Stack.Screen name="perfil/compartilhados" />
        <Stack.Screen name="perfil/convidar" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <FintrackProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </FintrackProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
