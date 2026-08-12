import { act, fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import TransacaoFormScreen from '@/app/transacao/[id]';
import { api } from '@/services/api';

import { resetRouter, router, setRouteParams } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  setRouteParams({ id: 'nova' });
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
    await renderScreen(<TransacaoFormScreen />);
    expect(screen.getByText('Nova transação')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('0,00')).toBeOnTheScreen();
    expect(screen.getByText('Conta corrente conjunta')).toBeOnTheScreen();
    expect(screen.getByText('Essenciais')).toBeOnTheScreen();
    expect(screen.getByText('24/05/2024')).toBeOnTheScreen();
    expect(screen.getByText('Ana')).toBeOnTheScreen();
  });

  it('formata o valor digitado em reais', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('15630');
    expect(screen.getByDisplayValue('156,30')).toBeOnTheScreen();
  });

  it('não salva com valor zerado', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);
    await salvar();
    expect(create).not.toHaveBeenCalled();
  });

  it('salva um gasto com os dados do formulário', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);

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
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('1000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ description: 'Essenciais' })),
    );
  });

  it('fecha a tela depois de salvar', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('1000');
    await salvar();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('trocar o tipo troca a categoria padrão', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await userEvent.press(screen.getByText('Ganho'));
    await waitFor(() => expect(screen.getByText('Receita')).toBeOnTheScreen());
    expect(screen.queryByText('Essenciais')).toBeNull();
  });

  it('salva um ganho', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
    expect(screen.queryByText('Destino')).toBeNull();

    await userEvent.press(screen.getByText('Transf.'));
    expect(await screen.findByText('Destino')).toBeOnTheScreen();
    expect(screen.getByText('Poupança')).toBeOnTheScreen();
  });

  it('transferência envia a conta de destino', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
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
    await renderScreen(<TransacaoFormScreen />);
    fireEvent(screen.getByLabelText('Recorrência'), 'valueChange', true);
    await digitarValor('5000');
    await salvar();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ recurring: true })),
    );
  });

  it('o X fecha sem salvar', async () => {
    const create = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);
    await userEvent.press(screen.getByLabelText('Fechar'));
    expect(router.back).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('erro do backend aparece na tela e o formulário continua aberto', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue(new Error('Saldo insuficiente.'));
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('5000');
    await salvar();

    expect(await screen.findByText('Saldo insuficiente.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('50,00')).toBeOnTheScreen();
  });

  it('erro sem mensagem cai no texto genérico', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue('pane');
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('5000');
    await salvar();

    expect(await screen.findByText('Não foi possível salvar a transação.')).toBeOnTheScreen();
  });
});

describe('Editar transação', () => {
  /** `t2` do seed: gasto de R$ 156,30 em Essenciais, no Nubank, pago pelo casal. */
  const abrirT2 = async () => {
    setRouteParams({ id: 't2' });
    await renderScreen(<TransacaoFormScreen />);
  };

  it('abre com os dados do lançamento preenchidos', async () => {
    await abrirT2();
    expect(screen.getByText('Editar transação')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('156,30')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Mercado')).toBeOnTheScreen();
    expect(screen.getByText('Nubank (casal)')).toBeOnTheScreen();
    expect(screen.getByText('Essenciais')).toBeOnTheScreen();
    expect(screen.getByText('Casal (compartilhado)')).toBeOnTheScreen();
  });

  it('salvar manda o id e os campos alterados', async () => {
    const update = jest.spyOn(api, 'updateTransaction');
    await abrirT2();

    await userEvent.press(screen.getByText('Essenciais'));
    await userEvent.press(await screen.findByText('Lazer'));
    await salvar();

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe('t2');
    expect(update.mock.calls[0][1]).toMatchObject({
      description: 'Mercado',
      amount: 156.3,
      category: 'Lazer',
      accountId: 'nubank',
    });
  });

  it('oferece a data original mesmo fora dos dias recentes', async () => {
    // `t15` é de 03/05, anterior à janela de 14 dias a partir de 24/05.
    setRouteParams({ id: 't15' });
    await renderScreen(<TransacaoFormScreen />);
    await userEvent.press(screen.getByText('03/05/2024'));

    const opcoes = await screen.findAllByText('03/05/2024');
    // Uma no formulário e outra como opção selecionável no picker.
    expect(opcoes).toHaveLength(2);
  });

  it('excluir pede confirmação antes', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await abrirT2();
    await userEvent.press(screen.getByText('Excluir transação'));

    expect(alert).toHaveBeenCalledWith(
      'Excluir transação?',
      expect.stringContaining('Mercado'),
      expect.arrayContaining([expect.objectContaining({ text: 'Excluir' })]),
    );
  });

  it('confirmar a exclusão chama a API e fecha a tela', async () => {
    const remove = jest.spyOn(api, 'deleteTransaction');
    let confirmar: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_titulo, _msg, botoes) => {
      confirmar = botoes?.find((botao) => botao.text === 'Excluir')?.onPress;
    });

    await abrirT2();
    await userEvent.press(screen.getByText('Excluir transação'));
    await act(async () => confirmar?.());

    expect(remove).toHaveBeenCalledWith('t2');
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('a tela de criar não oferece excluir', async () => {
    await renderScreen(<TransacaoFormScreen />);
    expect(screen.queryByText('Excluir transação')).toBeNull();
  });
});

describe('Dividir a conta', () => {
  const ligarDivisao = async () =>
    fireEvent(screen.getByLabelText('Dividir com alguém'), 'valueChange', true);

  it('só aparece em gastos', async () => {
    await renderScreen(<TransacaoFormScreen />);
    expect(screen.getByText('Dividir com alguém')).toBeOnTheScreen();

    await userEvent.press(screen.getByText('Ganho'));
    await waitFor(() => expect(screen.queryByText('Dividir com alguém')).toBeNull());
  });

  it('lista as pessoas cadastradas ao ligar a divisão', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await ligarDivisao();

    expect(await screen.findByText('João Pedro')).toBeOnTheScreen();
    expect(screen.getByText('Camila')).toBeOnTheScreen();
    expect(screen.getByText('Marque quem entrou na conta.')).toBeOnTheScreen();
  });

  it('marcar alguém racha o valor em partes iguais com você', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('6000');
    await ligarDivisao();
    await userEvent.press(await screen.findByLabelText('João Pedro'));

    expect(await screen.findByDisplayValue('30,00')).toBeOnTheScreen();
    expect(screen.getByText('Sua parte: R$ 30,00 · a receber: R$ 30,00')).toBeOnTheScreen();
  });

  it('com duas pessoas a conta racha em três', async () => {
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('15630');
    await ligarDivisao();
    await userEvent.press(await screen.findByLabelText('João Pedro'));
    await userEvent.press(screen.getByLabelText('Camila'));

    expect(await screen.findAllByDisplayValue('52,10')).toHaveLength(2);
    expect(screen.getByText('Sua parte: R$ 52,10 · a receber: R$ 104,20')).toBeOnTheScreen();
  });

  it('salva o gasto e a dívida de cada pessoa ligada a ele', async () => {
    const criarDivisoes = jest.spyOn(api, 'createSplits');
    await renderScreen(<TransacaoFormScreen />);

    await digitarValor('6000');
    await userEvent.type(screen.getByPlaceholderText('Adicionar'), 'Pizza');
    await ligarDivisao();
    await userEvent.press(await screen.findByLabelText('João Pedro'));
    await salvar();

    await waitFor(() =>
      expect(criarDivisoes).toHaveBeenCalledWith([
        {
          ownerId: 'ana',
          contactId: 'c1',
          direction: 'a-receber',
          description: 'Pizza',
          amount: 30,
          date: '2024-05-24',
          transactionId: expect.any(String),
        },
      ]),
    );
  });

  it('dá para ajustar a parte de cada um na mão', async () => {
    const criarDivisoes = jest.spyOn(api, 'createSplits');
    await renderScreen(<TransacaoFormScreen />);

    await digitarValor('10000');
    await ligarDivisao();
    await userEvent.press(await screen.findByLabelText('João Pedro'));
    fireEvent.changeText(screen.getByLabelText('Parte de João Pedro'), '2000');
    await salvar();

    await waitFor(() =>
      expect(criarDivisoes).toHaveBeenCalledWith([expect.objectContaining({ amount: 20 })]),
    );
  });

  it('não salva se as partes passarem do valor do gasto', async () => {
    const criar = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);

    await digitarValor('5000');
    await ligarDivisao();
    await userEvent.press(await screen.findByLabelText('João Pedro'));
    fireEvent.changeText(screen.getByLabelText('Parte de João Pedro'), '9000');

    expect(
      await screen.findByText('As partes somam mais que o valor do lançamento.'),
    ).toBeOnTheScreen();
    await salvar();
    expect(criar).not.toHaveBeenCalled();
  });

  it('não salva com a divisão ligada e ninguém marcado', async () => {
    const criar = jest.spyOn(api, 'createTransaction');
    await renderScreen(<TransacaoFormScreen />);
    await digitarValor('5000');
    await ligarDivisao();
    await salvar();

    expect(criar).not.toHaveBeenCalled();
  });

  it('cadastra uma pessoa nova sem sair do formulário', async () => {
    const criarPessoa = jest.spyOn(api, 'createContact');
    await renderScreen(<TransacaoFormScreen />);

    await digitarValor('4000');
    await ligarDivisao();
    await userEvent.type(await screen.findByPlaceholderText('Adicionar pessoa'), 'Bruna');
    await userEvent.press(screen.getByLabelText('Adicionar pessoa'));

    await waitFor(() =>
      expect(criarPessoa).toHaveBeenCalledWith({ name: 'Bruna', initial: 'B', ownerId: 'ana' }),
    );
    // Entra já marcada no rateio: R$ 40 entre você e ela.
    expect(await screen.findByDisplayValue('20,00')).toBeOnTheScreen();
  });

  it('editar um gasto já dividido abre com as pessoas marcadas', async () => {
    setRouteParams({ id: 't2' });
    await renderScreen(<TransacaoFormScreen />);

    expect(screen.getAllByDisplayValue('52,10')).toHaveLength(2);
    expect(screen.getByText('Sua parte: R$ 52,10 · a receber: R$ 104,20')).toBeOnTheScreen();
  });

  it('salvar a edição regrava as divisões pendentes do lançamento', async () => {
    const apagar = jest.spyOn(api, 'deleteSplit');
    const criarDivisoes = jest.spyOn(api, 'createSplits');

    setRouteParams({ id: 't2' });
    await renderScreen(<TransacaoFormScreen />);
    await userEvent.press(screen.getByLabelText('Camila'));
    await salvar();

    await waitFor(() => expect(apagar).toHaveBeenCalledTimes(2));
    expect(apagar.mock.calls.map(([splitId]) => splitId)).toEqual(['sp1', 'sp2']);
    await waitFor(() =>
      expect(criarDivisoes).toHaveBeenCalledWith([
        expect.objectContaining({ contactId: 'c1', amount: 78.15 }),
      ]),
    );
  });

  it('desligar a divisão apaga as dívidas pendentes do lançamento', async () => {
    const apagar = jest.spyOn(api, 'deleteSplit');
    const criarDivisoes = jest.spyOn(api, 'createSplits');

    setRouteParams({ id: 't2' });
    await renderScreen(<TransacaoFormScreen />);
    fireEvent(screen.getByLabelText('Dividir com alguém'), 'valueChange', false);
    await salvar();

    await waitFor(() => expect(apagar).toHaveBeenCalledTimes(2));
    expect(criarDivisoes).not.toHaveBeenCalled();
  });
});
