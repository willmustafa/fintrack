import { Text, XStack, YStack } from "tamagui";

type Props = {
  title: string;
  value: string;
  accent?: string;
  description?: string;
};

export function StatCard({ title, value, accent = "$accent", description }: Props) {
  return (
    <YStack
      marginBottom={8}
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$md"
      padding={12}
      backgroundColor="$background"
      space="$xs"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={14} color="$colorMuted">
          {title}
        </Text>
        {description && (
          <Text fontSize={12} color={accent} opacity={0.8}>
            {description}
          </Text>
        )}
      </XStack>
      <Text fontSize={32} fontWeight="700" color="$color">
        {value}
      </Text>
    </YStack>
  );
}
