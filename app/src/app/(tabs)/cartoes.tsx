import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Button, Card, ProgressBar } from '@/components/ui';
import { bankName } from '@/data/banks';
import { openInvoices } from '@/lib/finance';
import { formatCurrency, formatCurrencyShort } from '@/lib/format';
import { useFintrack, useSnapshot } from '@/store/fintrack-store';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Account, AccountKind } from '@/types';

const KIND_LABEL: Record<AccountKind, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  cartao: 'Cartão de crédito',
  investimento: 'Investimento',
};

const ARTICLE: Record<AccountKind, string> = {
  corrente: 'a conta',
  poupanca: 'a poupança',
  cartao: 'o cartão',
  investimento: 'a conta',
};

/** Cartões e contas — criar, editar, excluir e compartilhar contas e cartões. */
export default function CartoesScreen() {
  const router = useRouter();
  const { accounts, people } = useSnapshot();
  const { setAccountShared, removeAccount } = useFintrack();

  const cashAccounts = useMemo(
    () => accounts.filter((account) => account.kind !== 'cartao'),
    [accounts],
  );
  const cards = useMemo(() => accounts.filter((account) => account.kind === 'cartao'), [accounts]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  const [addOpen, setAddOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<Account | null>(null);

  const nameOf = (ownerId: string) =>
    ownerId === 'casal' ? 'Conjunta' : people.find((p) => p.id === ownerId)?.name ?? ownerId;

  const share = async (account: Account, shared: boolean) => {
    try {
      await setAccountShared(account.id, shared);
    } catch {
      Alert.alert('Ops', 'Não foi possível alterar o compartilhamento.');
    }
  };

  const confirmDelete = (account: Account) => {
    Alert.alert(
      `Excluir ${ARTICLE[account.kind]}?`,
      `"${account.name}" será removida. As transações continuam no extrato.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void removeAccount(account.id),
        },
      ],
    );
  };

  /** Ações do menu de uma conta/cartão: editar, compartilhar e excluir. */
  const actionsFor = (account: Account): SheetAction[] => {
    const isShared = account.ownerId === 'casal';
    return [
      {
        label: 'Editar',
        icon: 'create-outline',
        onPress: () => router.push(`/conta/${account.id}`),
      },
      {
        label: isShared ? 'Deixar de compartilhar' : 'Tornar conta conjunta',
        icon: isShared ? 'person-outline' : 'people-outline',
        onPress: () => void share(account, !isShared),
      },
      {
        label: 'Excluir',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => confirmDelete(account),
      },
    ];
  };

  const invoice = selected?.invoice ?? 0;
  const limit = selected?.limit ?? 0;
  const available = Math.max(limit - invoice, 0);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, gap: spacing.md }}
        showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text weight="extrabold" size="heading">
            Cartões e contas
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
            hitSlop={10}
            onPress={() => setAddOpen(true)}>
            <Ionicons name="add-circle" size={30} color={colors.accent} />
          </Pressable>
        </View>

        {/* ---------- Contas ---------- */}
        <Text weight="extrabold" size="small" color={colors.textSecondary}>
          CONTAS
        </Text>
        {cashAccounts.length === 0 ? (
          <Card>
            <Text size="caption" color={colors.textSecondary}>
              Nenhuma conta ainda. Toque em + para adicionar.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {cashAccounts.map((account, index) => (
              <Pressable
                key={account.id}
                onPress={() => setSheetFor(account)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: 13,
                  borderBottomWidth: index === cashAccounts.length - 1 ? 0 : 1,
                  borderBottomColor: colors.divider,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Avatar ownerId={account.ownerId} size={34} />
                <View style={{ flex: 1 }}>
                  <Text weight="semibold" size="small">
                    {account.name}
                  </Text>
                  <Text size="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {[KIND_LABEL[account.kind], bankName(account.bank)].filter(Boolean).join(' · ')}
                    {account.ownerId === 'casal' ? ' · conjunta' : ''}
                  </Text>
                </View>
                <Text weight="bold" size="small">
                  {formatCurrency(account.balance)}
                </Text>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textDisabled} />
              </Pressable>
            ))}
          </Card>
        )}

        {/* ---------- Cartões ---------- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.sm,
          }}>
          <Text weight="extrabold" size="small" color={colors.textSecondary}>
            CARTÕES
          </Text>
          <Text size="caption" color={colors.textSecondary}>
            Faturas abertas {formatCurrencyShort(openInvoices(accounts))}
          </Text>
        </View>

        {cards.length === 0 ? (
          <Card>
            <Text size="caption" color={colors.textSecondary}>
              Nenhum cartão ainda. Toque em + para adicionar.
            </Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingVertical: 2 }}>
            {cards.map((card) => {
              const active = card.id === selected?.id;
              return (
                <Pressable key={card.id} onPress={() => setSelectedId(card.id)}>
                  <View
                    style={{
                      width: 240,
                      borderRadius: radius.xl,
                      padding: spacing.lg,
                      backgroundColor: card.brandColor ?? colors.accent,
                      opacity: active ? 1 : 0.55,
                      gap: spacing.lg,
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Ionicons name="card" size={22} color={colors.white} />
                      <Avatar ownerId={card.ownerId} size={22} />
                    </View>
                    <View>
                      <Text size="tiny" color="rgba(255,255,255,0.85)">
                        Fatura atual
                      </Text>
                      <Text weight="extrabold" size="heading" color={colors.white}>
                        {formatCurrency(card.invoice ?? 0)}
                      </Text>
                    </View>
                    <Text size="caption" color="rgba(255,255,255,0.85)">
                      {card.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Bloco único do cartão: fatura total + progresso do limite + datas */}
        {selected ? (
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Fatura atual · {selected.name}
                </Text>
                <Text weight="extrabold" size="display" style={{ marginTop: 2 }}>
                  {formatCurrency(invoice)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Opções de ${selected.name}`}
                hitSlop={10}
                onPress={() => setSheetFor(selected)}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
                <Text weight="extrabold" size="small">
                  Limite
                </Text>
                <Text size="caption" color={colors.textSecondary}>
                  {formatCurrencyShort(available)} disponíveis
                </Text>
              </View>
              <ProgressBar progress={limit === 0 ? 0 : invoice / limit} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Usado {formatCurrencyShort(invoice)}
                </Text>
                <Text size="tiny" color={colors.textSecondary}>
                  Total {formatCurrencyShort(limit)}
                </Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Fecha dia
                </Text>
                <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
                  {selected.closingDay ?? '—'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text size="tiny" color={colors.textSecondary}>
                  Vence dia
                </Text>
                <Text weight="extrabold" size="title" style={{ marginTop: 3 }}>
                  {selected.dueDay ?? '—'}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <Button
          title="Ver lançamentos no extrato"
          variant="outline"
          icon="receipt-outline"
          onPress={() => router.push('/transacoes')}
        />
      </ScrollView>

      {/* Menu: o que criar */}
      <ActionSheet
        visible={addOpen}
        title="Adicionar"
        subtitle="Cadastre uma conta ou um cartão"
        actions={[
          {
            label: 'Nova conta',
            icon: 'wallet-outline',
            onPress: () => router.push('/conta/nova?kind=corrente'),
          },
          {
            label: 'Novo cartão',
            icon: 'card-outline',
            onPress: () => router.push('/conta/nova?kind=cartao'),
          },
        ]}
        onClose={() => setAddOpen(false)}
      />

      {/* Menu de ações de uma conta/cartão */}
      <ActionSheet
        visible={sheetFor !== null}
        title={sheetFor?.name ?? ''}
        subtitle={sheetFor ? `${KIND_LABEL[sheetFor.kind]} · ${nameOf(sheetFor.ownerId)}` : undefined}
        actions={sheetFor ? actionsFor(sheetFor) : []}
        onClose={() => setSheetFor(null)}
      />
    </Screen>
  );
}
