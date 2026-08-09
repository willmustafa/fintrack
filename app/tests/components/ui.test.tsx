import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Text as RNText, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  Fab,
  Field,
  ListRow,
  Notice,
  PasswordField,
  ProgressBar,
  SectionTitle,
  Segmented,
  SplitBar,
  SwitchRow,
} from '@/components/ui';
import { colors } from '@/theme/tokens';

/** Estilo resolvido de um nó, já achatado (o RN aceita array de estilos). */
const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

/**
 * Alguns componentes são puramente visuais (barras de progresso, divisores) e
 * não têm texto nem papel de acessibilidade — aqui a asserção é sobre o estilo
 * calculado, então varremos a árvore renderizada.
 */
const queryAll = (predicate: (node: { props: { style?: unknown } }) => boolean) =>
  screen.container.queryAll((node) => predicate(node as never));

describe('Card', () => {
  it('mostra o conteúdo', async () => {
    await render(
      <Card>
        <RNText>Conteúdo</RNText>
      </Card>,
    );
    expect(screen.getByText('Conteúdo')).toBeOnTheScreen();
  });

  it('sem onPress não vira área tocável', async () => {
    await render(
      <Card>
        <RNText>Estático</RNText>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('com onPress responde ao toque', async () => {
    const onPress = jest.fn();
    await render(
      <Card onPress={onPress}>
        <RNText>Tocável</RNText>
      </Card>,
    );
    await userEvent.press(screen.getByText('Tocável'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('variante accent usa o roxo de destaque', async () => {
    await render(
      <Card accent>
        <RNText testID="filho">x</RNText>
      </Card>,
    );
    const container = screen.getByTestId('filho').parent!;
    expect(styleOf(container).backgroundColor).toBe(colors.accent);
  });
});

describe('SectionTitle', () => {
  it('renderiza o texto', async () => {
    await render(<SectionTitle>Suas metas</SectionTitle>);
    expect(screen.getByText('Suas metas')).toBeOnTheScreen();
  });
});

describe('Button', () => {
  it('mostra o título e chama onPress', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('desabilitado não dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<Button title="Criar conta" onPress={onPress} disabled />);
    await userEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('carregando esconde o título e bloqueia o toque', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} loading />);
    expect(screen.queryByText('Entrar')).toBeNull();
    await userEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('variante outline e ghost também renderizam o título', async () => {
    await render(
      <>
        <Button title="Contorno" variant="outline" />
        <Button title="Fantasma" variant="ghost" />
      </>,
    );
    expect(screen.getByText('Contorno')).toBeOnTheScreen();
    expect(screen.getByText('Fantasma')).toBeOnTheScreen();
  });

  it('aceita ícone', async () => {
    await render(<Button title="Continuar com Google" icon="logo-google" />);
    expect(screen.getByText('Continuar com Google')).toBeOnTheScreen();
  });

  it('sem onPress não quebra ao ser pressionado', async () => {
    await render(<Button title="Inerte" />);
    await userEvent.press(screen.getByRole('button'));
    expect(screen.getByText('Inerte')).toBeOnTheScreen();
  });
});

describe('Field', () => {
  it('mostra rótulo e placeholder', async () => {
    await render(<Field label="E-mail" placeholder="voce@email.com" />);
    expect(screen.getByText('E-mail')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('voce@email.com')).toBeOnTheScreen();
  });

  it('propaga a digitação', async () => {
    const onChangeText = jest.fn();
    await render(<Field placeholder="Nome" onChangeText={onChangeText} />);
    await userEvent.type(screen.getByPlaceholderText('Nome'), 'Ana');
    expect(onChangeText).toHaveBeenLastCalledWith('Ana');
  });

  it('mostra a mensagem de erro', async () => {
    await render(<Field label="E-mail" error="E-mail inválido." />);
    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen();
  });

  it('mostra a dica quando não há erro', async () => {
    await render(<Field hint="Usaremos para avisos de fatura." />);
    expect(screen.getByText('Usaremos para avisos de fatura.')).toBeOnTheScreen();
  });

  it('erro tem prioridade sobre a dica', async () => {
    await render(<Field hint="dica" error="erro" />);
    expect(screen.getByText('erro')).toBeOnTheScreen();
    expect(screen.queryByText('dica')).toBeNull();
  });

  it('sem rótulo não renderiza rótulo vazio', async () => {
    await render(<Field placeholder="Só o campo" />);
    expect(screen.getByPlaceholderText('Só o campo')).toBeOnTheScreen();
  });

  it('aceita um nó à direita', async () => {
    await render(<Field right={<RNText>R$</RNText>} />);
    expect(screen.getByText('R$')).toBeOnTheScreen();
  });
});

describe('PasswordField', () => {
  it('começa com a senha oculta', async () => {
    await render(<PasswordField placeholder="Senha" />);
    expect(screen.getByPlaceholderText('Senha').props.secureTextEntry).toBe(true);
    expect(screen.getByLabelText('Mostrar senha')).toBeOnTheScreen();
  });

  it('alterna a visibilidade da senha', async () => {
    await render(<PasswordField placeholder="Senha" />);
    await userEvent.press(screen.getByLabelText('Mostrar senha'));
    expect(screen.getByPlaceholderText('Senha').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Ocultar senha')).toBeOnTheScreen();

    await userEvent.press(screen.getByLabelText('Ocultar senha'));
    expect(screen.getByPlaceholderText('Senha').props.secureTextEntry).toBe(true);
  });

  it('não capitaliza nem autocorrige', async () => {
    await render(<PasswordField placeholder="Senha" />);
    const input = screen.getByPlaceholderText('Senha');
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
  });
});

describe('Chip', () => {
  it('mostra o rótulo e responde ao toque', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Gastos" onPress={onPress} />);
    await userEvent.press(screen.getByText('Gastos'));
    expect(onPress).toHaveBeenCalled();
  });

  it('ativo pinta o fundo de roxo', async () => {
    await render(<Chip label="Tudo" active />);
    const container = screen.getByText('Tudo').parent!;
    expect(styleOf(container).backgroundColor).toBe(colors.accent);
  });

  it('com caret renderiza normalmente', async () => {
    await render(<Chip label="Mês" caret />);
    expect(screen.getByText('Mês')).toBeOnTheScreen();
  });

  it('ativo com caret também renderiza', async () => {
    await render(<Chip label="Mês" caret active />);
    expect(screen.getByText('Mês')).toBeOnTheScreen();
  });
});

describe('Segmented', () => {
  const options = [
    { value: 'gasto', label: 'Gasto' },
    { value: 'ganho', label: 'Ganho' },
  ];

  it('renderiza todas as opções', async () => {
    await render(<Segmented options={options} value="gasto" onChange={jest.fn()} />);
    expect(screen.getByText('Gasto')).toBeOnTheScreen();
    expect(screen.getByText('Ganho')).toBeOnTheScreen();
  });

  it('avisa a opção escolhida', async () => {
    const onChange = jest.fn();
    await render(<Segmented options={options} value="gasto" onChange={onChange} />);
    await userEvent.press(screen.getByText('Ganho'));
    expect(onChange).toHaveBeenCalledWith('ganho');
  });

  it('destaca a opção ativa em roxo', async () => {
    await render(<Segmented options={options} value="ganho" onChange={jest.fn()} />);
    expect(styleOf(screen.getByText('Ganho')).color).toBe(colors.accent);
    expect(styleOf(screen.getByText('Gasto')).color).toBe(colors.textSecondary);
  });
});

describe('ProgressBar', () => {
  it('converte o progresso em porcentagem de largura', async () => {
    await render(<ProgressBar progress={0.42} />);
    expect(queryAll((node) => styleOf(node).width === '42%')).toHaveLength(1);
  });

  it('limita o progresso entre 0 e 1', async () => {
    const { unmount } = await render(<ProgressBar progress={5} />);
    expect(queryAll((n) => styleOf(n).width === '100%').length).toBeGreaterThan(0);
    await unmount();

    await render(<ProgressBar progress={-3} />);
    expect(queryAll((n) => styleOf(n).width === '0%').length).toBeGreaterThan(0);
  });

  it('aceita altura e cores customizadas', async () => {
    await render(<ProgressBar progress={0.5} height={20} color="#000" track="#fff" />);
    expect(queryAll((n) => styleOf(n).height === 20).length).toBe(1);
  });
});

describe('SplitBar', () => {
  it('divide o espaço proporcionalmente', async () => {
    await render(
      <SplitBar
        parts={[
          { value: 40000, color: '#a' },
          { value: 10000, color: '#b' },
        ]}
      />,
    );
    const flexes = queryAll((n) => typeof styleOf(n).flex === 'number').map((n) => styleOf(n).flex);
    expect(flexes).toEqual([0.8, 0.2]);
  });

  it('partes zeradas não dividem por zero', async () => {
    await render(<SplitBar parts={[{ value: 0, color: '#a' }]} />);
    const flexes = queryAll((n) => typeof styleOf(n).flex === 'number').map((n) => styleOf(n).flex);
    expect(flexes).toEqual([0]);
  });

  it('sem partes renderiza só o trilho', async () => {
    await render(<SplitBar parts={[]} />);
    expect(screen.root).not.toBeNull();
  });
});

describe('ListRow', () => {
  it('mostra título, subtítulo e valor', async () => {
    await render(<ListRow title="Notificações" subtitle="Fatura e metas" value="Ativo" />);
    expect(screen.getByText('Notificações')).toBeOnTheScreen();
    expect(screen.getByText('Fatura e metas')).toBeOnTheScreen();
    expect(screen.getByText('Ativo')).toBeOnTheScreen();
  });

  it('responde ao toque quando tem onPress', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Editar perfil" onPress={onPress} />);
    await userEvent.press(screen.getByText('Editar perfil'));
    expect(onPress).toHaveBeenCalled();
  });

  it('o nó à direita substitui o valor', async () => {
    await render(<ListRow title="Conta" value="ignorado" right={<RNText>custom</RNText>} />);
    expect(screen.getByText('custom')).toBeOnTheScreen();
    expect(screen.queryByText('ignorado')).toBeNull();
  });

  it('aceita ícone e a flag de última linha', async () => {
    await render(<ListRow title="Segurança" icon="lock-closed-outline" last />);
    expect(screen.getByText('Segurança')).toBeOnTheScreen();
  });
});

describe('SwitchRow', () => {
  it('mostra título e subtítulo', async () => {
    await render(
      <SwitchRow
        title="Transações"
        subtitle="Cada lançamento novo"
        value={false}
        onValueChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Transações')).toBeOnTheScreen();
    expect(screen.getByText('Cada lançamento novo')).toBeOnTheScreen();
  });

  it('avisa a mudança do interruptor', async () => {
    const onValueChange = jest.fn();
    await render(<SwitchRow title="Faturas" value={false} onValueChange={onValueChange} />);
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('desabilitado não dispara a mudança', async () => {
    const onValueChange = jest.fn();
    await render(
      <SwitchRow title="Metas" value={false} onValueChange={onValueChange} disabled last />,
    );
    expect(screen.getByRole('switch').props.disabled).toBe(true);
    await userEvent.press(screen.getByRole('switch'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reflete o valor ligado', async () => {
    await render(<SwitchRow title="Resumo" value onValueChange={jest.fn()} />);
    expect(screen.getByRole('switch').props.value).toBe(true);
  });
});

describe('Notice', () => {
  it('mostra a mensagem', async () => {
    await render(<Notice message="Perfil atualizado." />);
    expect(screen.getByText('Perfil atualizado.')).toBeOnTheScreen();
  });

  it.each([
    ['info', colors.accent],
    ['error', colors.expense],
    ['success', colors.income],
  ] as const)('tom %s usa a cor correspondente', async (tone, cor) => {
    await render(<Notice message="msg" tone={tone} />);
    expect(styleOf(screen.getByText('msg')).color).toBe(cor);
  });
});

describe('Divider', () => {
  it('renderiza uma linha de 1px', async () => {
    await render(
      <View>
        <Divider />
      </View>,
    );
    expect(queryAll((n) => styleOf(n).height === 1).length).toBe(1);
  });
});

describe('Fab', () => {
  it('tem rótulo de acessibilidade e dispara o toque', async () => {
    const onPress = jest.fn();
    await render(<Fab onPress={onPress} />);
    await userEvent.press(screen.getByLabelText('Nova transação'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('aceita distância customizada do rodapé', async () => {
    await render(<Fab onPress={jest.fn()} bottom={90} />);
    expect(styleOf(screen.getByLabelText('Nova transação')).bottom).toBe(90);
  });
});
