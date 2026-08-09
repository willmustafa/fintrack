import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

const TABS: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  index: { label: 'Início', icon: 'home' },
  transacoes: { label: 'Transações', icon: 'swap-vertical' },
  cartoes: { label: 'Cartões', icon: 'card' },
  investimentos: { label: 'Invest.', icon: 'trending-up' },
  mais: { label: 'Mais', icon: 'grid' },
};

/** Barra inferior desenhada como no board (5 destinos, rótulos curtos). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const tint = focused ? colors.accent : colors.textDisabled;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name={tab.icon} size={20} color={tint} />
            <Text size="micro" weight={focused ? 'bold' : 'medium'} color={tint}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
