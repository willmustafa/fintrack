import { screen, userEvent, waitFor } from '@testing-library/react-native';

import ContaFormScreen from '@/app/conta/[id]';
import { api } from '@/services/api';

import { resetRouter, router, setRouteParams } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

describe('Nova conta / cartão', () => {
  it('começa vazio quando o id é "nova"', async () => {
    setRouteParams({ id: 'nova' });
    await renderScreen(<ContaFormScreen />);
    expect(screen.getByText('Nova conta')).toBeOnTheScreen();
    expect(screen.getByText('Saldo')).toBeOnTheScreen();
  });

  it('com ?kind=cartao mostra os campos de cartão', async () => {
    setRouteParams({ id: 'nova', kind: 'cartao' });
    await renderScreen(<ContaFormScreen />);
    expect(screen.getByText('Limite')).toBeOnTheScreen();
    expect(screen.getByText('Fatura atual')).toBeOnTheScreen();
    expect(screen.getByText('Fecha dia')).toBeOnTheScreen();
    expect(screen.getByText('Vence dia')).toBeOnTheScreen();
  });

  it('salvar chama a API e volta', async () => {
    const create = jest.spyOn(api, 'createAccount');
    setRouteParams({ id: 'nova' });
    await renderScreen(<ContaFormScreen />);

    await userEvent.type(screen.getByPlaceholderText('Ex.: Conta corrente'), 'Conta teste');
    await userEvent.press(screen.getByLabelText('Salvar'));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ name: 'Conta teste', kind: 'corrente' });
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('não salva sem nome', async () => {
    const create = jest.spyOn(api, 'createAccount');
    setRouteParams({ id: 'nova' });
    await renderScreen(<ContaFormScreen />);

    await userEvent.press(screen.getByLabelText('Salvar'));
    expect(create).not.toHaveBeenCalled();
  });
});

describe('Editar conta existente', () => {
  it('pré-preenche os dados do cartão do seed', async () => {
    setRouteParams({ id: 'nubank' });
    await renderScreen(<ContaFormScreen />);
    expect(screen.getByText('Editar')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Nubank (casal)')).toBeOnTheScreen();
    // Fatura atual 830 e limite 6000 vêm do seed.
    expect(screen.getByDisplayValue('6.000,00')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('830,00')).toBeOnTheScreen();
  });

  it('editar chama updateAccount com o id da conta', async () => {
    const update = jest.spyOn(api, 'updateAccount');
    setRouteParams({ id: 'nubank' });
    await renderScreen(<ContaFormScreen />);

    await userEvent.press(screen.getByLabelText('Salvar'));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe('nubank');
  });

  it('oferece excluir a conta editada', async () => {
    setRouteParams({ id: 'nubank' });
    await renderScreen(<ContaFormScreen />);
    expect(screen.getByText('Excluir cartão')).toBeOnTheScreen();
  });
});
