import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, Notice, PasswordField } from '@/components/ui';
import { isValidPassword, passwordRules } from '@/lib/validation';
import { useCurrentPerson, useFintrack } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Perfil · Segurança — troca de senha e encerramento de sessão. */
export default function SegurancaScreen() {
  const person = useCurrentPerson();
  const { changePassword, signOut } = useFintrack();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  );

  const rules = passwordRules(next);
  const confirmError = confirm.length > 0 && confirm !== next ? 'As senhas não conferem.' : null;
  const canSubmit =
    current.length > 0 && isValidPassword(next) && confirm === next && current !== next;

  const onSubmit = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setFeedback({ tone: 'success', message: 'Senha alterada. Use a nova no próximo login.' });
    } catch (caught) {
      setFeedback({
        tone: 'error',
        message: caught instanceof Error ? caught.message : 'Não foi possível alterar a senha.',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOutAll = () =>
    Alert.alert(
      'Encerrar sessões',
      'Você sai deste aparelho e de qualquer outro em que a conta esteja aberta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: signOut },
      ],
    );

  return (
    <Screen background={colors.surface}>
      <Header title="Segurança" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}

          <Text weight="extrabold" size="small" color={colors.textSecondary}>
            ALTERAR SENHA
          </Text>

          <PasswordField
            label="Senha atual"
            placeholder="Sua senha de hoje"
            value={current}
            onChangeText={setCurrent}
            textContentType="password"
          />

          <PasswordField
            label="Nova senha"
            placeholder="Escolha uma senha nova"
            value={next}
            onChangeText={setNext}
            textContentType="newPassword"
          />

          <View style={{ gap: 5, paddingHorizontal: spacing.xs }}>
            {rules.map((rule) => (
              <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rule.ok ? colors.income : colors.textDisabled}
                />
                <Text size="caption" color={rule.ok ? colors.textBody : colors.textMuted}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>

          <PasswordField
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            value={confirm}
            onChangeText={setConfirm}
            textContentType="newPassword"
            error={confirmError ?? undefined}
          />

          <Button
            title="Alterar senha"
            onPress={onSubmit}
            loading={saving}
            disabled={!canSubmit}
            style={{ marginTop: spacing.xs }}
          />

          <Text weight="extrabold" size="small" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            SESSÃO
          </Text>

          <Card style={{ gap: 4 }}>
            <Text weight="bold" size="small">
              {person?.email ?? '—'}
            </Text>
            <Text size="caption" color={colors.textSecondary} style={{ lineHeight: 17 }}>
              Este aparelho. O backend ainda não expõe a lista de sessões ativas — por enquanto,
              encerrar sai de todas.
            </Text>
          </Card>

          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOutAll}
            style={({ pressed }) => ({
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text weight="bold" size="small" color={colors.expense}>
              Encerrar sessões
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
