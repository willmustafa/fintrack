import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { LineChart } from '@/components/charts';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Divider } from '@/components/ui';
import { investmentSeries } from '@/data/seed';
import { investmentTotals, investmentYield } from '@/lib/finance';
import { formatCurrency, formatCurrencyShort, formatPercent } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';
import type { Investment, InvestmentClass } from '@/types';

const CLASS_LABEL: Record<InvestmentClass, string> = {
  'renda-fixa': 'Renda fixa',
  acoes: 'Ações',
  cripto: 'Cripto',
};

const GROUPS: { key: 'fixa' | 'variavel'; title: string; classes: InvestmentClass[] }[] = [
  { key: 'fixa', title: 'RENDA FIXA', classes: ['renda-fixa'] },
  { key: 'variavel', title: 'RENDA VARIÁVEL', classes: ['acoes', 'cripto'] },
];

/** Investimentos · V1 (blocos por classe) com o gráfico de evolução da V2. */
export default function InvestimentosScreen() {
  const { investments } = useSnapshot();
  const totals = useMemo(() => investmentTotals(investments), [investments]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Text weight="extrabold" size="heading">
          Investimentos
        </Text>

        <Card accent>
          <Text size="caption" color="rgba(255,255,255,0.85)">
            Valor atual
          </Text>
          <Text weight="extrabold" size="display" color={colors.white} style={{ marginTop: 3 }}>
            {formatCurrency(totals.current, 0)}
          </Text>
          <Text size="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
            +{formatCurrency(totals.profit, 0)} · {formatPercent(totals.yieldPercent)}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <LineChart
              values={investmentSeries.map((point) => point.value)}
              labels={investmentSeries.map((point) => point.label)}
              color={colors.white}
              height={90}
              fill={false}
            />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Metric label="Aportado" value={formatCurrencyShort(totals.invested)} />
          <Metric label="Atual" value={formatCurrencyShort(totals.current)} />
          <Metric
            label="Rend."
            value={formatPercent(totals.yieldPercent)}
            color={colors.income}
          />
        </View>

        {GROUPS.map((group) => {
          const items = investments.filter((investment) => group.classes.includes(investment.class));
          if (items.length === 0) return null;
          return (
            <View key={group.key} style={{ gap: spacing.sm }}>
              <Text size="tiny" weight="bold" color={colors.textSecondary} style={{ letterSpacing: 0.6 }}>
                {group.title}
              </Text>
              <Card style={{ paddingVertical: 6 }}>
                {items.map((investment, index) => (
                  <View key={investment.id}>
                    <AssetRow investment={investment} />
                    {index < items.length - 1 ? <Divider /> : null}
                  </View>
                ))}
              </Card>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card style={{ flex: 1, paddingHorizontal: spacing.md }}>
      <Text size="tiny" color={colors.textSecondary}>
        {label}
      </Text>
      <Text weight="extrabold" size="body" color={color} style={{ marginTop: 3 }}>
        {value}
      </Text>
    </Card>
  );
}

function AssetRow({ investment }: { investment: Investment }) {
  const yieldPercent = investmentYield(investment);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 }}>
      <Avatar ownerId={investment.ownerId} size={32} />
      <View style={{ flex: 1 }}>
        <Text weight="bold" size="small">
          {investment.name}
        </Text>
        <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
          {CLASS_LABEL[investment.class]} · aportado {formatCurrencyShort(investment.invested)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text weight="bold" size="small">
          {formatCurrencyShort(investment.current)}
        </Text>
        <Text size="caption" weight="semibold" color={colors.income} style={{ marginTop: 1 }}>
          {formatPercent(yieldPercent)}
        </Text>
      </View>
    </View>
  );
}
