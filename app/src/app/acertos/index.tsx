import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ContactAvatar } from '@/components/avatar';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Segmented } from '@/components/ui';
import { ledgerBalances, splitTotals, type CounterpartBalance } from '@/lib/finance';
import { formatCurrency } from '@/lib/format';
import { useContacts, useLedger } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

const FILTERS = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'a-receber' as const, label: 'Me devem' },
  { value: 'a-pagar' as const, label: 'Eu devo' },
];

/**
 * Acertos — quem me deve, a quem eu devo e em quais lançamentos.
 *
 * As divisões nascem no formulário de transação ("dividi essa conta") ou
 * avulsas em `acertos/nova`, e são quitadas em `acertos/[id]`.
 */
export default function AcertosScreen() {
  const router = useRouter();
  const entries = useLedger();
  const contacts = useContacts();
  const [filter, setFilter] = useState<'todos' | 'a-receber' | 'a-pagar'>('todos');

  const totals = useMemo(() => splitTotals(entries), [entries]);
  const balances = useMemo(() => ledgerBalances(entries), [entries]);

  const visible = balances.filter((balance) => {
    if (filter === 'a-receber') return balance.net > 0;
    if (filter === 'a-pagar') return balance.net < 0;
    return true;
  });

  return (
    <Screen>
      <Header title="Acertos" action="people-outline" onAction={() => router.push('/acertos/pessoas')} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TotalTile label="Te devem" value={totals.toReceive} color={colors.income} />
          <TotalTile label="Você deve" value={totals.toPay} color={colors.expense} />
        </View>

        <Text size="caption" color={colors.textSecondary}>
          {totals.net === 0
            ? 'Suas contas estão empatadas.'
            : totals.net > 0
              ? `No fim das contas, sobram ${formatCurrency(totals.net)} para você receber.`
              : `No fim das contas, faltam ${formatCurrency(Math.abs(totals.net))} para você pagar.`}
        </Text>

        <Segmented options={FILTERS} value={filter} onChange={setFilter} />

        {visible.length === 0 ? (
          <Card>
            <Text size="small" color={colors.textSecondary} align="center">
              {entries.length === 0
                ? 'Nenhuma divisão por aqui. Divida um gasto pelo formulário de transação ou registre uma dívida avulsa.'
                : 'Ninguém nesse filtro.'}
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {visible.map((balance, index) => (
              <CounterpartRow
                key={balance.id}
                balance={balance}
                initial={contacts.find((contact) => contact.id === balance.id)?.initial}
                onPress={() => router.push(`/acertos/${balance.id}`)}
                last={index === visible.length - 1}
              />
            ))}
          </Card>
        )}

        <Button
          title="Nova divisão"
          variant="outline"
          icon="add"
          onPress={() => router.push('/acertos/nova')}
        />
        <Button
          title="Pessoas"
          variant="ghost"
          icon="people-outline"
          onPress={() => router.push('/acertos/pessoas')}
        />
      </ScrollView>
    </Screen>
  );
}

function TotalTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      }}>
      <Text size="tiny" color={colors.textSecondary}>
        {label}
      </Text>
      <Text weight="extrabold" size="title" color={color} style={{ marginTop: 2 }}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function CounterpartRow({
  balance,
  initial,
  onPress,
  last,
}: {
  balance: CounterpartBalance;
  initial?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const settledOnly = balance.open.length === 0;
  const tone = balance.net > 0 ? colors.income : balance.net < 0 ? colors.expense : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        opacity: pressed ? 0.6 : 1,
      })}>
      <ContactAvatar initial={initial ?? balance.name.charAt(0).toUpperCase()} />
      <View style={{ flex: 1 }}>
        <Text weight="semibold" size="small">
          {balance.name}
        </Text>
        <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          {settledOnly ? 'Sem pendências' : `${balance.open.length} em aberto`}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text weight="bold" size="small" color={tone}>
          {formatCurrency(Math.abs(balance.net))}
        </Text>
        <Text size="tiny" color={colors.textMuted} style={{ marginTop: 2 }}>
          {balance.net > 0 ? 'te deve' : balance.net < 0 ? 'você deve' : 'em dia'}
        </Text>
      </View>
    </Pressable>
  );
}
