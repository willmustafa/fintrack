import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, ListRow } from '@/components/ui';
import { isMockMode } from '@/services/api';
import { useCurrentPerson, useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, spacing } from '@/theme/tokens';

export default function MaisScreen() {
  const router = useRouter();
  const person = useCurrentPerson();
  const { signOut } = useFintrack();
  const { goals, loans } = useSnapshot();

  const openGoals = goals.filter((goal) => !goal.target || goal.saved < goal.target).length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <Text weight="extrabold" size="heading">
          Mais
        </Text>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow
            icon="flag-outline"
            title="Metas"
            subtitle={`${openGoals} em andamento`}
            onPress={() => router.push('/metas')}
          />
          <ListRow
            icon="home-outline"
            title="Financiamento"
            subtitle={loans[0]?.name ?? 'Nenhum financiamento'}
            onPress={() => router.push('/financiamento')}
          />
          <ListRow
            icon="person-circle-outline"
            title="Perfil e compartilhamento"
            subtitle={person?.email}
            onPress={() => router.push('/perfil')}
            last
          />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow icon="pricetags-outline" title="Categorias" onPress={() => {}} />
          <ListRow icon="repeat-outline" title="Recorrentes" onPress={() => {}} />
          <ListRow icon="notifications-outline" title="Notificações" onPress={() => {}} last />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow
            icon="log-out-outline"
            title="Sair da conta"
            onPress={signOut}
            last
          />
        </Card>

        <View style={{ alignItems: 'center', gap: 2, marginTop: spacing.sm }}>
          <Text size="tiny" color={colors.textMuted}>
            FinTrack · versão 1.0.0
          </Text>
          <Text size="tiny" color={colors.textMuted}>
            {isMockMode ? 'Dados de exemplo (backend Go em construção)' : 'Conectado à API'}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
