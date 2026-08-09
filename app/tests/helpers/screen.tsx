/**
 * Render de tela: área segura + store real com sessão já carregada.
 *
 * As telas nunca conhecem `fetch` — em teste a `api` roda em modo mock sobre o
 * seed, então `renderScreen` exercita o caminho completo tela → store → api.
 */
import { render, screen, waitFor } from '@testing-library/react-native';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FintrackProvider, useFintrack } from '@/store/fintrack-store';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const EMAIL_PADRAO = 'ana@email.com';

/** Faz login e só libera a tela quando o snapshot terminou de carregar. */
function Session({ email, children }: { email: string; children: ReactNode }) {
  const { session, snapshot, signIn } = useFintrack();

  useEffect(() => {
    if (!session) void signIn(email, 'senha123');
  }, [session, signIn, email]);

  if (!session || !snapshot) return null;
  return (
    <>
      <View testID="sessao-pronta" />
      {children}
    </>
  );
}

type Options = {
  /** `false` para telas de autenticação, que rodam sem sessão. */
  signedIn?: boolean;
  /** Quem loga — muda o `ownerId` e o que a tela considera "meu". */
  email?: string;
};

export async function renderScreen(ui: ReactElement, options: Options = {}) {
  const { signedIn = true, email = EMAIL_PADRAO } = options;

  const view = await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FintrackProvider>
        {signedIn ? <Session email={email}>{ui}</Session> : ui}
      </FintrackProvider>
    </SafeAreaProvider>,
  );

  if (signedIn) {
    await waitFor(() => expect(screen.getByTestId('sessao-pronta')).toBeOnTheScreen());
  }
  return view;
}
