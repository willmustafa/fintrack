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

  it('abre com receitas, gasto do mês e faturas no topo', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('Receitas')).toBeOnTheScreen();
    expect(screen.getByText('R$ 5.000')).toBeOnTheScreen();
    expect(screen.getByText('Gasto do mês')).toBeOnTheScreen();
    expect(screen.getByText('R$ 2.380')).toBeOnTheScreen();
    expect(screen.getByText('R$ 1.250')).toBeOnTheScreen();
  });

  it('mostra a receita do mês no bloco de orçamento', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('receita R$ 5.000')).toBeOnTheScreen();
  });

  it('quebra os gastos em 50/30/20 no bloco de orçamento', async () => {
    await renderScreen(<DashboardScreen />);
    // Sem a rosca, cada rótulo aparece uma única vez.
    expect(screen.getByText('Essenciais')).toBeOnTheScreen();
    expect(screen.getByText('Outros')).toBeOnTheScreen();
    expect(screen.getByText('Investimentos')).toBeOnTheScreen();
  });

  it('não tem mais a rosca de divisão de gastos', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.queryByText('Divisão de gastos')).toBeNull();
    expect(screen.queryByText('Receitas × Gastos')).toBeNull();
  });

  it('resume a sobra do mês em vez de receitas × gastos', async () => {
    await renderScreen(<DashboardScreen />);
    // Entradas 5.000 − saídas 2.380.
    expect(screen.getByText('Sobrou no mês')).toBeOnTheScreen();
    expect(screen.getByText('+R$ 2.620')).toBeOnTheScreen();
  });

  it.each([
    ['R$ 1.250', '/cartoes'],
    ['R$ 2.380', '/transacoes'],
    ['R$ 5.000', '/transacoes'],
  ])('o atalho %s leva para %s', async (texto, rota) => {
    await renderScreen(<DashboardScreen />);
    await userEvent.press(screen.getByText(texto));
    expect(router.push).toHaveBeenCalledWith(rota);
  });

  it('lista as três metas mais perto de fechar, da maior para a menor', async () => {
    await renderScreen(<DashboardScreen />);
    expect(screen.getByText('Quase lá')).toBeOnTheScreen();
    expect(screen.getByText('Viagem Japão')).toBeOnTheScreen();
    expect(screen.getByText('Reserva de emergência')).toBeOnTheScreen();
    expect(screen.getByText('Notebook')).toBeOnTheScreen();
    // "Sofá novo" ainda não tem alvo, então fica de fora.
    expect(screen.queryByText('Sofá novo')).toBeNull();
    expect(screen.getByText('82%')).toBeOnTheScreen();
  });

  it('a seção de metas leva para a lista completa', async () => {
    await renderScreen(<DashboardScreen />);
    await userEvent.press(screen.getByText('Quase lá'));
    expect(router.push).toHaveBeenCalledWith('/metas');
  });

  it('o financiamento mostra quantos meses faltam', async () => {
    await renderScreen(<DashboardScreen />);
    // De mai/2024 até mar/2044.
    expect(screen.getByText('238')).toBeOnTheScreen();
    expect(screen.getByText('meses até quitar · 19 anos e 10 meses')).toBeOnTheScreen();
    expect(screen.getByText('30,6% quitado')).toBeOnTheScreen();
  });

  it('o card de financiamento navega', async () => {
    await renderScreen(<DashboardScreen />);
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

  it('tocar numa transação abre a edição dela', async () => {
    await renderScreen(<TransacoesScreen />);
    await userEvent.press(screen.getByText('Mercado'));
    expect(router.push).toHaveBeenCalledWith('/transacao/t2');
  });
});

describe('Cartões e contas', () => {
  it('separa contas e cartões em seções', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Cartões e contas')).toBeOnTheScreen();
    expect(screen.getByText('CONTAS')).toBeOnTheScreen();
    expect(screen.getByText('CARTÕES')).toBeOnTheScreen();
  });

  it('lista as contas do seed com o saldo', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Conta corrente conjunta')).toBeOnTheScreen();
    expect(screen.getByText('R$ 2.620,00')).toBeOnTheScreen();
    expect(screen.getByText('R$ 1.430,00')).toBeOnTheScreen();
  });

  it('mostra o total de faturas abertas', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Faturas abertas R$ 1.250')).toBeOnTheScreen();
  });

  it('lista os dois cartões do seed', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('Nubank (casal)')).toBeOnTheScreen();
    expect(screen.getByText('Inter Gold')).toBeOnTheScreen();
  });

  it('junta fatura, limite e datas no mesmo bloco do cartão', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.getByText('R$ 5.170 disponíveis')).toBeOnTheScreen();
    expect(screen.getByText('Usado R$ 830')).toBeOnTheScreen();
    expect(screen.getByText('Total R$ 6.000')).toBeOnTheScreen();
    expect(screen.getByText('28')).toBeOnTheScreen();
    expect(screen.getByText('5')).toBeOnTheScreen();
  });

  it('não mostra mais os lançamentos da fatura', async () => {
    await renderScreen(<CartoesScreen />);
    expect(screen.queryByText('Lançamentos da fatura')).toBeNull();
    expect(screen.queryByText('Ônibus Trabalho')).toBeNull();
  });

  it('o botão de extrato leva para as transações', async () => {
    await renderScreen(<CartoesScreen />);
    await userEvent.press(screen.getByText('Ver lançamentos no extrato'));
    expect(router.push).toHaveBeenCalledWith('/transacoes');
  });

  it('trocar de cartão troca fatura e limite', async () => {
    await renderScreen(<CartoesScreen />);
    await userEvent.press(screen.getByText('Inter Gold'));
    await waitFor(() => expect(screen.getByText('R$ 3.080 disponíveis')).toBeOnTheScreen());
  });

  it('o + oferece criar conta ou cartão', async () => {
    await renderScreen(<CartoesScreen />);
    await userEvent.press(screen.getByLabelText('Adicionar'));
    await userEvent.press(await screen.findByText('Novo cartão'));
    expect(router.push).toHaveBeenCalledWith('/conta/nova?kind=cartao');
  });

  it('editar uma conta abre o formulário dela', async () => {
    await renderScreen(<CartoesScreen />);
    await userEvent.press(screen.getByText('Conta corrente conjunta'));
    await userEvent.press(await screen.findByText('Editar'));
    expect(router.push).toHaveBeenCalledWith('/conta/corrente');
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
