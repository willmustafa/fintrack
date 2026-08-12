import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Picker, type PickerOption } from '@/components/picker';
import { Text } from '@/components/text';
import { Button, Notice, Segmented } from '@/components/ui';
import { centsToInput, formatDate, inputToNumber, recentDateOptions } from '@/lib/format';
import { useContacts, useCurrentPerson, useFintrack } from '@/store/fintrack-store';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { SplitDirection } from '@/types';

const TODAY = '2024-05-24';

const DIRECTIONS = [
  { value: 'a-receber' as const, label: 'Me devem' },
  { value: 'a-pagar' as const, label: 'Eu devo' },
];

/**
 * Nova divisão avulsa — a dívida que não saiu de um lançamento seu: o jantar
 * que alguém pagou por você, o troco que ficou faltando.
 */
export default function NovaDivisaoScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const contacts = useContacts();
  const { addSplits } = useFintrack();

  const [direction, setDirection] = useState<SplitDirection>('a-receber');
  const [amount, setAmount] = useState('0,00');
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(TODAY);
  const [openPicker, setOpenPicker] = useState<'pessoa' | 'data' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactOptions = useMemo<PickerOption<string>[]>(
    () => contacts.map((contact) => ({ value: contact.id, label: contact.name })),
    [contacts],
  );

  const value = inputToNumber(amount);
  const contact = contacts.find((item) => item.id === contactId);
  const canSave = value > 0 && Boolean(contact) && !saving;

  const onSave = async () => {
    if (!canSave || !contact) return;
    setSaving(true);
    setError(null);
    try {
      await addSplits([
        {
          ownerId: person?.id ?? 'ana',
          contactId: contact.id,
          direction,
          description: description.trim() || (direction === 'a-receber' ? 'Divisão' : 'Dívida'),
          amount: value,
          date,
        },
      ]);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar a divisão.');
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
          Nova divisão
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

          {contacts.length === 0 ? (
            <>
              <Notice message="Cadastre primeiro quem divide contas com você." />
              <Button
                title="Cadastrar pessoa"
                variant="outline"
                icon="person-add-outline"
                onPress={() => router.push('/acertos/pessoas')}
              />
            </>
          ) : null}

          <Segmented options={DIRECTIONS} value={direction} onChange={setDirection} />

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
                  color: direction === 'a-receber' ? colors.income : colors.expense,
                  minWidth: 120,
                  textAlign: 'center',
                  padding: 0,
                }}
              />
            </View>
          </View>

          <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
            <Pressable
              onPress={() => setOpenPicker('pessoa')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
                backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
              })}>
              <Text size="small" color={colors.textSecondary}>
                Pessoa
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text size="small" weight="semibold">
                  {contact?.name ?? 'Escolher'}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />
              </View>
            </Pressable>

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
                placeholder="Ex.: jantar de sexta"
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

            <Pressable
              onPress={() => setOpenPicker('data')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: 15,
                backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
              })}>
              <Text size="small" color={colors.textSecondary}>
                Data
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text size="small" weight="semibold">
                  {formatDate(date)}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />
              </View>
            </Pressable>
          </View>

          <Text size="caption" color={colors.textSecondary}>
            {direction === 'a-receber'
              ? 'Fica registrado como valor a receber — nenhum lançamento entra no seu extrato agora.'
              : 'Fica registrado como valor a pagar — o gasto entra quando você acertar.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Picker
        visible={openPicker === 'pessoa'}
        title="Pessoa"
        options={contactOptions}
        value={contactId}
        onSelect={setContactId}
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
    </SafeAreaView>
  );
}
