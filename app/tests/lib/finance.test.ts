import * as seed from '@/data/seed';
import {
  REFERENCE_MONTH,
  applyTransaction,
  equalShares,
  ledgerBalances,
  openEntries,
  settlementKind,
  splitLedger,
  splitTotals,
  budgetSlices,
  budgetTargets,
  consolidatedBalance,
  goalProgress,
  goalsClosestToDone,
  groupByDay,
  investmentTotals,
  investmentYield,
  isInMonth,
  loanPaidRatio,
  monthExpense,
  monthIncome,
  monthOutflow,
  monthsBetween,
  monthsToPayoff,
  openInvoices,
  runningBalances,
  signOf,
  signedAmount,
} from '@/lib/finance';
import type {
  Account,
  Contact,
  Goal,
  Investment,
  Loan,
  Person,
  Split,
  Transaction,
} from '@/types';

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't',
  kind: 'gasto',
  description: 'Item',
  amount: 100,
  category: 'Outros',
  accountId: 'corrente',
  date: '2024-05-10',
  ownerId: 'ana',
  ...over,
});

const account = (over: Partial<Account> = {}): Account => ({
  id: 'a',
  name: 'Conta',
  kind: 'corrente',
  balance: 0,
  ownerId: 'ana',
  ...over,
});

describe('signOf / signedAmount', () => {
  it('ganho é positivo', () => {
    expect(signOf(tx({ kind: 'ganho' }))).toBe(1);
    expect(signedAmount(tx({ kind: 'ganho', amount: 4200 }))).toBe(4200);
  });

  it('gasto e aporte são negativos', () => {
    expect(signOf(tx({ kind: 'gasto' }))).toBe(-1);
    expect(signOf(tx({ kind: 'aporte' }))).toBe(-1);
    expect(signedAmount(tx({ kind: 'gasto', amount: 156.3 }))).toBe(-156.3);
    expect(signedAmount(tx({ kind: 'aporte', amount: 300 }))).toBe(-300);
  });

  it('transferência é neutra — não muda o consolidado', () => {
    expect(signOf(tx({ kind: 'transferencia' }))).toBe(0);
    expect(signedAmount(tx({ kind: 'transferencia', amount: 500 }))).toBe(0);
  });
});

describe('isInMonth', () => {
  it('compara pelo prefixo YYYY-MM', () => {
    expect(isInMonth('2024-05-24', '2024-05')).toBe(true);
    expect(isInMonth('2024-06-01', '2024-05')).toBe(false);
    expect(isInMonth('2023-05-24', '2024-05')).toBe(false);
  });
});

describe('consolidatedBalance', () => {
  it('soma contas e ignora cartões', () => {
    expect(
      consolidatedBalance([
        account({ id: '1', balance: 2620 }),
        account({ id: '2', kind: 'poupanca', balance: 1430 }),
        account({ id: '3', kind: 'cartao', balance: 0, invoice: 830 }),
      ]),
    ).toBe(4050);
  });

  it('soma saldos negativos', () => {
    expect(consolidatedBalance([account({ balance: -200 }), account({ balance: 100 })])).toBe(-100);
  });

  it('lista vazia dá zero', () => {
    expect(consolidatedBalance([])).toBe(0);
  });

  it('bate com o seed (R$ 4.050 do board)', () => {
    expect(consolidatedBalance(seed.accounts)).toBe(4050);
  });
});

describe('openInvoices', () => {
  it('soma só as faturas dos cartões', () => {
    expect(openInvoices(seed.accounts)).toBe(1250);
  });

  it('cartão sem fatura conta como zero', () => {
    expect(openInvoices([account({ kind: 'cartao' })])).toBe(0);
  });

  it('lista sem cartões dá zero', () => {
    expect(openInvoices([account()])).toBe(0);
  });
});

describe('applyTransaction', () => {
  const corrente = account({ id: 'corrente', balance: 1000 });
  const poupanca = account({ id: 'poupanca', kind: 'poupanca', balance: 500 });
  const cartao = account({ id: 'nubank', kind: 'cartao', balance: 0, invoice: 800 });
  const contas = [corrente, poupanca, cartao];

  const saldo = (lista: Account[], id: string) => lista.find((a) => a.id === id)!.balance;
  const fatura = (lista: Account[], id: string) => lista.find((a) => a.id === id)!.invoice;

  it('gasto desconta do saldo e desfazer devolve', () => {
    const depois = applyTransaction(contas, tx({ amount: 250 }), 1);
    expect(saldo(depois, 'corrente')).toBe(750);
    expect(saldo(applyTransaction(depois, tx({ amount: 250 }), -1), 'corrente')).toBe(1000);
  });

  it('ganho soma no saldo', () => {
    expect(saldo(applyTransaction(contas, tx({ kind: 'ganho', amount: 200 }), 1), 'corrente')).toBe(
      1200,
    );
  });

  it('aporte sai do saldo', () => {
    expect(saldo(applyTransaction(contas, tx({ kind: 'aporte', amount: 300 }), 1), 'corrente')).toBe(
      700,
    );
  });

  it('gasto no cartão mexe na fatura, não no saldo', () => {
    const depois = applyTransaction(contas, tx({ accountId: 'nubank', amount: 150 }), 1);
    expect(fatura(depois, 'nubank')).toBe(950);
    expect(saldo(depois, 'nubank')).toBe(0);
  });

  it('desfazer um gasto de cartão abate a fatura', () => {
    const lancamento = tx({ accountId: 'nubank', amount: 150 });
    expect(fatura(applyTransaction(contas, lancamento, -1), 'nubank')).toBe(650);
  });

  it('ganho lançado num cartão não altera nada', () => {
    const depois = applyTransaction(contas, tx({ kind: 'ganho', accountId: 'nubank' }), 1);
    expect(fatura(depois, 'nubank')).toBe(800);
    expect(saldo(depois, 'nubank')).toBe(0);
  });

  it('transferência tira da origem e põe no destino', () => {
    const depois = applyTransaction(
      contas,
      tx({ kind: 'transferencia', amount: 200, toAccountId: 'poupanca' }),
      1,
    );
    expect(saldo(depois, 'corrente')).toBe(800);
    expect(saldo(depois, 'poupanca')).toBe(700);
  });

  it('não toca nas contas fora do lançamento', () => {
    const depois = applyTransaction(contas, tx(), 1);
    expect(saldo(depois, 'poupanca')).toBe(500);
  });

  it('cartão sem fatura parte do zero', () => {
    const semFatura = [account({ id: 'novo', kind: 'cartao' })];
    expect(fatura(applyTransaction(semFatura, tx({ accountId: 'novo' }), 1), 'novo')).toBe(100);
  });
});

describe('agregados do mês', () => {
  it('monthIncome soma só os ganhos do mês', () => {
    expect(monthIncome(seed.transactions)).toBe(5000);
  });

  it('monthExpense soma só os gastos (sem aportes)', () => {
    expect(monthExpense(seed.transactions)).toBeCloseTo(1904, 2);
  });

  it('monthOutflow soma gastos + aportes', () => {
    expect(monthOutflow(seed.transactions)).toBeCloseTo(2380, 2);
  });

  it('ignora transações de outros meses', () => {
    const lista = [
      tx({ kind: 'ganho', amount: 1000, date: '2024-05-01' }),
      tx({ kind: 'ganho', amount: 999, date: '2024-04-30' }),
    ];
    expect(monthIncome(lista, '2024-05')).toBe(1000);
    expect(monthIncome(lista, '2024-04')).toBe(999);
  });

  it('usa REFERENCE_MONTH por padrão', () => {
    expect(REFERENCE_MONTH).toBe('2024-05');
    expect(monthIncome(seed.transactions)).toBe(monthIncome(seed.transactions, REFERENCE_MONTH));
  });

  it('mês sem movimento dá zero', () => {
    expect(monthIncome(seed.transactions, '2020-01')).toBe(0);
    expect(monthExpense(seed.transactions, '2020-01')).toBe(0);
    expect(monthOutflow(seed.transactions, '2020-01')).toBe(0);
  });

  it('transferência não entra em nenhum agregado', () => {
    const lista = [tx({ kind: 'transferencia', amount: 500 })];
    expect(monthIncome(lista)).toBe(0);
    expect(monthExpense(lista)).toBe(0);
    expect(monthOutflow(lista)).toBe(0);
  });
});

describe('budgetSlices', () => {
  const slices = budgetSlices(seed.transactions);

  it('devolve as três fatias do 50/30/20 na ordem', () => {
    expect(slices.map((s) => s.key)).toEqual(['essenciais', 'outros', 'investimentos']);
    expect(slices.map((s) => s.target)).toEqual([50, 30, 20]);
  });

  it('bate com os números do board', () => {
    expect(slices[0].amount).toBeCloseTo(1190, 2);
    expect(slices[1].amount).toBeCloseTo(714, 2);
    expect(slices[2].amount).toBeCloseTo(476, 2);
  });

  it('classifica categorias essenciais', () => {
    const [essenciais, outros] = budgetSlices([
      tx({ category: 'Moradia', amount: 850 }),
      tx({ category: 'Transporte', amount: 10 }),
      tx({ category: 'Saúde', amount: 20 }),
      tx({ category: 'Mercado', amount: 30 }),
      tx({ category: 'Essenciais', amount: 40 }),
      tx({ category: 'Lazer', amount: 60 }),
    ]);
    expect(essenciais.amount).toBe(950);
    expect(outros.amount).toBe(60);
  });

  it('aportes vão para a fatia de investimentos independente da categoria', () => {
    const slices = budgetSlices([tx({ kind: 'aporte', category: 'Moradia', amount: 300 })]);
    expect(slices[0].amount).toBe(0);
    expect(slices[2].amount).toBe(300);
  });

  it('ganhos e transferências não entram em fatia nenhuma', () => {
    const slices = budgetSlices([
      tx({ kind: 'ganho', amount: 4200, category: 'Receita' }),
      tx({ kind: 'transferencia', amount: 500, category: 'Transferência' }),
    ]);
    expect(slices.map((s) => s.amount)).toEqual([0, 0, 0]);
  });

  it('filtra pelo mês pedido', () => {
    const lista = [tx({ amount: 100, date: '2024-04-10', category: 'Moradia' })];
    expect(budgetSlices(lista, '2024-05')[0].amount).toBe(0);
    expect(budgetSlices(lista, '2024-04')[0].amount).toBe(100);
  });

  it('cada fatia tem cor e rótulo', () => {
    for (const slice of slices) {
      expect(slice.color).toMatch(/^#|rgb/);
      expect(slice.label.length).toBeGreaterThan(0);
    }
  });
});

describe('budgetTargets', () => {
  it('divide a receita em 50/30/20', () => {
    expect(budgetTargets(5000)).toEqual([
      { key: 'essenciais', amount: 2500 },
      { key: 'outros', amount: 1500 },
      { key: 'investimentos', amount: 1000 },
    ]);
  });

  it('receita zero zera os alvos', () => {
    expect(budgetTargets(0).map((t) => t.amount)).toEqual([0, 0, 0]);
  });
});

describe('investmentTotals / investmentYield', () => {
  const investment = (over: Partial<Investment> = {}): Investment => ({
    id: 'i',
    name: 'Ativo',
    class: 'renda-fixa',
    invested: 1000,
    current: 1100,
    ownerId: 'ana',
    ...over,
  });

  it('soma investido, atual e lucro', () => {
    const totals = investmentTotals(seed.investments);
    expect(totals.invested).toBe(18500);
    expect(totals.current).toBe(21340);
    expect(totals.profit).toBe(2840);
    expect(totals.yieldPercent).toBeCloseTo(15.35, 2);
  });

  it('prejuízo dá lucro e rendimento negativos', () => {
    const totals = investmentTotals([investment({ invested: 1000, current: 800 })]);
    expect(totals.profit).toBe(-200);
    expect(totals.yieldPercent).toBe(-20);
  });

  it('carteira vazia não divide por zero', () => {
    expect(investmentTotals([])).toEqual({
      invested: 0,
      current: 0,
      profit: 0,
      yieldPercent: 0,
    });
  });

  it('investimento sem aporte não divide por zero', () => {
    expect(investmentYield(investment({ invested: 0, current: 50 }))).toBe(0);
  });

  it('rendimento de um ativo isolado', () => {
    expect(investmentYield(investment({ invested: 8000, current: 8640 }))).toBeCloseTo(8, 5);
  });
});

describe('goalProgress', () => {
  const goal = (over: Partial<Goal> = {}): Goal => ({
    id: 'g',
    name: 'Meta',
    target: 1000,
    saved: 250,
    ...over,
  });

  it('devolve a fração guardada', () => {
    expect(goalProgress(goal())).toBe(0.25);
  });

  it('limita em 1 quando passa da meta', () => {
    expect(goalProgress(goal({ saved: 1500 }))).toBe(1);
  });

  it('meta sem alvo definido tem progresso zero', () => {
    expect(goalProgress(goal({ target: undefined, saved: 500 }))).toBe(0);
    expect(goalProgress(goal({ target: 0, saved: 500 }))).toBe(0);
  });
});

describe('groupByDay', () => {
  it('agrupa por data e ordena do mais recente para o mais antigo', () => {
    const grupos = groupByDay([
      tx({ id: 'a', date: '2024-05-10' }),
      tx({ id: 'b', date: '2024-05-24' }),
      tx({ id: 'c', date: '2024-05-10' }),
    ]);
    expect(grupos.map(([dia]) => dia)).toEqual(['2024-05-24', '2024-05-10']);
    expect(grupos[1][1].map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('não muta o array recebido', () => {
    const lista = [tx({ id: 'a', date: '2024-05-10' }), tx({ id: 'b', date: '2024-05-24' })];
    groupByDay(lista);
    expect(lista.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('lista vazia devolve nenhum grupo', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('cobre todas as transações do seed sem perder nenhuma', () => {
    const grupos = groupByDay(seed.transactions);
    const total = grupos.reduce((sum, [, itens]) => sum + itens.length, 0);
    expect(total).toBe(seed.transactions.length);
  });
});

describe('runningBalances', () => {
  it('a transação mais recente carrega o saldo inicial', () => {
    const lista = [
      tx({ id: 'novo', kind: 'gasto', amount: 100, date: '2024-05-24' }),
      tx({ id: 'velho', kind: 'ganho', amount: 500, date: '2024-05-20' }),
    ];
    const saldos = runningBalances(lista, 1000);
    expect(saldos.get('novo')).toBe(1000);
    // Desfazendo o gasto de 100: antes dele o saldo era 1100.
    expect(saldos.get('velho')).toBe(1100);
  });

  it('desfaz ganhos ao voltar no tempo', () => {
    const lista = [tx({ id: 'a', kind: 'ganho', amount: 200, date: '2024-05-02' })];
    const saldos = runningBalances([...lista, tx({ id: 'b', date: '2024-05-01' })], 1000);
    expect(saldos.get('a')).toBe(1000);
    expect(saldos.get('b')).toBe(800);
  });

  it('transferência não move o saldo acumulado', () => {
    const saldos = runningBalances(
      [
        tx({ id: 'a', kind: 'transferencia', amount: 500, date: '2024-05-02' }),
        tx({ id: 'b', kind: 'gasto', amount: 50, date: '2024-05-01' }),
      ],
      1000,
    );
    expect(saldos.get('a')).toBe(1000);
    expect(saldos.get('b')).toBe(1000);
  });

  it('lista vazia devolve mapa vazio', () => {
    expect(runningBalances([], 1000).size).toBe(0);
  });

  it('não muta o array recebido', () => {
    const lista = [tx({ id: 'a', date: '2024-05-01' }), tx({ id: 'b', date: '2024-05-24' })];
    runningBalances(lista, 0);
    expect(lista.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('cobre todas as transações do seed', () => {
    expect(runningBalances(seed.transactions, 4050).size).toBe(seed.transactions.length);
  });
});

describe('goalsClosestToDone', () => {
  const goal = (over: Partial<Goal> = {}): Goal => ({ id: 'g', name: 'Meta', saved: 0, ...over });

  it('ordena da mais adiantada para a menos', () => {
    const metas = [
      goal({ id: 'a', target: 100, saved: 10 }),
      goal({ id: 'b', target: 100, saved: 90 }),
      goal({ id: 'c', target: 100, saved: 50 }),
    ];
    expect(goalsClosestToDone(metas).map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });

  it('devolve no máximo três por padrão', () => {
    const metas = Array.from({ length: 6 }, (_, i) =>
      goal({ id: `g${i}`, target: 100, saved: i * 10 }),
    );
    expect(goalsClosestToDone(metas)).toHaveLength(3);
  });

  it('respeita um limite diferente', () => {
    const metas = [goal({ id: 'a', target: 100, saved: 10 }), goal({ id: 'b', target: 100, saved: 90 })];
    expect(goalsClosestToDone(metas, 1).map((m) => m.id)).toEqual(['b']);
  });

  it('ignora metas sem alvo e as já concluídas', () => {
    const metas = [
      goal({ id: 'sem-alvo', saved: 500 }),
      goal({ id: 'zerada', target: 0, saved: 0 }),
      goal({ id: 'fechada', target: 100, saved: 100 }),
      goal({ id: 'aberta', target: 100, saved: 20 }),
    ];
    expect(goalsClosestToDone(metas).map((m) => m.id)).toEqual(['aberta']);
  });

  it('no seed traz as três com alvo em andamento', () => {
    expect(goalsClosestToDone(seed.goals).map((m) => m.name)).toEqual([
      'Viagem Japão',
      'Reserva de emergência',
      'Notebook',
    ]);
  });

  it('lista vazia devolve vazio', () => {
    expect(goalsClosestToDone([])).toEqual([]);
  });
});

describe('meses até quitar', () => {
  const loan = (over: Partial<Loan> = {}): Loan => ({ ...seed.loans[0], ...over });

  it('monthsBetween conta os meses entre dois YYYY-MM', () => {
    expect(monthsBetween('2024-05', '2024-05')).toBe(0);
    expect(monthsBetween('2024-05', '2024-08')).toBe(3);
    expect(monthsBetween('2024-05', '2025-05')).toBe(12);
    expect(monthsBetween('2024-05', '2044-03')).toBe(238);
  });

  it('monthsBetween não fica negativo quando a data já passou', () => {
    expect(monthsBetween('2024-05', '2023-01')).toBe(0);
  });

  it('monthsToPayoff lê o payoffDate em pt-BR', () => {
    expect(monthsToPayoff(seed.loans[0])).toBe(238);
  });

  it('monthsToPayoff aceita outro mês de referência', () => {
    expect(monthsToPayoff(seed.loans[0], '2044-01')).toBe(2);
  });

  it('payoffDate irreconhecível vira zero', () => {
    expect(monthsToPayoff(loan({ payoffDate: 'qualquer coisa' }))).toBe(0);
  });

  it('loanPaidRatio é a fatia já amortizada', () => {
    expect(loanPaidRatio(seed.loans[0])).toBeCloseTo(0.3058, 4);
    expect(loanPaidRatio(loan({ total: 0, balance: 0 }))).toBe(0);
  });
});

describe('divisão de contas', () => {
  const ana: Person = { id: 'ana', name: 'Ana Ribeiro', initial: 'A', email: 'ana@email.com' };
  const marcelo: Person = {
    id: 'marcelo',
    name: 'Marcelo Souza',
    initial: 'M',
    email: 'marcelo@email.com',
  };
  const people = [ana, marcelo];

  /** Contatos da Ana: um nome avulso e o Marcelo, que também usa o app. */
  const joao: Contact = { id: 'c1', name: 'João Pedro', initial: 'J', ownerId: 'ana' };
  const marceloContato: Contact = {
    id: 'c3',
    name: 'Marcelo',
    initial: 'M',
    ownerId: 'ana',
    personId: 'marcelo',
  };
  /** Contato que o Marcelo cadastrou apontando para a conta da Ana. */
  const anaContato: Contact = {
    id: 'c4',
    name: 'Ana',
    initial: 'A',
    ownerId: 'marcelo',
    personId: 'ana',
  };
  const contacts = [joao, marceloContato, anaContato];

  const split = (over: Partial<Split> = {}): Split => ({
    id: 's1',
    ownerId: 'ana',
    contactId: 'c1',
    direction: 'a-receber',
    description: 'Mercado',
    amount: 50,
    date: '2024-05-24',
    ...over,
  });

  describe('splitLedger', () => {
    it('traz as divisões que a pessoa registrou com o nome do contato', () => {
      const entradas = splitLedger([split()], contacts, people, 'ana');
      expect(entradas).toHaveLength(1);
      expect(entradas[0]).toMatchObject({
        direction: 'a-receber',
        counterpartId: 'c1',
        counterpartName: 'João Pedro',
        mirrored: false,
        settled: false,
      });
    });

    it('inverte o lado da divisão que o outro registrou apontando para mim', () => {
      const doMarcelo = split({ id: 's2', ownerId: 'marcelo', contactId: 'c4', amount: 100 });
      const entradas = splitLedger([doMarcelo], contacts, people, 'ana');
      expect(entradas[0]).toMatchObject({
        direction: 'a-pagar',
        counterpartId: 'c3',
        counterpartName: 'Marcelo',
        mirrored: true,
      });
    });

    it('sem contato cadastrado, a contraparte espelhada vira a pessoa do app', () => {
      const doMarcelo = split({ id: 's2', ownerId: 'marcelo', contactId: 'c4' });
      const entradas = splitLedger([doMarcelo], [anaContato], people, 'ana');
      expect(entradas[0]).toMatchObject({
        counterpartId: 'pessoa-marcelo',
        counterpartName: 'Marcelo Souza',
      });
    });

    it('ignora divisão entre terceiros', () => {
      const deOutros = split({ id: 's3', ownerId: 'marcelo', contactId: 'c1' });
      expect(splitLedger([deOutros], contacts, people, 'ana')).toEqual([]);
    });

    it('sem pessoa logada não devolve nada', () => {
      expect(splitLedger([split()], contacts, people, null)).toEqual([]);
    });

    it('marca como acertada quem já tem data ou lançamento de acerto', () => {
      const lista = [
        split({ id: 'a', settledAt: '2024-05-20' }),
        split({ id: 'b', settlementTransactionId: 't9' }),
        split({ id: 'c' }),
      ];
      const entradas = splitLedger(lista, contacts, people, 'ana');
      expect(entradas.map((entrada) => entrada.settled)).toEqual([true, true, false]);
      expect(openEntries(entradas).map((entrada) => entrada.split.id)).toEqual(['c']);
    });

    it('contato apagado ainda aparece, sem nome', () => {
      const entradas = splitLedger([split({ contactId: 'sumiu' })], contacts, people, 'ana');
      expect(entradas[0].counterpartName).toBe('Sem nome');
    });

    it('ordena da divisão mais recente para a mais antiga', () => {
      const lista = [
        split({ id: 'velha', date: '2024-04-01' }),
        split({ id: 'nova', date: '2024-05-24' }),
      ];
      expect(splitLedger(lista, contacts, people, 'ana').map((e) => e.split.id)).toEqual([
        'nova',
        'velha',
      ]);
    });
  });

  describe('splitTotals', () => {
    const entradas = () =>
      splitLedger(
        [
          split({ id: 'a', amount: 52.1 }),
          split({ id: 'b', direction: 'a-pagar', amount: 45 }),
          split({ id: 'c', amount: 100, settledAt: '2024-05-01' }),
        ],
        contacts,
        people,
        'ana',
      );

    it('soma o que está em aberto dos dois lados', () => {
      const totais = splitTotals(entradas());
      expect(totais).toMatchObject({ toReceive: 52.1, toPay: 45 });
      expect(totais.net).toBeCloseTo(7.1, 2);
    });

    it('sem divisões, zera tudo', () => {
      expect(splitTotals([])).toEqual({ toReceive: 0, toPay: 0, net: 0 });
    });
  });

  describe('ledgerBalances', () => {
    it('agrupa por contraparte e separa aberto de acertado', () => {
      const entradas = splitLedger(
        [
          split({ id: 'a', amount: 52.1 }),
          split({ id: 'b', direction: 'a-pagar', amount: 45 }),
          split({ id: 'c', amount: 30, settledAt: '2024-05-01' }),
        ],
        contacts,
        people,
        'ana',
      );
      const [joaoBalance] = ledgerBalances(entradas);

      expect(joaoBalance).toMatchObject({ id: 'c1', name: 'João Pedro', toReceive: 52.1, toPay: 45 });
      expect(joaoBalance.net).toBeCloseTo(7.1, 2);
      expect(joaoBalance.open).toHaveLength(2);
      expect(joaoBalance.settled).toHaveLength(1);
    });

    it('ordena pelo maior saldo em aberto, em módulo', () => {
      const entradas = splitLedger(
        [
          split({ id: 'a', contactId: 'c1', amount: 10 }),
          split({ id: 'b', ownerId: 'marcelo', contactId: 'c4', amount: 100 }),
        ],
        contacts,
        people,
        'ana',
      );
      expect(ledgerBalances(entradas).map((balance) => balance.id)).toEqual(['c3', 'c1']);
    });

    it('quem só tem histórico fica com saldo zero', () => {
      const entradas = splitLedger([split({ settledAt: '2024-05-01' })], contacts, people, 'ana');
      expect(ledgerBalances(entradas)[0]).toMatchObject({ net: 0, open: [] });
    });
  });

  describe('equalShares', () => {
    it('divide sem sobrar centavo', () => {
      expect(equalShares(10, 3)).toEqual([3.34, 3.33, 3.33]);
      expect(equalShares(10, 3).reduce((total, part) => total + part, 0)).toBeCloseTo(10, 2);
    });

    it('divide em partes exatas quando dá', () => {
      expect(equalShares(156.3, 3)).toEqual([52.1, 52.1, 52.1]);
    });

    it('uma parte só devolve o valor inteiro', () => {
      expect(equalShares(99.99, 1)).toEqual([99.99]);
    });

    it('zero partes devolve lista vazia', () => {
      expect(equalShares(100, 0)).toEqual([]);
      expect(equalShares(100, -1)).toEqual([]);
    });
  });

  describe('settlementKind', () => {
    it('receber vira ganho e pagar vira gasto', () => {
      expect(settlementKind('a-receber')).toBe('ganho');
      expect(settlementKind('a-pagar')).toBe('gasto');
    });
  });

  describe('seed', () => {
    it('a Ana tem João e Camila devendo e uma dívida com o Marcelo', () => {
      const entradas = splitLedger(seed.splits, seed.contacts, seed.people, 'ana');
      expect(splitTotals(entradas)).toMatchObject({ toReceive: 104.2, toPay: 145 });
      expect(ledgerBalances(entradas).map((balance) => balance.name)).toEqual([
        'Marcelo Souza',
        'Camila',
        'João Pedro',
      ]);
    });

    it('a mesma divisão aparece invertida no app do Marcelo', () => {
      const entradas = splitLedger(seed.splits, seed.contacts, seed.people, 'marcelo');
      expect(entradas).toHaveLength(1);
      expect(entradas[0]).toMatchObject({
        direction: 'a-receber',
        counterpartName: 'Ana Ribeiro',
        mirrored: false,
      });
    });
  });
});
