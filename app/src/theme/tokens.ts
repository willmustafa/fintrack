/**
 * Tokens extraídos do board "FinTrack — Wireframes" (Claude Design).
 * As medidas do wireframe (frame de 300×640) foram reescaladas para densidade
 * real de telefone (~390pt de largura).
 */

export const colors = {
  /** Fundo das telas com cards empilhados */
  canvas: '#f7f6f3',
  /** Fundo das telas de lista / formulários */
  surface: '#ffffff',
  surfaceMuted: '#f0efeb',

  border: '#ededea',
  borderStrong: '#d9d7d1',
  divider: '#f0efeb',
  track: '#e6e4de',

  text: '#2a2a2e',
  textBody: '#4a4a4e',
  textSecondary: '#87868c',
  textMuted: '#a8a7ac',
  textDisabled: '#b8b7bc',

  accent: '#5a51d6',
  accentSoft: '#eeedfa',

  income: '#1f9d57',
  expense: '#d64545',

  placeholder: '#d9d7d1',
  placeholderStrong: '#e6e4de',

  white: '#ffffff',
} as const;

/** Cor de etiqueta por pessoa (conta e cartão são compartilhados). */
export const ownerColors = {
  ana: '#5a51d6',
  marcelo: '#e08a3c',
  casal: '#6a6a70',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const fonts = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  extrabold: 'HankenGrotesk_800ExtraBold',
} as const;

export const fontSize = {
  micro: 10,
  tiny: 11,
  caption: 12,
  small: 13,
  body: 15,
  title: 17,
  heading: 21,
  display: 27,
  hero: 33,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;
