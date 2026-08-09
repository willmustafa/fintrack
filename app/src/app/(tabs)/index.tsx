import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Donut, MiniBars, PairedBars } from '@/components/charts';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Fab, ProgressBar } from '@/components/ui';
import { balanceSeries, weeklySummary } from '@/data/seed';
import {
  REFERENCE_MONTH,
  budgetSlices,
  consolidatedBalance,
  monthIncome,
  monthOutflow,
  openInvoices,
} from '@/lib/finance';
import { formatCurrency, formatCurrencyShort, formatPercent, monthNameOf } from '@/lib/format';
import { useCurrentPerson, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Início · V1 do board: saldo consolidado + 50/30/20 + receitas × gastos. */
export default function DashboardScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { accounts, transactions, goals } = useSnapshot();

  const balance = consolidatedBalance(accounts);
  const invoices = openInvoices(accounts);
  const outflow = monthOutflow(transactions);
  const income = monthIncome(transactions);
  const slices = useMemo(() => budgetSlices(transactions), [transactions]);
  const slicesTotal = slices.reduce((sum, slice) => sum + slice.amount, 0) || 1;

  const previous = balanceSeries[balanceSeries.length - 2] ?? balance;
  const growth = previous === 0 ? 0 : ((balance - previous) / previous) * 100;
  const cashAccounts = accounts.filter((account) => account.kind !== 'cartao').length;
  const openGoals = goals.filter((goal) => goal.target && goal.saved < goal.target).length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        {/* Saudação */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text weight="extrabold" size="body" color={colors.accent}>
              {person?.initial ?? 'A'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text size="caption" color={colors.textSecondary}>
              Bom dia,
            </Text>
            <Text weight="extrabold" size="title">
              {person?.name.split(' ')[0] ?? 'Ana'}!
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="notifications-outline" size={19} color={colors.textBody} />
          </Pressable>
        </View>

        {/* Saldo consolidado */}
        <Card accent>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size="caption" color="rgba(255,255,255,0.85)">
              Saldo consolidado · {cashAccounts} contas
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}>
              <Text size="micro" weight="bold" color={colors.white}>
                {formatPercent(growth, 0)} no mês
              </Text>
            </View>
          </View>
          <Text weight="extrabold" size="display" color={colors.white} style={{ marginTop: 5 }}>
            {formatCurrency(balance)}
          </Text>
          <MiniBars values={balanceSeries} height={34} />
        </Card>

        {/* 50/30/20 */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <Donut
            slices={slices.map((slice) => ({ value: slice.amount, color: slice.color }))}
            centerTop={monthNameOf(REFERENCE_MONTH)}
            centerBottom="50/30/20"
          />
          <View style={{ flex: 1 }}>
            <Text weight="extrabold" size="small" style={{ marginBottom: spacing.sm }}>
              Divisão de gastos
            </Text>
            {slices.map((slice) => (
              <View
                key={slice.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 3,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      backgroundColor: slice.color,
                    }}
                  />
                  <Text size="caption" color={colors.textBody}>
                    {slice.label}
                  </Text>
                </View>
                <Text size="caption" weight="bold">
                  {Math.round((slice.amount / slicesTotal) * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Receitas × gastos */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}>
            <Text weight="extrabold" size="small">
              Receitas × Gastos
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Legend color={colors.income} label="Receita" />
              <Legend color={colors.expense} label="Gasto" />
            </View>
          </View>
          <PairedBars data={weeklySummary} />
        </Card>

        {/* Atalhos numéricos */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Card
            style={{ flex: 1, backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}
            onPress={() => router.push('/cartoes')}>
            <Text size="tiny" color={colors.textBody}>
              Faturas abertas
            </Text>
            <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
              {formatCurrencyShort(invoices)}
            </Text>
          </Card>
          <Card style={{ flex: 1 }} onPress={() => router.push('/transacoes')}>
            <Text size="tiny" color={colors.textSecondary}>
              Gasto do mês
            </Text>
            <Text weight="extrabold" size="title" color={colors.expense} style={{ marginTop: 3 }}>
              {formatCurrencyShort(outflow)}
            </Text>
          </Card>
        </View>

        {/* Orçamento do mês sobre a receita */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: spacing.md,
            }}>
            <Text weight="extrabold" size="small">
              Orçamento 50/30/20
            </Text>
            <Text size="tiny" color={colors.textSecondary}>
              receita {formatCurrencyShort(income)}
            </Text>
          </View>
          <View style={{ gap: spacing.md }}>
            {slices.map((slice) => {
              const target = (income * slice.target) / 100;
              return (
                <View key={slice.key} style={{ gap: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text size="caption" color={colors.textBody}>
                      {slice.label}
                    </Text>
                    <Text size="caption" color={colors.textSecondary}>
                      {formatCurrencyShort(slice.amount)} de {formatCurrencyShort(target)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={target === 0 ? 0 : slice.amount / target}
                    height={7}
                    color={slice.color}
                  />
                </View>
              );
            })}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Card style={{ flex: 1 }} onPress={() => router.push('/metas')}>
            <Text size="tiny" color={colors.textSecondary}>
              Metas em andamento
            </Text>
            <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
              {openGoals}
            </Text>
          </Card>
          <Card style={{ flex: 1 }} onPress={() => router.push('/financiamento')}>
            <Text size="tiny" color={colors.textSecondary}>
              Financiamento
            </Text>
            <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
              30,6%
            </Text>
          </Card>
        </View>
      </ScrollView>

      <Fab onPress={() => router.push('/transacao/nova')} bottom={24} />
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text size="micro" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}
