/**
 * Contrato HTTP com o backend em Go.
 *
 * Estes testes são a rede de segurança da troca do mock pela API real: fixam
 * método, rota, corpo e headers de cada chamada, além do tratamento de erro.
 * Se o Go divergir daqui, o app quebra — e o teste avisa antes.
 */
import type { Preferences, Transaction } from '@/types';

type ApiModule = typeof import('@/services/api');

const BASE = 'http://localhost:8080';

let api: ApiModule['api'];
let ApiError: ApiModule['ApiError'];
let fetchMock: jest.Mock;

/** Resposta de sucesso com corpo JSON. */
const jsonResponse = (body: unknown, status = 200) => ({
  ok: true,
  status,
  statusText: 'OK',
  json: async () => body,
});

/** Resposta de erro do backend: `{ "message": "..." }` em pt-BR. */
const errorResponse = (message: string | null, status = 400, statusText = 'Bad Request') => ({
  ok: false,
  status,
  statusText,
  json: async () => (message === null ? Promise.reject(new Error('sem corpo')) : { message }),
});

beforeEach(() => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_URL = BASE;
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;

  const mod: ApiModule = require('@/services/api');
  api = mod.api;
  ApiError = mod.ApiError;
});

afterAll(() => {
  delete process.env.EXPO_PUBLIC_API_URL;
});

/** Último `fetch`: `[url, init]` já com o body desserializado. */
function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    method: init?.method,
    headers: init?.headers as Record<string, string>,
    body: init?.body ? JSON.parse(init.body as string) : undefined,
  };
}

it('sai do modo mock quando EXPO_PUBLIC_API_URL está definida', () => {
  const mod: ApiModule = require('@/services/api');
  expect(mod.isMockMode).toBe(false);
  expect(mod.API_BASE_URL).toBe(BASE);
});

describe('POST /auth/login', () => {
  it('envia e-mail e senha e devolve a sessão', async () => {
    const session = { person: { id: 'ana', name: 'Ana', initial: 'A', email: 'a@e.com' }, token: 'jwt' };
    fetchMock.mockResolvedValue(jsonResponse(session));

    await expect(api.signIn('ana@email.com', 's3nha')).resolves.toEqual(session);
    expect(lastCall()).toMatchObject({
      url: `${BASE}/auth/login`,
      method: 'POST',
      body: { email: 'ana@email.com', password: 's3nha' },
    });
  });

  it('manda Content-Type: application/json', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.signIn('a@e.com', 'x');
    expect(lastCall().headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});

describe('POST /auth/signup', () => {
  it('envia nome, e-mail e senha', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ person: {}, token: 't' }));
    await api.signUp('Joana', 'joana@email.com', 'senha123');
    expect(lastCall()).toMatchObject({
      url: `${BASE}/auth/signup`,
      method: 'POST',
      body: { name: 'Joana', email: 'joana@email.com', password: 'senha123' },
    });
  });
});

describe('GET /snapshot', () => {
  it('busca o snapshot sem corpo e sem método explícito', async () => {
    const snapshot = { people: [], accounts: [], transactions: [] };
    fetchMock.mockResolvedValue(jsonResponse(snapshot));

    await expect(api.snapshot()).resolves.toEqual(snapshot);
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/snapshot`);
    expect(call.method).toBeUndefined();
    expect(call.body).toBeUndefined();
  });
});

describe('PATCH /me', () => {
  it('envia nome e e-mail', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'ana' }));
    await api.updateProfile({ name: 'Ana Paula', email: 'ap@email.com' });
    expect(lastCall()).toMatchObject({
      url: `${BASE}/me`,
      method: 'PATCH',
      body: { name: 'Ana Paula', email: 'ap@email.com' },
    });
  });
});

describe('POST /me/password', () => {
  it('envia a senha atual e a nova', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    await expect(api.changePassword('velha123', 'nova4567')).resolves.toBeUndefined();
    expect(lastCall()).toMatchObject({
      url: `${BASE}/me/password`,
      method: 'POST',
      body: { currentPassword: 'velha123', newPassword: 'nova4567' },
    });
  });
});

describe('PUT /me/preferences', () => {
  it('envia o objeto de preferências inteiro', async () => {
    const preferences: Preferences = {
      notifications: { transactions: true, invoices: false, goals: true, weeklySummary: false },
    };
    fetchMock.mockResolvedValue(jsonResponse(preferences));

    await expect(api.updatePreferences(preferences)).resolves.toEqual(preferences);
    expect(lastCall()).toMatchObject({
      url: `${BASE}/me/preferences`,
      method: 'PUT',
      body: preferences,
    });
  });
});

describe('/members/:id', () => {
  it('PATCH envia o novo acesso', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'marcelo', access: 'leitura' }));
    await api.updateMemberAccess('marcelo', 'leitura');
    expect(lastCall()).toMatchObject({
      url: `${BASE}/members/marcelo`,
      method: 'PATCH',
      body: { access: 'leitura' },
    });
  });

  it('DELETE remove o membro e aceita 204 sem corpo', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    await expect(api.removeMember('marcelo')).resolves.toBeUndefined();
    expect(lastCall()).toMatchObject({ url: `${BASE}/members/marcelo`, method: 'DELETE' });
  });
});

describe('PUT /accounts/:id/sharing', () => {
  it('envia o flag de compartilhamento', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'corrente', ownerId: 'casal' }));
    await api.setAccountShared('corrente', true);
    expect(lastCall()).toMatchObject({
      url: `${BASE}/accounts/corrente/sharing`,
      method: 'PUT',
      body: { shared: true },
    });
  });

  it('desfaz o compartilhamento com shared: false', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'corrente', ownerId: 'ana' }));
    await api.setAccountShared('corrente', false);
    expect(lastCall().body).toEqual({ shared: false });
  });
});

describe('CRUD de contas', () => {
  const input = {
    name: 'Cartão Novo',
    kind: 'cartao' as const,
    ownerId: 'ana' as const,
    bank: 'nubank',
    brandColor: '#8a05be',
    balance: 0,
    limit: 5000,
    invoice: 0,
  };

  it('POST /accounts cria e devolve a conta com id do servidor', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...input, id: 'a99' }));
    await expect(api.createAccount(input)).resolves.toMatchObject({ id: 'a99' });
    const call = lastCall();
    expect(call).toMatchObject({ url: `${BASE}/accounts`, method: 'POST', body: input });
    expect(call.body).not.toHaveProperty('id');
  });

  it('PUT /accounts/:id edita a conta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...input, id: 'nubank' }));
    await api.updateAccount('nubank', input);
    expect(lastCall()).toMatchObject({
      url: `${BASE}/accounts/nubank`,
      method: 'PUT',
      body: input,
    });
  });

  it('DELETE /accounts/:id exclui e aceita 204 sem corpo', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    await expect(api.deleteAccount('nubank')).resolves.toBeUndefined();
    expect(lastCall()).toMatchObject({ url: `${BASE}/accounts/nubank`, method: 'DELETE' });
  });
});

describe('POST /transactions', () => {
  it('envia a transação sem id e devolve a criada pelo servidor', async () => {
    const input: Omit<Transaction, 'id'> = {
      kind: 'gasto',
      description: 'Mercado',
      amount: 156.3,
      category: 'Essenciais',
      accountId: 'nubank',
      date: '2024-05-24',
      ownerId: 'casal',
    };
    fetchMock.mockResolvedValue(jsonResponse({ ...input, id: 't99' }));

    await expect(api.createTransaction(input)).resolves.toMatchObject({ id: 't99' });
    const call = lastCall();
    expect(call).toMatchObject({ url: `${BASE}/transactions`, method: 'POST', body: input });
    expect(call.body).not.toHaveProperty('id');
  });

  it('valores em reais como número e data YYYY-MM-DD, como documenta o README', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.createTransaction({
      kind: 'ganho',
      description: 'Salário',
      amount: 4200,
      category: 'Receita',
      accountId: 'corrente',
      date: '2024-05-23',
      ownerId: 'ana',
    });
    const body = lastCall().body;
    expect(typeof body.amount).toBe('number');
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('POST /goals/:id/quote', () => {
  it('envia o id do orçamento escolhido', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'g4', target: 3200 }));
    await api.chooseGoalQuote('g4', 'q2');
    expect(lastCall()).toMatchObject({
      url: `${BASE}/goals/g4/quote`,
      method: 'POST',
      body: { quoteId: 'q2' },
    });
  });
});

describe('/invites', () => {
  it('POST envia e-mail e contas liberadas', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'inv9' }));
    await api.sendInvite('joana@email.com', ['corrente']);
    expect(lastCall()).toMatchObject({
      url: `${BASE}/invites`,
      method: 'POST',
      body: { email: 'joana@email.com', accountIds: ['corrente'] },
    });
  });

  it('POST /invites/:id/resend reenvia sem corpo', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'inv1', sentDaysAgo: 0 }));
    await api.resendInvite('inv1');
    const call = lastCall();
    expect(call).toMatchObject({ url: `${BASE}/invites/inv1/resend`, method: 'POST' });
    expect(call.body).toBeUndefined();
  });

  it('DELETE /invites/:id cancela e aceita 204', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    await expect(api.cancelInvite('inv1')).resolves.toBeUndefined();
    expect(lastCall()).toMatchObject({ url: `${BASE}/invites/inv1`, method: 'DELETE' });
  });
});

describe('tratamento de erro', () => {
  it('usa a mensagem em pt-BR devolvida pelo backend', async () => {
    fetchMock.mockResolvedValue(errorResponse('E-mail ou senha inválidos.', 401, 'Unauthorized'));
    await expect(api.signIn('a@e.com', 'errada')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'E-mail ou senha inválidos.',
    });
  });

  it('lança ApiError, não Error genérico', async () => {
    fetchMock.mockResolvedValue(errorResponse('falhou', 500, 'Internal Server Error'));
    await expect(api.snapshot()).rejects.toBeInstanceOf(ApiError);
  });

  it('cai para status + statusText quando o corpo não tem message', async () => {
    fetchMock.mockResolvedValue(errorResponse(null, 502, 'Bad Gateway'));
    await expect(api.snapshot()).rejects.toMatchObject({
      status: 502,
      message: '502 Bad Gateway',
    });
  });

  it('cai para status + statusText quando o JSON não traz o campo message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({ erro: 'outro formato' }),
    });
    await expect(api.snapshot()).rejects.toMatchObject({ message: '422 Unprocessable Entity' });
  });

  it('propaga falha de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(api.snapshot()).rejects.toThrow('Network request failed');
  });

  it('erro em qualquer endpoint vira ApiError', async () => {
    fetchMock.mockResolvedValue(errorResponse('Conta não encontrada.', 404, 'Not Found'));
    await expect(api.setAccountShared('x', true)).rejects.toMatchObject({
      status: 404,
      message: 'Conta não encontrada.',
    });
  });
});

describe('ApiError', () => {
  it('carrega mensagem, status e nome', () => {
    const error = new ApiError('Deu ruim.', 418);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Deu ruim.');
    expect(error.status).toBe(418);
    expect(error.name).toBe('ApiError');
  });
});

describe('URL base', () => {
  it('não duplica barras ao montar a rota', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.snapshot();
    expect(lastCall().url).toBe('http://localhost:8080/snapshot');
    expect(lastCall().url).not.toContain('//snapshot');
  });
});
