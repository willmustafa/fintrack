import { screen, userEvent, waitFor } from '@testing-library/react-native';

import AmortizacaoScreen from '@/app/financiamento/amortizacao';
import FinanciamentoScreen from '@/app/financiamento/index';
import { api } from '@/services/api';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

/** Snapshot sem financiamento, para o estado vazio das duas telas. */
const semFinanciamento = async () => {
  const original = await jest.requireActual<typeof import('@/services/api')>(
    '@/services/api',
  ).api.snapshot();
  jest.spyOn(api, 'snapshot').mockResolvedValue({ ...original, loans: [] });
};

describe('Financiamento · visão geral', () => {
  it('mostra o nome, saldo devedor e percentual quitado', async () => {
    await renderScreen(<FinanciamentoScreen />);
    expect(screen.getByText('Casa · Jardim das Flores')).toBeOnTheScreen();
    expect(screen.getByText('R$ 312.400')).toBeOnTheScreen();
    expect(screen.getByText('30,6% quitado')).toBeOnTheScreen();
    expect(screen.getByText('Total R$ 450.000')).toBeOnTheScreen();
  });

  it('rateia a entrada entre Ana e Marcelo', async () => {
    await renderScreen(<FinanciamentoScreen />);
    expect(screen.getByText('Entrada — R$ 70.000')).toBeOnTheScreen();
    expect(screen.getByText('Ana · R$ 40.000 (57%)')).toBeOnTheScreen();
    expect(screen.getByText('Marcelo · R$ 30.000 (43%)')).toBeOnTheScreen();
  });

  it('mostra as parcelas pagas por pessoa', async () => {
    await renderScreen(<FinanciamentoScreen />);
    expect(screen.getAllByText('42 parcelas pagas')).toHaveLength(2);
    expect(screen.getByText('R$ 58.800')).toBeOnTheScreen();
    expect(screen.getByText('R$ 44.100')).toBeOnTheScreen();
  });

  it('mostra quitação prevista e taxa', async () => {
    await renderScreen(<FinanciamentoScreen />);
    expect(screen.getByText('mar/2044')).toBeOnTheScreen();
    expect(screen.getByText('TR + 9,8% a.a.')).toBeOnTheScreen();
  });

  it('leva para a amortização detalhada', async () => {
    await renderScreen(<FinanciamentoScreen />);
    await userEvent.press(screen.getByText('Ver amortização detalhada'));
    expect(router.push).toHaveBeenCalledWith('/financiamento/amortizacao');
  });

  it('sem financiamento mostra o estado vazio', async () => {
    await semFinanciamento();
    await renderScreen(<FinanciamentoScreen />);
    expect(screen.getByText('Nenhum financiamento cadastrado.')).toBeOnTheScreen();
  });
});

describe('Financiamento · amortização', () => {
  it('começa na visão do casal com os valores cheios', async () => {
    await renderScreen(<AmortizacaoScreen />);
    expect(screen.getByText('Amortização')).toBeOnTheScreen();
    expect(screen.getByText('R$ 61.200')).toBeOnTheScreen();
    expect(screen.getByText('R$ 76.400')).toBeOnTheScreen();
  });

  it('lista as cinco parcelas com juros, amortização e saldo', async () => {
    await renderScreen(<AmortizacaoScreen />);
    for (const numero of ['84', '85', '86', '87', '88']) {
      expect(screen.getByText(numero)).toBeOnTheScreen();
    }
    expect(screen.getByText('R$ 1.480')).toBeOnTheScreen();
    expect(screen.getByText('R$ 312.400')).toBeOnTheScreen();
  });

  it('não mostra o rodapé de rateio na visão do casal', async () => {
    await renderScreen(<AmortizacaoScreen />);
    expect(screen.queryByText(/Valores proporcionais/)).toBeNull();
  });

  it('trocar para Ana aplica a fatia dela', async () => {
    await renderScreen(<AmortizacaoScreen />);
    await userEvent.press(screen.getByText('Ana'));

    // Ana pagou 58.800 de 102.900 → 57% das parcelas.
    expect(await screen.findByText(/Valores proporcionais à participação de Ana/)).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('R$ 34.971')).toBeOnTheScreen());
  });

  it('trocar para Marcelo aplica a fatia dele', async () => {
    await renderScreen(<AmortizacaoScreen />);
    await userEvent.press(screen.getByText('Marcelo'));
    expect(
      await screen.findByText(/Valores proporcionais à participação de Marcelo/),
    ).toBeOnTheScreen();
  });

  it('o saldo devedor da parcela não é rateado', async () => {
    await renderScreen(<AmortizacaoScreen />);
    await userEvent.press(screen.getByText('Ana'));
    // O saldo é do contrato, não da pessoa — segue cheio.
    await waitFor(() => expect(screen.getByText('R$ 312.400')).toBeOnTheScreen());
  });

  it('voltar para Casal restaura os valores cheios', async () => {
    await renderScreen(<AmortizacaoScreen />);
    await userEvent.press(screen.getByText('Ana'));
    await waitFor(() => expect(screen.getByText('R$ 34.971')).toBeOnTheScreen());

    await userEvent.press(screen.getByText('Casal'));
    await waitFor(() => expect(screen.getByText('R$ 61.200')).toBeOnTheScreen());
  });

  it('sem financiamento mostra o estado vazio', async () => {
    await semFinanciamento();
    await renderScreen(<AmortizacaoScreen />);
    expect(screen.getByText('Nenhum financiamento cadastrado.')).toBeOnTheScreen();
  });
});
