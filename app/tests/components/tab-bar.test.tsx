import { screen, userEvent } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { colors } from '@/theme/tokens';

import { renderWithSafeArea as render } from '../helpers/render';

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

const ROUTES = ['index', 'transacoes', 'cartoes', 'investimentos', 'mais'];

function props(index = 0, names = ROUTES) {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };
  const tabBarProps = {
    state: { index, routes: names.map((name) => ({ key: `${name}-key`, name })) },
    navigation,
  } as unknown as BottomTabBarProps;
  return { tabBarProps, navigation };
}

describe('TabBar', () => {
  it('mostra os cinco destinos com os rótulos do board', async () => {
    const { tabBarProps } = props();
    await render(<TabBar {...tabBarProps} />);
    for (const label of ['Início', 'Transações', 'Cartões', 'Invest.', 'Mais']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });

  it('marca a aba atual como selecionada', async () => {
    const { tabBarProps } = props(2);
    await render(<TabBar {...tabBarProps} />);
    expect(screen.getByLabelText('Cartões').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByLabelText('Início').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('pinta a aba ativa de roxo e as demais de cinza', async () => {
    const { tabBarProps } = props(1);
    await render(<TabBar {...tabBarProps} />);
    expect(styleOf(screen.getByText('Transações')).color).toBe(colors.accent);
    expect(styleOf(screen.getByText('Início')).color).toBe(colors.textDisabled);
  });

  it('tocar em outra aba emite tabPress e navega', async () => {
    const { tabBarProps, navigation } = props(0);
    await render(<TabBar {...tabBarProps} />);
    await userEvent.press(screen.getByLabelText('Cartões'));
    expect(navigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'cartoes-key',
      canPreventDefault: true,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('cartoes');
  });

  it('tocar na aba já ativa não navega de novo', async () => {
    const { tabBarProps, navigation } = props(0);
    await render(<TabBar {...tabBarProps} />);
    await userEvent.press(screen.getByLabelText('Início'));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('respeita o preventDefault do evento', async () => {
    const { tabBarProps, navigation } = props(0);
    (navigation.emit as jest.Mock).mockReturnValue({ defaultPrevented: true });
    await render(<TabBar {...tabBarProps} />);
    await userEvent.press(screen.getByLabelText('Mais'));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('ignora rotas que não estão no mapa de abas', async () => {
    const { tabBarProps } = props(0, [...ROUTES, 'rota-fantasma']);
    await render(<TabBar {...tabBarProps} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });
});
