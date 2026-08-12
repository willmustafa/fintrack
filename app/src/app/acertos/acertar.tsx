import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Picker, type PickerOption } from '@/components/picker';
import { Text } from '@/components/text';
import { Button, Notice, Segmented } from '@/components/ui';
import { SETTLEMENT_CATEGORY, settlementKind } from '@/lib/finance';
import { formatCurrency, formatDate, recentDateOptions } from '@/lib/format';
import { useCurrentPerson, useFintrack, useLedger, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

const TODAY = '2024-05-24';

const MODES = [
  { value: 'novo' as const, label: 'Novo lançamento' },
  { value: 'existente' as const, label: 'Já lancei' },
];

/**
 * Registrar acerto: transforma as divisões escolhidas em um pagamento.
 *
 * O acerto sempre aponta para um lançamento — criado aqui na hora ou escolhido
 * entre os que já estão no extrato —, que é o que responde "qual transação foi
 * o pagamento".
 */
export default function AcertarScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { pessoa, ids } = useLocalSearchParams<{ pessoa?: string; ids?: string }>();
  const { accounts, transactions } = useSnapshot();
  const entries = useLedger();
  const { addTransaction, settleSplits } = useFintrack();

  const splitIds = useMemo(() => (ids ?? '').split(',').filter(Boolean), [ids]);
  const chosen = entries.filter((entry) => splitIds.includes(entry.split.id));
  const name = chosen[0]?.counterpartName ?? 'Pessoa';

  const net = chosen.reduce(
    (total, entry) =>
      total + (entry.direction === 'a-receber' ? entry.split.amount : -entry.split.amount),
    0,
  );
  const direction = net >= 0 ? 'a-receber' : 'a-pagar';
  const amount = Math.abs(net);
  const kind = settlementKind(direction);

  const [mode, setMode] = useState<'novo' | 'existente'>('novo');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? 'corrente');
  const [date, setDate] = useState(TODAY);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<'conta' | 'data' | 'lancamento' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountOptions = useMemo<PickerOption<string>[]>(
    () =>
      accounts
        .filter((account) => account.kind !== 'cartao')
        .map((account) => ({ value: account.id, label: account.name })),
    [accounts],
  );

  /** Só lançamentos do mesmo lado do acerto: ganho ao receber, gasto ao pagar. */
  const transactionOptions = useMemo<PickerOption<string>[]>(
    () =>
      transactions
        .filter((transaction) => transaction.kind === kind)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20)
        .map((transaction) => ({
          value: transaction.id,
          label: transaction.description,
          hint: `${formatDate(transaction.date)} · ${formatCurrency(transaction.amount)}`,
        })),
    [transactions, kind],
  );

  const accountName = (key: string) => accounts.find((a) => a.id === key)?.name ?? key;
  const chosenTransaction = transactions.find((transaction) => transaction.id === transactionId);
  const canSave =
    chosen.length > 0 &&
    amount > 0 &&
    !saving &&
    (mode === 'novo' ? Boolean(accountId) : Boolean(transactionId));

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payment =
        mode === 'novo'
          ? await addTransaction({
              kind,
              amount,
              category: SETTLEMENT_CATEGORY,
              accountId,
              date,
              ownerId: person?.id ?? 'ana',
              description: `Acerto · ${name}`,
            })
          : chosenTransaction;

      if (!payment) throw new Error('Escolha o lançamento do pagamento.');

      await settleSplits(splitIds, payment.id, mode === 'novo' ? date : payment.date);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível registrar o acerto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
        <Pressable accessibilityLabel="Fechar" hitSlop={12} onPress={router.back}>
          <Ionicons name="close" size={24} color={colors.textBody} />
        </Pressable>
        <Text weight="extrabold" size="title">
          Registrar acerto
        </Text>
        <Pressable accessibilityLabel="Salvar" hitSlop={12} onPress={onSave} disabled={!canSave}>
          <Text weight="bold" size="small" color={canSave ? colors.accent : colors.textDisabled}>
            Salvar
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {error ? <Notice tone="error" message={error} /> : null}

        {chosen.length === 0 ? (
          <Notice tone="error" message="Nenhuma divisão selecionada para acertar." />
        ) : null}

        <View
          style={{
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: 'center',
            gap: 4,
          }}>
          <Text size="caption" color={colors.textSecondary}>
            {direction === 'a-receber' ? `${name} te paga` : `Você paga para ${name}`}
          </Text>
          <Text
            weight="extrabold"
            size="display"
            color={direction === 'a-receber' ? colors.income : colors.expense}>
            {formatCurrency(amount)}
          </Text>
          <Text size="tiny" color={colors.textMuted}>
            {chosen.length === 1 ? '1 divisão' : `${chosen.length} divisões`}
          </Text>
        </View>

        <Segmented options={MODES} value={mode} onChange={setMode} />

        <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
          {mode === 'novo' ? (
            <>
              <FormRow
                label="Conta"
                value={accountName(accountId)}
                onPress={() => setOpenPicker('conta')}
              />
              <FormRow
                label="Data"
                value={formatDate(date)}
                onPress={() => setOpenPicker('data')}
                last
              />
            </>
          ) : (
            <FormRow
              label="Lançamento"
              value={chosenTransaction ? chosenTransaction.description : 'Escolher'}
              onPress={() => setOpenPicker('lancamento')}
              last
            />
          )}
        </View>

        <Text size="caption" color={colors.textSecondary}>
          {mode === 'novo'
            ? `Cria um ${kind === 'ganho' ? 'ganho' : 'gasto'} de ${formatCurrency(
                amount,
              )} em ${accountName(accountId)} e marca as divisões como acertadas.`
            : 'Aponta as divisões para um lançamento que já está no seu extrato.'}
        </Text>

        <Button title="Confirmar acerto" onPress={onSave} loading={saving} disabled={!canSave} />
      </ScrollView>

      <Picker
        visible={openPicker === 'conta'}
        title="Conta"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'data'}
        title="Data"
        options={recentDateOptions(TODAY)}
        value={date}
        onSelect={setDate}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'lancamento'}
        title={kind === 'ganho' ? 'Qual ganho foi o pagamento?' : 'Qual gasto foi o pagamento?'}
        options={transactionOptions}
        value={transactionId ?? undefined}
        onSelect={setTransactionId}
        onClose={() => setOpenPicker(null)}
      />
    </SafeAreaView>
  );
}

function FormRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
        gap: spacing.md,
      })}>
      <Text size="small" color={colors.textSecondary}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text size="small" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}
