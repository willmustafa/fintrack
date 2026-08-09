import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { api, type Snapshot } from '@/services/api';
import type {
  Goal,
  Invite,
  MemberAccess,
  Person,
  Preferences,
  ProfileInput,
  Session,
  Transaction,
} from '@/types';

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
  /** Perfil e configurações */
  updateProfile: (input: ProfileInput) => Promise<Person>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updatePreferences: (preferences: Preferences) => Promise<void>;
  updateMemberAccess: (personId: string, access: MemberAccess) => Promise<void>;
  removeMember: (personId: string) => Promise<void>;
  setAccountShared: (accountId: string, shared: boolean) => Promise<void>;
  resendInvite: (inviteId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
};

const FintrackContext = createContext<Store | null>(null);

const EMPTY_PREFERENCES: Preferences = {
  notifications: { transactions: true, invoices: true, goals: false, weeklySummary: true },
};

const EMPTY: Snapshot = {
  people: [],
  accounts: [],
  transactions: [],
  investments: [],
  goals: [],
  loans: [],
  invites: [],
  preferences: EMPTY_PREFERENCES,
};

export function FintrackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    session: null,
    snapshot: null,
    loading: false,
    error: null,
  });

  /** Leitura síncrona do estado atual dentro de callbacks (ex.: reverter update otimista). */
  const stateRef = useRef(state);
  stateRef.current = state;

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

  /** Aplica uma alteração no snapshot já carregado (no-op antes do primeiro load). */
  const patchSnapshot = useCallback((patch: (snapshot: Snapshot) => Snapshot) => {
    setState((prev) => (prev.snapshot ? { ...prev, snapshot: patch(prev.snapshot) } : prev));
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      const person = await api.updateProfile(input);
      setState((prev) =>
        prev.session ? { ...prev, session: { ...prev.session, person } } : prev,
      );
      patchSnapshot((snapshot) => ({
        ...snapshot,
        people: snapshot.people.map((item) => (item.id === person.id ? person : item)),
      }));
      return person;
    },
    [patchSnapshot],
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  }, []);

  const updatePreferences = useCallback(
    async (preferences: Preferences) => {
      // Otimista: a tela reflete o toggle na hora e reverte se a API recusar.
      const previous = stateRef.current.snapshot?.preferences;
      patchSnapshot((snapshot) => ({ ...snapshot, preferences }));
      try {
        const saved = await api.updatePreferences(preferences);
        patchSnapshot((snapshot) => ({ ...snapshot, preferences: saved }));
      } catch (error) {
        if (previous) patchSnapshot((snapshot) => ({ ...snapshot, preferences: previous }));
        throw error;
      }
    },
    [patchSnapshot],
  );

  const updateMemberAccess = useCallback(
    async (personId: string, access: MemberAccess) => {
      const person = await api.updateMemberAccess(personId, access);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        people: snapshot.people.map((item) => (item.id === person.id ? person : item)),
      }));
    },
    [patchSnapshot],
  );

  const removeMember = useCallback(
    async (personId: string) => {
      await api.removeMember(personId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        people: snapshot.people.filter((item) => item.id !== personId),
      }));
    },
    [patchSnapshot],
  );

  const setAccountShared = useCallback(
    async (accountId: string, shared: boolean) => {
      const account = await api.setAccountShared(accountId, shared);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts.map((item) => (item.id === account.id ? account : item)),
      }));
    },
    [patchSnapshot],
  );

  const resendInvite = useCallback(
    async (inviteId: string) => {
      const invite = await api.resendInvite(inviteId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        invites: snapshot.invites.map((item) =>
          item.id === inviteId ? { ...item, ...invite, id: item.id } : item,
        ),
      }));
    },
    [patchSnapshot],
  );

  const cancelInvite = useCallback(
    async (inviteId: string) => {
      await api.cancelInvite(inviteId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        invites: snapshot.invites.filter((item) => item.id !== inviteId),
      }));
    },
    [patchSnapshot],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      addTransaction,
      chooseGoalQuote,
      sendInvite,
      updateProfile,
      changePassword,
      updatePreferences,
      updateMemberAccess,
      removeMember,
      setAccountShared,
      resendInvite,
      cancelInvite,
    }),
    [
      state,
      signIn,
      signUp,
      signOut,
      addTransaction,
      chooseGoalQuote,
      sendInvite,
      updateProfile,
      changePassword,
      updatePreferences,
      updateMemberAccess,
      removeMember,
      setAccountShared,
      resendInvite,
      cancelInvite,
    ],
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

export function usePreferences(): Preferences {
  return useSnapshot().preferences;
}
