import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LineChart } from '@/components/charts';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Divider, Segmented } from '@/components/ui';
import { formatCurrency, formatCurrencyShort } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';
import type { OwnerId } from '@/types';

type ViewMode = 'casal' | OwnerId;

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'casal', label: 'Casal' },
  { value: 'ana', label: 'Ana' },
  { value: 'marcelo', label: 'Marcelo' },
];

/** Financiamento · Amortização: evolução do saldo devedor e tabela de parcelas. */
export default function AmortizacaoScreen() {
  const { loans } = useSnapshot();
  const loan = loans[0];
  const [view, setView] = useState<ViewMode>('casal');

  if (!loan) {
    return (
      <Screen background={colors.surface}>
        <Header title="Amortização" />
        <Text size="small" color={colors.textSecondary} align="center" style={{ marginTop: 40 }}>
          Nenhum financiamento cadastrado.
        </Text>
      </Screen>
    );
  }

  const totalPaid = loan.paidByOwner.reduce((sum, part) => sum + part.amount, 0) || 1;
  /** Fatia da pessoa selecionada no que já foi pago (Casal = 100%). */
  const share =
    view === 'casal'
      ? 1
      : (loan.paidByOwner.find((part) => part.ownerId === view)?.amount ?? 0) / totalPaid;

  return (
    <Screen background={colors.surface}>
      <Header title="Amortização" centered={false} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Segmented options={OPTIONS} value={view} onChange={setView} />

        <Card>
          <Text weight="extrabold" size="small" style={{ marginBottom: spacing.md }}>
            Saldo devedor ao longo do tempo
          </Text>
          <LineChart
            values={loan.balanceSeries.map((point) => point.balance)}
            labels={[
              String(loan.balanceSeries[0].year),
              String(loan.balanceSeries[Math.floor(loan.balanceSeries.length / 2)].year),
              String(loan.balanceSeries[loan.balanceSeries.length - 1].year),
            ]}
          />
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Text weight="extrabold" size="small">
            Parcelas · a partir de maio
          </Text>

          <View style={{ flexDirection: 'row', paddingBottom: 6 }}>
            <Text size="tiny" color={colors.textSecondary} style={{ width: 58 }}>
              Parcela
            </Text>
            <Text size="tiny" color={colors.textSecondary} align="right" style={{ flex: 1 }}>
              Juros
            </Text>
            <Text size="tiny" color={colors.textSecondary} align="right" style={{ flex: 1 }}>
              Amort.
            </Text>
            <Text size="tiny" color={colors.textSecondary} align="right" style={{ flex: 1.3 }}>
              Saldo
            </Text>
          </View>
          <Divider />

          {loan.installments.map((installment) => (
            <View
              key={installment.number}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9 }}>
              <Text weight="bold" size="caption" style={{ width: 58 }}>
                {installment.number}
              </Text>
              <Text size="caption" color={colors.textBody} align="right" style={{ flex: 1 }}>
                {formatCurrencyShort(installment.interest * share)}
              </Text>
              <Text size="caption" color={colors.textBody} align="right" style={{ flex: 1 }}>
                {formatCurrencyShort(installment.amortization * share)}
              </Text>
              <Text weight="semibold" size="caption" align="right" style={{ flex: 1.3 }}>
                {formatCurrencyShort(installment.balance)}
              </Text>
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Card style={{ flex: 1 }}>
            <Text size="tiny" color={colors.textSecondary}>
              Já pago em juros
            </Text>
            <Text weight="extrabold" size="body" color={colors.expense} style={{ marginTop: 3 }}>
              {formatCurrency(loan.paidInterest * share, 0)}
            </Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text size="tiny" color={colors.textSecondary}>
              Já amortizado
            </Text>
            <Text weight="extrabold" size="body" color={colors.income} style={{ marginTop: 3 }}>
              {formatCurrency(loan.amortized * share, 0)}
            </Text>
          </Card>
        </View>

        {view !== 'casal' ? (
          <Text size="tiny" color={colors.textMuted} align="center">
            Valores proporcionais à participação de {view === 'ana' ? 'Ana' : 'Marcelo'} nas parcelas
            pagas ({Math.round(share * 100)}%).
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
