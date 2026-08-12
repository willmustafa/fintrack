import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Picker, type PickerOption } from '@/components/picker';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { TransactionRow } from '@/components/transaction-row';
import { Chip, Fab, Field } from '@/components/ui';
import { groupByDay, monthIncome, monthOutflow } from '@/lib/finance';
import { dayGroupLabel, formatCurrencyShort } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';
import type { TransactionKind } from '@/types';

const TODAY = '2024-05-24';

const KIND_OPTIONS: PickerOption<TransactionKind | 'todos'>[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'gasto', label: 'Gastos' },
  { value: 'ganho', label: 'Ganhos' },
  { value: 'transferencia', label: 'Transferências' },
  { value: 'aporte', label: 'Aportes' },
];

/** Transações · V1 do board (busca + filtros + agrupamento por dia). */
export default function TransacoesScreen() {
  const router = useRouter();
  const { transactions, accounts, splits } = useSnapshot();

  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<TransactionKind | 'todos'>('todos');
  const [category, setCategory] = useState<string>('todas');
  const [accountId, setAccountId] = useState<string>('todas');
  const [openPicker, setOpenPicker] = useState<'tipo' | 'categoria' | 'conta' | null>(null);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  const categoryOptions = useMemo<PickerOption<string>[]>(
    () => [
      { value: 'todas', label: 'Todas as categorias' },
      ...[...new Set(transactions.map((t) => t.category))]
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [transactions],
  );

  const accountOptions = useMemo<PickerOption<string>[]>(
    () => [
      { value: 'todas', label: 'Todas as contas' },
      ...accounts.map((account) => ({
        value: account.id,
        label: account.name,
        hint: account.kind === 'cartao' ? 'Cartão' : 'Conta',
      })),
    ],
    [accounts],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (kind !== 'todos' && t.kind !== kind) return false;
      if (category !== 'todas' && t.category !== category) return false;
      if (accountId !== 'todas' && t.accountId !== accountId) return false;
      if (term && !t.description.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [transactions, kind, category, accountId, search]);

  /** Lançamentos rachados ganham um "dividido" no subtítulo. */
  const splitTransactionIds = useMemo(
    () => new Set(splits.map((split) => split.transactionId).filter(Boolean)),
    [splits],
  );

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const income = monthIncome(filtered);
  const outflow = monthOutflow(filtered);

  return (
    <Screen background={colors.surface}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md }}>
        <Text weight="extrabold" size="heading">
          Transações
        </Text>

        <Field
          placeholder="Buscar transação"
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}>
          <Chip
            label={KIND_OPTIONS.find((o) => o.value === kind)!.label.replace('Todos os tipos', 'Tipo')}
            caret
            active={kind !== 'todos'}
            onPress={() => setOpenPicker('tipo')}
          />
          <Chip
            label={category === 'todas' ? 'Categoria' : category}
            caret
            active={category !== 'todas'}
            onPress={() => setOpenPicker('categoria')}
          />
          <Chip
            label={accountId === 'todas' ? 'Conta' : accountName(accountId)}
            caret
            active={accountId !== 'todas'}
            onPress={() => setOpenPicker('conta')}
          />
          <Chip label="Maio" />
        </ScrollView>

        {/* Resumo do período filtrado (Transações · V2) */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SummaryTile label="Entradas" value={`+${formatCurrencyShort(income)}`} color={colors.income} />
          <SummaryTile label="Saídas" value={`-${formatCurrencyShort(outflow)}`} color={colors.expense} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <Text size="small" color={colors.textSecondary} align="center" style={{ marginTop: 40 }}>
            Nenhuma transação com esses filtros.
          </Text>
        ) : null}

        {grouped.map(([date, items]) => (
          <View key={date}>
            <Text
              size="tiny"
              weight="bold"
              color={colors.textSecondary}
              style={{ paddingTop: spacing.lg, paddingBottom: 4 }}>
              {dayGroupLabel(date, TODAY).toUpperCase()}
            </Text>
            {items.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                subtitle={`${transaction.category} · ${accountName(transaction.accountId)}${
                  splitTransactionIds.has(transaction.id) ? ' · dividido' : ''
                }`}
                onPress={() => router.push(`/transacao/${transaction.id}`)}
                last={index === items.length - 1}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <Fab onPress={() => router.push('/transacao/nova')} bottom={24} />

      <Picker
        visible={openPicker === 'tipo'}
        title="Tipo"
        options={KIND_OPTIONS}
        value={kind}
        onSelect={setKind}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'categoria'}
        title="Categoria"
        options={categoryOptions}
        value={category}
        onSelect={setCategory}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'conta'}
        title="Conta"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        onClose={() => setOpenPicker(null)}
      />
    </Screen>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      }}>
      <Text size="tiny" color={colors.textSecondary}>
        {label}
      </Text>
      <Text weight="extrabold" size="body" color={color} style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
