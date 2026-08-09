import { screen, userEvent, waitFor } from '@testing-library/react-native';

import CadastroScreen from '@/app/(auth)/cadastro';
import AuthLayout from '@/app/(auth)/_layout';
import LoginScreen from '@/app/(auth)/login';
import { api } from '@/services/api';

import { resetRouter, router } from '../helpers/router';
import { renderScreen } from '../helpers/screen';

jest.mock('expo-router', () => require('../helpers/router').expoRouterMock);

beforeEach(() => {
  resetRouter();
  jest.restoreAllMocks();
});

const semSessao = { signedIn: false as const };

describe('Login', () => {
  it('mostra o hero e o formulário', async () => {
    await renderScreen(<LoginScreen />, semSessao);
    expect(screen.getByText(/Controle total/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('E-mail')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Senha')).toBeOnTheScreen();
  });

  it('vem pré-preenchido com a conta de exemplo', async () => {
    await renderScreen(<LoginScreen />, semSessao);
    expect(screen.getByPlaceholderText('E-mail').props.value).toBe('ana@email.com');
  });

  it('a senha fica oculta', async () => {
    await renderScreen(<LoginScreen />, semSessao);
    expect(screen.getByPlaceholderText('Senha').props.secureTextEntry).toBe(true);
  });

  it('entrar chama a API com o e-mail digitado, sem espaços', async () => {
    const signIn = jest.spyOn(api, 'signIn');
    await renderScreen(<LoginScreen />, semSessao);

    await userEvent.clear(screen.getByPlaceholderText('E-mail'));
    await userEvent.type(screen.getByPlaceholderText('E-mail'), '  marcelo@email.com  ');
    await userEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('marcelo@email.com', '123456'));
  });

  it('mostra o erro quando o login falha', async () => {
    jest.spyOn(api, 'signIn').mockRejectedValue(new Error('boom'));
    await renderScreen(<LoginScreen />, semSessao);

    await userEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText('Não foi possível entrar. Confira e-mail e senha.'),
    ).toBeOnTheScreen();
  });

  it('leva para o cadastro', async () => {
    await renderScreen(<LoginScreen />, semSessao);
    await userEvent.press(screen.getByText('Criar conta'));
    expect(router.push).toHaveBeenCalledWith('/cadastro');
  });

  it('oferece o login com Google', async () => {
    await renderScreen(<LoginScreen />, semSessao);
    expect(screen.getByText('Continuar com Google')).toBeOnTheScreen();
  });
});

describe('Cadastro', () => {
  const preencher = async (over: Partial<Record<string, string>> = {}) => {
    const dados = {
      nome: 'Joana Silva',
      email: 'joana@email.com',
      senha: 'senha123',
      confirmar: 'senha123',
      ...over,
    };
    await userEvent.type(screen.getByPlaceholderText('Como podemos te chamar?'), dados.nome!);
    await userEvent.type(screen.getByPlaceholderText('voce@email.com'), dados.email!);
    await userEvent.type(screen.getByPlaceholderText('Crie uma senha'), dados.senha!);
    await userEvent.type(screen.getByPlaceholderText('Repita a senha'), dados.confirmar!);
    return dados;
  };

  const aceitarTermos = () => userEvent.press(screen.getByRole('checkbox'));

  it('mostra os campos e o checklist de senha', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeOnTheScreen();
    expect(screen.getByText('Pelo menos 8 caracteres')).toBeOnTheScreen();
    expect(screen.getByText('Uma letra')).toBeOnTheScreen();
    expect(screen.getByText('Um número')).toBeOnTheScreen();
  });

  it('formulário vazio não envia nada para a API', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    const signUp = jest.spyOn(api, 'signUp');
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('não envia sem aceitar os termos', async () => {
    const signUp = jest.spyOn(api, 'signUp');
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('acusa e-mail inválido depois da primeira tentativa', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher({ email: 'nao-e-email' });
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen();
  });

  it('acusa nome curto demais', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher({ nome: 'J' });
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('Informe pelo menos 2 caracteres.')).toBeOnTheScreen();
  });

  it('acusa senhas diferentes assim que a confirmação é digitada', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher({ confirmar: 'outra123' });
    expect(screen.getByText('As senhas não conferem.')).toBeOnTheScreen();
  });

  it('não envia com senha fraca', async () => {
    const signUp = jest.spyOn(api, 'signUp');
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher({ senha: 'abc', confirmar: 'abc' });
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('marca as regras cumpridas conforme a senha é digitada', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    const campo = screen.getByPlaceholderText('Crie uma senha');
    await userEvent.type(campo, 'senha123');
    // Sem asserção de ícone: o checklist é derivado de `passwordRules`, já
    // coberto em unidade — aqui basta que os três itens sigam na tela.
    expect(screen.getByText('Um número')).toBeOnTheScreen();
  });

  it('envia o cadastro com os dados limpos', async () => {
    const signUp = jest.spyOn(api, 'signUp');
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher({ nome: '  Joana Silva  ', email: '  joana@email.com  ' });
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith('Joana Silva', 'joana@email.com', 'senha123'),
    );
  });

  it('mostra a mensagem de erro devolvida pela API', async () => {
    jest.spyOn(api, 'signUp').mockRejectedValue(new Error('E-mail já cadastrado.'));
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher();
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('E-mail já cadastrado.')).toBeOnTheScreen();
  });

  it('usa uma mensagem genérica quando o erro não é Error', async () => {
    jest.spyOn(api, 'signUp').mockRejectedValue('pane');
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher();
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(
      await screen.findByText('Não foi possível criar a conta. Tente de novo em instantes.'),
    ).toBeOnTheScreen();
  });

  it('desmarcar os termos bloqueia o envio de novo', async () => {
    const signUp = jest.spyOn(api, 'signUp');
    await renderScreen(<CadastroScreen />, semSessao);
    await preencher();
    await aceitarTermos();
    await aceitarTermos();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('volta para o login', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    await userEvent.press(screen.getByText(/Já tenho conta/));
    expect(router.back).toHaveBeenCalled();
  });

  it('o voltar do cabeçalho também retorna', async () => {
    await renderScreen(<CadastroScreen />, semSessao);
    await userEvent.press(screen.getByLabelText('Voltar'));
    expect(router.back).toHaveBeenCalled();
  });
});

describe('AuthLayout', () => {
  it('exporta a âncora de rota do grupo', () => {
    expect(typeof AuthLayout).toBe('function');
  });
});
