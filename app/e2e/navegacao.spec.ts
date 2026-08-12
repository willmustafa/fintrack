import { expect, test } from '@playwright/test';

import { entrar, irParaAba } from './helpers';

test.describe('Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test('as cinco abas trocam de tela', async ({ page }) => {
    await irParaAba(page, 'Transações');
    await expect(page.getByPlaceholder('Buscar transação')).toBeVisible();

    await irParaAba(page, 'Cartões');
    await expect(page.getByText('Faturas abertas R$ 1.250')).toBeVisible();

    await irParaAba(page, 'Invest.');
    await expect(page.getByText('RENDA FIXA')).toBeVisible();

    await irParaAba(page, 'Mais');
    await expect(page.getByText('FinTrack · versão 1.0.0')).toBeVisible();

    await irParaAba(page, 'Início');
    await expect(page.getByText('Bom dia,')).toBeVisible();
  });

  test('os atalhos do painel levam às telas certas', async ({ page }) => {
    await page.getByText('Faturas', { exact: true }).click();
    await expect(page.getByText('Total R$ 6.000')).toBeVisible();

    await irParaAba(page, 'Início');
    await page.getByText('Quase lá').click();
    // "Sofá novo" ainda não tem alvo, então só aparece na lista completa.
    await expect(page.getByText('Sofá novo')).toBeVisible();
  });

  test('o painel resume a sobra do mês e o prazo do financiamento', async ({ page }) => {
    await expect(page.getByText('Sobrou no mês')).toBeVisible();
    await expect(page.getByText('+R$ 2.620')).toBeVisible();
    await expect(page.getByText('meses até quitar · 19 anos e 10 meses')).toBeVisible();
  });

  test('Mais → Metas → detalhe e volta', async ({ page }) => {
    await irParaAba(page, 'Mais');
    await page.getByText('Metas', { exact: true }).click();
    await expect(page.getByText('Reserva de emergência')).toBeVisible();

    await page.getByText('Notebook').click();
    await expect(page.getByText('R$ 1.200 guardados')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByText('Reserva de emergência')).toBeVisible();
  });

  test('Mais → Financiamento → amortização', async ({ page }) => {
    await irParaAba(page, 'Mais');
    await page.getByText('Financiamento').click();
    await expect(page.getByText('30,6% quitado')).toBeVisible();

    await page.getByText('Ver amortização detalhada').click();
    await expect(page.getByText('Saldo devedor ao longo do tempo')).toBeVisible();
  });

  test('Mais → Perfil abre as configurações', async ({ page }) => {
    await irParaAba(page, 'Mais');
    await page.getByText('Perfil e compartilhamento').click();
    await expect(page.getByText('Ana Ribeiro')).toBeVisible();
    await expect(page.getByText('Compartilhado com')).toBeVisible();
  });
});
