import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Field } from '@/components/ui';
import { useFintrack } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';

export default function CadastroScreen() {
  const router = useRouter();
  const { signUp } = useFintrack();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length > 1 && email.includes('@') && password.length >= 6;

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } finally {
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

          <Field
            label="Nome"
            placeholder="Como podemos te chamar?"
            icon="person-outline"
            value={name}
            onChangeText={setName}
          />
          <Field
            label="E-mail"
            placeholder="voce@email.com"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Senha"
            placeholder="Mínimo de 6 caracteres"
            icon="lock-closed-outline"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Criar conta"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />

          <Text size="tiny" color={colors.textMuted} align="center" style={{ lineHeight: 16 }}>
            Ao continuar você aceita os Termos{'\n'}e a Política de Privacidade.
          </Text>

          <Pressable onPress={router.back} style={{ alignSelf: 'center', padding: spacing.sm }}>
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
