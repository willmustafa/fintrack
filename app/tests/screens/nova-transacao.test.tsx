import { fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';

import NovaTransacaoScreen from '@/app/transacao/nova';
import { api } from '@/services/api';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

/** Digita o valor no teclado numérico (o campo formata em centavos). */
const digitarValor = async (digitos: string) => {
  const campo = screen.getByDisplayValue('0,00');
  await userEvent.type(campo, digitos);
};

const salvar = () => userEvent.press(screen.getByLabelText('Salvar'));

describe('Nova transação', () => {
  it('abre no tipo Gasto com os padrões do formulário', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    expect(screen.getByText('Nova transação')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('0,00')).toBeOnTheScreen();
    expect(screen.getByText('Conta corrente conjunta')).toBeOnTheScreen();
    expect(screen.getByText('Essenciais')).toBeOnTheScreen();
    expect(screen.getByText('24/05/2024')).toBeOnTheScreen();
    expect(screen.getByText('Ana')).toBeOnTheScreen();
  });

  it('formata o valor digitado em reais', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    await digitarValor('15630');
    expect(screen.getByDisplayValue('156,30')).toBeOnTheScreen();
  });

  it('não salva com valor zerado', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await salvar();
    expect(create).not.toHaveBeenCalled();
  });

  it('salva um gasto com os dados do formulário', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);

    await digitarValor('15630');
    await userEvent.type(screen.getByPlaceholderText('Adicionar'), 'Mercado');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        kind: 'gasto',
        amount: 156.3,
        category: 'Essenciais',
        accountId: 'corrente',
        toAccountId: undefined,
        date: '2024-05-24',
        ownerId: 'ana',
        description: 'Mercado',
        recurring: false,
      }),
    );
  });

  it('sem descrição usa a categoria como descrição', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await digitarValor('1000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ description: 'Essenciais' })),
    );
  });

  it('fecha a tela depois de salvar', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    await digitarValor('1000');
    await salvar();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('trocar o tipo troca a categoria padrão', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Ganho'));
    await waitFor(() => expect(screen.getByText('Receita')).toBeOnTheScreen());
    expect(screen.queryByText('Essenciais')).toBeNull();
  });

  it('salva um ganho', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Ganho'));
    await digitarValor('420000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'ganho', amount: 4200, category: 'Receita' }),
      ),
    );
  });

  it('salva um aporte', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Aporte'));
    await digitarValor('30000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'aporte', category: 'Investimentos' }),
      ),
    );
  });

  it('transferência revela o campo de destino', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    expect(screen.queryByText('Destino')).toBeNull();

    await userEvent.press(screen.getByText('Transf.'));
    expect(await screen.findByText('Destino')).toBeOnTheScreen();
    expect(screen.getByText('Poupança')).toBeOnTheScreen();
  });

  it('transferência envia a conta de destino', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Transf.'));
    await digitarValor('50000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'transferencia',
          accountId: 'corrente',
          toAccountId: 'poupanca',
        }),
      ),
    );
  });

  it('o picker de destino não oferece a conta de origem', async () => {
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Transf.'));
    await userEvent.press(await screen.findByText('Destino'));

    const titulo = await screen.findByText('Conta de destino');
    expect(titulo).toBeOnTheScreen();
    // "Conta corrente conjunta" segue visível no formulário, mas não como opção:
    // o picker lista as outras três contas.
    expect(screen.getAllByText('Conta corrente conjunta')).toHaveLength(1);
  });

  it('troca a conta pelo picker', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Conta corrente conjunta'));
    await userEvent.press(await screen.findByText('Nubank (casal)'));
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'nubank' })),
    );
  });

  it('troca a categoria pelo picker', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Essenciais'));
    await userEvent.press(await screen.findByText('Lazer'));
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ category: 'Lazer' })),
    );
  });

  it('troca a data pelo picker de dias recentes', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('24/05/2024'));
    await userEvent.press(await screen.findByText('Ontem'));
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ date: '2024-05-23' })),
    );
  });

  it('troca quem pagou', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByText('Ana'));
    await userEvent.press(await screen.findByText('Casal (compartilhado)'));
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'casal' })),
    );
  });

  it('marca a transação como recorrente', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ recurring: true })),
    );
  });

  it('o X fecha sem salvar', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<NovaTransacaoScreen />);
    await userEvent.press(screen.getByLabelText('Fechar'));
    expect(router.back).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('erro do backend aparece na tela e o formulário continua aberto', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue(new Error('Saldo insuficiente.'));
    await renderScreen(<NovaTransacaoScreen />);
    await digitarValor('5000');
    await salvar();

    expect(await screen.findByText('Saldo insuficiente.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('50,00')).toBeOnTheScreen();
  });

  it('erro sem mensagem cai no texto genérico', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue('pane');
    await renderScreen(<NovaTransacaoScreen />);
    await digitarValor('5000');
    await salvar();

    expect(await screen.findByText('Não foi possível salvar a transação.')).toBeOnTheScreen();
  });
});
