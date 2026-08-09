import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

export type PickerOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type PickerProps<T extends string> = {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Bottom-sheet simples para escolher conta, categoria, pessoa ou filtro. */
export function Picker<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: PickerProps<T>) {
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
            maxHeight: '75%',
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
          <Text weight="extrabold" size="title" style={{ paddingHorizontal: spacing.xl }}>
            {title}
          </Text>
          <ScrollView style={{ marginTop: spacing.sm }}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.xl,
                    paddingVertical: 14,
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                  })}>
                  <View style={{ flex: 1 }}>
                    <Text weight={active ? 'bold' : 'medium'} size="body">
                      {option.label}
                    </Text>
                    {option.hint ? (
                      <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {option.hint}
                      </Text>
                    ) : null}
                  </View>
                  {active ? (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: colors.borderStrong,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
            <Pressable onPress={onClose} style={{ alignSelf: 'center', padding: spacing.sm }}>
              <Text size="small" weight="semibold" color={colors.textSecondary}>
                Fechar
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
