import { render, screen } from '@testing-library/react-native';

import { Text } from '@/components/text';
import { colors, fonts, fontSize } from '@/theme/tokens';

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

describe('Text', () => {
  it('usa peso regular, tamanho body e cor padrão', async () => {
    await render(<Text>Olá</Text>);
    expect(styleOf(screen.getByText('Olá'))).toMatchObject({
      fontFamily: fonts.regular,
      fontSize: fontSize.body,
      color: colors.text,
    });
  });

  it.each(Object.keys(fonts) as (keyof typeof fonts)[])('aplica o peso %s', async (weight) => {
    await render(<Text weight={weight}>peso</Text>);
    expect(styleOf(screen.getByText('peso')).fontFamily).toBe(fonts[weight]);
  });

  it.each(Object.keys(fontSize) as (keyof typeof fontSize)[])(
    'aplica o tamanho %s',
    async (size) => {
      await render(<Text size={size}>tamanho</Text>);
      expect(styleOf(screen.getByText('tamanho')).fontSize).toBe(fontSize[size]);
    },
  );

  it('aceita tamanho numérico direto (usado no avatar)', async () => {
    await render(<Text size={9.8}>numérico</Text>);
    expect(styleOf(screen.getByText('numérico')).fontSize).toBe(9.8);
  });

  it('aceita cor e alinhamento', async () => {
    await render(
      <Text color={colors.expense} align="center">
        alinhado
      </Text>,
    );
    expect(styleOf(screen.getByText('alinhado'))).toMatchObject({
      color: colors.expense,
      textAlign: 'center',
    });
  });

  it('o style passado sobrescreve o padrão', async () => {
    await render(<Text style={{ fontSize: 99 }}>custom</Text>);
    expect(styleOf(screen.getByText('custom')).fontSize).toBe(99);
  });

  it('repassa props do Text do react-native', async () => {
    await render(<Text numberOfLines={1}>cortado</Text>);
    expect(screen.getByText('cortado').props.numberOfLines).toBe(1);
  });
});
