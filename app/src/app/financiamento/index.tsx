import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Divider, ProgressBar, SplitBar } from '@/components/ui';
import { formatCurrency, formatCurrencyShort } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, ownerColors, spacing } from '@/theme/tokens';

const OWNER_NAME: Record<string, string> = { ana: 'Ana', marcelo: 'Marcelo', casal: 'Casal' };

/** Financiamento · Visão geral do board. */
export default function FinanciamentoScreen() {
  const router = useRouter();
  const { loans } = useSnapshot();
  const loan = loans[0];

  if (!loan) {
    return (
      <Screen background={colors.surface}>
        <Header title="Financiamento" />
        <Text size="small" color={colors.textSecondary} align="center" style={{ marginTop: 40 }}>
          Nenhum financiamento cadastrado.
        </Text>
      </Screen>
    );
  }

  const paidPercent = ((loan.total - loan.balance) / loan.total) * 100;
  const downTotal = loan.downPayment.reduce((sum, part) => sum + part.amount, 0);

  return (
    <Screen background={colors.surface}>
      <Header title={loan.name} action="ellipsis-horizontal" onAction={() => {}} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Card accent>
          <Text size="caption" color="rgba(255,255,255,0.85)">
            Saldo devedor
          </Text>
          <Text weight="extrabold" size="display" color={colors.white} style={{ marginTop: 3 }}>
            {formatCurrency(loan.balance, 0)}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar
              progress={paidPercent / 100}
              height={8}
              color={colors.white}
              track="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
            <Text size="tiny" color="rgba(255,255,255,0.9)">
              {paidPercent.toFixed(1).replace('.', ',')}% quitado
            </Text>
            <Text size="tiny" color="rgba(255,255,255,0.9)">
              Total {formatCurrencyShort(loan.total)}
            </Text>
          </View>
        </Card>

        <Card>
          <Text weight="extrabold" size="small" style={{ marginBottom: spacing.md }}>
            Entrada — {formatCurrencyShort(downTotal)}
          </Text>
          <SplitBar
            parts={loan.downPayment.map((part) => ({
              value: part.amount,
              color: ownerColors[part.ownerId],
            }))}
          />
          <View style={{ gap: 6, marginTop: spacing.md }}>
            {loan.downPayment.map((part) => (
              <View
                key={part.ownerId}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Avatar ownerId={part.ownerId} size={16} />
                <Text size="caption" color={colors.textBody}>
                  {OWNER_NAME[part.ownerId]} · {formatCurrencyShort(part.amount)} (
                  {Math.round((part.amount / downTotal) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text weight="extrabold" size="small" style={{ marginBottom: spacing.sm }}>
            Parcelas pagas por pessoa
          </Text>
          {loan.paidByOwner.map((part, index) => (
            <View key={part.ownerId}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 10,
                }}>
                <Avatar ownerId={part.ownerId} size={30} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold" size="small">
                    {OWNER_NAME[part.ownerId]}
                  </Text>
                  <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                    {part.installments} parcelas pagas
                  </Text>
                </View>
                <Text weight="extrabold" size="small">
                  {formatCurrencyShort(part.amount)}
                </Text>
              </View>
              {index < loan.paidByOwner.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Card style={{ flex: 1 }}>
            <Text size="tiny" color={colors.textSecondary}>
              Quitação prevista
            </Text>
            <Text weight="extrabold" size="body" style={{ marginTop: 3 }}>
              {loan.payoffDate}
            </Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text size="tiny" color={colors.textSecondary}>
              Taxa
            </Text>
            <Text weight="extrabold" size="body" style={{ marginTop: 3 }}>
              {loan.rate}
            </Text>
          </Card>
        </View>

        <Button
          title="Ver amortização detalhada"
          variant="outline"
          onPress={() => router.push('/financiamento/amortizacao')}
        />
      </ScrollView>
    </Screen>
  );
}
