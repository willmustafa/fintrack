/**
 * Modelo de domínio do FinTrack.
 *
 * Estes tipos são o contrato que o backend em Go deverá expor — os campos usam
 * os mesmos nomes esperados no JSON da API (ver `src/services/api.ts`).
 */

export type OwnerId = 'ana' | 'marcelo' | 'casal';

/** Acesso concedido a quem recebeu o compartilhamento. */
export type MemberAccess = 'total' | 'leitura';

export type Person = {
  id: OwnerId;
  name: string;
  initial: string;
  email: string;
  /** Acesso concedido ao compartilhar contas e cartões */
  access?: MemberAccess;
};

export type TransactionKind = 'gasto' | 'ganho' | 'transferencia' | 'aporte';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  description: string;
  /** Sempre positivo; o sinal é derivado de `kind`. */
  amount: number;
  category: string;
  accountId: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  ownerId: OwnerId;
  /** Preenchido em transferências: conta de destino */
  toAccountId?: string;
  recurring?: boolean;
  notes?: string;
};

/**
 * Pessoa com quem se divide contas. Não precisa usar o FinTrack — é só um nome
 * que a pessoa logada cadastra. Quando `personId` está preenchido, a pessoa
 * também tem conta no app e as divisões aparecem dos dois lados.
 */
export type Contact = {
  id: string;
  name: string;
  initial: string;
  /** Quem cadastrou o contato */
  ownerId: OwnerId;
  /** Membro do FinTrack por trás do nome, quando existe */
  personId?: OwnerId;
};

/** `a-receber`: a outra pessoa me deve. `a-pagar`: eu devo a ela. */
export type SplitDirection = 'a-receber' | 'a-pagar';

/**
 * Uma dívida entre quem registrou (`ownerId`) e um contato (`contactId`).
 *
 * Nasce de um lançamento dividido (`transactionId`) ou avulsa, e é quitada
 * apontando para o lançamento do acerto (`settlementTransactionId`).
 */
export type Split = {
  id: string;
  ownerId: OwnerId;
  contactId: string;
  direction: SplitDirection;
  description: string;
  /** Sempre positivo; quem deve a quem vem de `direction`. */
  amount: number;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Lançamento que originou a divisão — a conta que foi paga */
  transactionId?: string;
  /** Lançamento do acerto: o ganho ao receber, o gasto ao pagar */
  settlementTransactionId?: string;
  /** ISO date do acerto; ausente enquanto a divisão está em aberto */
  settledAt?: string;
};

export type AccountKind = 'corrente' | 'poupanca' | 'cartao' | 'investimento';

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  ownerId: OwnerId;
  /** Banco escolhido no seletor (ver `src/data/banks.ts`) */
  bank?: string;
  /** Cartões: limite total e fatura aberta */
  limit?: number;
  invoice?: number;
  closingDay?: number;
  dueDay?: number;
  brandColor?: string;
};

export type BudgetSlice = {
  key: 'essenciais' | 'outros' | 'investimentos';
  label: string;
  /** Percentual alvo do 50/30/20 */
  target: number;
  amount: number;
  color: string;
};

export type MonthSummary = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

export type InvestmentClass = 'renda-fixa' | 'acoes' | 'cripto';

export type Investment = {
  id: string;
  name: string;
  class: InvestmentClass;
  invested: number;
  current: number;
  ownerId: OwnerId;
};

export type GoalQuote = {
  id: string;
  title: string;
  vendor: string;
  amount: number;
  chosen?: boolean;
};

export type Goal = {
  id: string;
  name: string;
  /** Indefinido quando a meta ainda depende da escolha de um orçamento */
  target?: number;
  saved: number;
  /** ISO month (YYYY-MM) */
  deadline?: string;
  linkedInvestmentId?: string;
  quotes?: GoalQuote[];
};

export type LoanInstallment = {
  number: number;
  interest: number;
  amortization: number;
  balance: number;
};

export type Loan = {
  id: string;
  name: string;
  total: number;
  balance: number;
  downPayment: { ownerId: OwnerId; amount: number }[];
  paidByOwner: { ownerId: OwnerId; installments: number; amount: number }[];
  payoffDate: string;
  rate: string;
  paidInterest: number;
  amortized: number;
  installments: LoanInstallment[];
  /** Série do saldo devedor para o gráfico (ano, saldo) */
  balanceSeries: { year: number; balance: number }[];
};

export type Invite = {
  id: string;
  email: string;
  status: 'pendente' | 'aceito';
  sentDaysAgo: number;
  /** Contas, cartões e financiamentos que o convite libera */
  accountIds?: string[];
};

/** Preferências da pessoa logada — editadas em `perfil/notificacoes`. */
export type NotificationPreferences = {
  /** Cada lançamento novo feito por quem compartilha as contas */
  transactions: boolean;
  /** Fechamento e vencimento das faturas de cartão */
  invoices: boolean;
  /** Progresso de metas e estouro de orçamento */
  goals: boolean;
  /** Resumo de entradas e saídas toda segunda-feira */
  weeklySummary: boolean;
};

export type Preferences = {
  notifications: NotificationPreferences;
};

export type Session = {
  person: Person;
  token: string;
};

export type ProfileInput = {
  name: string;
  email: string;
};
