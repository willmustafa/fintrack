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

import { Picker, type PickerOption } from '@/components/picker';
import { Text } from '@/components/text';
import { Button, Notice, Segmented } from '@/components/ui';
import { banks, findBank } from '@/data/banks';
import { centsToInput, formatNumber, inputToNumber } from '@/lib/format';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { Account, AccountKind, OwnerId } from '@/types';

const KINDS: { value: AccountKind; label: string }[] = [
  { value: 'corrente', label: 'Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'investimento', label: 'Invest.' },
];

const BANK_OPTIONS: PickerOption<string>[] = banks.map((bank) => ({
  value: bank.id,
  label: bank.name,
}));

const KIND_LABEL: Record<AccountKind, string> = {
  corrente: 'conta',
  poupanca: 'poupança',
  cartao: 'cartão',
  investimento: 'conta de investimento',
};

/** `830` → `830,00` para pré-preencher os campos de dinheiro na edição. */
const moneyInput = (value?: number) => (value ? formatNumber(value, 2) : '0,00');

/** Mantém só dígitos e limita ao intervalo de dias de um mês (1–31). */
const dayInput = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  return String(Math.min(Math.max(Number(digits), 1), 31));
};

/**
 * Conta ou cartão · criar e editar. A rota `conta/nova` abre o formulário vazio
 * (opcionalmente com `?kind=cartao`); qualquer outro id edita a conta existente.
 */
export default function ContaFormScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: AccountKind }>();
  const { accounts } = useSnapshot();
  const { addAccount, saveAccount, removeAccount } = useFintrack();

  const editing = accounts.find((account) => account.id === id);
  const isNew = !editing;

  const [kind, setKind] = useState<AccountKind>(editing?.kind ?? kindParam ?? 'corrente');
  const [name, setName] = useState(editing?.name ?? '');
  const [bank, setBank] = useState<string | undefined>(editing?.bank);
  const [balance, setBalance] = useState(moneyInput(editing?.balance));
  const [limit, setLimit] = useState(moneyInput(editing?.limit));
  const [invoice, setInvoice] = useState(moneyInput(editing?.invoice));
  const [closingDay, setClosingDay] = useState(editing?.closingDay ? String(editing.closingDay) : '');
  const [dueDay, setDueDay] = useState(editing?.dueDay ? String(editing.dueDay) : '');
  const [shared, setShared] = useState(editing ? editing.ownerId === 'casal' : false);
  const [openPicker, setOpenPicker] = useState<'banco' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCard = kind === 'cartao';
  const canSave = name.trim().length > 0 && !saving;

  const bankLabel = useMemo(() => findBank(bank)?.name ?? 'Selecionar', [bank]);

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    // Dono: "conta conjunta" vira do casal; senão fica com quem já era dono
    // (a pessoa logada quando a conta é nova ou estava compartilhada).
    const mine: OwnerId = person?.id ?? 'ana';
    const previousOwner = editing && editing.ownerId !== 'casal' ? editing.ownerId : mine;
    const ownerId: OwnerId = shared ? 'casal' : previousOwner;

    const input: Omit<Account, 'id'> = {
      name: name.trim(),
      kind,
      ownerId,
      bank,
      brandColor: findBank(bank)?.color ?? editing?.brandColor,
      balance: isCard ? 0 : inputToNumber(balance),
      limit: isCard ? inputToNumber(limit) : undefined,
      invoice: isCard ? inputToNumber(invoice) : undefined,
      closingDay: isCard && closingDay ? Number(closingDay) : undefined,
      dueDay: isCard && dueDay ? Number(dueDay) : undefined,
    };

    try {
      if (editing) {
        await saveAccount(editing.id, input);
      } else {
        await addAccount(input);
      }
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível salvar. Tente de novo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert(
      `Excluir ${KIND_LABEL[editing.kind]}?`,
      `"${editing.name}" será removida. As transações continuam no extrato.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAccount(editing.id);
              router.back();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Não foi possível excluir.',
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
          {isNew ? 'Nova conta' : 'Editar'}
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

          <Segmented options={KINDS} value={kind} onChange={setKind} />

          <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
            <InputRow
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder={isCard ? 'Ex.: Cartão Nubank' : 'Ex.: Conta corrente'}
              autoFocus={isNew}
            />
            <FormRow label="Banco" value={bankLabel} onPress={() => setOpenPicker('banco')} />

            {isCard ? (
              <>
                <MoneyRow label="Limite" value={limit} onChangeText={setLimit} />
                <MoneyRow label="Fatura atual" value={invoice} onChangeText={setInvoice} />
                <InputRow
                  label="Fecha dia"
                  value={closingDay}
                  onChangeText={(text) => setClosingDay(dayInput(text))}
                  placeholder="Dia"
                  keyboardType="number-pad"
                />
                <InputRow
                  label="Vence dia"
                  value={dueDay}
                  onChangeText={(text) => setDueDay(dayInput(text))}
                  placeholder="Dia"
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <MoneyRow label="Saldo" value={balance} onChangeText={setBalance} />
            )}

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
                  Conta conjunta
                </Text>
                <Text size="tiny" color={colors.textMuted} style={{ marginTop: 2 }}>
                  Compartilha com quem tem acesso
                </Text>
              </View>
              <Switch
                value={shared}
                onValueChange={setShared}
                trackColor={{ true: colors.accent, false: colors.track }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {editing ? (
            <Button
              title={`Excluir ${KIND_LABEL[editing.kind]}`}
              variant="ghost"
              icon="trash-outline"
              onPress={onDelete}
              style={{ borderWidth: 1, borderColor: colors.expenseSoft }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Picker
        visible={openPicker === 'banco'}
        title="Banco"
        options={BANK_OPTIONS}
        value={bank}
        onSelect={setBank}
        onClose={() => setOpenPicker(null)}
      />
    </SafeAreaView>
  );
}

function FormRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
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
        <Text size="small" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}

function InputRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  autoFocus?: boolean;
}) {
  return (
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
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
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
  );
}

/** Campo de dinheiro com prefixo R$ e máscara de centavos. */
function MoneyRow({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
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
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 4 }}>
        <Text size="small" weight="semibold" color={colors.textSecondary}>
          R$
        </Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(centsToInput(text))}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            fontFamily: fonts.semibold,
            fontSize: 15,
            color: colors.text,
            textAlign: 'right',
            minWidth: 80,
            padding: 0,
          }}
        />
      </View>
    </View>
  );
}
