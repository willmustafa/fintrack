import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { ContactAvatar } from '@/components/avatar';
import { Picker, type PickerOption } from '@/components/picker';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Field, Notice } from '@/components/ui';
import { initialOf } from '@/lib/validation';
import { useContacts, useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';
import type { Contact, OwnerId } from '@/types';

const NO_MEMBER = 'ninguem';

/**
 * Acertos · Pessoas: os nomes com quem se divide contas.
 *
 * Não precisam usar o app — mas quem usa pode ser vinculado aqui, e aí a mesma
 * divisão aparece dos dois lados.
 */
export default function PessoasScreen() {
  const person = useCurrentPerson();
  const contacts = useContacts();
  const { people, splits } = useSnapshot();
  const { addContact, saveContact, removeContact } = useFintrack();

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<Contact | null>(null);
  const [linking, setLinking] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberOptions: PickerOption<string>[] = [
    { value: NO_MEMBER, label: 'Ninguém', hint: 'Só um nome na sua lista' },
    ...people
      .filter((member) => member.id !== person?.id && member.id !== 'casal')
      .map((member) => ({ value: member.id, label: member.name, hint: member.email })),
  ];

  const memberName = (personId?: OwnerId) =>
    people.find((member) => member.id === personId)?.name ?? personId;

  const openCount = (contactId: string) =>
    splits.filter((split) => split.contactId === contactId && !split.settledAt).length;

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addContact({
        name: trimmed,
        initial: initialOf(trimmed),
        ownerId: person?.id ?? 'ana',
      });
      setName('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar a pessoa.');
    } finally {
      setSaving(false);
    }
  };

  const onLink = async (contact: Contact, value: string) => {
    setError(null);
    try {
      await saveContact(contact.id, {
        name: contact.name,
        initial: contact.initial,
        ownerId: contact.ownerId,
        personId: value === NO_MEMBER ? undefined : (value as OwnerId),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível vincular a pessoa.');
    }
  };

  const onRemove = (contact: Contact) => {
    const pending = openCount(contact.id);
    Alert.alert(
      `Excluir ${contact.name}?`,
      pending > 0
        ? `${pending} divisão(ões) em aberto com ${contact.name} também saem da lista.`
        : 'A pessoa sai da sua lista de acertos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contact.id);
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Não foi possível excluir a pessoa.',
              );
            }
          },
        },
      ],
    );
  };

  const menuActions = (contact: Contact): SheetAction[] => [
    {
      label: contact.personId ? 'Trocar o vínculo' : 'Vincular a quem usa o app',
      icon: 'link-outline',
      onPress: () => setLinking(contact),
    },
    {
      label: 'Excluir pessoa',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => onRemove(contact),
    },
  ];

  return (
    <Screen background={colors.surface}>
      <Header title="Pessoas" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {error ? <Notice tone="error" message={error} /> : null}

        <Field
          label="Nova pessoa"
          placeholder="Nome de quem divide contas com você"
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => void onAdd()}
          hint="Não precisa ter conta no FinTrack."
        />
        <Button
          title="Adicionar"
          icon="person-add-outline"
          onPress={() => void onAdd()}
          disabled={name.trim().length === 0 || saving}
        />

        {contacts.length === 0 ? (
          <Card>
            <Text size="small" color={colors.textSecondary} align="center">
              Nenhuma pessoa cadastrada ainda.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {contacts.map((contact, index) => (
              <View
                key={contact.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 12,
                  borderBottomWidth: index === contacts.length - 1 ? 0 : 1,
                  borderBottomColor: colors.divider,
                }}>
                <ContactAvatar initial={contact.initial} ownerId={contact.personId} />
                <View style={{ flex: 1 }}>
                  <Text weight="semibold" size="small">
                    {contact.name}
                  </Text>
                  <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {contact.personId
                      ? `Usa o FinTrack como ${memberName(contact.personId)}`
                      : `${openCount(contact.id)} divisão(ões) em aberto`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Opções de ${contact.name}`}
                  hitSlop={10}
                  onPress={() => setMenu(contact)}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textDisabled} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <ActionSheet
        visible={menu !== null}
        title={menu?.name ?? ''}
        actions={menu ? menuActions(menu) : []}
        onClose={() => setMenu(null)}
      />

      <Picker
        visible={linking !== null}
        title="Quem usa o app"
        options={memberOptions}
        value={linking?.personId ?? NO_MEMBER}
        onSelect={(value) => {
          if (linking) void onLink(linking, value);
        }}
        onClose={() => setLinking(null)}
      />
    </Screen>
  );
}
