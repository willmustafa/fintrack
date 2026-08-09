import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import CartoesScreen from '@/app/(tabs)/cartoes';
import DashboardScreen from '@/app/(tabs)/index';
import InvestimentosScreen from '@/app/(tabs)/investimentos';
import MaisScreen from '@/app/(tabs)/mais';
import TransacoesScreen from '@/app/(tabs)/transacoes';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

describe('Início (dashboard)', () => {
  it('saúda a pessoa logada pelo primeiro nome', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('Ana!')).toBeOnTheScreen();
    expect(screen.getByText('Bom dia,')).toBeOnTheScreen();
  });

  it('mostra o saldo consolidado do seed', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('R$ 4.050,00')).toBeOnTheScreen();
    expect(screen.getByText('Saldo consolidado · 2 contas')).toBeOnTheScreen();
  });

  it('mostra faturas abertas e gasto do mês', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('R$ 1.250')).toBeOnTheScreen();
    expect(screen.getByText('R$ 2.380')).toBeOnTheScreen();
  });

  it('mostra a receita do mês no bloco de orçamento', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('receita R$ 5.000')).toBeOnTheScreen();
  });

  it('quebra os gastos em 50/30/20 com os percentuais', async () => {
    await renderScreen(<DashboardScreen />);
    // Os rótulos aparecem duas vezes: na legenda da rosca e no bloco de orçamento.
    expect(screen.getAllByText('Essenciais')).toHaveLength(2);
    expect(screen.getAllByText('Outros')).toHaveLength(2);
    expect(screen.getAllByText('Investimentos')).toHaveLength(2);
    expect(screen.getByText('50%')).toBeOnTheScreen();
    expect(screen.getByText('30%')).toBeOnTheScreen();
    expect(screen.getByText('20%')).toBeOnTheScreen();
  });

  it('conta as metas em andamento', async () => {
    await renderScreen(<DashboardScreen />);
    // g1, g2 e g3 têm alvo e ainda não fecharam; g4 está sem alvo.
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('mostra a legenda de receitas × gastos', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('Receita')).toBeOnTheScreen();
    expect(screen.getByText('Gasto')).toBeOnTheScreen();
  });

  it.each([
    ['R$ 1.250', '/cartoes'],
    ['R$ 2.380', '/transacoes'],
  ])('o atalho %s leva para %s', async (texto, rota) => {
    await renderScreen(<DashboardScreen />);
    await userEvent.press(screen.getByText(texto));
    expect(router.push).toHaveBeenCalledWith(rota);
  });

  it('os cards de metas e financiamento navegam', async () => {
    await renderScreen(<DashboardScreen />);
    await userEvent.press(screen.getByText('Metas em andamento'));
    expect(router.push).toHaveBeenCalledWith('/metas');

    await userEvent.press(screen.getByText('Financiamento'));
    expect(router.push).toHaveBeenCalledWith('/financiamento');
  });

  it('o botão flutuante abre a nova transação', async () => {
    await renderScreen(<DashboardScreen />);
    await userEvent.press(screen.getByLabelText('Nova transação'));
    expect(router.push).toHaveBeenCalledWith('/transacao/nova');
  });

  it('tem o atalho de notificações', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByLabelText('Notificações')).toBeOnTheScreen();
  });
});

describe('Transações', () => {
  it('lista as transações agrupadas por dia', async () => {
    await renderScreen(<TransacoesScreen />);
    expect(screen.getByText('HOJE · 24/05')).toBeOnTheScreen();
    expect(screen.getByText('ONTEM · 23/05')).toBeOnTheScreen();
    expect(screen.getByText('Mercado')).toBeOnTheScreen();
    expect(screen.getByText('Salário')).toBeOnTheScreen();
  });

  it('resume entradas e saídas do período', async () => {
    await renderScreen(<TransacoesScreen />);
    expect(screen.getByText('+R$ 5.000')).toBeOnTheScreen();
    expect(screen.getByText('-R$ 2.380')).toBeOnTheScreen();
  });

  it('mostra a conta de cada lançamento no subtítulo', async () => {
    await renderScreen(<TransacoesScreen />);
    expect(screen.getByText('Essenciais · Nubank (casal)')).toBeOnTheScreen();
  });

  it('filtra pela busca', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.type(screen.getByPlaceholderText('Buscar transação'), 'netflix');

    await waitFor(() => expect(screen.getByText('Netflix')).toBeOnTheScreen());
    expect(screen.queryByText('Mercado')).toBeNull();
  });

  it('busca sem resultado mostra o aviso', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.type(screen.getByPlaceholderText('Buscar transação'), 'zzzz');
    expect(await screen.findByText('Nenhuma transação com esses filtros.')).toBeOnTheScreen();
  });

  it('filtra por tipo pelo picker', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Tipo'));
    await userEvent.press(await screen.findByText('Ganhos'));

    await waitFor(() => expect(screen.queryByText('Mercado')).toBeNull());
    expect(screen.getByText('Salário')).toBeOnTheScreen();
    expect(screen.getByText('Freelance')).toBeOnTheScreen();
  });

  it('o chip de tipo passa a mostrar o filtro escolhido', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Tipo'));
    await userEvent.press(await screen.findByText('Aportes'));
    expect(await screen.findByText('Aportes')).toBeOnTheScreen();
  });

  it('filtra por categoria', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Categoria'));
    await userEvent.press(await screen.findByText('Moradia'));

    await waitFor(() => expect(screen.getByText('Aluguel')).toBeOnTheScreen());
    expect(screen.queryByText('Netflix')).toBeNull();
  });

  it('filtra por conta', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Conta'));
    await userEvent.press(await screen.findByText('Inter Gold'));

    await waitFor(() => expect(screen.getByText('Restaurante')).toBeOnTheScreen());
    expect(screen.queryByText('Salário')).toBeNull();
  });

  it('voltar o filtro para "todos" traz a lista inteira de volta', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Tipo'));
    await userEvent.press(await screen.findByText('Ganhos'));
    await waitFor(() => expect(screen.queryByText('Mercado')).toBeNull());

    await userEvent.press(screen.getByText('Ganhos'));
    await userEvent.press(await screen.findByText('Todos os tipos'));
    await waitFor(() => expect(screen.getByText('Mercado')).toBeOnTheScreen());
  });

  it('o botão flutuante abre a nova transação', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByLabelText('Nova transação'));
    expect(router.push).toHaveBeenCalledWith('/transacao/nova');
  });
});

describe('Cartões', () => {
  it('mostra o total de faturas abertas', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Faturas abertas R$ 1.250')).toBeOnTheScreen();
  });

  it('lista os dois cartões do seed', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Nubank (casal)')).toBeOnTheScreen();
    expect(screen.getByText('Inter Gold')).toBeOnTheScreen();
  });

  it('começa no primeiro cartão, com limite e datas', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('R$ 5.170 disponíveis')).toBeOnTheScreen();
    expect(screen.getByText('Usado R$ 830')).toBeOnTheScreen();
    expect(screen.getByText('Total R$ 6.000')).toBeOnTheScreen();
    expect(screen.getByText('28')).toBeOnTheScreen();
    expect(screen.getByText('5')).toBeOnTheScreen();
  });

  it('lista os lançamentos do cartão selecionado', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Ônibus Trabalho')).toBeOnTheScreen();
    expect(screen.queryByText('Restaurante')).toBeNull();
  });

  it('trocar de cartão troca limite e lançamentos', async () => {
    await renderScreen(<CartoesScreen />);
    await userEvent.press(screen.getByText('Inter Gold'));

    await waitFor(() => expect(screen.getByText('R$ 3.080 disponíveis')).toBeOnTheScreen());
    expect(screen.getByText('Restaurante')).toBeOnTheScreen();
    expect(screen.queryByText('Ônibus Trabalho')).toBeNull();
  });
});

describe('Investimentos', () => {
  it('mostra o patrimônio atual e o rendimento', async () => {
    await renderScreen(<InvestimentosScreen />);
    // No card roxo e de novo na métrica "Atual".
    expect(screen.getAllByText('R$ 21.340')).toHaveLength(2);
    expect(screen.getByText('+R$ 2.840 · +15,4%')).toBeOnTheScreen();
  });

  it('mostra os totais de aportado e atual', async () => {
    await renderScreen(<InvestimentosScreen />);
    expect(screen.getByText('R$ 18.500')).toBeOnTheScreen();
    expect(screen.getByText('Aportado')).toBeOnTheScreen();
  });

  it('agrupa por renda fixa e renda variável', async () => {
    await renderScreen(<InvestimentosScreen />);
    expect(screen.getByText('RENDA FIXA')).toBeOnTheScreen();
    expect(screen.getByText('RENDA VARIÁVEL')).toBeOnTheScreen();
  });

  it('lista cada ativo com classe e rendimento', async () => {
    await renderScreen(<InvestimentosScreen />);
    expect(screen.getByText('Tesouro Selic')).toBeOnTheScreen();
    expect(screen.getByText('PETR4')).toBeOnTheScreen();
    expect(screen.getByText('Bitcoin')).toBeOnTheScreen();
    expect(screen.getByText('Renda fixa · aportado R$ 8.000')).toBeOnTheScreen();
    expect(screen.getByText('Cripto · aportado R$ 2.000')).toBeOnTheScreen();
  });
});

describe('Mais', () => {
  it('lista os atalhos com os contadores certos', async () => {
    await renderScreen(<MaisScreen />);
    expect(screen.getByText('4 em andamento')).toBeOnTheScreen();
    expect(screen.getByText('3 de 4 alertas ligados')).toBeOnTheScreen();
    expect(screen.getByText('Casa · Jardim das Flores')).toBeOnTheScreen();
    expect(screen.getByText('ana@email.com')).toBeOnTheScreen();
  });

  it('indica que está em modo de dados de exemplo', async () => {
    await renderScreen(<MaisScreen />);
    expect(screen.getByText('Dados de exemplo (backend Go em construção)')).toBeOnTheScreen();
    expect(screen.getByText('FinTrack · versão 1.0.0')).toBeOnTheScreen();
  });

  it.each([
    ['Metas', '/metas'],
    ['Financiamento', '/financiamento'],
    ['Perfil e compartilhamento', '/perfil'],
    ['Notificações', '/perfil/notificacoes'],
    ['Segurança', '/perfil/seguranca'],
  ])('%s navega para %s', async (titulo, rota) => {
    await renderScreen(<MaisScreen />);
    await userEvent.press(screen.getByText(titulo));
    expect(router.push).toHaveBeenCalledWith(rota);
  });

  it('sair da conta pede confirmação antes', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<MaisScreen />);
    await userEvent.press(screen.getByText('Sair da conta'));

    expect(alert).toHaveBeenCalledWith(
      'Sair da conta',
      'Você precisará entrar de novo com e-mail e senha.',
      expect.arrayContaining([expect.objectContaining({ text: 'Sair' })]),
    );
  });

  it('confirmar a saída derruba a sessão', async () => {
    let confirmar: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      confirmar = buttons?.find((button) => button.text === 'Sair')?.onPress;
    });

    await renderScreen(<MaisScreen />);
    await userEvent.press(screen.getByText('Sair da conta'));
    confirmar?.();

    // Sem sessão o helper de render tira a tela do ar.
    await waitFor(() => expect(screen.queryByTestId('sessao-pronta')).toBeNull());
  });
});
