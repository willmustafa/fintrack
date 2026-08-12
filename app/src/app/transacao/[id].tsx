import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Picker, type PickerOption } from '@/components/picker';
import { Text } from '@/components/text';
import { Button, Notice, Segmented } from '@/components/ui';
import { centsToInput, formatDate, formatNumber, inputToNumber } from '@/lib/format';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { OwnerId, TransactionKind } from '@/types';

const TODAY = '2024-05-24';

const KINDS: { value: TransactionKind; label: string }[] = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'transferencia', label: 'Transf.' },
  { value: 'aporte', label: 'Aporte' },
];

const CATEGORIES_BY_KIND: Record<TransactionKind, string[]> = {
  gasto: ['Essenciais', 'Moradia', 'Transporte', 'Saúde', 'Assinatura', 'Lazer', 'Compras', 'Outros'],
  ganho: ['Receita', 'Reembolso', 'Outros'],
  transferencia: ['Transferência'],
  aporte: ['Investimentos'],
};

const OWNERS: PickerOption<OwnerId>[] = [
  { value: 'ana', label: 'Ana' },
  { value: 'marcelo', label: 'Marcelo' },
  { value: 'casal', label: 'Casal (compartilhado)' },
];

/** Últimos dias como opções de data — evita depender de um date picker nativo. */
function recentDates(reference: string): PickerOption<string>[] {
  const base = Date.parse(`${reference}T12:00:00`);
  return Array.from({ length: 14 }, (_, index) => {
    const iso = new Date(base - index * 86400000).toISOString().slice(0, 10);
    const label = index === 0 ? 'Hoje' : index === 1 ? 'Ontem' : formatDate(iso);
    return { value: iso, label, hint: index <= 1 ? formatDate(iso) : undefined };
  });
}

/**
 * Nova transação · V1: cabeçalho com Salvar, tipo em abas e campos em lista.
 *
 * A rota `transacao/nova` abre o formulário vazio; qualquer outro id edita o
 * lançamento correspondente, que também pode ser excluído por aqui.
 */
export default function TransacaoFormScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, transactions } = useSnapshot();
  const { addTransaction, editTransaction, removeTransaction } = useFintrack();

  const editing = transactions.find((transaction) => transaction.id === id);
  const isNew = !editing;

  const [kind, setKind] = useState<TransactionKind>(editing?.kind ?? 'gasto');
  const [amount, setAmount] = useState(editing ? formatNumber(editing.amount, 2) : '0,00');
  const [accountId, setAccountId] = useState(editing?.accountId ?? accounts[0]?.id ?? 'corrente');
  const [toAccountId, setToAccountId] = useState(
    editing?.toAccountId ?? accounts[1]?.id ?? 'poupanca',
  );
  const [category, setCategory] = useState(editing?.category ?? 'Essenciais');
  const [date, setDate] = useState(editing?.date ?? TODAY);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [ownerId, setOwnerId] = useState<OwnerId>(
    editing?.ownerId ?? (person?.id as OwnerId) ?? 'ana',
  );
  const [recurring, setRecurring] = useState(editing?.recurring ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<
    'conta' | 'destino' | 'categoria' | 'data' | 'pessoa' | null
  >(null);

  const accountOptions = useMemo<PickerOption<string>[]>(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: account.name,
        hint: account.kind === 'cartao' ? 'Cartão' : 'Conta',
      })),
    [accounts],
  );

  const categoryOptions = useMemo<PickerOption<string>[]>(
    () => CATEGORIES_BY_KIND[kind].map((value) => ({ value, label: value })),
    [kind],
  );

  /** A data original pode ser mais antiga que a janela de dias recentes. */
  const dateOptions = useMemo(() => {
    const recent = recentDates(TODAY);
    if (!editing || recent.some((option) => option.value === editing.date)) return recent;
    return [{ value: editing.date, label: formatDate(editing.date) }, ...recent];
  }, [editing]);

  const accountName = (accountKey: string) =>
    accounts.find((a) => a.id === accountKey)?.name ?? accountKey;
  const value = inputToNumber(amount);
  const canSave = value > 0 && !saving;

  const onChangeKind = (next: TransactionKind) => {
    setKind(next);
    setCategory(CATEGORIES_BY_KIND[next][0]);
  };

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const input = {
      kind,
      amount: value,
      category,
      accountId,
      toAccountId: kind === 'transferencia' ? toAccountId : undefined,
      date,
      ownerId,
      description: description.trim() || category,
      recurring,
    };
    try {
      if (editing) {
        await editTransaction(editing.id, input);
      } else {
        await addTransaction(input);
      }
      router.back();
    } catch (caught) {
      // A recusa vem do backend (saldo, limite, validação) — a tela fica aberta
      // com o formulário preenchido para a pessoa corrigir e tentar de novo.
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível salvar a transação.',
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert(
      'Excluir transação?',
      `"${editing.description}" será removida e o saldo da conta volta ao que era.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTransaction(editing.id);
              router.back();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Não foi possível excluir a transação.',
              );
            }
          },
        },
      ],
    );
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
          {isNew ? 'Nova transação' : 'Editar transação'}
        </Text>
        <Pressable accessibilityLabel="Salvar" hitSlop={12} onPress={onSave} disabled={!canSave}>
          <Text weight="bold" size="small" color={canSave ? colors.accent : colors.textDisabled}>
            Salvar
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled">
          {error ? <Notice tone="error" message={error} /> : null}

          <Segmented options={KINDS} value={kind} onChange={onChangeKind} />

          <View
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.lg,
              padding: spacing.lg,
              alignItems: 'center',
            }}>
            <Text size="caption" color={colors.textSecondary}>
              Valor
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text weight="bold" size="title" color={colors.textSecondary}>
                R$
              </Text>
              <TextInput
                value={amount}
                onChangeText={(text) => setAmount(centsToInput(text))}
                keyboardType="number-pad"
                selectTextOnFocus
                style={{
                  fontFamily: fonts.extrabold,
                  fontSize: 34,
                  color: kind === 'ganho' ? colors.income : colors.text,
                  minWidth: 120,
                  textAlign: 'center',
                  padding: 0,
                }}
              />
            </View>
          </View>

          <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
            <FormRow
              label="Conta"
              value={accountName(accountId)}
              onPress={() => setOpenPicker('conta')}
            />
            {kind === 'transferencia' ? (
              <FormRow
                label="Destino"
                value={accountName(toAccountId)}
                onPress={() => setOpenPicker('destino')}
              />
            ) : null}
            <FormRow label="Categoria" value={category} onPress={() => setOpenPicker('categoria')} />
            <FormRow label="Data" value={formatDate(date)} onPress={() => setOpenPicker('data')} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
                gap: spacing.md,
              }}>
              <Text size="small" color={colors.textSecondary} style={{ width: 90 }}>
                Descrição
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Adicionar"
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1,
                  textAlign: 'right',
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: colors.text,
                  padding: 0,
                }}
              />
            </View>
            <FormRow
              label="Pago por"
              value={OWNERS.find((o) => o.value === ownerId)!.label}
              onPress={() => setOpenPicker('pessoa')}
              left={<Avatar ownerId={ownerId} size={22} />}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
              }}>
              <Text size="small" color={colors.textSecondary}>
                Recorrência
              </Text>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ true: colors.accent, false: colors.track }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {editing ? (
            <Button
              title="Excluir transação"
              variant="ghost"
              icon="trash-outline"
              onPress={onDelete}
              style={{ borderWidth: 1, borderColor: colors.expenseSoft }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Picker
        visible={openPicker === 'conta'}
        title="Conta"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'destino'}
        title="Conta de destino"
        options={accountOptions.filter((option) => option.value !== accountId)}
        value={toAccountId}
        onSelect={setToAccountId}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'categoria'}
        title="Categoria"
        options={categoryOptions}
        value={category}
        onSelect={setCategory}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'data'}
        title="Data"
        options={dateOptions}
        value={date}
        onSelect={setDate}
        onClose={() => setOpenPicker(null)}
      />
      <Picker
        visible={openPicker === 'pessoa'}
        title="Pago por"
        options={OWNERS}
        value={ownerId}
        onSelect={setOwnerId}
        onClose={() => setOpenPicker(null)}
      />
    </SafeAreaView>
  );
}

function FormRow({
  label,
  value,
  onPress,
  left,
}: {
  label: string;
  value: string;
  onPress: () => void;
  left?: React.ReactNode;
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
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
        gap: spacing.md,
      })}>
      <Text size="small" color={colors.textSecondary}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {left}
        <Text size="small" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}
