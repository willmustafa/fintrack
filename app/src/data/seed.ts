/**
 * Dados de exemplo com os mesmos números do board de wireframes.
 * Serão substituídos pelas respostas do backend em Go (ver `services/api.ts`).
 */

import { ownerColors } from '@/theme/tokens';
import type {
  Account,
  Contact,
  Goal,
  Investment,
  Invite,
  Loan,
  MonthSummary,
  Person,
  Preferences,
  Split,
  Transaction,
} from '@/types';

export const people: Person[] = [
  { id: 'ana', name: 'Ana Ribeiro', initial: 'A', email: 'ana@email.com', access: 'total' },
  {
    id: 'marcelo',
    name: 'Marcelo Souza',
    initial: 'M',
    email: 'marcelo@email.com',
    access: 'total',
  },
  { id: 'casal', name: 'Casal', initial: 'C', email: 'casal@email.com' },
];

export const currentPerson = people[0];

export const accounts: Account[] = [
  { id: 'corrente', name: 'Conta corrente conjunta', kind: 'corrente', balance: 2620, ownerId: 'casal', bank: 'bb' },
  { id: 'poupanca', name: 'Poupança', kind: 'poupanca', balance: 1430, ownerId: 'casal', bank: 'caixa' },
  {
    id: 'nubank',
    name: 'Nubank (casal)',
    kind: 'cartao',
    balance: 0,
    ownerId: 'casal',
    bank: 'nubank',
    limit: 6000,
    invoice: 830,
    closingDay: 28,
    dueDay: 5,
    brandColor: '#8a05be',
  },
  {
    id: 'inter',
    name: 'Inter Gold',
    kind: 'cartao',
    balance: 0,
    ownerId: 'marcelo',
    bank: 'inter',
    limit: 3500,
    invoice: 420,
    closingDay: 20,
    dueDay: 28,
    brandColor: '#ff7a00',
  },
];

/**
 * Maio/2024 fecha exatamente com os números do board:
 * entradas R$ 5.000 · saídas R$ 2.380 (gastos R$ 1.904 + aportes R$ 476),
 * divididas em 50% essenciais (R$ 1.190), 30% outros (R$ 714) e 20% investimentos (R$ 476).
 */
export const transactions: Transaction[] = [
  {
    id: 't1',
    kind: 'gasto',
    description: 'Ônibus Trabalho',
    amount: 8.6,
    category: 'Transporte',
    accountId: 'nubank',
    date: '2024-05-24',
    ownerId: 'marcelo',
  },
  {
    id: 't2',
    kind: 'gasto',
    description: 'Mercado',
    amount: 156.3,
    category: 'Essenciais',
    accountId: 'nubank',
    date: '2024-05-24',
    ownerId: 'casal',
  },
  {
    id: 't3',
    kind: 'ganho',
    description: 'Salário',
    amount: 4200,
    category: 'Receita',
    accountId: 'corrente',
    date: '2024-05-23',
    ownerId: 'ana',
  },
  {
    id: 't4',
    kind: 'gasto',
    description: 'Netflix',
    amount: 39.9,
    category: 'Assinatura',
    accountId: 'nubank',
    date: '2024-05-23',
    ownerId: 'casal',
    recurring: true,
  },
  {
    id: 't5',
    kind: 'transferencia',
    description: 'Transferência',
    amount: 500,
    category: 'Transferência',
    accountId: 'corrente',
    toAccountId: 'poupanca',
    date: '2024-05-22',
    ownerId: 'ana',
  },
  {
    id: 't6',
    kind: 'gasto',
    description: 'Farmácia',
    amount: 74.2,
    category: 'Saúde',
    accountId: 'nubank',
    date: '2024-05-21',
    ownerId: 'marcelo',
  },
  {
    id: 't7',
    kind: 'aporte',
    description: 'Aporte Tesouro Selic',
    amount: 300,
    category: 'Investimentos',
    accountId: 'corrente',
    date: '2024-05-20',
    ownerId: 'ana',
  },
  {
    id: 't8',
    kind: 'gasto',
    description: 'Restaurante',
    amount: 128.4,
    category: 'Outros',
    accountId: 'inter',
    date: '2024-05-19',
    ownerId: 'casal',
  },
  {
    id: 't9',
    kind: 'gasto',
    description: 'Aluguel',
    amount: 850,
    category: 'Moradia',
    accountId: 'corrente',
    date: '2024-05-10',
    ownerId: 'casal',
    recurring: true,
  },
  {
    id: 't10',
    kind: 'gasto',
    description: 'Conta de luz',
    amount: 100.9,
    category: 'Moradia',
    accountId: 'corrente',
    date: '2024-05-12',
    ownerId: 'ana',
    recurring: true,
  },
  {
    id: 't11',
    kind: 'gasto',
    description: 'Cinema',
    amount: 60,
    category: 'Lazer',
    accountId: 'inter',
    date: '2024-05-11',
    ownerId: 'casal',
  },
  {
    id: 't12',
    kind: 'gasto',
    description: 'Roupas',
    amount: 285.7,
    category: 'Compras',
    accountId: 'nubank',
    date: '2024-05-08',
    ownerId: 'ana',
  },
  {
    id: 't13',
    kind: 'gasto',
    description: 'Padaria do mês',
    amount: 200,
    category: 'Outros',
    accountId: 'nubank',
    date: '2024-05-06',
    ownerId: 'marcelo',
  },
  {
    id: 't14',
    kind: 'ganho',
    description: 'Freelance',
    amount: 800,
    category: 'Receita',
    accountId: 'corrente',
    date: '2024-05-05',
    ownerId: 'marcelo',
  },
  {
    id: 't15',
    kind: 'aporte',
    description: 'Aporte Bitcoin',
    amount: 176,
    category: 'Investimentos',
    accountId: 'corrente',
    date: '2024-05-03',
    ownerId: 'marcelo',
  },
  // Abril de propósito: é o acerto de uma divisão antiga (`sp3`) e não pode
  // entrar nos números de maio fixados acima.
  {
    id: 't16',
    kind: 'ganho',
    description: 'Acerto · Camila',
    amount: 64.2,
    category: 'Acerto',
    accountId: 'corrente',
    date: '2024-04-28',
    ownerId: 'ana',
  },
];

/** Pessoas com quem se divide contas — nomes avulsos ou membros do app. */
export const contacts: Contact[] = [
  { id: 'c1', name: 'João Pedro', initial: 'J', ownerId: 'ana' },
  { id: 'c2', name: 'Camila', initial: 'C', ownerId: 'ana' },
  { id: 'c3', name: 'Marcelo Souza', initial: 'M', ownerId: 'ana', personId: 'marcelo' },
  { id: 'c4', name: 'Ana Ribeiro', initial: 'A', ownerId: 'marcelo', personId: 'ana' },
];

/**
 * Divisões da Ana: o mercado rachado com João e Camila, um Uber que ela deve
 * ao João e um rodízio já acertado. `sp5` é do Marcelo e aparece no app dela
 * pelo outro lado, porque o contato `c4` aponta para a conta da Ana.
 */
export const splits: Split[] = [
  {
    id: 'sp1',
    ownerId: 'ana',
    contactId: 'c1',
    direction: 'a-receber',
    description: 'Mercado',
    amount: 52.1,
    date: '2024-05-24',
    transactionId: 't2',
  },
  {
    id: 'sp2',
    ownerId: 'ana',
    contactId: 'c2',
    direction: 'a-receber',
    description: 'Mercado',
    amount: 52.1,
    date: '2024-05-24',
    transactionId: 't2',
  },
  {
    id: 'sp3',
    ownerId: 'ana',
    contactId: 'c2',
    direction: 'a-receber',
    description: 'Rodízio de aniversário',
    amount: 64.2,
    date: '2024-04-20',
    settlementTransactionId: 't16',
    settledAt: '2024-04-28',
  },
  {
    id: 'sp4',
    ownerId: 'ana',
    contactId: 'c1',
    direction: 'a-pagar',
    description: 'Uber do aeroporto',
    amount: 45,
    date: '2024-05-18',
  },
  {
    id: 'sp5',
    ownerId: 'marcelo',
    contactId: 'c4',
    direction: 'a-receber',
    description: 'Padaria do mês',
    amount: 100,
    date: '2024-05-06',
    transactionId: 't13',
  },
];

/** Receitas × gastos das últimas 6 semanas (card do dashboard). */
export const weeklySummary: MonthSummary[] = [
  { month: '2024-W16', label: 'S1', income: 1400, expense: 900 },
  { month: '2024-W17', label: 'S2', income: 1200, expense: 1100 },
  { month: '2024-W18', label: 'S3', income: 1700, expense: 800 },
  { month: '2024-W19', label: 'S4', income: 1100, expense: 1300 },
  { month: '2024-W20', label: 'S5', income: 1560, expense: 1000 },
  { month: '2024-W21', label: 'S6', income: 1900, expense: 1200 },
];

/** Saldo consolidado das últimas 7 semanas (sparkline do card de saldo). */
export const balanceSeries = [1540, 2230, 1860, 2760, 2350, 3320, 4050];

export const investments: Investment[] = [
  { id: 'i1', name: 'Tesouro Selic', class: 'renda-fixa', invested: 8000, current: 8640, ownerId: 'ana' },
  { id: 'i2', name: 'CDB Banco X', class: 'renda-fixa', invested: 5000, current: 5450, ownerId: 'marcelo' },
  { id: 'i3', name: 'PETR4', class: 'acoes', invested: 3500, current: 4100, ownerId: 'casal' },
  { id: 'i4', name: 'Bitcoin', class: 'cripto', invested: 2000, current: 3150, ownerId: 'marcelo' },
];

/** Evolução do patrimônio investido (dez → mai). */
export const investmentSeries = [
  { label: 'Dez', value: 17200 },
  { label: 'Jan', value: 17900 },
  { label: 'Fev', value: 18400 },
  { label: 'Mar', value: 19300 },
  { label: 'Abr', value: 20100 },
  { label: 'Mai', value: 21340 },
];

export const goals: Goal[] = [
  {
    id: 'g1',
    name: 'Viagem Japão',
    target: 12000,
    saved: 9800,
    deadline: '2024-12',
    linkedInvestmentId: 'i1',
  },
  { id: 'g2', name: 'Reserva de emergência', target: 10000, saved: 6000 },
  { id: 'g3', name: 'Notebook', target: 4000, saved: 1200, deadline: '2024-08' },
  {
    id: 'g4',
    name: 'Sofá novo',
    saved: 0,
    quotes: [
      { id: 'q1', title: 'Sofá retrátil 3L', vendor: 'Etna', amount: 2850, chosen: true },
      { id: 'q2', title: 'Sofá modular cinza', vendor: 'Tok&Stok', amount: 3200 },
      { id: 'q3', title: 'Sofá sob medida', vendor: 'Madeira Boa Marcenaria', amount: 3600 },
    ],
  },
];

export const loans: Loan[] = [
  {
    id: 'l1',
    name: 'Casa · Jardim das Flores',
    total: 450000,
    balance: 312400,
    downPayment: [
      { ownerId: 'ana', amount: 40000 },
      { ownerId: 'marcelo', amount: 30000 },
    ],
    paidByOwner: [
      { ownerId: 'ana', installments: 42, amount: 58800 },
      { ownerId: 'marcelo', installments: 42, amount: 44100 },
    ],
    payoffDate: 'mar/2044',
    rate: 'TR + 9,8% a.a.',
    paidInterest: 61200,
    amortized: 76400,
    installments: [
      { number: 84, interest: 1480, amortization: 1020, balance: 312400 },
      { number: 85, interest: 1474, amortization: 1026, balance: 311374 },
      { number: 86, interest: 1469, amortization: 1031, balance: 310343 },
      { number: 87, interest: 1463, amortization: 1037, balance: 309306 },
      { number: 88, interest: 1458, amortization: 1042, balance: 308264 },
    ],
    balanceSeries: [
      { year: 2018, balance: 380000 },
      { year: 2024, balance: 312400 },
      { year: 2031, balance: 205000 },
      { year: 2038, balance: 96000 },
      { year: 2044, balance: 0 },
    ],
  },
];

export const invites: Invite[] = [
  {
    id: 'inv1',
    email: 'joana@email.com',
    status: 'pendente',
    sentDaysAgo: 2,
    accountIds: ['corrente'],
  },
];

export const preferences: Preferences = {
  notifications: {
    transactions: true,
    invoices: true,
    goals: false,
    weeklySummary: true,
  },
};

export const inviteLink = 'fintrack.app/convite/8x2fq';

export const ownerColorFor = (ownerId: keyof typeof ownerColors) => ownerColors[ownerId];
