/**
 * `src/services/api.ts` sem `EXPO_PUBLIC_API_URL`: tudo resolve em memória a
 * partir do seed e nada toca a rede.
 */
import * as seed from '@/data/seed';
import type { Preferences, Transaction } from '@/types';

type ApiModule = typeof import('@/services/api');

let api: ApiModule['api'];
let ApiError: ApiModule['ApiError'];
let isMockMode: boolean;
const fetchSpy = jest.fn();

beforeEach(() => {
  jest.resetModules();
  delete process.env.EXPO_PUBLIC_API_URL;
  fetchSpy.mockReset();
  global.fetch = fetchSpy as unknown as typeof fetch;

  const mod: ApiModule = require('@/services/api');
  api = mod.api;
  ApiError = mod.ApiError;
  isMockMode = mod.isMockMode;
});

it('entra em modo mock quando a variável de ambiente não existe', () => {
  expect(isMockMode).toBe(true);
});

afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
});

describe('autenticação', () => {
  it('signIn devolve a pessoa do seed correspondente ao e-mail', async () => {
    const session = await api.signIn('marcelo@email.com', 'qualquer');
    expect(session.person.id).toBe('marcelo');
    expect(session.token).toBe('mock-token');
  });

  it('signIn cai na pessoa padrão quando o e-mail é desconhecido', async () => {
    const session = await api.signIn('ninguem@email.com', 'x');
    expect(session.person).toEqual(seed.currentPerson);
  });

  it('signUp monta a pessoa com nome, e-mail e inicial', async () => {
    const session = await api.signUp('joana silva', 'joana@email.com', 'senha123');
    expect(session.person).toMatchObject({
      name: 'joana silva',
      email: 'joana@email.com',
      initial: 'J',
      access: 'total',
    });
  });

  it('signUp com nome só de espaços ainda produz uma inicial', async () => {
    const session = await api.signUp('   ', 'x@email.com', 'senha123');
    expect(session.person.initial).toBe('A');
  });
});

describe('snapshot', () => {
  it('devolve todas as coleções do seed', async () => {
    const snapshot = await api.snapshot();
    expect(snapshot).toEqual({
      people: seed.people,
      accounts: seed.accounts,
      transactions: seed.transactions,
      contacts: seed.contacts,
      splits: seed.splits,
      investments: seed.investments,
      goals: seed.goals,
      loans: seed.loans,
      invites: seed.invites,
      preferences: seed.preferences,
    });
  });
});

describe('perfil', () => {
  it('updateProfile altera nome, e-mail e inicial da pessoa logada', async () => {
    await api.signIn('ana@email.com', 'x');
    const person = await api.updateProfile({ name: 'Ana Paula', email: 'anapaula@email.com' });
    expect(person).toMatchObject({
      id: 'ana',
      name: 'Ana Paula',
      email: 'anapaula@email.com',
      initial: 'A',
    });
  });

  it('updateProfile preserva a inicial quando o nome fica vazio', async () => {
    await api.signIn('marcelo@email.com', 'x');
    const person = await api.updateProfile({ name: '  ', email: 'm@email.com' });
    expect(person.initial).toBe('M');
  });

  it('changePassword recusa uma senha igual à atual', async () => {
    await expect(api.changePassword('senha123', 'senha123')).rejects.toThrow(ApiError);
    await expect(api.changePassword('senha123', 'senha123')).rejects.toThrow(
      'A nova senha precisa ser diferente da atual.',
    );
  });

  it('changePassword aceita uma senha diferente', async () => {
    await expect(api.changePassword('senha123', 'outra456')).resolves.toBeUndefined();
  });

  it('updatePreferences devolve exatamente o que recebeu', async () => {
    const preferences: Preferences = {
      notifications: { transactions: false, invoices: false, goals: true, weeklySummary: false },
    };
    await expect(api.updatePreferences(preferences)).resolves.toEqual(preferences);
  });
});

describe('membros e contas compartilhadas', () => {
  it('updateMemberAccess troca o acesso da pessoa', async () => {
    const person = await api.updateMemberAccess('marcelo', 'leitura');
    expect(person).toMatchObject({ id: 'marcelo', access: 'leitura' });
  });

  it('updateMemberAccess falha com 404 para pessoa inexistente', async () => {
    await expect(api.updateMemberAccess('fantasma' as never, 'total')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Pessoa não encontrada.',
    });
  });

  it('setAccountShared passa a conta para o casal', async () => {
    const account = await api.setAccountShared('corrente', true);
    expect(account.ownerId).toBe('casal');
  });

  it('setAccountShared devolve a conta para a pessoa logada', async () => {
    await api.signIn('marcelo@email.com', 'x');
    const account = await api.setAccountShared('corrente', false);
    expect(account.ownerId).toBe('marcelo');
  });

  it('setAccountShared falha com 404 para conta inexistente', async () => {
    await expect(api.setAccountShared('nao-existe', true)).rejects.toMatchObject({ status: 404 });
  });

  it('removeMember resolve sem erro', async () => {
    await expect(api.removeMember('marcelo')).resolves.toBeUndefined();
  });

  it('createAccount devolve a conta com um id gerado', async () => {
    const created = await api.createAccount({
      name: 'Conta nova',
      kind: 'corrente',
      ownerId: 'ana',
      balance: 100,
    });
    expect(created).toMatchObject({ name: 'Conta nova', kind: 'corrente', balance: 100 });
    expect(created.id).toMatch(/^a\d+$/);
  });

  it('updateAccount devolve o input com o id preservado', async () => {
    const saved = await api.updateAccount('nubank', {
      name: 'Nubank renomeado',
      kind: 'cartao',
      ownerId: 'casal',
      balance: 0,
      limit: 7000,
    });
    expect(saved).toMatchObject({ id: 'nubank', name: 'Nubank renomeado', limit: 7000 });
  });

  it('deleteAccount resolve sem erro', async () => {
    await expect(api.deleteAccount('nubank')).resolves.toBeUndefined();
  });
});

describe('transações', () => {
  it('createTransaction devolve o input com um id gerado', async () => {
    const input: Omit<Transaction, 'id'> = {
      kind: 'gasto',
      description: 'Café',
      amount: 12.5,
      category: 'Outros',
      accountId: 'corrente',
      date: '2024-05-25',
      ownerId: 'ana',
    };
    const created = await api.createTransaction(input);
    expect(created).toMatchObject(input);
    expect(created.id).toMatch(/^t\d+$/);
  });

  it('updateTransaction devolve o input com o id preservado', async () => {
    const saved = await api.updateTransaction('t2', {
      kind: 'gasto',
      description: 'Mercado grande',
      amount: 200,
      category: 'Essenciais',
      accountId: 'nubank',
      date: '2024-05-24',
      ownerId: 'casal',
    });
    expect(saved).toMatchObject({ id: 't2', description: 'Mercado grande', amount: 200 });
  });

  it('deleteTransaction resolve sem erro', async () => {
    await expect(api.deleteTransaction('t2')).resolves.toBeUndefined();
  });
});

describe('metas', () => {
  it('chooseGoalQuote marca o orçamento escolhido e ajusta o alvo', async () => {
    const goal = await api.chooseGoalQuote('g4', 'q2');
    expect(goal.target).toBe(3200);
    expect(goal.quotes?.map((q) => q.chosen)).toEqual([false, true, false]);
  });

  it('chooseGoalQuote com orçamento inexistente mantém o alvo original', async () => {
    const original = seed.goals.find((g) => g.id === 'g1')!;
    const goal = await api.chooseGoalQuote('g1', 'inexistente');
    expect(goal.target).toBe(original.target);
  });
});

describe('convites', () => {
  it('sendInvite cria um convite pendente com as contas escolhidas', async () => {
    const invite = await api.sendInvite('novo@email.com', ['corrente', 'nubank']);
    expect(invite).toMatchObject({
      email: 'novo@email.com',
      status: 'pendente',
      sentDaysAgo: 0,
      accountIds: ['corrente', 'nubank'],
    });
    expect(invite.id).toMatch(/^inv\d+$/);
  });

  it('resendInvite zera os dias desde o envio', async () => {
    const invite = await api.resendInvite('inv1');
    expect(invite).toMatchObject({ id: 'inv1', email: 'joana@email.com', sentDaysAgo: 0 });
  });

  it('resendInvite de um id desconhecido devolve um convite pendente vazio', async () => {
    const invite = await api.resendInvite('inv-desconhecido');
    expect(invite).toEqual({
      id: 'inv-desconhecido',
      email: '',
      status: 'pendente',
      sentDaysAgo: 0,
    });
  });

  it('cancelInvite resolve sem erro', async () => {
    await expect(api.cancelInvite('inv1')).resolves.toBeUndefined();
  });
});

describe('divisão de contas', () => {
  it('createContact devolve a pessoa com id do "servidor"', async () => {
    const contact = await api.createContact({ name: 'Bruna', initial: 'B', ownerId: 'ana' });
    expect(contact).toMatchObject({ name: 'Bruna', initial: 'B', ownerId: 'ana' });
    expect(contact.id).toMatch(/^c\d+$/);
  });

  it('updateContact mantém o id e devolve os campos novos', async () => {
    const contact = await api.updateContact('c1', {
      name: 'João Pedro',
      initial: 'J',
      ownerId: 'ana',
      personId: 'marcelo',
    });
    expect(contact).toEqual({
      id: 'c1',
      name: 'João Pedro',
      initial: 'J',
      ownerId: 'ana',
      personId: 'marcelo',
    });
  });

  it('deleteContact resolve sem erro', async () => {
    await expect(api.deleteContact('c1')).resolves.toBeUndefined();
  });

  it('createSplits devolve uma divisão por pessoa, com ids diferentes', async () => {
    const base = {
      ownerId: 'ana' as const,
      direction: 'a-receber' as const,
      description: 'Mercado',
      amount: 52.1,
      date: '2024-05-24',
      transactionId: 't2',
    };
    const splits = await api.createSplits([
      { ...base, contactId: 'c1' },
      { ...base, contactId: 'c2' },
    ]);

    expect(splits).toHaveLength(2);
    expect(splits.map((split) => split.contactId)).toEqual(['c1', 'c2']);
    expect(new Set(splits.map((split) => split.id)).size).toBe(2);
    expect(splits[0].id).toMatch(/^sp\d+$/);
  });

  it('createSplits com lista vazia devolve lista vazia', async () => {
    await expect(api.createSplits([])).resolves.toEqual([]);
  });

  it('deleteSplit, settleSplits e reopenSplit resolvem sem erro', async () => {
    await expect(api.deleteSplit('sp1')).resolves.toBeUndefined();
    await expect(api.settleSplits(['sp1'], 't99', '2024-05-24')).resolves.toBeUndefined();
    await expect(api.reopenSplit('sp1')).resolves.toBeUndefined();
  });
});
