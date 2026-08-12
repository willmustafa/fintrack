import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { Avatar, CategoryTile, ContactAvatar } from '@/components/avatar';
import { colors, ownerColors } from '@/theme/tokens';
import type { OwnerId } from '@/types';

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

describe('Avatar', () => {
  it.each([
    ['ana', 'A'],
    ['marcelo', 'M'],
    ['casal', 'C'],
  ] as [OwnerId, string][])('mostra a inicial de %s', async (ownerId, inicial) => {
    await render(<Avatar ownerId={ownerId} />);
    expect(screen.getByText(inicial)).toBeOnTheScreen();
  });

  it.each(['ana', 'marcelo', 'casal'] as OwnerId[])('usa a cor de %s', async (ownerId) => {
    await render(<Avatar ownerId={ownerId} />);
    const circulo = screen.getByText(/[AMC]/).parent!;
    expect(styleOf(circulo).backgroundColor).toBe(ownerColors[ownerId]);
  });

  it('tamanho padrão é 24 e o círculo é redondo', async () => {
    await render(<Avatar ownerId="ana" />);
    expect(styleOf(screen.getByText('A').parent!)).toMatchObject({
      width: 24,
      height: 24,
      borderRadius: 12,
    });
  });

  it('escala o texto junto com o tamanho', async () => {
    await render(<Avatar ownerId="ana" size={50} />);
    expect(styleOf(screen.getByText('A')).fontSize).toBe(21);
  });

  it('aceita style extra', async () => {
    await render(<Avatar ownerId="ana" style={{ marginLeft: 8 }} />);
    expect(styleOf(screen.getByText('A').parent!).marginLeft).toBe(8);
  });
});

describe('CategoryTile', () => {
  it('mostra o conteúdo e o selo da pessoa', async () => {
    await render(
      <CategoryTile ownerId="marcelo">
        <RNText>ícone</RNText>
      </CategoryTile>,
    );
    expect(screen.getByText('ícone')).toBeOnTheScreen();
    expect(screen.getByText('M')).toBeOnTheScreen();
  });

  it('funciona sem filhos', async () => {
    await render(<CategoryTile ownerId="casal" />);
    expect(screen.getByText('C')).toBeOnTheScreen();
  });

  it('o selo escala com o tamanho do quadrado', async () => {
    await render(<CategoryTile ownerId="ana" size={100} />);
    expect(styleOf(screen.getByText('A').parent!).width).toBe(42);
  });
});

describe('ContactAvatar', () => {
  it('mostra a inicial de quem divide contas', async () => {
    await render(<ContactAvatar initial="J" />);
    expect(screen.getByText('J')).toBeOnTheScreen();
  });

  it('quem não usa o app fica com a cor neutra do app', async () => {
    await render(<ContactAvatar initial="J" />);
    expect(styleOf(screen.getByText('J').parent!).backgroundColor).toBe(colors.accentSoft);
  });

  it('quem usa o app ganha a cor da pessoa', async () => {
    await render(<ContactAvatar initial="M" ownerId="marcelo" />);
    expect(styleOf(screen.getByText('M').parent!).backgroundColor).toBe(ownerColors.marcelo);
    expect(styleOf(screen.getByText('M')).color).toBe(colors.white);
  });

  it('escala o texto junto com o tamanho', async () => {
    await render(<ContactAvatar initial="J" size={50} />);
    expect(styleOf(screen.getByText('J')).fontSize).toBe(20);
  });
});
