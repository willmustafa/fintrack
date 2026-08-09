import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/theme/tokens';

export type SheetAction = {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Marca a opção como escolhida (checkmark à direita) */
  selected?: boolean;
  /** Pinta em vermelho — remover acesso, cancelar convite */
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions: SheetAction[];
  onClose: () => void;
};

/**
 * Menu de ações em bottom-sheet (o "…" das linhas de Perfil).
 * Complementa o `Picker`, que serve para escolher um valor entre opções.
 */
export function ActionSheet({ visible, title, subtitle, actions, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(20,18,30,0.35)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.track,
              marginBottom: spacing.md,
            }}
          />

          <View style={{ paddingHorizontal: spacing.xl, gap: 2 }}>
            <Text weight="extrabold" size="title">
              {title}
            </Text>
            {subtitle ? (
              <Text size="caption" color={colors.textSecondary}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: spacing.md }}>
            {actions.map((action) => {
              const tint = action.destructive ? colors.expense : colors.text;
              return (
                <Pressable
                  key={action.label}
                  onPress={() => {
                    onClose();
                    action.onPress();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.xl,
                    paddingVertical: 14,
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                  })}>
                  {action.icon ? (
                    <Ionicons name={action.icon} size={19} color={tint} />
                  ) : null}
                  <Text weight={action.selected ? 'bold' : 'medium'} size="body" color={tint} style={{ flex: 1 }}>
                    {action.label}
                  </Text>
                  {action.selected ? (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 13,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text weight="bold" size="small" color={colors.textSecondary}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
