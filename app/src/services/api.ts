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
  Person,
  Session,
  Transaction,
} from '@/types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** `true` enquanto o backend em Go não estiver publicado. */
export const isMockMode = API_BASE_URL.length === 0;

const latency = <T>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} em ${path}`);
  }
  return (await response.json()) as T;
}

export type Snapshot = {
  people: Person[];
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  goals: Goal[];
  loans: Loan[];
  invites: Invite[];
};

export const api = {
  async signIn(email: string, _password: string): Promise<Session> {
    if (isMockMode) {
      const person = seed.people.find((p) => p.email === email) ?? seed.currentPerson;
      return latency({ person, token: 'mock-token' });
    }
    return request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: _password }),
    });
  },

  async signUp(name: string, email: string, _password: string): Promise<Session> {
    if (isMockMode) {
      const person: Person = {
        id: 'ana',
        name,
        initial: name.trim().charAt(0).toUpperCase() || 'A',
        email,
        access: 'total',
      };
      return latency({ person, token: 'mock-token' });
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
      });
    }
    return request<Snapshot>('/snapshot');
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
      return latency({ id: `inv${Date.now()}`, email, status: 'pendente', sentDaysAgo: 0 }, 160);
    }
    return request<Invite>('/invites', {
      method: 'POST',
      body: JSON.stringify({ email, accountIds }),
    });
  },
};
