import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { CategoryTile } from '@/components/avatar';
import { Text } from '@/components/text';
import { formatCurrency, formatSigned } from '@/lib/format';
import { signOf } from '@/lib/finance';
import { colors, spacing } from '@/theme/tokens';
import type { Transaction } from '@/types';

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Transporte: 'bus-outline',
  Essenciais: 'cart-outline',
  Mercado: 'cart-outline',
  Receita: 'trending-up-outline',
  Assinatura: 'tv-outline',
  Saúde: 'medkit-outline',
  Outros: 'fast-food-outline',
  Investimentos: 'trending-up-outline',
  Transferência: 'swap-horizontal-outline',
  Acerto: 'people-outline',
  Moradia: 'home-outline',
};

export function amountColor(transaction: Transaction): string {
  const sign = signOf(transaction);
  if (sign > 0) return colors.income;
  if (sign < 0) return colors.expense;
  return colors.text;
}

export function amountLabel(transaction: Transaction): string {
  return signOf(transaction) === 0
    ? formatCurrency(transaction.amount)
    : formatSigned(signOf(transaction) * transaction.amount);
}

type Props = {
  transaction: Transaction;
  /** Texto secundário — normalmente "Categoria · Conta" ou "24/05 · Conta" */
  subtitle: string;
  onPress?: () => void;
  last?: boolean;
  /** Saldo acumulado exibido abaixo do valor (extrato) */
  runningBalance?: number;
};

export function TransactionRow({ transaction, subtitle, onPress, last, runningBalance }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 11,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        opacity: pressed && onPress ? 0.6 : 1,
      })}>
      <CategoryTile ownerId={transaction.ownerId}>
        <Ionicons
          name={CATEGORY_ICONS[transaction.category] ?? 'pricetag-outline'}
          size={18}
          color={colors.textSecondary}
        />
      </CategoryTile>
      <View style={{ flex: 1 }}>
        <Text weight="bold" size="small" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text size="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text weight="bold" size="small" color={amountColor(transaction)}>
          {amountLabel(transaction)}
        </Text>
        {runningBalance !== undefined ? (
          <Text size="micro" color={colors.textMuted} style={{ marginTop: 2 }}>
            saldo {formatCurrency(runningBalance, 0)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
