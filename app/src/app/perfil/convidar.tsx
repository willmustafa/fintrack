import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Button, Field } from '@/components/ui';
import { inviteLink } from '@/data/seed';
import { useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Perfil · Convidar do board: e-mail + seleção do que a pessoa poderá acessar. */
export default function ConvidarScreen() {
  const router = useRouter();
  const { accounts, loans } = useSnapshot();
  const { sendInvite } = useFintrack();

  const shareables = [
    ...accounts
      .filter((account) => account.ownerId === 'casal')
      .map((account) => ({ id: account.id, label: account.name })),
    ...loans.map((loan) => ({ id: loan.id, label: loan.name })),
  ];

  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>(shareables.map((item) => item.id));
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const onSend = async () => {
    setSending(true);
    try {
      await sendInvite(email.trim(), selected);
      router.back();
    } finally {
      setSending(false);
    }
  };

  const onCopy = async () => {
    await Clipboard.setStringAsync(`https://${inviteLink}`);
    setCopied(true);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
        <Pressable accessibilityLabel="Fechar" hitSlop={12} onPress={router.back}>
          <Ionicons name="close" size={24} color={colors.textBody} />
        </Pressable>
        <Text weight="extrabold" size="title" style={{ flex: 1 }}>
          Convidar para compartilhar
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled">
          <Text size="small" color={colors.textSecondary} style={{ lineHeight: 20 }}>
            A pessoa convidada poderá ver e lançar transações nas contas e cartões que você
            selecionar.
          </Text>

          <Field
            label="E-mail da pessoa"
            placeholder="nome@email.com"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ gap: spacing.sm }}>
            <Text size="caption" weight="semibold" color={colors.textSecondary}>
              Dar acesso a
            </Text>
            {shareables.map((item) => {
              const active = selected.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      borderWidth: active ? 0 : 1.5,
                      borderColor: colors.borderStrong,
                      backgroundColor: active ? colors.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {active ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                  </View>
                  <Text size="small" weight="medium" style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.track }} />
            <Text size="tiny" color={colors.textMuted}>
              ou
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.track }} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: 12,
            }}>
            <Text size="small" color={colors.textSecondary} style={{ flex: 1 }} numberOfLines={1}>
              {inviteLink}
            </Text>
            <Pressable onPress={onCopy} hitSlop={8}>
              <Text size="caption" weight="bold" color={colors.accent}>
                {copied ? 'Copiado' : 'Copiar'}
              </Text>
            </Pressable>
          </View>

          <Button
            title="Enviar convite"
            onPress={onSend}
            loading={sending}
            disabled={!email.includes('@') || selected.length === 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
