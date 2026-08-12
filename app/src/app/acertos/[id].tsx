import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { ContactAvatar } from '@/components/avatar';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Notice } from '@/components/ui';
import { type LedgerEntry } from '@/lib/finance';
import { formatCurrency, formatDate } from '@/lib/format';
import { useContacts, useFintrack, useLedger, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Acertos · uma pessoa: o que está em aberto, o histórico do que já foi
 * acertado e a seleção que vai para `acertos/acertar`.
 */
export default function AcertoPessoaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useLedger();
  const contacts = useContacts();
  const { transactions } = useSnapshot();
  const { removeSplit, reopenSplit } = useFintrack();

  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<LedgerEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(
    () => entries.filter((entry) => entry.counterpartId === id),
    [entries, id],
  );
  const open = mine.filter((entry) => !entry.settled);
  const settled = mine.filter((entry) => entry.settled);

  const contact = contacts.find((item) => item.id === id);
  const name = contact?.name ?? mine[0]?.counterpartName ?? 'Pessoa';

  const net = open.reduce(
    (total, entry) => total + (entry.direction === 'a-receber' ? entry.split.amount : -entry.split.amount),
    0,
  );
  const selectedNet = open
    .filter((entry) => selected.includes(entry.split.id))
    .reduce(
      (total, entry) =>
        total + (entry.direction === 'a-receber' ? entry.split.amount : -entry.split.amount),
      0,
    );

  const toggle = (splitId: string) =>
    setSelected((current) =>
      current.includes(splitId)
        ? current.filter((item) => item !== splitId)
        : [...current, splitId],
    );

  const descriptionOf = (transactionId?: string) =>
    transactions.find((transaction) => transaction.id === transactionId)?.description;

  const onDelete = (entry: LedgerEntry) =>
    Alert.alert(
      'Excluir divisão?',
      `"${entry.split.description}" sai da sua lista de acertos. O lançamento continua no extrato.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSplit(entry.split.id);
              setSelected((current) => current.filter((item) => item !== entry.split.id));
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Não foi possível excluir a divisão.',
              );
            }
          },
        },
      ],
    );

  const onReopen = async (entry: LedgerEntry) => {
    try {
      await reopenSplit(entry.split.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível reabrir a divisão.');
    }
  };

  const menuActions = (entry: LedgerEntry): SheetAction[] => {
    const actions: SheetAction[] = [];
    const origin = entry.split.transactionId ?? entry.split.settlementTransactionId;
    if (origin && transactions.some((transaction) => transaction.id === origin)) {
      actions.push({
        label: 'Ver lançamento',
        icon: 'receipt-outline',
        onPress: () => router.push(`/transacao/${origin}`),
      });
    }
    if (entry.settled) {
      actions.push({
        label: 'Desfazer acerto',
        icon: 'refresh-outline',
        onPress: () => void onReopen(entry),
      });
    }
    if (!entry.mirrored) {
      actions.push({
        label: 'Excluir divisão',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => onDelete(entry),
      });
    }
    return actions;
  };

  const acertar = () =>
    router.push(
      `/acertos/acertar?pessoa=${encodeURIComponent(String(id))}&ids=${selected.join(',')}`,
    );

  return (
    <Screen>
      <Header title={name} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        {error ? <Notice tone="error" message={error} /> : null}

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ContactAvatar
            initial={contact?.initial ?? name.charAt(0).toUpperCase()}
            size={46}
            ownerId={contact?.personId}
          />
          <View style={{ flex: 1 }}>
            <Text weight="extrabold" size="title" color={net >= 0 ? colors.income : colors.expense}>
              {formatCurrency(Math.abs(net))}
            </Text>
            <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {net > 0
                ? `${name} te deve`
                : net < 0
                  ? `você deve para ${name}`
                  : 'tudo acertado'}
            </Text>
          </View>
        </Card>

        {contact?.personId ? (
          <Notice message={`${name} também usa o FinTrack — as divisões aparecem no app dela também.`} />
        ) : null}

        <Text weight="extrabold" size="small" color={colors.textSecondary}>
          EM ABERTO
        </Text>

        {open.length === 0 ? (
          <Card>
            <Text size="small" color={colors.textSecondary} align="center">
              Nada em aberto com {name}.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {open.map((entry, index) => (
              <EntryRow
                key={entry.split.id}
                entry={entry}
                origin={descriptionOf(entry.split.transactionId)}
                selected={selected.includes(entry.split.id)}
                onPress={() => toggle(entry.split.id)}
                onMenu={() => setMenu(entry)}
                last={index === open.length - 1}
              />
            ))}
          </Card>
        )}

        {open.length > 0 ? (
          <Button
            title={
              selected.length === 0
                ? 'Selecione para acertar'
                : `Registrar acerto de ${formatCurrency(Math.abs(selectedNet))}`
            }
            icon="checkmark-done-outline"
            disabled={selected.length === 0 || selectedNet === 0}
            onPress={acertar}
          />
        ) : null}

        {selected.length > 0 && selectedNet === 0 ? (
          <Notice message="As divisões escolhidas se anulam — tire alguma da seleção para registrar o acerto." />
        ) : null}

        {settled.length > 0 ? (
          <>
            <Text weight="extrabold" size="small" color={colors.textSecondary}>
              ACERTADOS
            </Text>
            <Card style={{ paddingVertical: 4 }}>
              {settled.map((entry, index) => (
                <EntryRow
                  key={entry.split.id}
                  entry={entry}
                  origin={descriptionOf(entry.split.settlementTransactionId)}
                  onMenu={() => setMenu(entry)}
                  last={index === settled.length - 1}
                />
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={menu !== null}
        title={menu?.split.description ?? ''}
        subtitle={menu ? formatCurrency(menu.split.amount) : undefined}
        actions={menu ? menuActions(menu) : []}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}

function EntryRow({
  entry,
  origin,
  selected,
  onPress,
  onMenu,
  last,
}: {
  entry: LedgerEntry;
  /** Descrição do lançamento ligado à divisão, quando existe */
  origin?: string;
  selected?: boolean;
  onPress?: () => void;
  onMenu: () => void;
  last?: boolean;
}) {
  const receiving = entry.direction === 'a-receber';
  const detail = [
    formatDate(entry.split.date),
    origin,
    entry.settled && entry.split.settledAt ? `acertado em ${formatDate(entry.split.settledAt)}` : null,
    entry.mirrored ? 'lançado por quem divide com você' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
      }}>
      <Pressable
        accessibilityRole={onPress ? 'checkbox' : undefined}
        accessibilityState={onPress ? { checked: Boolean(selected) } : undefined}
        accessibilityLabel={entry.split.description}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          flex: 1,
          opacity: pressed ? 0.6 : 1,
        })}>
        {onPress ? (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: radius.sm / 2,
              borderWidth: selected ? 0 : 1.5,
              borderColor: colors.borderStrong,
              backgroundColor: selected ? colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
          </View>
        ) : (
          <Ionicons name="checkmark-circle" size={22} color={colors.income} />
        )}
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size="small" numberOfLines={1}>
            {entry.split.description}
          </Text>
          <Text size="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
            {detail}
          </Text>
        </View>
        <Text
          weight="bold"
          size="small"
          color={entry.settled ? colors.textSecondary : receiving ? colors.income : colors.expense}>
          {`${receiving ? '+' : '-'}${formatCurrency(entry.split.amount)}`}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Opções de ${entry.split.description}`}
        hitSlop={10}
        onPress={onMenu}>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textDisabled} />
      </Pressable>
    </View>
  );
}
