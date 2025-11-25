import { createTamagui } from "tamagui";
import { getDefaultTamaguiConfig } from "@tamagui/config-default";

const baseConfig = getDefaultTamaguiConfig();

const config = {
  ...baseConfig,
  tokens: {
    ...baseConfig.tokens,
    color: {
      ...baseConfig.tokens.color,
      fintrack: "#4f46e5",
      fintrackDark: "#312e81"
    }
  },
  themes: {
    ...baseConfig.themes,
    fintrack: {
      ...baseConfig.themes.light,
      accent: "$color-fintrack",
      background: "$color-white",
      color: "$color-black"
    }
  }
};

export default createTamagui(config);

export type Conf = typeof config

declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf {}
}

