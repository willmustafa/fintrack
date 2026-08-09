import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, ProgressBar } from '@/components/ui';
import { goalProgress } from '@/lib/finance';
import { formatCurrency, formatCurrencyShort, formatMonthLong } from '@/lib/format';
import { useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Metas · Orçamento do board: quando a meta ainda não tem valor, o app compara
 * orçamentos e o escolhido vira o alvo da meta.
 */
export default function MetaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, investments } = useSnapshot();
  const { chooseGoalQuote } = useFintrack();
  const [saving, setSaving] = useState<string | null>(null);

  const goal = goals.find((item) => item.id === id);
  if (!goal) {
    return (
      <Screen background={colors.surface}>
        <Header title="Meta" />
        <Text size="small" color={colors.textSecondary} align="center" style={{ marginTop: 40 }}>
          Meta não encontrada.
        </Text>
      </Screen>
    );
  }

  const linked = investments.find((i) => i.id === goal.linkedInvestmentId);
  const chosen = goal.quotes?.find((quote) => quote.chosen);
  const progress = goalProgress(goal);

  const onChoose = async (quoteId: string) => {
    setSaving(quoteId);
    try {
      await chooseGoalQuote(goal.id, quoteId);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Screen background={colors.surface}>
      <Header title={goal.name} action="ellipsis-horizontal" onAction={() => {}} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Card>
          <Text size="caption" color={colors.textSecondary}>
            Valor da meta
          </Text>
          <Text weight="extrabold" size="display" style={{ marginTop: 2 }}>
            {goal.target ? formatCurrency(goal.target, 0) : '—'}
          </Text>
          {goal.target ? (
            <>
              <View style={{ marginTop: spacing.md }}>
                <ProgressBar progress={progress} />
              </View>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text size="caption" color={colors.textSecondary}>
                  {formatCurrencyShort(goal.saved)} guardados
                </Text>
                <Text size="caption" color={colors.textSecondary}>
                  {goal.deadline ? formatMonthLong(goal.deadline) : 'Sem prazo'}
                </Text>
              </View>
            </>
          ) : (
            <Text size="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
              Ainda não definido — escolha um orçamento
            </Text>
          )}
        </Card>

        {linked ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.sm,
                backgroundColor: colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="trending-up" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="semibold" size="small">
                Vinculada a {linked.name}
              </Text>
              <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                Saldo atual {formatCurrencyShort(linked.current)}
              </Text>
            </View>
          </Card>
        ) : null}

        {goal.quotes?.length ? (
          <>
            <Text weight="extrabold" size="small" style={{ marginTop: spacing.xs }}>
              Comparar orçamentos · {goal.quotes.length} opções
            </Text>

            {goal.quotes.map((quote) => {
              const isChosen = quote.chosen;
              return (
                <Card
                  key={quote.id}
                  style={{
                    borderColor: isChosen ? colors.accent : colors.border,
                    borderWidth: isChosen ? 1.5 : 1,
                    gap: spacing.sm,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text weight="bold" size="small">
                        {quote.title}
                      </Text>
                      <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {quote.vendor}
                      </Text>
                    </View>
                    <Text weight="extrabold" size="body">
                      {formatCurrency(quote.amount, 0)}
                    </Text>
                  </View>

                  {isChosen ? (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: colors.accentSoft,
                        borderRadius: radius.pill,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.accent} />
                      <Text size="tiny" weight="bold" color={colors.accent}>
                        Escolhida
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onChoose(quote.id)}
                      disabled={saving !== null}
                      style={({ pressed }) => ({
                        alignSelf: 'flex-start',
                        opacity: pressed || saving === quote.id ? 0.6 : 1,
                      })}>
                      <Text size="caption" weight="bold" color={colors.accent}>
                        Escolher esta ›
                      </Text>
                    </Pressable>
                  )}
                </Card>
              );
            })}

            <Button
              title={
                chosen
                  ? `Confirmar orçamento · ${formatCurrency(chosen.amount, 0)}`
                  : 'Escolha um orçamento'
              }
              disabled={!chosen}
              onPress={() => chosen && onChoose(chosen.id)}
              style={{ marginTop: spacing.xs }}
            />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
