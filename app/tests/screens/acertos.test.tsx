/**
 * Divisão de contas: a lista de quem deve, o detalhe de cada pessoa, o acerto
 * e o cadastro de nomes. Tudo roda sobre o seed, então os números aqui são os
 * mesmos que aparecem no app com dados de exemplo.
 */
import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import AcertarScreen from '@/app/acertos/acertar';
import AcertoPessoaScreen from '@/app/acertos/[id]';
import AcertosScreen from '@/app/acertos/index';
import NovaDivisaoScreen from '@/app/acertos/nova';
import PessoasScreen from '@/app/acertos/pessoas';
import { api } from '@/services/api';

import { resetRouter, router, setRouteParams } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  setRouteParams({});
  jest.restoreAllMocks();
});

describe('Acertos', () => {
  it('mostra o total a receber e a pagar da pessoa logada', async () => {
    await renderScreen(<AcertosScreen />);

    expect(screen.getByText('Te devem')).toBeOnTheScreen();
    expect(screen.getByText('R$ 104,20')).toBeOnTheScreen();
    expect(screen.getByText('Você deve')).toBeOnTheScreen();
    expect(screen.getByText('R$ 145,00')).toBeOnTheScreen();
  });

  it('lista cada pessoa com o saldo em aberto', async () => {
    await renderScreen(<AcertosScreen />);

    expect(screen.getByText('João Pedro')).toBeOnTheScreen();
    expect(screen.getByText('Camila')).toBeOnTheScreen();
    expect(screen.getByText('Marcelo Souza')).toBeOnTheScreen();
    // João: R$ 52,10 do mercado menos os R$ 45 do Uber.
    expect(screen.getByText('R$ 7,10')).toBeOnTheScreen();
    expect(screen.getAllByText('te deve')).toHaveLength(2);
    expect(screen.getByText('você deve')).toBeOnTheScreen();
  });

  it('o filtro "Eu devo" deixa só quem eu devo', async () => {
    await renderScreen(<AcertosScreen />);
    await userEvent.press(screen.getByText('Eu devo'));

    await waitFor(() => expect(screen.queryByText('Camila')).toBeNull());
    expect(screen.getByText('Marcelo Souza')).toBeOnTheScreen();
  });

  it('o filtro "Me devem" esconde quem eu devo', async () => {
    await renderScreen(<AcertosScreen />);
    await userEvent.press(screen.getByText('Me devem'));

    await waitFor(() => expect(screen.queryByText('Marcelo Souza')).toBeNull());
    expect(screen.getByText('Camila')).toBeOnTheScreen();
  });

  it('abre o detalhe da pessoa', async () => {
    await renderScreen(<AcertosScreen />);
    await userEvent.press(screen.getByText('Camila'));
    expect(router.push).toHaveBeenCalledWith('/acertos/c2');
  });

  it('leva para nova divisão e para o cadastro de pessoas', async () => {
    await renderScreen(<AcertosScreen />);
    await userEvent.press(screen.getByText('Nova divisão'));
    expect(router.push).toHaveBeenCalledWith('/acertos/nova');

    await userEvent.press(screen.getByText('Pessoas'));
    expect(router.push).toHaveBeenCalledWith('/acertos/pessoas');
  });
});

describe('Acertos · pessoa', () => {
  const abrir = async (id: string) => {
    setRouteParams({ id });
    await renderScreen(<AcertoPessoaScreen />);
  };

  it('separa o que está em aberto do que já foi acertado', async () => {
    await abrir('c2');

    expect(screen.getByText('EM ABERTO')).toBeOnTheScreen();
    expect(screen.getByText('Mercado')).toBeOnTheScreen();
    expect(screen.getByText('ACERTADOS')).toBeOnTheScreen();
    expect(screen.getByText('Rodízio de aniversário')).toBeOnTheScreen();
    expect(screen.getByText(/acertado em 28\/04\/2024/)).toBeOnTheScreen();
  });

  it('mostra o saldo da pessoa e de que lado ele está', async () => {
    await abrir('c3');
    expect(screen.getByText('R$ 100,00')).toBeOnTheScreen();
    expect(screen.getByText('você deve para Marcelo Souza')).toBeOnTheScreen();
  });

  it('avisa quando a pessoa também usa o app', async () => {
    await abrir('c3');
    expect(
      screen.getByText(/Marcelo Souza também usa o FinTrack/),
    ).toBeOnTheScreen();
  });

  it('a dívida lançada pelo outro aparece identificada', async () => {
    await abrir('c3');
    expect(screen.getByText(/lançado por quem divide com você/)).toBeOnTheScreen();
  });

  it('só dá para acertar depois de escolher as divisões', async () => {
    await abrir('c2');
    expect(screen.getByText('Selecione para acertar')).toBeOnTheScreen();

    await userEvent.press(screen.getByLabelText('Mercado'));
    expect(await screen.findByText('Registrar acerto de R$ 52,10')).toBeOnTheScreen();
  });

  it('leva as divisões escolhidas para a tela de acerto', async () => {
    await abrir('c1');
    await userEvent.press(screen.getByLabelText('Mercado'));
    await userEvent.press(screen.getByText('Registrar acerto de R$ 52,10'));

    expect(router.push).toHaveBeenCalledWith('/acertos/acertar?pessoa=c1&ids=sp1');
  });

  it('selecionar os dois lados acerta pelo líquido', async () => {
    await abrir('c1');
    await userEvent.press(screen.getByLabelText('Mercado'));
    await userEvent.press(screen.getByLabelText('Uber do aeroporto'));

    expect(await screen.findByText('Registrar acerto de R$ 7,10')).toBeOnTheScreen();
  });

  it('excluir uma divisão pede confirmação e chama a API', async () => {
    const remover = jest.spyOn(api, 'deleteSplit');
    let confirmar: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_titulo, _mensagem, botoes) => {
      confirmar = botoes?.find((botao) => botao.text === 'Excluir')?.onPress;
    });

    await abrir('c2');
    await userEvent.press(screen.getByLabelText('Opções de Mercado'));
    await userEvent.press(await screen.findByText('Excluir divisão'));
    await act(async () => confirmar?.());

    expect(remover).toHaveBeenCalledWith('sp2');
  });

  it('a divisão de quem compartilha comigo não oferece exclusão', async () => {
    await abrir('c3');
    await userEvent.press(screen.getByLabelText('Opções de Padaria do mês'));

    expect(await screen.findByText('Ver lançamento')).toBeOnTheScreen();
    expect(screen.queryByText('Excluir divisão')).toBeNull();
  });

  it('desfazer o acerto devolve a divisão para as pendências', async () => {
    const reabrir = jest.spyOn(api, 'reopenSplit');
    await abrir('c2');
    await userEvent.press(screen.getByLabelText('Opções de Rodízio de aniversário'));
    await userEvent.press(await screen.findByText('Desfazer acerto'));

    expect(reabrir).toHaveBeenCalledWith('sp3');
  });

  it('abre o lançamento que originou a divisão', async () => {
    await abrir('c2');
    await userEvent.press(screen.getByLabelText('Opções de Mercado'));
    await userEvent.press(await screen.findByText('Ver lançamento'));

    expect(router.push).toHaveBeenCalledWith('/transacao/t2');
  });
});

describe('Registrar acerto', () => {
  const abrir = async (params: { pessoa: string; ids: string }) => {
    setRouteParams(params);
    await renderScreen(<AcertarScreen />);
  };

  it('resume quem paga quanto', async () => {
    await abrir({ pessoa: 'c2', ids: 'sp2' });
    expect(screen.getByText('Camila te paga')).toBeOnTheScreen();
    expect(screen.getByText('R$ 52,10')).toBeOnTheScreen();
    expect(screen.getByText('1 divisão')).toBeOnTheScreen();
  });

  it('quando eu devo, o acerto é um pagamento meu', async () => {
    await abrir({ pessoa: 'c3', ids: 'sp5' });
    expect(screen.getByText('Você paga para Marcelo Souza')).toBeOnTheScreen();
  });

  it('cria o lançamento do recebimento e marca a divisão como acertada', async () => {
    const criar = jest.spyOn(api, 'createTransaction');
    const acertar = jest.spyOn(api, 'settleSplits');

    await abrir({ pessoa: 'c2', ids: 'sp2' });
    await userEvent.press(screen.getByText('Confirmar acerto'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({
        kind: 'ganho',
        amount: 52.1,
        category: 'Acerto',
        accountId: 'corrente',
        date: '2024-05-24',
        ownerId: 'ana',
        description: 'Acerto · Camila',
      }),
    );
    await waitFor(() =>
      expect(acertar).toHaveBeenCalledWith(['sp2'], expect.any(String), '2024-05-24'),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('pagar uma dívida vira um gasto', async () => {
    const criar = jest.spyOn(api, 'createTransaction');
    await abrir({ pessoa: 'c3', ids: 'sp5' });
    await userEvent.press(screen.getByText('Confirmar acerto'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'gasto', amount: 100, category: 'Acerto' }),
      ),
    );
  });

  it('dá para apontar um lançamento que já está no extrato', async () => {
    const criar = jest.spyOn(api, 'createTransaction');
    const acertar = jest.spyOn(api, 'settleSplits');

    await abrir({ pessoa: 'c2', ids: 'sp2' });
    await userEvent.press(screen.getByText('Já lancei'));
    await userEvent.press(await screen.findByText('Lançamento'));
    await userEvent.press(await screen.findByText('Salário'));
    await userEvent.press(screen.getByText('Confirmar acerto'));

    await waitFor(() => expect(acertar).toHaveBeenCalledWith(['sp2'], 't3', '2024-05-23'));
    expect(criar).not.toHaveBeenCalled();
  });

  it('sem escolher o lançamento existente não salva', async () => {
    const acertar = jest.spyOn(api, 'settleSplits');
    await abrir({ pessoa: 'c2', ids: 'sp2' });
    await userEvent.press(screen.getByText('Já lancei'));
    await userEvent.press(screen.getByText('Confirmar acerto'));

    expect(acertar).not.toHaveBeenCalled();
  });

  it('erro do backend aparece na tela', async () => {
    jest.spyOn(api, 'createTransaction').mockRejectedValue(new Error('Conta bloqueada.'));
    await abrir({ pessoa: 'c2', ids: 'sp2' });
    await userEvent.press(screen.getByText('Confirmar acerto'));

    expect(await screen.findByText('Conta bloqueada.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('sem divisões selecionadas avisa e não salva', async () => {
    const acertar = jest.spyOn(api, 'settleSplits');
    await abrir({ pessoa: 'c2', ids: '' });

    expect(screen.getByText('Nenhuma divisão selecionada para acertar.')).toBeOnTheScreen();
    await userEvent.press(screen.getByText('Confirmar acerto'));
    expect(acertar).not.toHaveBeenCalled();
  });
});

describe('Acertos · pessoas', () => {
  it('lista quem já está cadastrado e o vínculo com o app', async () => {
    await renderScreen(<PessoasScreen />);

    expect(screen.getByText('João Pedro')).toBeOnTheScreen();
    expect(screen.getByText('Usa o FinTrack como Marcelo Souza')).toBeOnTheScreen();
  });

  it('cadastra um nome novo', async () => {
    const criar = jest.spyOn(api, 'createContact');
    await renderScreen(<PessoasScreen />);

    await userEvent.type(
      screen.getByPlaceholderText('Nome de quem divide contas com você'),
      'Bruna',
    );
    await userEvent.press(screen.getByText('Adicionar'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({ name: 'Bruna', initial: 'B', ownerId: 'ana' }),
    );
    expect(await screen.findByText('Bruna')).toBeOnTheScreen();
  });

  it('vincula uma pessoa a quem usa o app', async () => {
    const salvar = jest.spyOn(api, 'updateContact');
    await renderScreen(<PessoasScreen />);

    await userEvent.press(screen.getByLabelText('Opções de Camila'));
    await userEvent.press(await screen.findByText('Vincular a quem usa o app'));
    // O contato `c3` da Ana também se chama Marcelo Souza: aqui vale o membro
    // do app, identificado pelo e-mail na opção do picker.
    await userEvent.press(await screen.findByText('marcelo@email.com'));

    await waitFor(() =>
      expect(salvar).toHaveBeenCalledWith('c2', {
        name: 'Camila',
        initial: 'C',
        ownerId: 'ana',
        personId: 'marcelo',
      }),
    );
  });

  it('excluir avisa que as divisões vão junto', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<PessoasScreen />);

    await userEvent.press(screen.getByLabelText('Opções de João Pedro'));
    await userEvent.press(await screen.findByText('Excluir pessoa'));

    expect(alerta).toHaveBeenCalledWith(
      'Excluir João Pedro?',
      expect.stringContaining('em aberto'),
      expect.arrayContaining([expect.objectContaining({ text: 'Excluir' })]),
    );
  });
});

describe('Nova divisão', () => {
  it('registra uma dívida a receber', async () => {
    const criar = jest.spyOn(api, 'createSplits');
    await renderScreen(<NovaDivisaoScreen />);

    await userEvent.type(screen.getByDisplayValue('0,00'), '4500');
    await userEvent.type(screen.getByPlaceholderText('Ex.: jantar de sexta'), 'Presente');
    await userEvent.press(screen.getByLabelText('Salvar'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith([
        {
          ownerId: 'ana',
          contactId: 'c1',
          direction: 'a-receber',
          description: 'Presente',
          amount: 45,
          date: '2024-05-24',
        },
      ]),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('registra uma dívida minha com outra pessoa', async () => {
    const criar = jest.spyOn(api, 'createSplits');
    await renderScreen(<NovaDivisaoScreen />);

    await userEvent.press(screen.getByText('Eu devo'));
    await userEvent.press(screen.getByText('João Pedro'));
    await userEvent.press(await screen.findByText('Camila'));
    await userEvent.type(screen.getByDisplayValue('0,00'), '2000');
    await userEvent.press(screen.getByLabelText('Salvar'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith([
        expect.objectContaining({ direction: 'a-pagar', contactId: 'c2', amount: 20 }),
      ]),
    );
  });

  it('sem valor não salva', async () => {
    const criar = jest.spyOn(api, 'createSplits');
    await renderScreen(<NovaDivisaoScreen />);
    await userEvent.press(screen.getByLabelText('Salvar'));
    expect(criar).not.toHaveBeenCalled();
  });

  it('sem descrição usa um texto padrão', async () => {
    const criar = jest.spyOn(api, 'createSplits');
    await renderScreen(<NovaDivisaoScreen />);
    await userEvent.type(screen.getByDisplayValue('0,00'), '1000');
    await userEvent.press(screen.getByLabelText('Salvar'));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith([expect.objectContaining({ description: 'Divisão' })]),
    );
  });
});

describe('Sem nada dividido ainda', () => {
  /** A conta do casal não tem contatos nem divisões no seed. */
  const semDivisoes = { email: 'casal@email.com' };

  it('a lista explica como começar', async () => {
    await renderScreen(<AcertosScreen />, semDivisoes);
    expect(
      screen.getByText(/Nenhuma divisão por aqui/),
    ).toBeOnTheScreen();
  });

  it('o cadastro de pessoas aparece vazio', async () => {
    await renderScreen(<PessoasScreen />, semDivisoes);
    expect(screen.getByText('Nenhuma pessoa cadastrada ainda.')).toBeOnTheScreen();
  });

  it('nova divisão manda cadastrar alguém antes', async () => {
    const criar = jest.spyOn(api, 'createSplits');
    await renderScreen(<NovaDivisaoScreen />, semDivisoes);

    expect(screen.getByText('Cadastre primeiro quem divide contas com você.')).toBeOnTheScreen();
    await userEvent.type(screen.getByDisplayValue('0,00'), '5000');
    await userEvent.press(screen.getByLabelText('Salvar'));
    expect(criar).not.toHaveBeenCalled();

    await userEvent.press(screen.getByText('Cadastrar pessoa'));
    expect(router.push).toHaveBeenCalledWith('/acertos/pessoas');
  });
});

describe('erros do backend', () => {
  it('a divisão que não pôde ser excluída avisa na tela', async () => {
    jest.spyOn(api, 'deleteSplit').mockRejectedValue(new Error('Divisão bloqueada.'));
    let confirmar: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_titulo, _mensagem, botoes) => {
      confirmar = botoes?.find((botao) => botao.text === 'Excluir')?.onPress;
    });

    setRouteParams({ id: 'c2' });
    await renderScreen(<AcertoPessoaScreen />);
    await userEvent.press(screen.getByLabelText('Opções de Mercado'));
    await userEvent.press(await screen.findByText('Excluir divisão'));
    await act(async () => confirmar?.());

    expect(await screen.findByText('Divisão bloqueada.')).toBeOnTheScreen();
  });

  it('desfazer o acerto que falha avisa na tela', async () => {
    jest.spyOn(api, 'reopenSplit').mockRejectedValue(new Error('Acerto travado.'));
    setRouteParams({ id: 'c2' });
    await renderScreen(<AcertoPessoaScreen />);

    await userEvent.press(screen.getByLabelText('Opções de Rodízio de aniversário'));
    await userEvent.press(await screen.findByText('Desfazer acerto'));

    expect(await screen.findByText('Acerto travado.')).toBeOnTheScreen();
  });

  it('a pessoa que não pôde ser cadastrada avisa na tela', async () => {
    jest.spyOn(api, 'createContact').mockRejectedValue(new Error('Nome já usado.'));
    await renderScreen(<PessoasScreen />);

    await userEvent.type(
      screen.getByPlaceholderText('Nome de quem divide contas com você'),
      'Bruna',
    );
    await userEvent.press(screen.getByText('Adicionar'));

    expect(await screen.findByText('Nome já usado.')).toBeOnTheScreen();
  });

  it('a divisão avulsa que falha mantém o formulário aberto', async () => {
    jest.spyOn(api, 'createSplits').mockRejectedValue(new Error('Valor inválido.'));
    await renderScreen(<NovaDivisaoScreen />);

    await userEvent.type(screen.getByDisplayValue('0,00'), '5000');
    await userEvent.press(screen.getByLabelText('Salvar'));

    expect(await screen.findByText('Valor inválido.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });
});
