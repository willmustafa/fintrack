import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Field, Notice } from '@/components/ui';
import { isValidEmail } from '@/lib/validation';
import { useCurrentPerson, useFintrack } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';

/** Perfil · Editar — nome e e-mail da pessoa logada. */
export default function EditarPerfilScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { updateProfile } = useFintrack();

  const [name, setName] = useState(person?.name ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const nameError = name.trim().length < 2 ? 'Informe pelo menos 2 caracteres.' : null;
  const emailError = isValidEmail(email) ? null : 'E-mail inválido.';
  const changed = name.trim() !== person?.name || email.trim() !== person?.email;
  const canSave = !nameError && !emailError && changed;

  const onSave = async () => {
    setTouched(true);
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen background={colors.surface}>
      <Header title="Editar perfil" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
          keyboardShouldPersistTaps="handled">
          {error ? <Notice tone="error" message={error} /> : null}

          <Field
            label="Nome"
            placeholder="Como podemos te chamar?"
            icon="person-outline"
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
            value={email}
            onChangeText={setEmail}
            error={touched ? (emailError ?? undefined) : undefined}
            hint="Usado para entrar e para receber convites de compartilhamento."
          />

          {/* Habilitado sempre: `onSave` marca `touched` e mostra o que está errado. */}
          <Button
            title="Salvar alterações"
            onPress={onSave}
            loading={saving}
            style={{ marginTop: spacing.sm }}
          />

          <View style={{ paddingHorizontal: spacing.xs }}>
            <Text size="tiny" color={colors.textMuted} align="center" style={{ lineHeight: 16 }}>
              Trocar o e-mail exige confirmar o novo endereço antes do próximo login.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
