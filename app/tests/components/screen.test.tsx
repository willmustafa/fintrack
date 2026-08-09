import { screen, userEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { colors } from '@/theme/tokens';

import { renderWithSafeArea as render } from '../helpers/render';

const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: mockCanGoBack }),
}));

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

beforeEach(() => {
  mockBack.mockClear();
  mockCanGoBack.mockReturnValue(true);
});

describe('Screen', () => {
  it('mostra o conteúdo sobre o fundo padrão', async () => {
    await render(
      <Screen>
        <RNText testID="conteudo">Oi</RNText>
      </Screen>,
    );
    const raiz = screen.getByTestId('conteudo').parent!;
    expect(styleOf(raiz).backgroundColor).toBe(colors.canvas);
  });

  it('aceita cor de fundo customizada', async () => {
    await render(
      <Screen background={colors.surface}>
        <RNText testID="conteudo">Oi</RNText>
      </Screen>,
    );
    expect(styleOf(screen.getByTestId('conteudo').parent!).backgroundColor).toBe(colors.surface);
  });

  it('aceita style extra e edges customizadas', async () => {
    await render(
      <Screen edges={['top', 'bottom']} style={{ paddingTop: 40 }}>
        <RNText testID="conteudo">Oi</RNText>
      </Screen>,
    );
    expect(styleOf(screen.getByTestId('conteudo').parent!).paddingTop).toBe(40);
  });
});

describe('Header', () => {
  it('mostra o título', async () => {
    await render(<Header title="Criar conta" />);
    expect(screen.getByText('Criar conta')).toBeOnTheScreen();
  });

  it('usa o voltar do router quando dá para voltar', async () => {
    await render(<Header title="Perfil" />);
    await userEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('esconde o voltar quando não há para onde voltar', async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<Header title="Início" />);
    expect(screen.queryByLabelText('Voltar')).toBeNull();
  });

  it('onBack customizado tem prioridade sobre o router', async () => {
    const onBack = jest.fn();
    await render(<Header title="Perfil" onBack={onBack} />);
    await userEvent.press(screen.getByLabelText('Voltar'));
    expect(onBack).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('renderiza a ação da direita e dispara o callback', async () => {
    const onAction = jest.fn();
    await render(<Header title="Metas" action="add" onAction={onAction} />);
    const botoes = screen.getAllByRole('button');
    await userEvent.press(botoes[botoes.length - 1]);
    expect(onAction).toHaveBeenCalled();
  });

  it('o nó à direita substitui o ícone de ação', async () => {
    await render(<Header title="Metas" action="add" right={<RNText>Salvar</RNText>} />);
    expect(screen.getByText('Salvar')).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('alinha o título à esquerda quando centered é false', async () => {
    await render(<Header title="Transações" centered={false} />);
    expect(styleOf(screen.getByText('Transações')).textAlign).toBe('left');
  });

  it('centraliza o título por padrão', async () => {
    await render(<Header title="Transações" />);
    expect(styleOf(screen.getByText('Transações')).textAlign).toBe('center');
  });
});
