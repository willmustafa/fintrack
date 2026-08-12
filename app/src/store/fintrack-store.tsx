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

import { applyTransaction, splitLedger, type LedgerEntry } from '@/lib/finance';
import { api, type Snapshot } from '@/services/api';
import type {
  Account,
  Contact,
  Goal,
  Invite,
  MemberAccess,
  Person,
  Preferences,
  ProfileInput,
  Session,
  Split,
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
  editTransaction: (transactionId: string, input: Omit<Transaction, 'id'>) => Promise<Transaction>;
  removeTransaction: (transactionId: string) => Promise<void>;
  chooseGoalQuote: (goalId: string, quoteId: string) => Promise<Goal>;
  sendInvite: (email: string, accountIds: string[]) => Promise<Invite>;
  /** Perfil e configurações */
  updateProfile: (input: ProfileInput) => Promise<Person>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updatePreferences: (preferences: Preferences) => Promise<void>;
  updateMemberAccess: (personId: string, access: MemberAccess) => Promise<void>;
  removeMember: (personId: string) => Promise<void>;
  setAccountShared: (accountId: string, shared: boolean) => Promise<void>;
  /** Contas e cartões: criar, editar e excluir */
  addAccount: (input: Omit<Account, 'id'>) => Promise<Account>;
  saveAccount: (accountId: string, input: Omit<Account, 'id'>) => Promise<Account>;
  removeAccount: (accountId: string) => Promise<void>;
  resendInvite: (inviteId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  /** Divisão de contas: pessoas cadastradas e dívidas */
  addContact: (input: Omit<Contact, 'id'>) => Promise<Contact>;
  saveContact: (contactId: string, input: Omit<Contact, 'id'>) => Promise<Contact>;
  removeContact: (contactId: string) => Promise<void>;
  addSplits: (inputs: Omit<Split, 'id'>[]) => Promise<Split[]>;
  replaceTransactionSplits: (
    transactionId: string,
    inputs: Omit<Split, 'id'>[],
  ) => Promise<Split[]>;
  removeSplit: (splitId: string) => Promise<void>;
  settleSplits: (splitIds: string[], transactionId: string, settledAt: string) => Promise<void>;
  reopenSplit: (splitId: string) => Promise<void>;
};

const FintrackContext = createContext<Store | null>(null);

const EMPTY_PREFERENCES: Preferences = {
  notifications: { transactions: true, invoices: true, goals: false, weeklySummary: true },
};

const EMPTY: Snapshot = {
  people: [],
  accounts: [],
  transactions: [],
  contacts: [],
  splits: [],
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
              accounts: applyTransaction(prev.snapshot.accounts, created, 1),
            },
          }
        : prev,
    );
    return created;
  }, []);

  const editTransaction = useCallback(
    async (transactionId: string, input: Omit<Transaction, 'id'>) => {
      const updated = await api.updateTransaction(transactionId, input);
      setState((prev) => {
        if (!prev.snapshot) return prev;
        const previous = prev.snapshot.transactions.find((t) => t.id === transactionId);
        // Desfaz o efeito do lançamento antigo antes de aplicar o novo: a conta,
        // o valor ou até o tipo podem ter mudado na edição.
        const reverted = previous
          ? applyTransaction(prev.snapshot.accounts, previous, -1)
          : prev.snapshot.accounts;
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            transactions: prev.snapshot.transactions.map((t) =>
              t.id === transactionId ? updated : t,
            ),
            accounts: applyTransaction(reverted, updated, 1),
          },
        };
      });
      return updated;
    },
    [],
  );

  const removeTransaction = useCallback(async (transactionId: string) => {
    await api.deleteTransaction(transactionId);
    setState((prev) => {
      if (!prev.snapshot) return prev;
      const previous = prev.snapshot.transactions.find((t) => t.id === transactionId);
      return {
        ...prev,
        snapshot: {
          ...prev.snapshot,
          transactions: prev.snapshot.transactions.filter((t) => t.id !== transactionId),
          accounts: previous
            ? applyTransaction(prev.snapshot.accounts, previous, -1)
            : prev.snapshot.accounts,
          // Cascata que o backend também faz: some a divisão que nasceu do
          // lançamento e reabre a dívida que ele tinha acertado.
          splits: prev.snapshot.splits
            .filter((split) => split.transactionId !== transactionId)
            .map((split) =>
              split.settlementTransactionId === transactionId
                ? { ...split, settlementTransactionId: undefined, settledAt: undefined }
                : split,
            ),
        },
      };
    });
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

  const addAccount = useCallback(
    async (input: Omit<Account, 'id'>) => {
      const account = await api.createAccount(input);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        accounts: [...snapshot.accounts, account],
      }));
      return account;
    },
    [patchSnapshot],
  );

  const saveAccount = useCallback(
    async (accountId: string, input: Omit<Account, 'id'>) => {
      const account = await api.updateAccount(accountId, input);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts.map((item) => (item.id === account.id ? account : item)),
      }));
      return account;
    },
    [patchSnapshot],
  );

  const removeAccount = useCallback(
    async (accountId: string) => {
      await api.deleteAccount(accountId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        accounts: snapshot.accounts.filter((item) => item.id !== accountId),
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

  const addContact = useCallback(
    async (input: Omit<Contact, 'id'>) => {
      const contact = await api.createContact(input);
      patchSnapshot((snapshot) => ({ ...snapshot, contacts: [...snapshot.contacts, contact] }));
      return contact;
    },
    [patchSnapshot],
  );

  const saveContact = useCallback(
    async (contactId: string, input: Omit<Contact, 'id'>) => {
      const contact = await api.updateContact(contactId, input);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        contacts: snapshot.contacts.map((item) => (item.id === contact.id ? contact : item)),
      }));
      return contact;
    },
    [patchSnapshot],
  );

  /** Excluir a pessoa leva junto as divisões dela (o backend faz o mesmo). */
  const removeContact = useCallback(
    async (contactId: string) => {
      await api.deleteContact(contactId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        contacts: snapshot.contacts.filter((item) => item.id !== contactId),
        splits: snapshot.splits.filter((split) => split.contactId !== contactId),
      }));
    },
    [patchSnapshot],
  );

  const addSplits = useCallback(
    async (inputs: Omit<Split, 'id'>[]) => {
      if (inputs.length === 0) return [];
      const splits = await api.createSplits(inputs);
      patchSnapshot((snapshot) => ({ ...snapshot, splits: [...snapshot.splits, ...splits] }));
      return splits;
    },
    [patchSnapshot],
  );

  /**
   * Regrava a divisão de um lançamento ao editá-lo: as pendentes são trocadas
   * pelas novas e as já acertadas ficam como estão — desfazer um acerto é uma
   * decisão à parte, na tela de Acertos.
   */
  const replaceTransactionSplits = useCallback(
    async (transactionId: string, inputs: Omit<Split, 'id'>[]) => {
      const previous = (stateRef.current.snapshot?.splits ?? []).filter(
        (split) => split.transactionId === transactionId && !split.settledAt,
      );
      for (const split of previous) {
        await api.deleteSplit(split.id);
      }
      const created = inputs.length > 0 ? await api.createSplits(inputs) : [];
      patchSnapshot((snapshot) => ({
        ...snapshot,
        splits: [
          ...snapshot.splits.filter((split) => !previous.some((old) => old.id === split.id)),
          ...created,
        ],
      }));
      return created;
    },
    [patchSnapshot],
  );

  const removeSplit = useCallback(
    async (splitId: string) => {
      await api.deleteSplit(splitId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        splits: snapshot.splits.filter((split) => split.id !== splitId),
      }));
    },
    [patchSnapshot],
  );

  const settleSplits = useCallback(
    async (splitIds: string[], transactionId: string, settledAt: string) => {
      await api.settleSplits(splitIds, transactionId, settledAt);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        splits: snapshot.splits.map((split) =>
          splitIds.includes(split.id)
            ? { ...split, settlementTransactionId: transactionId, settledAt }
            : split,
        ),
      }));
    },
    [patchSnapshot],
  );

  const reopenSplit = useCallback(
    async (splitId: string) => {
      await api.reopenSplit(splitId);
      patchSnapshot((snapshot) => ({
        ...snapshot,
        splits: snapshot.splits.map((split) =>
          split.id === splitId
            ? { ...split, settlementTransactionId: undefined, settledAt: undefined }
            : split,
        ),
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
      editTransaction,
      removeTransaction,
      chooseGoalQuote,
      sendInvite,
      updateProfile,
      changePassword,
      updatePreferences,
      updateMemberAccess,
      removeMember,
      setAccountShared,
      addAccount,
      saveAccount,
      removeAccount,
      resendInvite,
      cancelInvite,
      addContact,
      saveContact,
      removeContact,
      addSplits,
      replaceTransactionSplits,
      removeSplit,
      settleSplits,
      reopenSplit,
}),
    [
      state,
      signIn,
      signUp,
      signOut,
      addTransaction,
      editTransaction,
      removeTransaction,
      chooseGoalQuote,
      sendInvite,
      updateProfile,
      changePassword,
      updatePreferences,
      updateMemberAccess,
      removeMember,
      setAccountShared,
      addAccount,
      saveAccount,
      removeAccount,
      resendInvite,
      cancelInvite,
      addContact,
      saveContact,
      removeContact,
      addSplits,
      replaceTransactionSplits,
      removeSplit,
      settleSplits,
      reopenSplit,
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

/** Pessoas que a pessoa logada cadastrou para dividir contas. */
export function useContacts(): Contact[] {
  const { contacts } = useSnapshot();
  const person = useCurrentPerson();
  return useMemo(
    () => contacts.filter((contact) => contact.ownerId === person?.id),
    [contacts, person?.id],
  );
}

/** Divisões que envolvem a pessoa logada, já do ponto de vista dela. */
export function useLedger(): LedgerEntry[] {
  const { splits, contacts, people } = useSnapshot();
  const person = useCurrentPerson();
  return useMemo(
    () => splitLedger(splits, contacts, people, person?.id ?? null),
    [splits, contacts, people, person?.id],
  );
}
