import { fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Alert, type AlertButton } from 'react-native';

import CompartilhadosScreen from '@/app/perfil/compartilhados';
import ConvidarScreen from '@/app/perfil/convidar';
import EditarPerfilScreen from '@/app/perfil/editar';
import NotificacoesScreen from '@/app/perfil/notificacoes';
import SegurancaScreen from '@/app/perfil/seguranca';
import { api } from '@/services/api';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

describe('Editar perfil', () => {
  it('abre preenchido com os dados atuais', async () => {
    await renderScreen(<EditarPerfilScreen />);
    expect(screen.getByDisplayValue('Ana Ribeiro')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('ana@email.com')).toBeOnTheScreen();
  });

  it('sem mudança nenhuma não chama a API', async () => {
    const update = jest.spyOn(api, 'updateProfile');
    await renderScreen(<EditarPerfilScreen />);
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(update).not.toHaveBeenCalled();
  });

  it('salva nome e e-mail sem espaços em volta', async () => {
    const update = jest.spyOn(api, 'updateProfile');
    await renderScreen(<EditarPerfilScreen />);

    const nome = screen.getByDisplayValue('Ana Ribeiro');
    await userEvent.clear(nome);
    await userEvent.type(nome, '  Ana Paula  ');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ name: 'Ana Paula', email: 'ana@email.com' }),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('acusa e-mail inválido', async () => {
    const update = jest.spyOn(api, 'updateProfile');
    await renderScreen(<EditarPerfilScreen />);

    const email = screen.getByDisplayValue('ana@email.com');
    await userEvent.clear(email);
    await userEvent.type(email, 'quebrado');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen();
    expect(update).not.toHaveBeenCalled();
  });

  it('acusa nome curto demais', async () => {
    await renderScreen(<EditarPerfilScreen />);
    const nome = screen.getByDisplayValue('Ana Ribeiro');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'A');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByText('Informe pelo menos 2 caracteres.')).toBeOnTheScreen();
  });

  it('mostra o erro da API sem fechar a tela', async () => {
    jest.spyOn(api, 'updateProfile').mockRejectedValue(new Error('E-mail já em uso.'));
    await renderScreen(<EditarPerfilScreen />);

    const nome = screen.getByDisplayValue('Ana Ribeiro');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'Ana Paula');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('E-mail já em uso.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('erro que não é Error usa a mensagem genérica', async () => {
    jest.spyOn(api, 'updateProfile').mockRejectedValue('pane');
    await renderScreen(<EditarPerfilScreen />);

    const nome = screen.getByDisplayValue('Ana Ribeiro');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'Ana Paula');
    await userEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Não foi possível salvar as alterações.')).toBeOnTheScreen();
  });
});

describe('Notificações', () => {
  const ligados = () => screen.getAllByRole('switch').map((node) => node.props.value);

  it('reflete as preferências do snapshot', async () => {
    await renderScreen(<NotificacoesScreen />);
    // seed: transactions/invoices/weeklySummary ligados, goals desligado.
    expect(ligados()).toEqual([true, true, false, true]);
  });

  it('mostra os quatro alertas por grupo', async () => {
    await renderScreen(<NotificacoesScreen />);
    expect(screen.getByText('MOVIMENTAÇÕES')).toBeOnTheScreen();
    expect(screen.getByText('ACOMPANHAMENTO')).toBeOnTheScreen();
    expect(screen.getByText('Novos lançamentos')).toBeOnTheScreen();
    expect(screen.getByText('Faturas de cartão')).toBeOnTheScreen();
    expect(screen.getByText('Metas e orçamento')).toBeOnTheScreen();
    expect(screen.getByText('Resumo semanal')).toBeOnTheScreen();
  });

  it('ligar um alerta salva a preferência inteira', async () => {
    const update = jest.spyOn(api, 'updatePreferences');
    await renderScreen(<NotificacoesScreen />);

    fireEvent(screen.getAllByRole('switch')[2], 'valueChange', true);

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        notifications: { transactions: true, invoices: true, goals: true, weeklySummary: true },
      }),
    );
    await waitFor(() => expect(ligados()).toEqual([true, true, true, true]));
  });

  it('desligar um alerta também salva', async () => {
    const update = jest.spyOn(api, 'updatePreferences');
    await renderScreen(<NotificacoesScreen />);

    fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.objectContaining({ transactions: false }),
        }),
      ),
    );
  });

  it('falha na API mostra o erro e devolve o interruptor', async () => {
    jest.spyOn(api, 'updatePreferences').mockRejectedValue(new Error('Servidor indisponível.'));
    await renderScreen(<NotificacoesScreen />);

    fireEvent(screen.getAllByRole('switch')[2], 'valueChange', true);

    expect(await screen.findByText('Servidor indisponível.')).toBeOnTheScreen();
    await waitFor(() => expect(ligados()).toEqual([true, true, false, true]));
  });

  it('erro que não é Error usa a mensagem genérica', async () => {
    jest.spyOn(api, 'updatePreferences').mockRejectedValue('pane');
    await renderScreen(<NotificacoesScreen />);

    fireEvent(screen.getAllByRole('switch')[2], 'valueChange', true);

    expect(
      await screen.findByText('Não foi possível salvar a preferência. Tente de novo.'),
    ).toBeOnTheScreen();
  });
});

describe('Segurança', () => {
  const preencher = async (atual: string, nova: string, confirmar = nova) => {
    await userEvent.type(screen.getByPlaceholderText('Sua senha de hoje'), atual);
    await userEvent.type(screen.getByPlaceholderText('Escolha uma senha nova'), nova);
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), confirmar);
  };

  const enviar = () => userEvent.press(screen.getByRole('button', { name: 'Alterar senha' }));

  it('mostra o e-mail da sessão atual', async () => {
    await renderScreen(<SegurancaScreen />);
    expect(screen.getByText('ana@email.com')).toBeOnTheScreen();
  });

  it('mostra o checklist da nova senha', async () => {
    await renderScreen(<SegurancaScreen />);
    expect(screen.getByText('Pelo menos 8 caracteres')).toBeOnTheScreen();
    expect(screen.getByText('Uma letra')).toBeOnTheScreen();
    expect(screen.getByText('Um número')).toBeOnTheScreen();
  });

  it('formulário vazio não chama a API', async () => {
    const change = jest.spyOn(api, 'changePassword');
    await renderScreen(<SegurancaScreen />);
    await enviar();
    expect(change).not.toHaveBeenCalled();
  });

  it('acusa confirmação diferente', async () => {
    const change = jest.spyOn(api, 'changePassword');
    await renderScreen(<SegurancaScreen />);
    await preencher('velha123', 'nova4567', 'outra999');

    expect(screen.getByText('As senhas não conferem.')).toBeOnTheScreen();
    await enviar();
    expect(change).not.toHaveBeenCalled();
  });

  it('não deixa repetir a senha atual', async () => {
    const change = jest.spyOn(api, 'changePassword');
    await renderScreen(<SegurancaScreen />);
    await preencher('senha123', 'senha123');
    await enviar();
    expect(change).not.toHaveBeenCalled();
  });

  it('senha nova fraca não passa', async () => {
    const change = jest.spyOn(api, 'changePassword');
    await renderScreen(<SegurancaScreen />);
    await preencher('velha123', 'abc');
    await enviar();
    expect(change).not.toHaveBeenCalled();
  });

  it('troca a senha e limpa o formulário', async () => {
    const change = jest.spyOn(api, 'changePassword');
    await renderScreen(<SegurancaScreen />);
    await preencher('velha123', 'nova4567');
    await enviar();

    await waitFor(() => expect(change).toHaveBeenCalledWith('velha123', 'nova4567'));
    expect(
      await screen.findByText('Senha alterada. Use a nova no próximo login.'),
    ).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Sua senha de hoje').props.value).toBe('');
    expect(screen.getByPlaceholderText('Escolha uma senha nova').props.value).toBe('');
  });

  it('mostra a recusa do backend', async () => {
    jest.spyOn(api, 'changePassword').mockRejectedValue(new Error('Senha atual incorreta.'));
    await renderScreen(<SegurancaScreen />);
    await preencher('errada12', 'nova4567');
    await enviar();

    expect(await screen.findByText('Senha atual incorreta.')).toBeOnTheScreen();
  });

  it('erro que não é Error usa a mensagem genérica', async () => {
    jest.spyOn(api, 'changePassword').mockRejectedValue('pane');
    await renderScreen(<SegurancaScreen />);
    await preencher('velha123', 'nova4567');
    await enviar();

    expect(await screen.findByText('Não foi possível alterar a senha.')).toBeOnTheScreen();
  });

  it('encerrar sessões pede confirmação e desloga', async () => {
    let confirmar: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons?: AlertButton[]) => {
      confirmar = buttons?.find((button) => button.text === 'Encerrar')?.onPress;
    });

    await renderScreen(<SegurancaScreen />);
    await userEvent.press(screen.getByText('Encerrar sessões'));
    confirmar?.();

    await waitFor(() => expect(screen.queryByTestId('sessao-pronta')).toBeNull());
  });
});

describe('Compartilhados', () => {
  it('resume quantas contas estão compartilhadas', async () => {
    await renderScreen(<CompartilhadosScreen />);
    expect(
      screen.getByText(/3 de 4 contas e cartões aparecem para quem tem acesso/),
    ).toBeOnTheScreen();
  });

  it('lista contas e cartões com saldo ou fatura', async () => {
    await renderScreen(<CompartilhadosScreen />);
    expect(screen.getByText('Conta corrente · R$ 2.620,00')).toBeOnTheScreen();
    expect(screen.getByText('Cartão de crédito · fatura R$ 830,00')).toBeOnTheScreen();
  });

  it('marca o que já é do casal', async () => {
    await renderScreen(<CompartilhadosScreen />);
    const valores = screen.getAllByRole('switch').map((node) => node.props.value);
    expect(valores).toEqual([true, true, true, false]);
  });

  it('conta de outra pessoa não pode ser alterada e diz de quem é', async () => {
    await renderScreen(<CompartilhadosScreen />);
    expect(
      screen.getByText('Cartão de crédito · fatura R$ 420,00 · de Marcelo Souza'),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole('switch')[3].props.disabled).toBe(true);
  });

  it('desligar o compartilhamento chama a API', async () => {
    const setShared = jest.spyOn(api, 'setAccountShared');
    await renderScreen(<CompartilhadosScreen />);

    fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);

    await waitFor(() => expect(setShared).toHaveBeenCalledWith('corrente', false));
    await waitFor(() =>
      expect(screen.getAllByRole('switch').map((n) => n.props.value)).toEqual([
        false,
        true,
        true,
        false,
      ]),
    );
  });

  it('erro da API aparece na tela', async () => {
    jest.spyOn(api, 'setAccountShared').mockRejectedValue(new Error('Conta não encontrada.'));
    await renderScreen(<CompartilhadosScreen />);

    fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);

    expect(await screen.findByText('Conta não encontrada.')).toBeOnTheScreen();
  });

  it('erro que não é Error usa a mensagem genérica', async () => {
    jest.spyOn(api, 'setAccountShared').mockRejectedValue('pane');
    await renderScreen(<CompartilhadosScreen />);

    fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);

    expect(
      await screen.findByText('Não foi possível alterar o compartilhamento.'),
    ).toBeOnTheScreen();
  });

  it('mostra o financiamento como sempre compartilhado', async () => {
    await renderScreen(<CompartilhadosScreen />);
    expect(screen.getByText('FINANCIAMENTOS')).toBeOnTheScreen();
    expect(screen.getByText('Casa · Jardim das Flores')).toBeOnTheScreen();
    expect(screen.getByText(/Saldo devedor R\$ 312\.400,00/)).toBeOnTheScreen();
  });

  it('sem financiamento a seção some', async () => {
    const real = jest.requireActual<typeof import('@/services/api')>('@/services/api');
    const original = await real.api.snapshot();
    jest.spyOn(api, 'snapshot').mockResolvedValue({ ...original, loans: [] });

    await renderScreen(<CompartilhadosScreen />);
    expect(screen.queryByText('FINANCIAMENTOS')).toBeNull();
  });

  it('leva para a tela de convite', async () => {
    await renderScreen(<CompartilhadosScreen />);
    await userEvent.press(screen.getByText('Convidar alguém'));
    expect(router.push).toHaveBeenCalledWith('/perfil/convidar');
  });
});

describe('Convidar', () => {
  it('lista o que dá para compartilhar, tudo marcado por padrão', async () => {
    await renderScreen(<ConvidarScreen />);
    expect(screen.getByText('Conta corrente conjunta')).toBeOnTheScreen();
    expect(screen.getByText('Poupança')).toBeOnTheScreen();
    expect(screen.getByText('Nubank (casal)')).toBeOnTheScreen();
    expect(screen.getByText('Casa · Jardim das Flores')).toBeOnTheScreen();
    // O Inter Gold é do Marcelo — não entra na lista do que a Ana compartilha.
    expect(screen.queryByText('Inter Gold')).toBeNull();
  });

  it('sem e-mail não envia', async () => {
    const send = jest.spyOn(api, 'sendInvite');
    await renderScreen(<ConvidarScreen />);
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));
    expect(send).not.toHaveBeenCalled();
  });

  it('envia o convite com as contas selecionadas', async () => {
    const send = jest.spyOn(api, 'sendInvite');
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), '  joana@email.com  ');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith('joana@email.com', [
        'corrente',
        'poupanca',
        'nubank',
        'l1',
      ]),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('desmarcar um item tira ele do convite', async () => {
    const send = jest.spyOn(api, 'sendInvite');
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), 'joana@email.com');
    await userEvent.press(screen.getByText('Poupança'));
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith('joana@email.com', ['corrente', 'nubank', 'l1']),
    );
  });

  it('remarcar devolve o item para o fim da lista', async () => {
    const send = jest.spyOn(api, 'sendInvite');
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), 'joana@email.com');
    await userEvent.press(screen.getByText('Poupança'));
    await userEvent.press(screen.getByText('Poupança'));
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith('joana@email.com', [
        'corrente',
        'nubank',
        'l1',
        'poupanca',
      ]),
    );
  });

  it('sem nada selecionado não envia', async () => {
    const send = jest.spyOn(api, 'sendInvite');
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), 'joana@email.com');
    for (const label of [
      'Conta corrente conjunta',
      'Poupança',
      'Nubank (casal)',
      'Casa · Jardim das Flores',
    ]) {
      await userEvent.press(screen.getByText(label));
    }
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(send).not.toHaveBeenCalled();
  });

  it('copiar o link troca o rótulo para Copiado', async () => {
    const copy = jest.spyOn(Clipboard, 'setStringAsync');
    await renderScreen(<ConvidarScreen />);

    await userEvent.press(screen.getByText('Copiar'));

    await waitFor(() => expect(copy).toHaveBeenCalledWith('https://fintrack.app/convite/8x2fq'));
    expect(await screen.findByText('Copiado')).toBeOnTheScreen();
  });

  it('erro do backend aparece e a tela continua aberta', async () => {
    jest.spyOn(api, 'sendInvite').mockRejectedValue(new Error('E-mail já convidado.'));
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), 'joana@email.com');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText('E-mail já convidado.')).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('erro sem mensagem cai no texto genérico', async () => {
    jest.spyOn(api, 'sendInvite').mockRejectedValue('pane');
    await renderScreen(<ConvidarScreen />);

    await userEvent.type(screen.getByPlaceholderText('nome@email.com'), 'joana@email.com');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText('Não foi possível enviar o convite.')).toBeOnTheScreen();
  });

  it('o X fecha a tela', async () => {
    await renderScreen(<ConvidarScreen />);
    await userEvent.press(screen.getByLabelText('Fechar'));
    expect(router.back).toHaveBeenCalled();
  });
});
