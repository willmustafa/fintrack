import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { TransactionRow } from '@/components/transaction-row';
import { Card, ProgressBar } from '@/components/ui';
import { openInvoices } from '@/lib/finance';
import { formatCurrency, formatCurrencyShort, formatDayMonth } from '@/lib/format';
import { useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * A aba "Cartões" aparece na barra inferior do board, mas não tem tela
 * desenhada — esta foi montada com os mesmos componentes das outras telas.
 */
export default function CartoesScreen() {
  const { accounts, transactions } = useSnapshot();
  const cards = useMemo(() => accounts.filter((a) => a.kind === 'cartao'), [accounts]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  const cardTransactions = useMemo(
    () => transactions.filter((t) => t.accountId === selected?.id).slice(0, 8),
    [transactions, selected?.id],
  );

  const invoice = selected?.invoice ?? 0;
  const limit = selected?.limit ?? 0;
  const available = Math.max(limit - invoice, 0);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text weight="extrabold" size="heading">
            Cartões
          </Text>
          <Text size="caption" color={colors.textSecondary}>
            Faturas abertas {formatCurrencyShort(openInvoices(accounts))}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingVertical: 2 }}>
          {cards.map((card) => {
            const active = card.id === selected?.id;
            return (
              <Pressable key={card.id} onPress={() => setSelectedId(card.id)}>
                <View
                  style={{
                    width: 240,
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                    backgroundColor: card.brandColor ?? colors.accent,
                    opacity: active ? 1 : 0.55,
                    gap: spacing.lg,
                  }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Ionicons name="card" size={22} color={colors.white} />
                    <Avatar ownerId={card.ownerId} size={22} />
                  </View>
                  <View>
                    <Text size="tiny" color="rgba(255,255,255,0.85)">
                      Fatura atual
                    </Text>
                    <Text weight="extrabold" size="heading" color={colors.white}>
                      {formatCurrency(card.invoice ?? 0)}
                    </Text>
                  </View>
                  <Text size="caption" color="rgba(255,255,255,0.85)">
                    {card.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {selected ? (
          <>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
                <Text weight="extrabold" size="small">
                  Limite
                </Text>
                <Text size="caption" color={colors.textSecondary}>
                  {formatCurrencyShort(available)} disponíveis
                </Text>
              </View>
              <ProgressBar progress={limit === 0 ? 0 : invoice / limit} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Usado {formatCurrencyShort(invoice)}
                </Text>
                <Text size="tiny" color={colors.textSecondary}>
                  Total {formatCurrencyShort(limit)}
                </Text>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Card style={{ flex: 1 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Fecha dia
                </Text>
                <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
                  {selected.closingDay ?? '—'}
                </Text>
              </Card>
              <Card style={{ flex: 1 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Vence dia
                </Text>
                <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
                  {selected.dueDay ?? '—'}
                </Text>
              </Card>
            </View>

            <Card>
              <Text weight="extrabold" size="small" style={{ marginBottom: 4 }}>
                Lançamentos da fatura
              </Text>
              {cardTransactions.length === 0 ? (
                <Text size="caption" color={colors.textSecondary} style={{ paddingVertical: spacing.md }}>
                  Nenhum lançamento neste cartão.
                </Text>
              ) : (
                cardTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    subtitle={`${formatDayMonth(transaction.date)} · ${transaction.category}`}
                    last={index === cardTransactions.length - 1}
                  />
                ))
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
