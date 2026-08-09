import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, type Snapshot } from '@/services/api';
import type { Goal, Invite, Session, Transaction } from '@/types';

type State = {
  session: Session | null;
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
};

type Store = State & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<Transaction>;
  chooseGoalQuote: (goalId: string, quoteId: string) => Promise<Goal>;
  sendInvite: (email: string, accountIds: string[]) => Promise<Invite>;
};

const FintrackContext = createContext<Store | null>(null);

const EMPTY: Snapshot = {
  people: [],
  accounts: [],
  transactions: [],
  investments: [],
  goals: [],
  loans: [],
  invites: [],
};

export function FintrackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    session: null,
    snapshot: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const snapshot = await api.snapshot();
      setState((prev) => ({ ...prev, snapshot, loading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Falha ao carregar dados',
      }));
    }
  }, []);

  useEffect(() => {
    if (state.session && !state.snapshot) {
      void load();
    }
  }, [state.session, state.snapshot, load]);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.signIn(email, password);
    setState((prev) => ({ ...prev, session }));
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const session = await api.signUp(name, email, password);
    setState((prev) => ({ ...prev, session }));
  }, []);

  const signOut = useCallback(() => {
    setState({ session: null, snapshot: null, loading: false, error: null });
  }, []);

  const addTransaction = useCallback(async (input: Omit<Transaction, 'id'>) => {
    const created = await api.createTransaction(input);
    setState((prev) =>
      prev.snapshot
        ? {
            ...prev,
            snapshot: {
              ...prev.snapshot,
              transactions: [created, ...prev.snapshot.transactions],
              accounts: prev.snapshot.accounts.map((account) => {
                // Destino da transferência recebe o valor
                if (account.id === created.toAccountId) {
                  return { ...account, balance: account.balance + created.amount };
                }
                if (account.id !== created.accountId) return account;
                // Gasto no cartão vai para a fatura, não para um saldo
                if (account.kind === 'cartao') {
                  return created.kind === 'gasto'
                    ? { ...account, invoice: (account.invoice ?? 0) + created.amount }
                    : account;
                }
                const delta = created.kind === 'ganho' ? created.amount : -created.amount;
                return { ...account, balance: account.balance + delta };
              }),
            },
          }
        : prev,
    );
    return created;
  }, []);

  const chooseGoalQuote = useCallback(async (goalId: string, quoteId: string) => {
    const goal = await api.chooseGoalQuote(goalId, quoteId);
    setState((prev) =>
      prev.snapshot
        ? {
            ...prev,
            snapshot: {
              ...prev.snapshot,
              goals: prev.snapshot.goals.map((g) => (g.id === goal.id ? goal : g)),
            },
          }
        : prev,
    );
    return goal;
  }, []);

  const sendInvite = useCallback(async (email: string, accountIds: string[]) => {
    const invite = await api.sendInvite(email, accountIds);
    setState((prev) =>
      prev.snapshot
        ? { ...prev, snapshot: { ...prev.snapshot, invites: [...prev.snapshot.invites, invite] } }
        : prev,
    );
    return invite;
  }, []);

  const value = useMemo<Store>(
    () => ({ ...state, signIn, signUp, signOut, addTransaction, chooseGoalQuote, sendInvite }),
    [state, signIn, signUp, signOut, addTransaction, chooseGoalQuote, sendInvite],
  );

  return <FintrackContext.Provider value={value}>{children}</FintrackContext.Provider>;
}

export function useFintrack(): Store {
  const context = useContext(FintrackContext);
  if (!context) {
    throw new Error('useFintrack precisa estar dentro de <FintrackProvider>');
  }
  return context;
}

/** Atalho para as telas que só leem dados — nunca retorna `null`. */
export function useSnapshot(): Snapshot {
  return useFintrack().snapshot ?? EMPTY;
}

export function useCurrentPerson() {
  return useFintrack().session?.person ?? null;
}
