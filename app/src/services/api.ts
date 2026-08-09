/**
 * Camada de acesso a dados.
 *
 * Hoje tudo é resolvido em memória a partir de `src/data/seed.ts`. Quando o
 * backend em Go existir, basta definir `EXPO_PUBLIC_API_URL` no `.env` — as
 * funções abaixo passam a falar HTTP e o resto do app não muda, porque só
 * conhecem os tipos de `src/types`.
 */

import * as seed from '@/data/seed';
import type {
  Account,
  Goal,
  Investment,
  Invite,
  Loan,
  MemberAccess,
  Person,
  Preferences,
  ProfileInput,
  Session,
  Transaction,
} from '@/types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** `true` enquanto o backend em Go não estiver publicado. */
export const isMockMode = API_BASE_URL.length === 0;

const latency = <T>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/** Erro de negócio devolvido pela API (mensagem já pronta para a tela). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `${response.status} ${response.statusText}`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Pessoa logada enquanto o app roda com dados de exemplo. `signIn`/`signUp`
 * atualizam esta referência para que `updateProfile` tenha o que alterar.
 */
let mockPerson: Person = seed.currentPerson;

export type Snapshot = {
  people: Person[];
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  goals: Goal[];
  loans: Loan[];
  invites: Invite[];
  preferences: Preferences;
};

export const api = {
  async signIn(email: string, _password: string): Promise<Session> {
    if (isMockMode) {
      mockPerson = seed.people.find((p) => p.email === email) ?? seed.currentPerson;
      return latency({ person: mockPerson, token: 'mock-token' });
    }
    return request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: _password }),
    });
  },

  async signUp(name: string, email: string, _password: string): Promise<Session> {
    if (isMockMode) {
      mockPerson = {
        id: 'ana',
        name,
        initial: name.trim().charAt(0).toUpperCase() || 'A',
        email,
        access: 'total',
      };
      return latency({ person: mockPerson, token: 'mock-token' });
    }
    return request<Session>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: _password }),
    });
  },

  async snapshot(): Promise<Snapshot> {
    if (isMockMode) {
      return latency({
        people: seed.people,
        accounts: seed.accounts,
        transactions: seed.transactions,
        investments: seed.investments,
        goals: seed.goals,
        loans: seed.loans,
        invites: seed.invites,
        preferences: seed.preferences,
      });
    }
    return request<Snapshot>('/snapshot');
  },

  async updateProfile(input: ProfileInput): Promise<Person> {
    if (isMockMode) {
      mockPerson = {
        ...mockPerson,
        name: input.name,
        email: input.email,
        initial: input.name.trim().charAt(0).toUpperCase() || mockPerson.initial,
      };
      return latency(mockPerson, 160);
    }
    return request<Person>('/me', { method: 'PATCH', body: JSON.stringify(input) });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (isMockMode) {
      if (currentPassword === newPassword) {
        throw new ApiError('A nova senha precisa ser diferente da atual.', 422);
      }
      await latency(null, 260);
      return;
    }
    await request<void>('/me/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updatePreferences(preferences: Preferences): Promise<Preferences> {
    if (isMockMode) {
      return latency(preferences, 140);
    }
    return request<Preferences>('/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  async updateMemberAccess(personId: string, access: MemberAccess): Promise<Person> {
    if (isMockMode) {
      const person = seed.people.find((p) => p.id === personId);
      if (!person) throw new ApiError('Pessoa não encontrada.', 404);
      return latency({ ...person, access }, 160);
    }
    return request<Person>(`/members/${personId}`, {
      method: 'PATCH',
      body: JSON.stringify({ access }),
    });
  },

  async removeMember(personId: string): Promise<void> {
    if (isMockMode) {
      await latency(null, 200);
      return;
    }
    await request<void>(`/members/${personId}`, { method: 'DELETE' });
  },

  async setAccountShared(accountId: string, shared: boolean): Promise<Account> {
    if (isMockMode) {
      const account = seed.accounts.find((item) => item.id === accountId);
      if (!account) throw new ApiError('Conta não encontrada.', 404);
      return latency({ ...account, ownerId: shared ? 'casal' : mockPerson.id }, 160);
    }
    return request<Account>(`/accounts/${accountId}/sharing`, {
      method: 'PUT',
      body: JSON.stringify({ shared }),
    });
  },

  async createTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (isMockMode) {
      return latency({ ...input, id: `t${Date.now()}` }, 120);
    }
    return request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async chooseGoalQuote(goalId: string, quoteId: string): Promise<Goal> {
    if (isMockMode) {
      const goal = seed.goals.find((g) => g.id === goalId)!;
      const quote = goal.quotes?.find((q) => q.id === quoteId);
      return latency(
        {
          ...goal,
          target: quote?.amount ?? goal.target,
          quotes: goal.quotes?.map((q) => ({ ...q, chosen: q.id === quoteId })),
        },
        120,
      );
    }
    return request<Goal>(`/goals/${goalId}/quote`, {
      method: 'POST',
      body: JSON.stringify({ quoteId }),
    });
  },

  async sendInvite(email: string, accountIds: string[]): Promise<Invite> {
    if (isMockMode) {
      return latency(
        { id: `inv${Date.now()}`, email, status: 'pendente', sentDaysAgo: 0, accountIds },
        160,
      );
    }
    return request<Invite>('/invites', {
      method: 'POST',
      body: JSON.stringify({ email, accountIds }),
    });
  },

  async resendInvite(inviteId: string): Promise<Invite> {
    if (isMockMode) {
      const invite = seed.invites.find((item) => item.id === inviteId);
      return latency(
        { ...(invite ?? { id: inviteId, email: '', status: 'pendente' as const }), sentDaysAgo: 0 },
        200,
      );
    }
    return request<Invite>(`/invites/${inviteId}/resend`, { method: 'POST' });
  },

  async cancelInvite(inviteId: string): Promise<void> {
    if (isMockMode) {
      await latency(null, 180);
      return;
    }
    await request<void>(`/invites/${inviteId}`, { method: 'DELETE' });
  },
};
