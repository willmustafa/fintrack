import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Notice, SwitchRow } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import type { Account, AccountKind } from '@/types';
import { colors, spacing } from '@/theme/tokens';

const KIND_LABEL: Record<AccountKind, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  cartao: 'Cartão de crédito',
  investimento: 'Conta de investimento',
};

const summaryOf = (account: Account) =>
  account.kind === 'cartao'
    ? `${KIND_LABEL[account.kind]} · fatura ${formatCurrency(account.invoice ?? 0)}`
    : `${KIND_LABEL[account.kind]} · ${formatCurrency(account.balance)}`;

/** Perfil · Contas e cartões compartilhados — o que cada convidado enxerga. */
export default function CompartilhadosScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { accounts, loans, people } = useSnapshot();
  const { setAccountShared } = useFintrack();

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (ownerId: string) => people.find((item) => item.id === ownerId)?.name ?? ownerId;

  /** Só dá para mexer no compartilhamento do que é do casal ou seu. */
  const canToggle = (account: Account) =>
    account.ownerId === 'casal' || account.ownerId === person?.id;

  const toggle = async (account: Account, shared: boolean) => {
    setPending(account.id);
    setError(null);
    try {
      await setAccountShared(account.id, shared);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível alterar o compartilhamento.',
      );
    } finally {
      setPending(null);
    }
  };

  const sharedCount = accounts.filter((account) => account.ownerId === 'casal').length;

  return (
    <Screen background={colors.surface}>
      <Header title="Compartilhados" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        {error ? <Notice tone="error" message={error} /> : null}

        <Notice
          message={`${sharedCount} de ${accounts.length} contas e cartões aparecem para quem tem acesso. O que estiver desligado fica visível só para você.`}
        />

        <Text weight="extrabold" size="small" color={colors.textSecondary}>
          CONTAS E CARTÕES
        </Text>

        <Card style={{ paddingVertical: 4 }}>
          {accounts.map((account, index) => (
            <SwitchRow
              key={account.id}
              title={account.name}
              subtitle={
                canToggle(account)
                  ? summaryOf(account)
                  : `${summaryOf(account)} · de ${nameOf(account.ownerId)}`
              }
              value={account.ownerId === 'casal'}
              disabled={!canToggle(account) || pending === account.id}
              onValueChange={(value) => void toggle(account, value)}
              last={index === accounts.length - 1}
            />
          ))}
        </Card>

        {loans.length > 0 ? (
          <>
            <Text weight="extrabold" size="small" color={colors.textSecondary}>
              FINANCIAMENTOS
            </Text>
            <Card style={{ gap: spacing.sm }}>
              {loans.map((loan) => (
                <View key={loan.id} style={{ gap: 2 }}>
                  <Text weight="bold" size="small">
                    {loan.name}
                  </Text>
                  <Text size="caption" color={colors.textSecondary}>
                    Saldo devedor {formatCurrency(loan.balance)} · sempre compartilhado com quem
                    paga as parcelas
                  </Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <Button
          title="Convidar alguém"
          variant="outline"
          icon="person-add-outline"
          onPress={() => router.push('/perfil/convidar')}
        />
      </ScrollView>
    </Screen>
  );
}
