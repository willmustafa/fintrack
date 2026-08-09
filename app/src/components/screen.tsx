import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

type ScreenProps = {
  children: React.ReactNode;
  background?: string;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  background = colors.canvas,
  edges = ['top'],
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: background }, style]}>
      {children}
    </SafeAreaView>
  );
}

type HeaderProps = {
  title: string;
  onBack?: () => void;
  /** Ação à direita: ícone + callback, ou nó customizado */
  action?: React.ComponentProps<typeof Ionicons>['name'];
  onAction?: () => void;
  right?: React.ReactNode;
  centered?: boolean;
};

export function Header({ title, onBack, action, onAction, right, centered = true }: HeaderProps) {
  const router = useRouter();
  const back = onBack ?? (router.canGoBack() ? router.back : undefined);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.md,
      }}>
      <View style={{ width: 28, alignItems: 'flex-start' }}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={back}>
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <Text
        weight="extrabold"
        size="title"
        align={centered ? 'center' : 'left'}
        numberOfLines={1}
        style={{ flex: 1 }}>
        {title}
      </Text>
      <View style={{ width: 28, alignItems: 'flex-end' }}>
        {right ??
          (action ? (
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onAction}>
              <Ionicons name={action} size={22} color={colors.accent} />
            </Pressable>
          ) : null)}
      </View>
    </View>
  );
}
