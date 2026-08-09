import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Divider, ListRow, Notice } from '@/components/ui';
import { inviteLink } from '@/data/seed';
import { isMockMode } from '@/services/api';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import type { Invite, MemberAccess, Person } from '@/types';
import { colors, ownerColors, radius, spacing } from '@/theme/tokens';

const inviteLabel = (invite: Invite) => {
  if (invite.sentDaysAgo === 0) return 'enviado agora';
  if (invite.sentDaysAgo === 1) return 'enviado ontem';
  return `enviado há ${invite.sentDaysAgo} dias`;
};

/** Perfil · Configurações do board (pessoas com quem as contas são compartilhadas). */
export default function PerfilScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { signOut, updateMemberAccess, removeMember, resendInvite, cancelInvite } = useFintrack();
  const { people, invites, accounts } = useSnapshot();

  const [member, setMember] = useState<Person | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  );

  const shared = people.filter((item) => item.id !== person?.id && item.id !== 'casal');
  const sharedAccounts = accounts.filter((account) => account.ownerId === 'casal').length;

  /** Executa uma ação da API e traduz o resultado numa faixa de feedback. */
  const run = async (action: () => Promise<void>, success: string) => {
    setFeedback(null);
    try {
      await action();
      setFeedback({ tone: 'success', message: success });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
      });
    }
  };

  const changeAccess = (target: Person, access: MemberAccess) =>
    run(
      () => updateMemberAccess(target.id, access),
      `${target.name} agora tem acesso ${access === 'total' ? 'total' : 'somente leitura'}.`,
    );

  const confirmRemoveMember = (target: Person) =>
    Alert.alert(
      'Remover acesso',
      `${target.name} deixa de ver as contas, cartões e financiamentos compartilhados. Os lançamentos já feitos continuam no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => void run(() => removeMember(target.id), `${target.name} não tem mais acesso.`),
        },
      ],
    );

  const confirmCancelInvite = (target: Invite) =>
    Alert.alert('Cancelar convite', `O link enviado para ${target.email} deixa de funcionar.`, [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Cancelar convite',
        style: 'destructive',
        onPress: () => void run(() => cancelInvite(target.id), 'Convite cancelado.'),
      },
    ]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(`https://${inviteLink}`);
    setFeedback({ tone: 'success', message: 'Link de convite copiado.' });
  };

  const confirmSignOut = () =>
    Alert.alert('Sair da conta', 'Você precisará entrar de novo com e-mail e senha.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);

  const memberActions: SheetAction[] = member
    ? [
        {
          label: 'Acesso total',
          icon: 'create-outline',
          selected: (member.access ?? 'total') === 'total',
          onPress: () => void changeAccess(member, 'total'),
        },
        {
          label: 'Somente leitura',
          icon: 'eye-outline',
          selected: member.access === 'leitura',
          onPress: () => void changeAccess(member, 'leitura'),
        },
        {
          label: 'Remover acesso',
          icon: 'person-remove-outline',
          destructive: true,
          onPress: () => confirmRemoveMember(member),
        },
      ]
    : [];

  const inviteActions: SheetAction[] = invite
    ? [
        {
          label: 'Reenviar convite',
          icon: 'mail-outline',
          onPress: () =>
            void run(() => resendInvite(invite.id), `Convite reenviado para ${invite.email}.`),
        },
        { label: 'Copiar link', icon: 'link-outline', onPress: () => void copyLink() },
        {
          label: 'Cancelar convite',
          icon: 'close-circle-outline',
          destructive: true,
          onPress: () => confirmCancelInvite(invite),
        },
      ]
    : [];

  return (
    <Screen background={colors.surface}>
      <Header title="Perfil" action="create-outline" onAction={() => router.push('/perfil/editar')} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
          onPress={() => router.push('/perfil/editar')}
          style={({ pressed }) => ({
            alignItems: 'center',
            gap: 6,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text weight="extrabold" size="heading" color={colors.white}>
              {person?.initial ?? '?'}
            </Text>
          </View>
          <Text weight="extrabold" size="title">
            {person?.name ?? 'Sem nome'}
          </Text>
          <Text size="small" color={colors.textSecondary}>
            {person?.email ?? '—'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="create-outline" size={13} color={colors.accent} />
            <Text size="caption" weight="bold" color={colors.accent}>
              Editar perfil
            </Text>
          </View>
        </Pressable>

        {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}

        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}>
            <Text weight="extrabold" size="small">
              Compartilhado com
            </Text>
            <Pressable
              onPress={() => router.push('/perfil/convidar')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Ionicons name="add" size={15} color={colors.accent} />
              <Text size="caption" weight="bold" color={colors.accent}>
                Convidar
              </Text>
            </Pressable>
          </View>

          {shared.length === 0 && invites.length === 0 ? (
            <Text size="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
              Ninguém tem acesso às suas contas ainda. Convide alguém para dividir contas, cartões e
              financiamentos.
            </Text>
          ) : null}

          {shared.map((item) => (
            <View key={item.id}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 10,
                }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: ownerColors[item.id],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text weight="extrabold" size="caption" color={colors.white}>
                    {item.initial}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="bold" size="small">
                    {item.name}
                  </Text>
                  <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                    {item.email} · Acesso {item.access ?? 'total'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Opções de ${item.name}`}
                  hitSlop={10}
                  onPress={() => setMember(item)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}>
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textDisabled} />
                </Pressable>
              </View>
              <Divider />
            </View>
          ))}

          {invites.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: 10,
              }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: colors.borderStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text weight="bold" size="caption" color={colors.textMuted}>
                  ?
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="bold" size="small" color={colors.textBody}>
                  Convite pendente
                </Text>
                <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {item.email} · {inviteLabel(item)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Opções do convite para ${item.email}`}
                hitSlop={10}
                onPress={() => setInvite(item)}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textDisabled} />
              </Pressable>
            </View>
          ))}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow
            icon="wallet-outline"
            title="Contas e cartões compartilhados"
            value={String(sharedAccounts)}
            onPress={() => router.push('/perfil/compartilhados')}
          />
          <ListRow
            icon="notifications-outline"
            title="Notificações"
            onPress={() => router.push('/perfil/notificacoes')}
          />
          <ListRow
            icon="shield-checkmark-outline"
            title="Segurança"
            subtitle="Senha e sessões"
            onPress={() => router.push('/perfil/seguranca')}
            last
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={confirmSignOut}
          style={({ pressed }) => ({
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
          })}>
          <Text weight="bold" size="small" color={colors.expense}>
            Sair da conta
          </Text>
        </Pressable>

        <Text size="tiny" color={colors.textMuted} align="center">
          {isMockMode ? 'Dados de exemplo — as alterações valem só nesta sessão' : 'Conectado à API'}
        </Text>
      </ScrollView>

      <ActionSheet
        visible={member !== null}
        title={member?.name ?? ''}
        subtitle={member?.email}
        actions={memberActions}
        onClose={() => setMember(null)}
      />

      <ActionSheet
        visible={invite !== null}
        title="Convite pendente"
        subtitle={invite?.email}
        actions={inviteActions}
        onClose={() => setInvite(null)}
      />
    </Screen>
  );
}
