import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, ProgressBar } from '@/components/ui';
import { goalProgress } from '@/lib/finance';
import { formatCurrencyShort, formatMonthShort } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';

/** Metas · V1 (cards com barra de progresso) + estado "orçamento a definir" da V4. */
export default function MetasScreen() {
  const router = useRouter();
  const { goals, investments } = useSnapshot();

  return (
    <Screen background={colors.surface}>
      <Header title="Metas" action="add" onAction={() => {}} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        {goals.map((goal) => {
          const progress = goalProgress(goal);
          const linked = investments.find((i) => i.id === goal.linkedInvestmentId);
          const chosenQuote = goal.quotes?.find((quote) => quote.chosen);

          return (
            <Card key={goal.id} onPress={() => router.push(`/metas/${goal.id}`)}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 9,
                }}>
                <Text weight="extrabold" size="small" style={{ flex: 1 }} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text weight="extrabold" size="caption" color={colors.accent}>
                  {goal.target ? `${Math.round(progress * 100)}%` : 'a definir'}
                </Text>
              </View>

              <ProgressBar progress={progress} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  gap: spacing.sm,
                }}>
                <Text size="caption" color={colors.textSecondary}>
                  {goal.target
                    ? `${formatCurrencyShort(goal.saved)} / ${formatCurrencyShort(goal.target)}`
                    : chosenQuote
                      ? `orçamento escolhido ${formatCurrencyShort(chosenQuote.amount)}`
                      : `${goal.quotes?.length ?? 0} orçamentos para comparar`}
                </Text>
                <Text size="caption" color={colors.textSecondary}>
                  {goal.deadline ? `Prazo: ${formatMonthShort(goal.deadline)}` : 'Sem prazo'}
                </Text>
              </View>

              {linked ? (
                <Text size="tiny" color={colors.textMuted} style={{ marginTop: 6 }}>
                  ↳ vinculada: {linked.name}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
