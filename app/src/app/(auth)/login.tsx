import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Button, Field } from '@/components/ui';
import { useFintrack } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Auth · V2 do board: hero roxo + bottom-sheet branco com o formulário. */
export default function LoginScreen() {
  const { signIn } = useFintrack();
  const [email, setEmail] = useState('ana@email.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError('Não foi possível entrar. Confira e-mail e senha.');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.accent }}>
      <SafeAreaView edges={['top']}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: 48 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: radius.lg,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.xl,
            }}>
            <Ionicons name="wallet" size={28} color={colors.accent} />
          </View>
          <Text weight="extrabold" size="hero" color={colors.white} style={{ lineHeight: 38 }}>
            Controle total{'\n'}no seu bolso
          </Text>
          <Text size="body" color="rgba(255,255,255,0.82)" style={{ marginTop: spacing.sm }}>
            Contas, cartões, metas e investimentos.
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -24,
          }}>
          <ScrollView
            contentContainerStyle={{ padding: spacing.xxl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled">
            <Text weight="extrabold" size="heading">
              Entrar
            </Text>

            <Field
              placeholder="E-mail"
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              placeholder="Senha"
              icon="lock-closed-outline"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <Text size="caption" color={colors.expense}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Entrar"
              onPress={onSubmit}
              loading={loading}
              style={{ marginTop: spacing.xs }}
            />

            <Pressable style={{ alignSelf: 'center', padding: spacing.sm }}>
              <Text size="caption" color={colors.textSecondary}>
                Esqueci minha senha
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.track }} />
              <Text size="tiny" color={colors.textMuted}>
                ou
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.track }} />
            </View>

            <Button title="Continuar com Google" variant="outline" icon="logo-google" />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 5,
                marginTop: spacing.sm,
              }}>
              <Text size="small" color={colors.textSecondary}>
                Novo por aqui?
              </Text>
              <Link href="/cadastro">
                <Text size="small" weight="bold" color={colors.accent}>
                  Criar conta
                </Text>
              </Link>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
