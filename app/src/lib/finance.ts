/**
 * Cálculos derivados exibidos no dashboard e nas listas.
 * São puros de propósito: quando o backend em Go passar a devolver os
 * agregados prontos, basta trocar as chamadas por campos da API.
 */

import { colors } from '@/theme/tokens';
import type { Account, BudgetSlice, Goal, Investment, Transaction } from '@/types';

export const REFERENCE_MONTH = '2024-05';

export const signOf = (t: Transaction): number => {
  switch (t.kind) {
    case 'ganho':
      return 1;
    case 'gasto':
    case 'aporte':
      return -1;
    default:
      return 0;
  }
};

export const signedAmount = (t: Transaction): number => signOf(t) * t.amount;

export const isInMonth = (iso: string, month: string) => iso.startsWith(month);

/**
 * Aplica o efeito de um lançamento nos saldos e faturas.
 *
 * `direction` 1 lança e -1 desfaz — é o que permite editar (desfaz o antigo,
 * aplica o novo) e excluir sem recarregar o snapshot inteiro.
 */
export function applyTransaction(
  accounts: Account[],
  transaction: Transaction,
  direction: 1 | -1,
): Account[] {
  return accounts.map((account) => {
    // Destino da transferência recebe o valor
    if (account.id === transaction.toAccountId) {
      return { ...account, balance: account.balance + direction * transaction.amount };
    }
    if (account.id !== transaction.accountId) return account;
    // Gasto no cartão vai para a fatura, não para um saldo
    if (account.kind === 'cartao') {
      return transaction.kind === 'gasto'
        ? { ...account, invoice: (account.invoice ?? 0) + direction * transaction.amount }
        : account;
    }
    const delta = transaction.kind === 'ganho' ? transaction.amount : -transaction.amount;
    return { ...account, balance: account.balance + direction * delta };
  });
}

export function consolidatedBalance(accounts: Account[]): number {
  return accounts
    .filter((a) => a.kind !== 'cartao')
    .reduce((total, account) => total + account.balance, 0);
}

export function openInvoices(accounts: Account[]): number {
  return accounts
    .filter((a) => a.kind === 'cartao')
    .reduce((total, account) => total + (account.invoice ?? 0), 0);
}

export function monthExpense(transactions: Transaction[], month = REFERENCE_MONTH): number {
  return transactions
    .filter((t) => t.kind === 'gasto' && isInMonth(t.date, month))
    .reduce((total, t) => total + t.amount, 0);
}

/** Tudo que saiu no mês: gastos + aportes (o "Gasto do mês" do dashboard). */
export function monthOutflow(transactions: Transaction[], month = REFERENCE_MONTH): number {
  return transactions
    .filter((t) => (t.kind === 'gasto' || t.kind === 'aporte') && isInMonth(t.date, month))
    .reduce((total, t) => total + t.amount, 0);
}

export function monthIncome(transactions: Transaction[], month = REFERENCE_MONTH): number {
  return transactions
    .filter((t) => t.kind === 'ganho' && isInMonth(t.date, month))
    .reduce((total, t) => total + t.amount, 0);
}

const ESSENTIAL_CATEGORIES = ['Essenciais', 'Moradia', 'Transporte', 'Saúde', 'Mercado'];

/**
 * Regra 50/30/20: essenciais, outros (estilo de vida) e investimentos.
 * Os aportes entram na fatia de investimentos.
 */
export function budgetSlices(
  transactions: Transaction[],
  month = REFERENCE_MONTH,
): BudgetSlice[] {
  const inMonth = transactions.filter((t) => isInMonth(t.date, month));
  const essenciais = inMonth
    .filter((t) => t.kind === 'gasto' && ESSENTIAL_CATEGORIES.includes(t.category))
    .reduce((total, t) => total + t.amount, 0);
  const outros = inMonth
    .filter((t) => t.kind === 'gasto' && !ESSENTIAL_CATEGORIES.includes(t.category))
    .reduce((total, t) => total + t.amount, 0);
  const investimentos = inMonth
    .filter((t) => t.kind === 'aporte')
    .reduce((total, t) => total + t.amount, 0);

  return [
    { key: 'essenciais', label: 'Essenciais', target: 50, amount: essenciais, color: colors.accent },
    { key: 'outros', label: 'Outros', target: 30, amount: outros, color: colors.placeholder },
    {
      key: 'investimentos',
      label: 'Investimentos',
      target: 20,
      amount: investimentos,
      color: colors.text,
    },
  ];
}

/** Valor alvo de cada fatia do 50/30/20 sobre a receita do mês. */
export function budgetTargets(income: number): { key: BudgetSlice['key']; amount: number }[] {
  return [
    { key: 'essenciais', amount: income * 0.5 },
    { key: 'outros', amount: income * 0.3 },
    { key: 'investimentos', amount: income * 0.2 },
  ];
}

export function investmentTotals(investments: Investment[]) {
  const invested = investments.reduce((total, i) => total + i.invested, 0);
  const current = investments.reduce((total, i) => total + i.current, 0);
  return {
    invested,
    current,
    profit: current - invested,
    yieldPercent: invested === 0 ? 0 : ((current - invested) / invested) * 100,
  };
}

export const investmentYield = (investment: Investment): number =>
  investment.invested === 0
    ? 0
    : ((investment.current - investment.invested) / investment.invested) * 100;

export const goalProgress = (goal: Goal): number =>
  goal.target && goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0;

export function groupByDay(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const t of [...transactions].sort((a, b) => b.date.localeCompare(a.date))) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return [...map.entries()];
}

/** Saldo acumulado (extrato "running balance" da variação V3 do wireframe). */
export function runningBalances(
  transactions: Transaction[],
  startingBalance: number,
): Map<string, number> {
  const ordered = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const result = new Map<string, number>();
  let balance = startingBalance;
  for (const t of ordered) {
    result.set(t.id, balance);
    balance -= signedAmount(t);
  }
  return result;
}
