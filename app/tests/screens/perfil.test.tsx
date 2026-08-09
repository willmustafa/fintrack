import { screen, userEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Alert, type AlertButton } from 'react-native';

import PerfilScreen from '@/app/perfil/index';
import { api } from '@/services/api';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

/** Captura o botão de confirmação de um `Alert.alert` e devolve o gatilho. */
function captureAlert(label: string) {
  const acionar = { current: undefined as (() => void) | undefined };
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons?: AlertButton[]) => {
    acionar.current = buttons?.find((button) => button.text === label)?.onPress;
  });
  return acionar;
}

const abrirOpcoesDoMarcelo = () =>
  userEvent.press(screen.getByLabelText('Opções de Marcelo Souza'));

const abrirOpcoesDoConvite = () =>
  userEvent.press(screen.getByLabelText('Opções do convite para joana@email.com'));

describe('Perfil', () => {
  it('mostra os dados da pessoa logada', async () => {
    await renderScreen(<PerfilScreen />);
    expect(screen.getByText('Ana Ribeiro')).toBeOnTheScreen();
    expect(screen.getByText('ana@email.com')).toBeOnTheScreen();
    expect(screen.getByText('A')).toBeOnTheScreen();
  });

  it('lista quem compartilha, sem a própria pessoa nem o "casal"', async () => {
    await renderScreen(<PerfilScreen />);
    expect(screen.getByText('Marcelo Souza')).toBeOnTheScreen();
    expect(screen.getByText('marcelo@email.com · Acesso total')).toBeOnTheScreen();
    expect(screen.queryByText('Casal')).toBeNull();
  });

  it('mostra o convite pendente com quanto tempo faz', async () => {
    await renderScreen(<PerfilScreen />);
    expect(screen.getByText('Convite pendente')).toBeOnTheScreen();
    expect(screen.getByText('joana@email.com · enviado há 2 dias')).toBeOnTheScreen();
  });

  it('conta as contas compartilhadas', async () => {
    await renderScreen(<PerfilScreen />);
    expect(screen.getByText('Contas e cartões compartilhados')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it.each([
    ['Editar perfil', '/perfil/editar'],
    ['Convidar', '/perfil/convidar'],
    ['Contas e cartões compartilhados', '/perfil/compartilhados'],
    ['Notificações', '/perfil/notificacoes'],
    ['Segurança', '/perfil/seguranca'],
  ])('%s navega para %s', async (texto, rota) => {
    await renderScreen(<PerfilScreen />);
    await userEvent.press(screen.getByText(texto));
    expect(router.push).toHaveBeenCalledWith(rota);
  });

  it('indica que roda com dados de exemplo', async () => {
    await renderScreen(<PerfilScreen />);
    expect(
      screen.getByText('Dados de exemplo — as alterações valem só nesta sessão'),
    ).toBeOnTheScreen();
  });

  describe('menu de um membro', () => {
    it('abre com as três ações', async () => {
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      expect(await screen.findByText('Acesso total')).toBeOnTheScreen();
      expect(screen.getByText('Somente leitura')).toBeOnTheScreen();
      expect(screen.getByText('Remover acesso')).toBeOnTheScreen();
    });

    it('mudar para somente leitura chama a API e confirma na tela', async () => {
      const update = jest.spyOn(api, 'updateMemberAccess');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Somente leitura'));

      await waitFor(() => expect(update).toHaveBeenCalledWith('marcelo', 'leitura'));
      expect(
        await screen.findByText('Marcelo Souza agora tem acesso somente leitura.'),
      ).toBeOnTheScreen();
      expect(await screen.findByText('marcelo@email.com · Acesso leitura')).toBeOnTheScreen();
    });

    it('voltar para acesso total também funciona', async () => {
      const update = jest.spyOn(api, 'updateMemberAccess');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Acesso total'));

      await waitFor(() => expect(update).toHaveBeenCalledWith('marcelo', 'total'));
      expect(
        await screen.findByText('Marcelo Souza agora tem acesso total.'),
      ).toBeOnTheScreen();
    });

    it('erro da API vira faixa vermelha', async () => {
      jest.spyOn(api, 'updateMemberAccess').mockRejectedValue(new Error('Pessoa não encontrada.'));
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Somente leitura'));

      expect(await screen.findByText('Pessoa não encontrada.')).toBeOnTheScreen();
    });

    it('erro que não é Error usa a mensagem genérica', async () => {
      jest.spyOn(api, 'updateMemberAccess').mockRejectedValue('pane');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Somente leitura'));

      expect(await screen.findByText('Não foi possível concluir a ação.')).toBeOnTheScreen();
    });

    it('remover acesso pede confirmação', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Remover acesso'));

      expect(alert).toHaveBeenCalledWith(
        'Remover acesso',
        expect.stringContaining('Marcelo Souza deixa de ver as contas'),
        expect.any(Array),
      );
    });

    it('confirmar a remoção tira a pessoa da lista', async () => {
      const acionar = captureAlert('Remover');
      const remove = jest.spyOn(api, 'removeMember');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoMarcelo();
      await userEvent.press(await screen.findByText('Remover acesso'));

      acionar.current?.();

      await waitFor(() => expect(remove).toHaveBeenCalledWith('marcelo'));
      expect(await screen.findByText('Marcelo Souza não tem mais acesso.')).toBeOnTheScreen();
      await waitFor(() => expect(screen.queryByText('Marcelo Souza')).toBeNull());
    });
  });

  describe('menu de um convite', () => {
    it('abre com reenviar, copiar e cancelar', async () => {
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoConvite();
      expect(await screen.findByText('Reenviar convite')).toBeOnTheScreen();
      expect(screen.getByText('Copiar link')).toBeOnTheScreen();
      expect(screen.getByText('Cancelar convite')).toBeOnTheScreen();
    });

    it('reenviar chama a API e confirma na tela', async () => {
      const resend = jest.spyOn(api, 'resendInvite');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoConvite();
      await userEvent.press(await screen.findByText('Reenviar convite'));

      await waitFor(() => expect(resend).toHaveBeenCalledWith('inv1'));
      expect(
        await screen.findByText('Convite reenviado para joana@email.com.'),
      ).toBeOnTheScreen();
      expect(await screen.findByText('joana@email.com · enviado agora')).toBeOnTheScreen();
    });

    it('copiar link põe a URL completa na área de transferência', async () => {
      const copy = jest.spyOn(Clipboard, 'setStringAsync');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoConvite();
      await userEvent.press(await screen.findByText('Copiar link'));

      await waitFor(() =>
        expect(copy).toHaveBeenCalledWith('https://fintrack.app/convite/8x2fq'),
      );
      expect(await screen.findByText('Link de convite copiado.')).toBeOnTheScreen();
    });

    it('cancelar pede confirmação e remove o convite', async () => {
      const acionar = captureAlert('Cancelar convite');
      const cancel = jest.spyOn(api, 'cancelInvite');
      await renderScreen(<PerfilScreen />);
      await abrirOpcoesDoConvite();
      await userEvent.press(await screen.findByText('Cancelar convite'));

      acionar.current?.();

      await waitFor(() => expect(cancel).toHaveBeenCalledWith('inv1'));
      expect(await screen.findByText('Convite cancelado.')).toBeOnTheScreen();
      await waitFor(() => expect(screen.queryByText('Convite pendente')).toBeNull());
    });
  });

  it('sair da conta pede confirmação e derruba a sessão', async () => {
    const acionar = captureAlert('Sair');
    await renderScreen(<PerfilScreen />);
    await userEvent.press(screen.getByText('Sair da conta'));

    acionar.current?.();
    await waitFor(() => expect(screen.queryByTestId('sessao-pronta')).toBeNull());
  });

  it('sem ninguém compartilhando mostra o convite para começar', async () => {
    const real = jest.requireActual<typeof import('@/services/api')>('@/services/api');
    const original = await real.api.snapshot();
    jest.spyOn(api, 'snapshot').mockResolvedValue({
      ...original,
      people: original.people.filter((p) => p.id === 'ana'),
      invites: [],
    });

    await renderScreen(<PerfilScreen />);
    expect(
      screen.getByText(/Ninguém tem acesso às suas contas ainda/),
    ).toBeOnTheScreen();
  });
});
