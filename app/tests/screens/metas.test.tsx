import { screen, userEvent, waitFor } from '@testing-library/react-native';

import MetaDetalheScreen from '@/app/metas/[id]';
import MetasScreen from '@/app/metas/index';
import { api } from '@/services/api';

import { resetRouter, router, setRouteParams } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

describe('Lista de metas', () => {
  it('lista as quatro metas do seed', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getByText('Viagem Japão')).toBeOnTheScreen();
    expect(screen.getByText('Reserva de emergência')).toBeOnTheScreen();
    expect(screen.getByText('Notebook')).toBeOnTheScreen();
    expect(screen.getByText('Sofá novo')).toBeOnTheScreen();
  });

  it('mostra o progresso em porcentagem', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getByText('82%')).toBeOnTheScreen();
    expect(screen.getByText('60%')).toBeOnTheScreen();
    expect(screen.getByText('30%')).toBeOnTheScreen();
  });

  it('mostra guardado / alvo e o prazo', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getByText('R$ 9.800 / R$ 12.000')).toBeOnTheScreen();
    expect(screen.getByText('Prazo: dez/24')).toBeOnTheScreen();
  });

  it('meta sem prazo diz "Sem prazo"', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getAllByText('Sem prazo').length).toBeGreaterThan(0);
  });

  it('meta sem alvo aparece como "a definir" com o orçamento escolhido', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getByText('a definir')).toBeOnTheScreen();
    expect(screen.getByText('orçamento escolhido R$ 2.850')).toBeOnTheScreen();
  });

  it('mostra o investimento vinculado', async () => {
    await renderScreen(<MetasScreen />);
    expect(screen.getByText('↳ vinculada: Tesouro Selic')).toBeOnTheScreen();
  });

  it('tocar numa meta abre o detalhe', async () => {
    await renderScreen(<MetasScreen />);
    await userEvent.press(screen.getByText('Notebook'));
    expect(router.push).toHaveBeenCalledWith('/metas/g3');
  });
});

describe('Detalhe da meta', () => {
  it('meta inexistente mostra o aviso', async () => {
    setRouteParams({ id: 'nao-existe' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('Meta não encontrada.')).toBeOnTheScreen();
  });

  it('meta com alvo mostra valor, guardado e prazo', async () => {
    setRouteParams({ id: 'g1' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('R$ 12.000')).toBeOnTheScreen();
    expect(screen.getByText('R$ 9.800 guardados')).toBeOnTheScreen();
    expect(screen.getByText('dez/2024')).toBeOnTheScreen();
  });

  it('meta com alvo e sem prazo diz "Sem prazo"', async () => {
    setRouteParams({ id: 'g2' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('Sem prazo')).toBeOnTheScreen();
  });

  it('mostra o investimento vinculado com o saldo', async () => {
    setRouteParams({ id: 'g1' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('Vinculada a Tesouro Selic')).toBeOnTheScreen();
    expect(screen.getByText('Saldo atual R$ 8.640')).toBeOnTheScreen();
  });

  it('meta sem alvo pede a escolha de um orçamento', async () => {
    setRouteParams({ id: 'g4' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('—')).toBeOnTheScreen();
    expect(screen.getByText('Ainda não definido — escolha um orçamento')).toBeOnTheScreen();
  });

  it('lista os três orçamentos para comparar', async () => {
    setRouteParams({ id: 'g4' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('Comparar orçamentos · 3 opções')).toBeOnTheScreen();
    expect(screen.getByText('Sofá retrátil 3L')).toBeOnTheScreen();
    expect(screen.getByText('Etna')).toBeOnTheScreen();
    expect(screen.getByText('R$ 3.200')).toBeOnTheScreen();
  });

  it('marca qual orçamento já está escolhido', async () => {
    setRouteParams({ id: 'g4' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.getByText('Escolhida')).toBeOnTheScreen();
    expect(screen.getAllByText('Escolher esta ›')).toHaveLength(2);
  });

  it('escolher outro orçamento chama a API e vira o alvo da meta', async () => {
    const choose = jest.spyOn(api, 'chooseGoalQuote');
    setRouteParams({ id: 'g4' });
    await renderScreen(<MetaDetalheScreen />);

    await userEvent.press(screen.getAllByText('Escolher esta ›')[0]);

    await waitFor(() => expect(choose).toHaveBeenCalledWith('g4', 'q2'));
    expect(await screen.findByText('R$ 3.200', { exact: false })).toBeOnTheScreen();
  });

  it('o botão confirma o orçamento já escolhido', async () => {
    const choose = jest.spyOn(api, 'chooseGoalQuote');
    setRouteParams({ id: 'g4' });
    await renderScreen(<MetaDetalheScreen />);

    await userEvent.press(screen.getByText('Confirmar orçamento · R$ 2.850'));
    await waitFor(() => expect(choose).toHaveBeenCalledWith('g4', 'q1'));
  });

  it('meta sem orçamentos não mostra a comparação', async () => {
    setRouteParams({ id: 'g2' });
    await renderScreen(<MetaDetalheScreen />);
    expect(screen.queryByText(/Comparar orçamentos/)).toBeNull();
  });
});
