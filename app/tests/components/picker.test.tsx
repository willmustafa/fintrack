import { screen, userEvent } from '@testing-library/react-native';

import { renderWithSafeArea as render } from '../helpers/render';

import { Picker, type PickerOption } from '@/components/picker';

const options: PickerOption<string>[] = [
  { value: 'corrente', label: 'Conta corrente conjunta', hint: 'R$ 2.620,00' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'nubank', label: 'Nubank (casal)' },
];

const setup = (over: Partial<React.ComponentProps<typeof Picker<string>>> = {}) => {
  const props = {
    visible: true,
    title: 'Conta',
    options,
    value: 'corrente',
    onSelect: jest.fn(),
    onClose: jest.fn(),
    ...over,
  };
  return { props, render: () => render(<Picker {...props} />) };
};

describe('Picker', () => {
  it('mostra o título e todas as opções', async () => {
    const { render: r } = setup();
    await r();
    expect(screen.getByText('Conta')).toBeOnTheScreen();
    for (const option of options) {
      expect(screen.getByText(option.label)).toBeOnTheScreen();
    }
  });

  it('mostra a dica da opção quando existe', async () => {
    const { render: r } = setup();
    await r();
    expect(screen.getByText('R$ 2.620,00')).toBeOnTheScreen();
  });

  it('escolher uma opção avisa e fecha', async () => {
    const { props, render: r } = setup();
    await r();
    await userEvent.press(screen.getByText('Poupança'));
    expect(props.onSelect).toHaveBeenCalledWith('poupanca');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('o botão Fechar apenas fecha', async () => {
    const { props, render: r } = setup();
    await r();
    await userEvent.press(screen.getByText('Fechar'));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('invisível não mostra o conteúdo', async () => {
    const { render: r } = setup({ visible: false });
    await r();
    expect(screen.queryByText('Poupança')).toBeNull();
  });

  it('funciona sem valor escolhido', async () => {
    const { render: r } = setup({ value: undefined });
    await r();
    expect(screen.getByText('Conta corrente conjunta')).toBeOnTheScreen();
  });

  it('lista vazia mostra só o título e o Fechar', async () => {
    const { render: r } = setup({ options: [] });
    await r();
    expect(screen.getByText('Conta')).toBeOnTheScreen();
    expect(screen.getByText('Fechar')).toBeOnTheScreen();
  });
});
