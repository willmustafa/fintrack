import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, fonts, fontSize } from '@/theme/tokens';

type Weight = keyof typeof fonts;
type Size = keyof typeof fontSize;

export type TextProps = RNTextProps & {
  weight?: Weight;
  size?: Size | number;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function Text({
  weight = 'regular',
  size = 'body',
  color = colors.text,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: typeof size === 'number' ? size : fontSize[size],
          color,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
