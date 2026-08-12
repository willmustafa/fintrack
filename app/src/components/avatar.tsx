import { View, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { colors, ownerColors } from '@/theme/tokens';
import type { OwnerId } from '@/types';

const INITIALS: Record<OwnerId, string> = { ana: 'A', marcelo: 'M', casal: 'C' };

type AvatarProps = {
  ownerId: OwnerId;
  size?: number;
  style?: ViewStyle;
};

/** Etiqueta de quem realizou a transação (contas e cartões são compartilhados). */
export function Avatar({ ownerId, size = 24, style }: AvatarProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ownerColors[ownerId],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text weight="extrabold" size={size * 0.42} color={colors.white}>
        {INITIALS[ownerId]}
      </Text>
    </View>
  );
}

type ContactAvatarProps = {
  /** Inicial já calculada (`Contact.initial`) */
  initial: string;
  size?: number;
  /** Contato ligado a um membro do app ganha a cor da pessoa */
  ownerId?: OwnerId;
};

/** Selo de quem divide contas — só um nome, não necessariamente do app. */
export function ContactAvatar({ initial, size = 36, ownerId }: ContactAvatarProps) {
  const linked = ownerId ? ownerColors[ownerId] : null;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: linked ?? colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text weight="extrabold" size={size * 0.4} color={linked ? colors.white : colors.accent}>
        {initial}
      </Text>
    </View>
  );
}

type CategoryIconProps = {
  ownerId: OwnerId;
  size?: number;
  children?: React.ReactNode;
};

/** Quadrado de categoria com o selo da pessoa no canto, como no wireframe. */
export function CategoryTile({ ownerId, size = 42, children }: CategoryIconProps) {
  const badge = size * 0.42;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.placeholderStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
      <View
        style={{
          position: 'absolute',
          right: -badge * 0.18,
          bottom: -badge * 0.18,
          borderRadius: badge,
          borderWidth: 2,
          borderColor: colors.white,
        }}>
        <Avatar ownerId={ownerId} size={badge} />
      </View>
    </View>
  );
}
