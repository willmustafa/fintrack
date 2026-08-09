/**
 * Helpers de render compartilhados.
 *
 * Componentes com bottom-sheet e telas inteiras dependem do `SafeAreaProvider`
 * (insets) e, no caso das telas, do `FintrackProvider`. Em vez de repetir os
 * wrappers em cada teste, eles vivem aqui.
 */
import { render as rtlRender } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FintrackProvider } from '@/store/fintrack-store';

/** Métricas fixas para o `SafeAreaProvider` — sem elas o insets fica indefinido. */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function SafeAreaWrapper({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

export function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaWrapper>
      <FintrackProvider>{children}</FintrackProvider>
    </SafeAreaWrapper>
  );
}

/** Render com área segura — para componentes isolados (Picker, ActionSheet, TabBar). */
export const renderWithSafeArea = (ui: ReactElement) =>
  rtlRender(ui, { wrapper: SafeAreaWrapper });

/** Render com área segura + store — para telas. */
export const renderWithProviders = (ui: ReactElement) => rtlRender(ui, { wrapper: AppWrapper });
