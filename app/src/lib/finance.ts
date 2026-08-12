/**
 * Cálculos derivados exibidos no dashboard e nas listas.
 * São puros de propósito: quando o backend em Go passar a devolver os
 * agregados prontos, basta trocar as chamadas por campos da API.
 */

import { parseMonthLong } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type {
  Account,
  BudgetSlice,
  Contact,
  Goal,
  Investment,
  Loan,
  OwnerId,
  Person,
  Split,
  SplitDirection,
  Transaction,
  TransactionKind,
} from '@/types';

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

/**
 * Metas mais próximas de concluir, da mais adiantada para a menos.
 * Fica de fora quem ainda não tem alvo (depende de orçamento) e quem já fechou.
 */
export function goalsClosestToDone(goals: Goal[], limit = 3): Goal[] {
  return goals
    .filter((goal) => goal.target !== undefined && goal.target > 0 && goal.saved < goal.target)
    .sort((a, b) => goalProgress(b) - goalProgress(a))
    .slice(0, limit);
}

/** Meses de `fromMonth` até `toMonth` (`YYYY-MM`); nunca negativo. */
export function monthsBetween(fromMonth: string, toMonth: string): number {
  const [fromYear, from] = fromMonth.split('-').map(Number);
  const [toYear, to] = toMonth.split('-').map(Number);
  return Math.max((toYear - fromYear) * 12 + (to - from), 0);
}

/** Quantos meses faltam para quitar — `payoffDate` chega como `mar/2044`. */
export function monthsToPayoff(loan: Loan, fromMonth = REFERENCE_MONTH): number {
  const payoff = parseMonthLong(loan.payoffDate);
  return payoff ? monthsBetween(fromMonth, payoff) : 0;
}

/** Fatia já quitada do financiamento, de 0 a 1. */
export const loanPaidRatio = (loan: Loan): number =>
  loan.total > 0 ? (loan.total - loan.balance) / loan.total : 0;

/* ------------------------------------------------------------------ *
 * Divisão de contas (Acertos)
 * ------------------------------------------------------------------ */

/**
 * Uma divisão vista pela pessoa logada.
 *
 * `direction` já vem do ponto de vista de quem está no app: a divisão que o
 * Marcelo registrou como "a Ana me deve" chega aqui, no app da Ana, como
 * `a-pagar` e `mirrored: true`.
 */
export type LedgerEntry = {
  split: Split;
  direction: SplitDirection;
  /** Chave da contraparte — id do contato, ou `pessoa-<id>` sem contato cadastrado */
  counterpartId: string;
  counterpartName: string;
  /** Veio do app de quem compartilha contas comigo */
  mirrored: boolean;
  settled: boolean;
};

export type CounterpartBalance = {
  id: string;
  name: string;
  /** Saldo em aberto: positivo te devem, negativo você deve */
  net: number;
  toReceive: number;
  toPay: number;
  open: LedgerEntry[];
  settled: LedgerEntry[];
};

const invert = (direction: SplitDirection): SplitDirection =>
  direction === 'a-receber' ? 'a-pagar' : 'a-receber';

/** O acerto de quem tem a receber entra como ganho; de quem deve, como gasto. */
export const settlementKind = (direction: SplitDirection): TransactionKind =>
  direction === 'a-receber' ? 'ganho' : 'gasto';

/** Categoria dos lançamentos criados ao acertar uma divisão. */
export const SETTLEMENT_CATEGORY = 'Acerto';

/**
 * Divisões que envolvem a pessoa logada, normalizadas para o ponto de vista
 * dela: as que ela registrou e as que alguém registrou apontando para ela.
 */
export function splitLedger(
  splits: Split[],
  contacts: Contact[],
  people: Person[],
  personId: OwnerId | null,
): LedgerEntry[] {
  if (!personId) return [];

  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  /** Contato que a pessoa logada cadastrou para um membro do app. */
  const myContactFor = (memberId: OwnerId) =>
    contacts.find((contact) => contact.ownerId === personId && contact.personId === memberId);

  const entries: LedgerEntry[] = [];
  for (const split of splits) {
    const settled = Boolean(split.settledAt || split.settlementTransactionId);
    const contact = contactById.get(split.contactId);

    if (split.ownerId === personId) {
      entries.push({
        split,
        direction: split.direction,
        counterpartId: split.contactId,
        counterpartName: contact?.name ?? 'Sem nome',
        mirrored: false,
        settled,
      });
      continue;
    }

    // Registrada por quem compartilha contas comigo, apontando para mim:
    // a dívida é a mesma, só que do outro lado.
    if (contact?.personId === personId) {
      const mine = myContactFor(split.ownerId);
      entries.push({
        split,
        direction: invert(split.direction),
        counterpartId: mine?.id ?? `pessoa-${split.ownerId}`,
        counterpartName:
          mine?.name ?? people.find((person) => person.id === split.ownerId)?.name ?? 'Sem nome',
        mirrored: true,
        settled,
      });
    }
  }

  return entries.sort((a, b) => b.split.date.localeCompare(a.split.date));
}

/** Só o que ainda não foi acertado. */
export const openEntries = (entries: LedgerEntry[]): LedgerEntry[] =>
  entries.filter((entry) => !entry.settled);

/** Quanto tenho a receber, a pagar e o líquido — apenas divisões em aberto. */
export function splitTotals(entries: LedgerEntry[]) {
  const toReceive = openEntries(entries)
    .filter((entry) => entry.direction === 'a-receber')
    .reduce((total, entry) => total + entry.split.amount, 0);
  const toPay = openEntries(entries)
    .filter((entry) => entry.direction === 'a-pagar')
    .reduce((total, entry) => total + entry.split.amount, 0);
  return { toReceive, toPay, net: toReceive - toPay };
}

/** Agrupa por contraparte, do maior saldo em aberto para o menor. */
export function ledgerBalances(entries: LedgerEntry[]): CounterpartBalance[] {
  const groups = new Map<string, CounterpartBalance>();

  for (const entry of entries) {
    const group = groups.get(entry.counterpartId) ?? {
      id: entry.counterpartId,
      name: entry.counterpartName,
      net: 0,
      toReceive: 0,
      toPay: 0,
      open: [],
      settled: [],
    };
    if (entry.settled) {
      group.settled.push(entry);
    } else {
      group.open.push(entry);
      if (entry.direction === 'a-receber') group.toReceive += entry.split.amount;
      else group.toPay += entry.split.amount;
      group.net = group.toReceive - group.toPay;
    }
    groups.set(entry.counterpartId, group);
  }

  return [...groups.values()].sort(
    (a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name),
  );
}

/**
 * Divide um valor em partes iguais sem perder centavos: a sobra do
 * arredondamento vai para as primeiras partes (R$ 10 em 3 → 3,34 · 3,33 · 3,33).
 */
export function equalShares(amount: number, parts: number): number[] {
  if (parts <= 0) return [];
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / parts);
  const rest = cents - base * parts;
  return Array.from({ length: parts }, (_, index) => (base + (index < rest ? 1 : 0)) / 100);
}

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
