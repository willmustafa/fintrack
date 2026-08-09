import { screen, userEvent } from '@testing-library/react-native';

import { renderWithSafeArea as render } from '../helpers/render';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';

const setup = (over: Partial<React.ComponentProps<typeof ActionSheet>> = {}) => {
  const actions: SheetAction[] = [
    { label: 'Acesso total', icon: 'key-outline', selected: true, onPress: jest.fn() },
    { label: 'Só leitura', onPress: jest.fn() },
    { label: 'Remover acesso', destructive: true, onPress: jest.fn() },
  ];
  const props = {
    visible: true,
    title: 'Marcelo Souza',
    subtitle: 'marcelo@email.com',
    actions,
    onClose: jest.fn(),
    ...over,
  };
  return { props, actions: props.actions, render: () => render(<ActionSheet {...props} />) };
};

describe('ActionSheet', () => {
  it('mostra título, subtítulo e ações', async () => {
    const { render: r } = setup();
    await r();
    expect(screen.getByText('Marcelo Souza')).toBeOnTheScreen();
    expect(screen.getByText('marcelo@email.com')).toBeOnTheScreen();
    expect(screen.getByText('Acesso total')).toBeOnTheScreen();
    expect(screen.getByText('Remover acesso')).toBeOnTheScreen();
  });

  it('tocar numa ação fecha o sheet e executa o callback', async () => {
    const { props, actions, render: r } = setup();
    await r();
    await userEvent.press(screen.getByText('Só leitura'));
    expect(props.onClose).toHaveBeenCalled();
    expect(actions[1].onPress).toHaveBeenCalledTimes(1);
    expect(actions[0].onPress).not.toHaveBeenCalled();
  });

  it('Cancelar só fecha', async () => {
    const { props, actions, render: r } = setup();
    await r();
    await userEvent.press(screen.getByText('Cancelar'));
    expect(props.onClose).toHaveBeenCalled();
    for (const action of actions) {
      expect(action.onPress).not.toHaveBeenCalled();
    }
  });

  it('funciona sem subtítulo', async () => {
    const { render: r } = setup({ subtitle: undefined });
    await r();
    expect(screen.queryByText('marcelo@email.com')).toBeNull();
    expect(screen.getByText('Marcelo Souza')).toBeOnTheScreen();
  });

  it('invisível não mostra as ações', async () => {
    const { render: r } = setup({ visible: false });
    await r();
    expect(screen.queryByText('Acesso total')).toBeNull();
  });

  it('lista de ações vazia ainda mostra o Cancelar', async () => {
    const { render: r } = setup({ actions: [] });
    await r();
    expect(screen.getByText('Cancelar')).toBeOnTheScreen();
  });
});
