import { render, screen, userEvent } from '@testing-library/react-native';

import { TransactionRow, amountColor, amountLabel } from '@/components/transaction-row';
import { colors } from '@/theme/tokens';
import type { Transaction } from '@/types';

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  kind: 'gasto',
  description: 'Mercado',
  amount: 156.3,
  category: 'Essenciais',
  accountId: 'nubank',
  date: '2024-05-24',
  ownerId: 'casal',
  ...over,
});

describe('amountColor', () => {
  it('ganho é verde', () => {
    expect(amountColor(tx({ kind: 'ganho' }))).toBe(colors.income);
  });

  it('gasto e aporte são vermelhos', () => {
    expect(amountColor(tx({ kind: 'gasto' }))).toBe(colors.expense);
    expect(amountColor(tx({ kind: 'aporte' }))).toBe(colors.expense);
  });

  it('transferência é neutra', () => {
    expect(amountColor(tx({ kind: 'transferencia' }))).toBe(colors.text);
  });
});

describe('amountLabel', () => {
  it('ganho ganha um +', () => {
    expect(amountLabel(tx({ kind: 'ganho', amount: 4200 }))).toBe('+R$ 4.200,00');
  });

  it('gasto ganha um -', () => {
    expect(amountLabel(tx({ kind: 'gasto', amount: 156.3 }))).toBe('-R$ 156,30');
  });

  it('transferência sai sem sinal', () => {
    expect(amountLabel(tx({ kind: 'transferencia', amount: 500 }))).toBe('R$ 500,00');
  });
});

describe('TransactionRow', () => {
  it('mostra descrição, subtítulo e valor', async () => {
    await render(<TransactionRow transaction={tx()} subtitle="Essenciais · Nubank" />);
    expect(screen.getByText('Mercado')).toBeOnTheScreen();
    expect(screen.getByText('Essenciais · Nubank')).toBeOnTheScreen();
    expect(screen.getByText('-R$ 156,30')).toBeOnTheScreen();
  });

  it('mostra a etiqueta de quem lançou', async () => {
    await render(<TransactionRow transaction={tx({ ownerId: 'marcelo' })} subtitle="x" />);
    expect(screen.getByText('M')).toBeOnTheScreen();
  });

  it('pinta o valor conforme o tipo', async () => {
    await render(
      <TransactionRow transaction={tx({ kind: 'ganho', amount: 4200 })} subtitle="Receita" />,
    );
    expect(styleOf(screen.getByText('+R$ 4.200,00')).color).toBe(colors.income);
  });

  it('mostra o saldo acumulado quando informado', async () => {
    await render(<TransactionRow transaction={tx()} subtitle="x" runningBalance={4050} />);
    expect(screen.getByText('saldo R$ 4.050')).toBeOnTheScreen();
  });

  it('esconde o saldo acumulado por padrão', async () => {
    await render(<TransactionRow transaction={tx()} subtitle="x" />);
    expect(screen.queryByText(/^saldo/)).toBeNull();
  });

  it('saldo acumulado zero ainda é exibido', async () => {
    await render(<TransactionRow transaction={tx()} subtitle="x" runningBalance={0} />);
    expect(screen.getByText('saldo R$ 0')).toBeOnTheScreen();
  });

  it('responde ao toque', async () => {
    const onPress = jest.fn();
    await render(<TransactionRow transaction={tx()} subtitle="x" onPress={onPress} />);
    await userEvent.press(screen.getByText('Mercado'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('categoria desconhecida usa o ícone genérico sem quebrar', async () => {
    await render(<TransactionRow transaction={tx({ category: 'Categoria nova' })} subtitle="x" />);
    expect(screen.getByText('Mercado')).toBeOnTheScreen();
  });

  it.each([
    'Transporte',
    'Essenciais',
    'Mercado',
    'Receita',
    'Assinatura',
    'Saúde',
    'Outros',
    'Investimentos',
    'Transferência',
    'Moradia',
  ])('renderiza a categoria %s', async (category) => {
    await render(
      <TransactionRow transaction={tx({ description: 'Lançamento', category })} subtitle={category} />,
    );
    expect(screen.getByText(category)).toBeOnTheScreen();
  });

  it('última linha não desenha divisória', async () => {
    await render(<TransactionRow transaction={tx()} subtitle="x" last />);
    expect(screen.getByText('Mercado')).toBeOnTheScreen();
  });
});
