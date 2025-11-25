import { Button, Text, XStack, YStack } from "tamagui";
import { formatCurrency } from "../utils/formatCurrency";
import { StatCard } from "../components/StatCard";

const quickActions = [
  "Registrar despesa",
  "Adicionar receita",
  "Atualizar metas",
  "Convidar parceiros"
];

export function DashboardScreen() {
  return (
    <YStack flex={1} paddingHorizontal={24} paddingTop={32} paddingBottom={24} backgroundColor="$background">
      <Text fontSize={24} fontWeight="700">
        Fintrack
      </Text>
      <Text fontSize={16} color="$colorMuted" marginBottom={12}>
        Controle suas finanças pessoais, metas e sonhos em um único lugar.
      </Text>

      <StatCard title="Saldo disponível" value={formatCurrency(2381.42)} description="Atualizado há 2h" />
      <StatCard title="Receitas este mês" value={formatCurrency(8420)} description="Receitas previstas" />
      <StatCard title="Despesas este mês" value={formatCurrency(6035)} description="Orçamento restante" />

      <YStack marginTop={20}>
        <Text fontSize={18} fontWeight="600" marginBottom={8}>
          Ações rápidas
        </Text>
        <XStack flexWrap="wrap" justifyContent="space-between">
          {quickActions.map((action) => (
            <Button
              key={action}
              size="$sm"
              borderRadius="$pill"
              marginRight={8}
              marginBottom={8}
            >
              {action}
            </Button>
          ))}
        </XStack>
      </YStack>
    </YStack>
  );
}
