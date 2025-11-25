import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, Theme, YStack } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import tamaguiConfig from "../tamagui.config";
import { AppNavigator } from "./navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig}>
        <Theme name="light">
          <YStack flex={1} backgroundColor="$background">
            <StatusBar style="auto" />
            <AppNavigator />
          </YStack>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
