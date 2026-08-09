import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Divider, ListRow } from '@/components/ui';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, ownerColors, radius, spacing } from '@/theme/tokens';

/** Perfil · Configurações do board (pessoas com quem as contas são compartilhadas). */
export default function PerfilScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { signOut } = useFintrack();
  const { people, invites, accounts } = useSnapshot();

  const shared = people.filter((item) => item.id !== person?.id && item.id !== 'casal');
  const sharedAccounts = accounts.filter((account) => account.ownerId === 'casal').length;

  return (
    <Screen background={colors.surface}>
      <Header title="Perfil" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: spacing.md }}>
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
              {person?.initial ?? 'A'}
            </Text>
          </View>
          <Text weight="extrabold" size="title">
            {person?.name ?? 'Ana Ribeiro'}
          </Text>
          <Text size="small" color={colors.textSecondary}>
            {person?.email ?? 'ana@email.com'}
          </Text>
        </View>

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

          {shared.map((member) => (
            <View key={member.id}>
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
                    backgroundColor: ownerColors[member.id],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text weight="extrabold" size="caption" color={colors.white}>
                    {member.initial}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="bold" size="small">
                    {member.name}
                  </Text>
                  <Text size="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                    {member.email} · Acesso {member.access ?? 'total'}
                  </Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textDisabled} />
              </View>
              <Divider />
            </View>
          ))}

          {invites.map((invite) => (
            <View
              key={invite.id}
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
                  {invite.email} ·{' '}
                  {invite.sentDaysAgo === 0
                    ? 'enviado agora'
                    : `enviado há ${invite.sentDaysAgo} dias`}
                </Text>
              </View>
              <Pressable hitSlop={8}>
                <Text size="caption" weight="bold" color={colors.accent}>
                  Reenviar
                </Text>
              </Pressable>
            </View>
          ))}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow
            icon="wallet-outline"
            title="Contas e cartões compartilhados"
            value={String(sharedAccounts)}
            onPress={() => {}}
          />
          <ListRow icon="notifications-outline" title="Notificações" onPress={() => {}} />
          <ListRow icon="shield-checkmark-outline" title="Segurança" onPress={() => {}} last />
        </Card>

        <Pressable
          onPress={signOut}
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
      </ScrollView>
    </Screen>
  );
}
