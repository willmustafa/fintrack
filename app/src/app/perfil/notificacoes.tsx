import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Header, Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Card, Notice, SwitchRow } from '@/components/ui';
import { useFintrack, usePreferences } from '@/store/fintrack-store';
import type { NotificationPreferences } from '@/types';
import { colors, spacing } from '@/theme/tokens';

type Toggle = {
  key: keyof NotificationPreferences;
  title: string;
  subtitle: string;
};

const MOVIMENTACOES: Toggle[] = [
  {
    key: 'transactions',
    title: 'Novos lançamentos',
    subtitle: 'Quando alguém com acesso registra um gasto, ganho ou transferência.',
  },
  {
    key: 'invoices',
    title: 'Faturas de cartão',
    subtitle: 'Aviso no fechamento e três dias antes do vencimento.',
  },
];

const ACOMPANHAMENTO: Toggle[] = [
  {
    key: 'goals',
    title: 'Metas e orçamento',
    subtitle: 'Quando uma meta é atingida ou uma categoria estoura o 50/30/20.',
  },
  {
    key: 'weeklySummary',
    title: 'Resumo semanal',
    subtitle: 'Toda segunda-feira, com entradas e saídas da semana anterior.',
  },
];

/** Perfil · Notificações — preferências por tipo de alerta. */
export default function NotificacoesScreen() {
  const preferences = usePreferences();
  const { updatePreferences } = useFintrack();
  const [error, setError] = useState<string | null>(null);

  const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
    setError(null);
    try {
      await updatePreferences({
        ...preferences,
        notifications: { ...preferences.notifications, [key]: value },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível salvar a preferência. Tente de novo.',
      );
    }
  };

  const renderCard = (items: Toggle[]) => (
    <Card style={{ paddingVertical: 4 }}>
      {items.map((item, index) => (
        <SwitchRow
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          value={preferences.notifications[item.key]}
          onValueChange={(value) => void toggle(item.key, value)}
          last={index === items.length - 1}
        />
      ))}
    </Card>
  );

  return (
    <Screen background={colors.surface}>
      <Header title="Notificações" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        {error ? <Notice tone="error" message={error} /> : null}

        <Text weight="extrabold" size="small" color={colors.textSecondary}>
          MOVIMENTAÇÕES
        </Text>
        {renderCard(MOVIMENTACOES)}

        <Text weight="extrabold" size="small" color={colors.textSecondary}>
          ACOMPANHAMENTO
        </Text>
        {renderCard(ACOMPANHAMENTO)}

        <Notice message="As preferências ficam salvas na sua conta. O envio dos alertas depende do backend registrar o dispositivo para push." />
      </ScrollView>
    </Screen>
  );
}
