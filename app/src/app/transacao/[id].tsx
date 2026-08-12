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

import { Avatar, ContactAvatar } from '@/components/avatar';
import { Picker, type PickerOption } from '@/components/picker';
import { Text } from '@/components/text';
import { Button, Notice, Segmented } from '@/components/ui';
import { equalShares } from '@/lib/finance';
import {
  centsToInput,
  formatCurrency,
  formatDate,
  formatNumber,
  inputToNumber,
  recentDateOptions,
} from '@/lib/format';
import { initialOf } from '@/lib/validation';
import {
  useContacts,
  useCurrentPerson,
  useFintrack,
  useSnapshot,
} from '@/store/fintrack-store';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { OwnerId, Split, TransactionKind } from '@/types';

const TODAY = '2024-05-24';

const KINDS: { value: TransactionKind; label: string }[] = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'transferencia', label: 'Transf.' },
  { value: 'aporte', label: 'Aporte' },
];

const CATEGORIES_BY_KIND: Record<TransactionKind, string[]> = {
  gasto: [
    'Essenciais',
    'Moradia',
    'Transporte',
    'Saúde',
    'Assinatura',
    'Lazer',
    'Compras',
    'Acerto',
    'Outros',
  ],
  ganho: ['Receita', 'Reembolso', 'Acerto', 'Outros'],
  transferencia: ['Transferência'],
  aporte: ['Investimentos'],
};

const OWNERS: PickerOption<OwnerId>[] = [
  { value: 'ana', label: 'Ana' },
  { value: 'marcelo', label: 'Marcelo' },
  { value: 'casal', label: 'Casal (compartilhado)' },
];

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
  const { accounts, transactions, splits } = useSnapshot();
  const contacts = useContacts();
  const {
    addTransaction,
    editTransaction,
    removeTransaction,
    addContact,
    addSplits,
    replaceTransactionSplits,
  } = useFintrack();

  const editing = transactions.find((transaction) => transaction.id === id);
  const isNew = !editing;

  /** Divisões que este lançamento já gerou, separadas pelo que ainda dá para mexer. */
  const mySplits = editing
    ? splits.filter(
        (split) => split.transactionId === editing.id && split.ownerId === person?.id,
      )
    : [];
  const openSplits = mySplits.filter((split) => !split.settledAt);
  const settledSplits = mySplits.filter((split) => split.settledAt);

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

  // Divisão: quem entrou no rateio e quanto cada um deve.
  const [splitting, setSplitting] = useState(openSplits.length > 0);
  const [shared, setShared] = useState<string[]>(openSplits.map((split) => split.contactId));
  const [shares, setShares] = useState<Record<string, string>>(() =>
    Object.fromEntries(openSplits.map((split) => [split.contactId, formatNumber(split.amount, 2)])),
  );
  const [newContact, setNewContact] = useState('');
  const [addingContact, setAddingContact] = useState(false);

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
  const dateOptions = useMemo<PickerOption<string>[]>(() => {
    const recent = recentDateOptions(TODAY);
    if (!editing || recent.some((option) => option.value === editing.date)) return recent;
    return [{ value: editing.date, label: formatDate(editing.date) }, ...recent];
  }, [editing]);

  const accountName = (accountKey: string) =>
    accounts.find((a) => a.id === accountKey)?.name ?? accountKey;
  const value = inputToNumber(amount);

  /** Só faz sentido rachar uma conta que você pagou. */
  const canSplit = kind === 'gasto';
  const sharedTotal = shared.reduce((total, id) => total + inputToNumber(shares[id] ?? '0'), 0);
  const myPart = value - sharedTotal;
  const splitInvalid = splitting && canSplit && (shared.length === 0 || myPart < 0);

  const canSave = value > 0 && !saving && !splitInvalid;

  /** Rateio igual entre você e quem foi marcado; a sobra de centavos fica com você. */
  const splitEqually = (people: string[], total: number) => {
    const parts = equalShares(total, people.length + 1);
    return Object.fromEntries(people.map((id, index) => [id, formatNumber(parts[index + 1], 2)]));
  };

  const onChangeAmount = (text: string) => {
    const next = centsToInput(text);
    setAmount(next);
    if (splitting) setShares(splitEqually(shared, inputToNumber(next)));
  };

  const toggleShared = (contactId: string) => {
    const next = shared.includes(contactId)
      ? shared.filter((item) => item !== contactId)
      : [...shared, contactId];
    setShared(next);
    setShares(splitEqually(next, value));
  };

  const onToggleSplitting = (next: boolean) => {
    setSplitting(next);
    if (next) setShares(splitEqually(shared, value));
  };

  const onAddContact = async () => {
    const trimmed = newContact.trim();
    if (!trimmed || addingContact) return;
    setAddingContact(true);
    setError(null);
    try {
      const contact = await addContact({
        name: trimmed,
        initial: initialOf(trimmed),
        ownerId: person?.id ?? 'ana',
      });
      const next = [...shared, contact.id];
      setShared(next);
      setShares(splitEqually(next, value));
      setNewContact('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar a pessoa.');
    } finally {
      setAddingContact(false);
    }
  };

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
    /** Cada pessoa marcada vira uma dívida ligada a este lançamento. */
    const splitsOf = (transactionId: string): Omit<Split, 'id'>[] =>
      splitting && canSplit
        ? shared.map((contactId) => ({
            ownerId: person?.id ?? 'ana',
            contactId,
            direction: 'a-receber' as const,
            description: input.description,
            amount: inputToNumber(shares[contactId] ?? '0'),
            date,
            transactionId,
          }))
        : [];

    try {
      if (editing) {
        await editTransaction(editing.id, input);
        await replaceTransactionSplits(editing.id, splitsOf(editing.id));
      } else {
        const created = await addTransaction(input);
        await addSplits(splitsOf(created.id));
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
                onChangeText={onChangeAmount}
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
                accessibilityLabel="Recorrência"
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ true: colors.accent, false: colors.track }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {canSplit ? (
            <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 10,
                  gap: spacing.md,
                }}>
                <View style={{ flex: 1 }}>
                  <Text size="small" color={colors.textSecondary}>
                    Dividir com alguém
                  </Text>
                  <Text size="tiny" color={colors.textMuted} style={{ marginTop: 2 }}>
                    Você paga agora e a parte de cada um fica em Acertos
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Dividir com alguém"
                  value={splitting}
                  onValueChange={onToggleSplitting}
                  trackColor={{ true: colors.accent, false: colors.track }}
                  thumbColor={colors.white}
                />
              </View>

              {splitting ? (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }}>
                  {contacts.map((contact) => {
                    const active = shared.includes(contact.id);
                    return (
                      <View
                        key={contact.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.divider,
                        }}>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: active }}
                          accessibilityLabel={contact.name}
                          onPress={() => toggleShared(contact.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.sm,
                            flex: 1,
                            opacity: pressed ? 0.6 : 1,
                          })}>
                          <ContactAvatar
                            initial={contact.initial}
                            size={28}
                            ownerId={contact.personId}
                          />
                          <Text
                            size="small"
                            weight={active ? 'bold' : 'medium'}
                            color={active ? colors.text : colors.textSecondary}
                            numberOfLines={1}
                            style={{ flex: 1 }}>
                            {contact.name}
                          </Text>
                        </Pressable>

                        {active ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text size="small" color={colors.textSecondary}>
                              R$
                            </Text>
                            <TextInput
                              accessibilityLabel={`Parte de ${contact.name}`}
                              value={shares[contact.id] ?? '0,00'}
                              onChangeText={(text) =>
                                setShares((current) => ({
                                  ...current,
                                  [contact.id]: centsToInput(text),
                                }))
                              }
                              keyboardType="number-pad"
                              selectTextOnFocus
                              style={{
                                fontFamily: fonts.semibold,
                                fontSize: 15,
                                color: colors.text,
                                textAlign: 'right',
                                minWidth: 70,
                                padding: 0,
                              }}
                            />
                          </View>
                        ) : (
                          <Ionicons name="add-circle-outline" size={20} color={colors.textDisabled} />
                        )}
                      </View>
                    );
                  })}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.divider,
                    }}>
                    <Ionicons name="person-add-outline" size={18} color={colors.textDisabled} />
                    <TextInput
                      value={newContact}
                      onChangeText={setNewContact}
                      placeholder="Adicionar pessoa"
                      placeholderTextColor={colors.textMuted}
                      onSubmitEditing={() => void onAddContact()}
                      style={{
                        flex: 1,
                        fontFamily: fonts.medium,
                        fontSize: 15,
                        color: colors.text,
                        padding: 0,
                      }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Adicionar pessoa"
                      hitSlop={10}
                      disabled={newContact.trim().length === 0 || addingContact}
                      onPress={() => void onAddContact()}>
                      <Text
                        weight="bold"
                        size="small"
                        color={newContact.trim() ? colors.accent : colors.textDisabled}>
                        Adicionar
                      </Text>
                    </Pressable>
                  </View>

                  <View style={{ paddingHorizontal: spacing.lg, paddingVertical: 12, gap: 4 }}>
                    <Text size="caption" color={myPart < 0 ? colors.expense : colors.textSecondary}>
                      {shared.length === 0
                        ? 'Marque quem entrou na conta.'
                        : myPart < 0
                          ? 'As partes somam mais que o valor do lançamento.'
                          : `Sua parte: ${formatCurrency(myPart)} · a receber: ${formatCurrency(
                              sharedTotal,
                            )}`}
                    </Text>
                    {settledSplits.length > 0 ? (
                      <Text size="tiny" color={colors.textMuted}>
                        {settledSplits.length === 1
                          ? '1 divisão já acertada continua no histórico.'
                          : `${settledSplits.length} divisões já acertadas continuam no histórico.`}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

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
