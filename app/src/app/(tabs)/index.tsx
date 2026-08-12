import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { MiniBars, NetBars } from '@/components/charts';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Fab, ProgressBar } from '@/components/ui';
import { balanceSeries, weeklySummary } from '@/data/seed';
import {
  budgetSlices,
  consolidatedBalance,
  goalProgress,
  goalsClosestToDone,
  loanPaidRatio,
  monthIncome,
  monthOutflow,
  monthsToPayoff,
  openInvoices,
} from '@/lib/finance';
import {
  formatCurrency,
  formatCurrencyShort,
  formatMonthSpan,
  formatPercent,
  formatSigned,
} from '@/lib/format';
import { useCurrentPerson, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Início · V1 do board: saldo consolidado + 50/30/20 + receitas × gastos. */
export default function DashboardScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { accounts, transactions, goals, loans } = useSnapshot();

  const balance = consolidatedBalance(accounts);
  const invoices = openInvoices(accounts);
  const outflow = monthOutflow(transactions);
  const income = monthIncome(transactions);
  const slices = useMemo(() => budgetSlices(transactions), [transactions]);

  const previous = balanceSeries[balanceSeries.length - 2] ?? balance;
  const growth = previous === 0 ? 0 : ((balance - previous) / previous) * 100;
  const cashAccounts = accounts.filter((account) => account.kind !== 'cartao').length;

  /** Quanto sobrou no mês e como isso se distribuiu pelas semanas. */
  const leftover = income - outflow;
  const weeklyNet = useMemo(
    () => weeklySummary.map((week) => ({ label: week.label, net: week.income - week.expense })),
    [],
  );

  const nextGoals = useMemo(() => goalsClosestToDone(goals), [goals]);
  const loan = loans[0];

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

        {/* Números do mês, logo no topo */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile
            label="Receitas"
            value={formatCurrencyShort(income)}
            color={colors.income}
            onPress={() => router.push('/transacoes')}
          />
          <StatTile
            label="Gasto do mês"
            value={formatCurrencyShort(outflow)}
            color={colors.expense}
            onPress={() => router.push('/transacoes')}
          />
          <StatTile
            label="Faturas"
            value={formatCurrencyShort(invoices)}
            onPress={() => router.push('/cartoes')}
          />
        </View>

        {/* Sobra do mês — a barra fica acima ou abaixo do zero em cada semana */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: spacing.lg,
            }}>
            <View>
              <Text size="tiny" color={colors.textSecondary}>
                {leftover >= 0 ? 'Sobrou no mês' : 'Faltou no mês'}
              </Text>
              <Text
                weight="extrabold"
                size="heading"
                color={leftover >= 0 ? colors.income : colors.expense}
                style={{ marginTop: 2 }}>
                {formatSigned(leftover, 0)}
              </Text>
            </View>
            <Text size="tiny" color={colors.textSecondary}>
              por semana
            </Text>
          </View>
          <NetBars data={weeklyNet} />
        </Card>

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

        {/* Metas mais perto de fechar */}
        {nextGoals.length > 0 ? (
          <Card onPress={() => router.push('/metas')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}>
              <Text weight="extrabold" size="small">
                Quase lá
              </Text>
              <Text size="tiny" color={colors.textSecondary}>
                Ver todas
              </Text>
            </View>
            <View style={{ gap: spacing.md }}>
              {nextGoals.map((goal) => {
                const progress = goalProgress(goal);
                return (
                  <View key={goal.id} style={{ gap: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text size="caption" color={colors.textBody} numberOfLines={1} style={{ flex: 1 }}>
                        {goal.name}
                      </Text>
                      <Text size="caption" weight="bold" color={colors.textSecondary}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                    <ProgressBar progress={progress} height={7} />
                    <Text size="micro" color={colors.textMuted}>
                      {formatCurrencyShort(goal.saved)} de {formatCurrencyShort(goal.target ?? 0)} ·
                      faltam {formatCurrencyShort((goal.target ?? 0) - goal.saved)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        {/* Financiamento: o que interessa é quanto tempo ainda falta */}
        {loan ? (
          <Card onPress={() => router.push('/financiamento')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}>
              <Text weight="extrabold" size="small">
                Financiamento
              </Text>
              <Text size="tiny" color={colors.textSecondary}>
                {formatPercent(loanPaidRatio(loan) * 100, 1).replace('+', '')} quitado
              </Text>
            </View>
            <ProgressBar progress={loanPaidRatio(loan)} height={7} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 6,
                marginTop: spacing.md,
              }}>
              <Text weight="extrabold" size="title">
                {monthsToPayoff(loan)}
              </Text>
              <Text size="caption" color={colors.textSecondary}>
                meses até quitar · {formatMonthSpan(monthsToPayoff(loan))}
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <Fab onPress={() => router.push('/transacao/nova')} bottom={24} />
    </Screen>
  );
}

/** Número do mês no topo do painel — o valor é o gráfico. */
function StatTile({
  label,
  value,
  color,
  onPress,
}: {
  label: string;
  value: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Card style={{ flex: 1, paddingHorizontal: spacing.md }} onPress={onPress}>
      <Text size="micro" color={colors.textSecondary} numberOfLines={1}>
        {label}
      </Text>
      <Text weight="extrabold" size="body" color={color} style={{ marginTop: 3 }}>
        {value}
      </Text>
    </Card>
  );
}
