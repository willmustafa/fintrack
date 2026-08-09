import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/text';
import { colors, fonts, fontSize, radius, shadow, spacing } from '@/theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Card sólido de destaque (roxo) usado no saldo consolidado */
  accent?: boolean;
  onPress?: () => void;
};

export function Card({ children, style, accent, onPress }: CardProps) {
  const content = (
    <View
      style={[
        {
          backgroundColor: accent ? colors.accent : colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: accent ? 0 : 1,
          borderColor: colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="extrabold" size="body">
      {children}
    </Text>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: isPrimary ? colors.accent : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.borderStrong,
          borderRadius: radius.md,
          paddingVertical: 15,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.accent} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={isPrimary ? colors.white : isGhost ? colors.accent : colors.textBody}
            />
          ) : null}
          <Text
            weight="bold"
            size="body"
            color={isPrimary ? colors.white : isGhost ? colors.accent : colors.textBody}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Mensagem de validação — pinta a borda de vermelho */
  error?: string;
  /** Texto auxiliar exibido abaixo do campo quando não há erro */
  hint?: string;
  /** Ação à direita do campo (ex.: mostrar/ocultar senha) */
  right?: React.ReactNode;
};

export function Field({ label, icon, error, hint, right, style, ...rest }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text size="caption" weight="semibold" color={colors.textSecondary}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: error ? colors.expense : colors.borderStrong,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
        }}>
        {icon ? <Ionicons name={icon} size={17} color={colors.textDisabled} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          {...rest}
          style={[
            {
              flex: 1,
              paddingVertical: 15,
              fontFamily: fonts.medium,
              fontSize: fontSize.body,
              color: colors.text,
            },
            style,
          ]}
        />
        {right}
      </View>
      {error ? (
        <Text size="caption" color={colors.expense}>
          {error}
        </Text>
      ) : hint ? (
        <Text size="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordField({ ...rest }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...rest}
      icon={rest.icon ?? 'lock-closed-outline'}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          hitSlop={10}
          onPress={() => setVisible((current) => !current)}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.textDisabled}
          />
        </Pressable>
      }
    />
  );
}

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  caret?: boolean;
};

export function Chip({ label, active, onPress, caret }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: active ? colors.accent : 'transparent',
        borderWidth: active ? 0 : 1,
        borderColor: colors.borderStrong,
        borderRadius: radius.pill,
        paddingVertical: 8,
        paddingHorizontal: 13,
        opacity: pressed ? 0.75 : 1,
      })}>
      <Text weight={active ? 'bold' : 'medium'} size="caption" color={active ? colors.white : colors.textBody}>
        {label}
      </Text>
      {caret ? (
        <Ionicons
          name="chevron-down"
          size={11}
          color={active ? colors.white : colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.md,
          padding: 3,
        },
        style,
      ]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 9,
              borderRadius: radius.sm,
              backgroundColor: active ? colors.surface : 'transparent',
              ...(active ? shadow.card : null),
            }}>
            <Text
              weight={active ? 'bold' : 'medium'}
              size="caption"
              color={active ? colors.accent : colors.textSecondary}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ProgressBarProps = {
  progress: number;
  height?: number;
  color?: string;
  track?: string;
};

export function ProgressBar({
  progress,
  height = 9,
  color = colors.accent,
  track = colors.track,
}: ProgressBarProps) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Barra dividida em partes (rateio da entrada entre Ana e Marcelo). */
export function SplitBar({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <View style={{ height: 9, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' }}>
      {parts.map((part, index) => (
        <View
          key={index}
          style={{ flex: part.value / total, backgroundColor: part.color }}
        />
      ))}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
  right?: React.ReactNode;
};

/** Linha de lista com chevron — usada em Perfil / Mais / campos do formulário. */
export function ListRow({ title, subtitle, value, onPress, icon, last, right }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        opacity: pressed && onPress ? 0.6 : 1,
      })}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text weight="semibold" size="small">
          {title}
        </Text>
        {subtitle ? (
          <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (value ? (
          <Text size="small" weight="semibold" color={colors.textSecondary}>
            {value}
          </Text>
        ) : null)}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} /> : null}
    </Pressable>
  );
}

type SwitchRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
};

/** Linha de preferência com interruptor — usada em Notificações e Segurança. */
export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  last,
}: SwitchRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        opacity: disabled ? 0.5 : 1,
      }}>
      <View style={{ flex: 1 }}>
        <Text weight="semibold" size="small">
          {title}
        </Text>
        {subtitle ? (
          <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2, lineHeight: 17 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.track, true: colors.accent }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.track}
      />
    </View>
  );
}

type NoticeProps = {
  message: string;
  tone?: 'info' | 'error' | 'success';
};

/** Faixa de feedback usada acima dos formulários de configuração. */
export function Notice({ message, tone = 'info' }: NoticeProps) {
  const palette = {
    info: { bg: colors.accentSoft, fg: colors.accent, icon: 'information-circle-outline' },
    error: { bg: colors.expenseSoft, fg: colors.expense, icon: 'alert-circle-outline' },
    success: { bg: colors.incomeSoft, fg: colors.income, icon: 'checkmark-circle-outline' },
  }[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: palette.bg,
        borderRadius: radius.md,
        padding: spacing.md,
      }}>
      <Ionicons
        name={palette.icon as React.ComponentProps<typeof Ionicons>['name']}
        size={16}
        color={palette.fg}
        style={{ marginTop: 1 }}
      />
      <Text size="caption" color={palette.fg} style={{ flex: 1, lineHeight: 17 }}>
        {message}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

/** Botão flutuante "+" das telas de Início e Transações. */
export function Fab({ onPress, bottom = 24 }: { onPress: () => void; bottom?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nova transação"
      onPress={onPress}
      style={({ pressed }) => [
        {
          position: 'absolute',
          right: spacing.lg,
          bottom,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        shadow.floating,
      ]}>
      <Ionicons name="add" size={30} color={colors.white} />
    </Pressable>
  );
}
