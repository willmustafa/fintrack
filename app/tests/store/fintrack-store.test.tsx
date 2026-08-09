/**
 * O store é a ponte entre as telas e a API: além de chamar o endpoint certo,
 * ele mantém o snapshot local coerente (saldos, faturas, listas) sem recarregar
 * tudo. Estes testes fixam esse comportamento com a API mockada.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { api, type Snapshot } from '@/services/api';
import {
  FintrackProvider,
  useCurrentPerson,
  useFintrack,
  usePreferences,
  useSnapshot,
} from '@/store/fintrack-store';
import type { Account, Goal, Invite, Person, Preferences, Transaction } from '@/types';

jest.mock('@/services/api', () => {
  const actual = jest.requireActual('@/services/api');
  return {
    ...actual,
    api: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      snapshot: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      updatePreferences: jest.fn(),
      updateMemberAccess: jest.fn(),
      removeMember: jest.fn(),
      setAccountShared: jest.fn(),
      createTransaction: jest.fn(),
      chooseGoalQuote: jest.fn(),
      sendInvite: jest.fn(),
      resendInvite: jest.fn(),
      cancelInvite: jest.fn(),
    },
  };
});

const mockApi = api as jest.Mocked<typeof api>;

const ana: Person = {
  id: 'ana',
  name: 'Ana Ribeiro',
  initial: 'A',
  email: 'ana@email.com',
  access: 'total',
};
const marcelo: Person = {
  id: 'marcelo',
  name: 'Marcelo Souza',
  initial: 'M',
  email: 'marcelo@email.com',
  access: 'total',
};

const conta: Account = { id: 'corrente', name: 'Corrente', kind: 'corrente', balance: 1000, ownerId: 'casal' };
const poupanca: Account = { id: 'poupanca', name: 'Poupança', kind: 'poupanca', balance: 500, ownerId: 'casal' };
const cartao: Account = {
  id: 'nubank',
  name: 'Nubank',
  kind: 'cartao',
  balance: 0,
  ownerId: 'casal',
  limit: 6000,
  invoice: 800,
};

const meta: Goal = { id: 'g1', name: 'Viagem', target: 12000, saved: 9800 };
const convite: Invite = { id: 'inv1', email: 'joana@email.com', status: 'pendente', sentDaysAgo: 2 };
const preferencias: Preferences = {
  notifications: { transactions: true, invoices: true, goals: false, weeklySummary: true },
};

const snapshotBase = (): Snapshot => ({
  people: [ana, marcelo],
  accounts: [conta, poupanca, cartao],
  transactions: [],
  investments: [],
  goals: [meta],
  loans: [],
  invites: [convite],
  preferences: preferencias,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <FintrackProvider>{children}</FintrackProvider>
);

const renderStore = () => renderHook(() => useFintrack(), { wrapper });

/** Loga e espera o snapshot carregar — ponto de partida da maioria dos testes. */
async function renderLogged() {
  const view = await renderStore();
  await act(async () => {
    await view.result.current.signIn('ana@email.com', 'x');
  });
  await waitFor(() => expect(view.result.current.snapshot).not.toBeNull());
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.signIn.mockResolvedValue({ person: ana, token: 'token' });
  mockApi.signUp.mockResolvedValue({ person: ana, token: 'token' });
  mockApi.snapshot.mockResolvedValue(snapshotBase());
});

describe('estado inicial', () => {
  it('começa deslogado, sem snapshot e sem erro', async () => {
    const { result } = await renderStore();
    expect(result.current.session).toBeNull();
    expect(result.current.snapshot).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('não carrega o snapshot antes do login', async () => {
    await renderStore();
    expect(mockApi.snapshot).not.toHaveBeenCalled();
  });

  it('useFintrack fora do provider explica o erro', async () => {
    await expect(renderHook(() => useFintrack())).rejects.toThrow(
      'useFintrack precisa estar dentro de <FintrackProvider>',
    );
  });
});

describe('sessão', () => {
  it('signIn guarda a sessão e dispara o carregamento do snapshot', async () => {
    const { result } = await renderLogged();
    expect(mockApi.signIn).toHaveBeenCalledWith('ana@email.com', 'x');
    expect(result.current.session?.person).toEqual(ana);
    expect(mockApi.snapshot).toHaveBeenCalledTimes(1);
  });

  it('signUp guarda a sessão e carrega o snapshot', async () => {
    const { result } = await renderStore();
    await act(async () => {
      await result.current.signUp('Ana', 'ana@email.com', 'senha123');
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    expect(mockApi.signUp).toHaveBeenCalledWith('Ana', 'ana@email.com', 'senha123');
    expect(result.current.session?.token).toBe('token');
  });

  it('erro no signIn propaga para a tela e não cria sessão', async () => {
    mockApi.signIn.mockRejectedValue(new Error('E-mail ou senha inválidos.'));
    const { result } = await renderStore();
    await act(async () => {
      await expect(result.current.signIn('a@e.com', 'errada')).rejects.toThrow(
        'E-mail ou senha inválidos.',
      );
    });
    expect(result.current.session).toBeNull();
  });

  it('signOut limpa sessão e snapshot', async () => {
    const { result } = await renderLogged();
    await act(async () => {
      result.current.signOut();
    });
    expect(result.current.session).toBeNull();
    expect(result.current.snapshot).toBeNull();
  });

  it('login de novo depois do signOut recarrega o snapshot', async () => {
    const { result } = await renderLogged();
    await act(async () => {
      result.current.signOut();
    });
    await act(async () => {
      await result.current.signIn('ana@email.com', 'x');
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    expect(mockApi.snapshot).toHaveBeenCalledTimes(2);
  });
});

describe('carregamento do snapshot', () => {
  it('guarda a mensagem de erro quando a API falha', async () => {
    mockApi.snapshot.mockRejectedValue(new Error('Backend fora do ar'));
    const { result } = await renderStore();
    await act(async () => {
      await result.current.signIn('a@e.com', 'x');
    });
    await waitFor(() => expect(result.current.error).toBe('Backend fora do ar'));
    expect(result.current.loading).toBe(false);
    expect(result.current.snapshot).toBeNull();
  });

  it('usa uma mensagem padrão quando o erro não é Error', async () => {
    mockApi.snapshot.mockRejectedValue('pane');
    const { result } = await renderStore();
    await act(async () => {
      await result.current.signIn('a@e.com', 'x');
    });
    await waitFor(() => expect(result.current.error).toBe('Falha ao carregar dados'));
  });

  it('não fica em loading depois de carregar', async () => {
    const { result } = await renderLogged();
    expect(result.current.loading).toBe(false);
  });
});

describe('addTransaction', () => {
  const criar = (over: Partial<Transaction> = {}): Omit<Transaction, 'id'> => ({
    kind: 'gasto',
    description: 'Compra',
    amount: 100,
    category: 'Outros',
    accountId: 'corrente',
    date: '2024-05-25',
    ownerId: 'ana',
    ...over,
  });

  it('insere a transação no topo da lista', async () => {
    const { result } = await renderLogged();
    mockApi.createTransaction.mockResolvedValue({ ...criar(), id: 'novo' });
    await act(async () => {
      await result.current.addTransaction(criar());
    });
    expect(result.current.snapshot?.transactions[0].id).toBe('novo');
  });

  it('gasto em conta corrente desconta do saldo', async () => {
    const { result } = await renderLogged();
    mockApi.createTransaction.mockResolvedValue({ ...criar({ amount: 250 }), id: 'x' });
    await act(async () => {
      await result.current.addTransaction(criar({ amount: 250 }));
    });
    expect(result.current.snapshot?.accounts.find((a) => a.id === 'corrente')?.balance).toBe(750);
  });

  it('ganho soma no saldo', async () => {
    const { result } = await renderLogged();
    const input = criar({ kind: 'ganho', amount: 4200 });
    mockApi.createTransaction.mockResolvedValue({ ...input, id: 'x' });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    expect(result.current.snapshot?.accounts.find((a) => a.id === 'corrente')?.balance).toBe(5200);
  });

  it('aporte sai do saldo da conta', async () => {
    const { result } = await renderLogged();
    const input = criar({ kind: 'aporte', amount: 300 });
    mockApi.createTransaction.mockResolvedValue({ ...input, id: 'x' });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    expect(result.current.snapshot?.accounts.find((a) => a.id === 'corrente')?.balance).toBe(700);
  });

  it('gasto no cartão vai para a fatura, não para o saldo', async () => {
    const { result } = await renderLogged();
    const input = criar({ accountId: 'nubank', amount: 156.3 });
    mockApi.createTransaction.mockResolvedValue({ ...input, id: 'x' });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    const card = result.current.snapshot?.accounts.find((a) => a.id === 'nubank');
    expect(card?.invoice).toBeCloseTo(956.3, 2);
    expect(card?.balance).toBe(0);
  });

  it('ganho lançado num cartão não mexe em nada', async () => {
    const { result } = await renderLogged();
    const input = criar({ kind: 'ganho', accountId: 'nubank', amount: 50 });
    mockApi.createTransaction.mockResolvedValue({ ...input, id: 'x' });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    const card = result.current.snapshot?.accounts.find((a) => a.id === 'nubank');
    expect(card?.invoice).toBe(800);
    expect(card?.balance).toBe(0);
  });

  it('transferência tira da origem e põe no destino', async () => {
    const { result } = await renderLogged();
    const input = criar({ kind: 'transferencia', amount: 200, toAccountId: 'poupanca' });
    mockApi.createTransaction.mockResolvedValue({ ...input, id: 'x' });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    const contas = result.current.snapshot!.accounts;
    expect(contas.find((a) => a.id === 'corrente')?.balance).toBe(800);
    expect(contas.find((a) => a.id === 'poupanca')?.balance).toBe(700);
  });

  it('não toca nas contas que não participam do lançamento', async () => {
    const { result } = await renderLogged();
    mockApi.createTransaction.mockResolvedValue({ ...criar(), id: 'x' });
    await act(async () => {
      await result.current.addTransaction(criar());
    });
    expect(result.current.snapshot?.accounts.find((a) => a.id === 'poupanca')?.balance).toBe(500);
  });

  it('devolve a transação criada pela API', async () => {
    const { result } = await renderLogged();
    mockApi.createTransaction.mockResolvedValue({ ...criar(), id: 'servidor-1' });
    let criada: Transaction | undefined;
    await act(async () => {
      criada = await result.current.addTransaction(criar());
    });
    expect(criada?.id).toBe('servidor-1');
  });

  it('erro da API propaga e não altera o snapshot', async () => {
    const { result } = await renderLogged();
    mockApi.createTransaction.mockRejectedValue(new Error('Saldo insuficiente.'));
    await act(async () => {
      await expect(result.current.addTransaction(criar())).rejects.toThrow('Saldo insuficiente.');
    });
    expect(result.current.snapshot?.transactions).toHaveLength(0);
    expect(result.current.snapshot?.accounts.find((a) => a.id === 'corrente')?.balance).toBe(1000);
  });
});

describe('metas', () => {
  it('chooseGoalQuote substitui a meta no snapshot', async () => {
    const { result } = await renderLogged();
    mockApi.chooseGoalQuote.mockResolvedValue({ ...meta, target: 3200 });
    await act(async () => {
      await result.current.chooseGoalQuote('g1', 'q2');
    });
    expect(mockApi.chooseGoalQuote).toHaveBeenCalledWith('g1', 'q2');
    expect(result.current.snapshot?.goals[0].target).toBe(3200);
  });

  it('não mexe em outras metas', async () => {
    mockApi.snapshot.mockResolvedValue({
      ...snapshotBase(),
      goals: [meta, { id: 'g2', name: 'Reserva', target: 10000, saved: 6000 }],
    });
    const { result } = await renderLogged();
    mockApi.chooseGoalQuote.mockResolvedValue({ ...meta, target: 15000 });
    await act(async () => {
      await result.current.chooseGoalQuote('g1', 'q1');
    });
    expect(result.current.snapshot?.goals[1].target).toBe(10000);
  });
});

describe('perfil', () => {
  it('updateProfile atualiza a sessão e a lista de pessoas', async () => {
    const { result } = await renderLogged();
    const atualizada = { ...ana, name: 'Ana Paula', email: 'ap@email.com' };
    mockApi.updateProfile.mockResolvedValue(atualizada);
    await act(async () => {
      await result.current.updateProfile({ name: 'Ana Paula', email: 'ap@email.com' });
    });
    expect(result.current.session?.person).toEqual(atualizada);
    expect(result.current.snapshot?.people[0]).toEqual(atualizada);
    expect(result.current.snapshot?.people[1]).toEqual(marcelo);
  });

  it('changePassword só repassa para a API', async () => {
    const { result } = await renderLogged();
    mockApi.changePassword.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.changePassword('velha123', 'nova4567');
    });
    expect(mockApi.changePassword).toHaveBeenCalledWith('velha123', 'nova4567');
  });

  it('changePassword propaga o erro da API', async () => {
    const { result } = await renderLogged();
    mockApi.changePassword.mockRejectedValue(new Error('Senha atual incorreta.'));
    await act(async () => {
      await expect(result.current.changePassword('x', 'y')).rejects.toThrow('Senha atual incorreta.');
    });
  });
});

describe('preferências (atualização otimista)', () => {
  const desligado: Preferences = {
    notifications: { transactions: false, invoices: false, goals: false, weeklySummary: false },
  };

  it('grava o que a API confirmou', async () => {
    const { result } = await renderLogged();
    mockApi.updatePreferences.mockResolvedValue(desligado);
    await act(async () => {
      await result.current.updatePreferences(desligado);
    });
    expect(result.current.snapshot?.preferences).toEqual(desligado);
  });

  it('reverte para o valor anterior quando a API recusa', async () => {
    const { result } = await renderLogged();
    mockApi.updatePreferences.mockRejectedValue(new Error('Não foi possível salvar.'));
    await act(async () => {
      await expect(result.current.updatePreferences(desligado)).rejects.toThrow(
        'Não foi possível salvar.',
      );
    });
    expect(result.current.snapshot?.preferences).toEqual(preferencias);
  });

  it('aplica o valor da resposta mesmo quando o servidor ajusta o payload', async () => {
    const { result } = await renderLogged();
    const ajustado: Preferences = {
      notifications: { ...desligado.notifications, weeklySummary: true },
    };
    mockApi.updatePreferences.mockResolvedValue(ajustado);
    await act(async () => {
      await result.current.updatePreferences(desligado);
    });
    expect(result.current.snapshot?.preferences.notifications.weeklySummary).toBe(true);
  });
});

describe('membros', () => {
  it('updateMemberAccess troca o acesso na lista', async () => {
    const { result } = await renderLogged();
    mockApi.updateMemberAccess.mockResolvedValue({ ...marcelo, access: 'leitura' });
    await act(async () => {
      await result.current.updateMemberAccess('marcelo', 'leitura');
    });
    expect(result.current.snapshot?.people[1].access).toBe('leitura');
  });

  it('removeMember tira a pessoa da lista', async () => {
    const { result } = await renderLogged();
    mockApi.removeMember.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.removeMember('marcelo');
    });
    expect(result.current.snapshot?.people.map((p) => p.id)).toEqual(['ana']);
  });

  it('removeMember não mexe na lista quando a API falha', async () => {
    const { result } = await renderLogged();
    mockApi.removeMember.mockRejectedValue(new Error('Não foi possível remover.'));
    await act(async () => {
      await expect(result.current.removeMember('marcelo')).rejects.toThrow();
    });
    expect(result.current.snapshot?.people).toHaveLength(2);
  });

  it('setAccountShared substitui a conta no snapshot', async () => {
    const { result } = await renderLogged();
    mockApi.setAccountShared.mockResolvedValue({ ...conta, ownerId: 'casal' });
    await act(async () => {
      await result.current.setAccountShared('corrente', true);
    });
    expect(result.current.snapshot?.accounts[0].ownerId).toBe('casal');
    expect(mockApi.setAccountShared).toHaveBeenCalledWith('corrente', true);
  });
});

describe('convites', () => {
  it('sendInvite acrescenta o convite na lista', async () => {
    const { result } = await renderLogged();
    const novo: Invite = { id: 'inv2', email: 'novo@email.com', status: 'pendente', sentDaysAgo: 0 };
    mockApi.sendInvite.mockResolvedValue(novo);
    await act(async () => {
      await result.current.sendInvite('novo@email.com', ['corrente']);
    });
    expect(result.current.snapshot?.invites).toHaveLength(2);
    expect(result.current.snapshot?.invites[1]).toEqual(novo);
  });

  it('resendInvite atualiza o convite preservando o id local', async () => {
    const { result } = await renderLogged();
    mockApi.resendInvite.mockResolvedValue({ ...convite, id: 'outro-id', sentDaysAgo: 0 });
    await act(async () => {
      await result.current.resendInvite('inv1');
    });
    expect(result.current.snapshot?.invites[0]).toMatchObject({ id: 'inv1', sentDaysAgo: 0 });
  });

  it('cancelInvite remove o convite da lista', async () => {
    const { result } = await renderLogged();
    mockApi.cancelInvite.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.cancelInvite('inv1');
    });
    expect(result.current.snapshot?.invites).toHaveLength(0);
  });
});

describe('mutações antes do snapshot carregar', () => {
  it('não quebram — viram no-op no estado local', async () => {
    mockApi.snapshot.mockImplementation(() => new Promise(() => {}));
    const { result } = await renderStore();
    await act(async () => {
      await result.current.signIn('a@e.com', 'x');
    });

    mockApi.cancelInvite.mockResolvedValue(undefined);
    mockApi.createTransaction.mockResolvedValue({
      id: 'x',
      kind: 'gasto',
      description: 'y',
      amount: 1,
      category: 'Outros',
      accountId: 'corrente',
      date: '2024-05-25',
      ownerId: 'ana',
    });

    await act(async () => {
      await result.current.cancelInvite('inv1');
      await result.current.addTransaction({
        kind: 'gasto',
        description: 'y',
        amount: 1,
        category: 'Outros',
        accountId: 'corrente',
        date: '2024-05-25',
        ownerId: 'ana',
      });
    });
    expect(result.current.snapshot).toBeNull();
  });
});

describe('hooks auxiliares', () => {
  it('useSnapshot devolve um snapshot vazio antes do login', async () => {
    const { result } = await renderHook(() => useSnapshot(), { wrapper });
    expect(result.current.accounts).toEqual([]);
    expect(result.current.people).toEqual([]);
    expect(result.current.preferences.notifications.transactions).toBe(true);
  });

  it('useCurrentPerson devolve null sem sessão', async () => {
    const { result } = await renderHook(() => useCurrentPerson(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('useCurrentPerson devolve a pessoa logada', async () => {
    const { result } = await renderHook(
      () => ({ store: useFintrack(), person: useCurrentPerson() }),
      { wrapper },
    );
    await act(async () => {
      await result.current.store.signIn('ana@email.com', 'x');
    });
    expect(result.current.person).toEqual(ana);
  });

  it('usePreferences acompanha o snapshot carregado', async () => {
    const { result } = await renderHook(
      () => ({ store: useFintrack(), preferences: usePreferences() }),
      { wrapper },
    );
    await act(async () => {
      await result.current.store.signIn('ana@email.com', 'x');
    });
    await waitFor(() => expect(result.current.store.snapshot).not.toBeNull());
    expect(result.current.preferences).toEqual(preferencias);
  });
});
