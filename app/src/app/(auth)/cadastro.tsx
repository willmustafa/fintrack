import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Field, Notice, PasswordField } from '@/components/ui';
import { isValidEmail, isValidPassword, passwordRules } from '@/lib/validation';
import { useFintrack } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

export default function CadastroScreen() {
  const router = useRouter();
  const { signUp } = useFintrack();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const rules = passwordRules(password);
  const nameError = name.trim().length < 2 ? 'Informe pelo menos 2 caracteres.' : null;
  const emailError = isValidEmail(email) ? null : 'E-mail inválido.';
  const confirmError = confirm !== password ? 'As senhas não conferem.' : null;

  const canSubmit =
    !nameError && !emailError && isValidPassword(password) && !confirmError && accepted;

  const onSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim(), password);
      // Sucesso: o guard de sessão no layout raiz troca para as abas sozinho.
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível criar a conta. Tente de novo em instantes.',
      );
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header title="Criar conta" onBack={router.back} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          keyboardShouldPersistTaps="handled">
          <Text size="small" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Depois de criar sua conta você pode convidar alguém para dividir contas, cartões e
            financiamentos.
          </Text>

          {error ? <Notice tone="error" message={error} /> : null}

          <Field
            label="Nome"
            placeholder="Como podemos te chamar?"
            icon="person-outline"
            autoCapitalize="words"
            textContentType="name"
            value={name}
            onChangeText={setName}
            error={touched ? (nameError ?? undefined) : undefined}
          />
          <Field
            label="E-mail"
            placeholder="voce@email.com"
            icon="mail-outline"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            error={touched ? (emailError ?? undefined) : undefined}
          />
          <PasswordField
            label="Senha"
            placeholder="Crie uma senha"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />

          <View style={{ gap: 5, paddingHorizontal: spacing.xs, marginTop: -spacing.xs }}>
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
            label="Confirmar senha"
            placeholder="Repita a senha"
            textContentType="newPassword"
            value={confirm}
            onChangeText={setConfirm}
            error={confirm.length > 0 ? (confirmError ?? undefined) : undefined}
          />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => setAccepted((current) => !current)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.xs,
              opacity: pressed ? 0.7 : 1,
            })}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: accepted ? 0 : 1.5,
                borderColor: colors.borderStrong,
                backgroundColor: accepted ? colors.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {accepted ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
            </View>
            <Text size="caption" color={colors.textSecondary} style={{ flex: 1, lineHeight: 17 }}>
              Li e aceito os Termos de uso e a Política de Privacidade.
            </Text>
          </Pressable>

          <Button
            title="Criar conta"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: spacing.xs }}
          />

          <Pressable
            onPress={router.back}
            style={({ pressed }) => ({
              alignSelf: 'center',
              padding: spacing.sm,
              borderRadius: radius.sm,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text size="small" color={colors.textSecondary}>
              Já tenho conta —{' '}
              <Text size="small" weight="bold" color={colors.accent}>
                Entrar
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
