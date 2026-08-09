import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';

export const unstable_settings = { anchor: 'index' };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="transacoes" options={{ title: 'Transações' }} />
      <Tabs.Screen name="cartoes" options={{ title: 'Cartões' }} />
      <Tabs.Screen name="investimentos" options={{ title: 'Investimentos' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
    </Tabs>
  );
}
