import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export const unstable_settings = { anchor: 'login' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.accent } }}
    />
  );
}
