import { expect, test } from '@playwright/test';

import { entrar, irParaAba } from './helpers';

async function abrirMetas(page: import('@playwright/test').Page) {
  await entrar(page);
  await irParaAba(page, 'Mais');
  await page.getByText('Metas', { exact: true }).click();
  await expect(page.getByText('Viagem Japão')).toBeVisible();
}

test.describe('Metas', () => {
  test('lista as metas com progresso e prazo', async ({ page }) => {
    await abrirMetas(page);
    await expect(page.getByText('82%')).toBeVisible();
    await expect(page.getByText('R$ 9.800 / R$ 12.000')).toBeVisible();
    await expect(page.getByText('Prazo: dez/24')).toBeVisible();
    await expect(page.getByText('↳ vinculada: Tesouro Selic')).toBeVisible();
  });

  test('meta sem valor aparece como "a definir"', async ({ page }) => {
    await abrirMetas(page);
    await expect(page.getByText('a definir')).toBeVisible();
    await expect(page.getByText('orçamento escolhido R$ 2.850')).toBeVisible();
  });

  test('escolher outro orçamento vira o valor da meta', async ({ page }) => {
    await abrirMetas(page);
    await page.getByText('Sofá novo').click();

    await expect(page.getByText('Comparar orçamentos · 3 opções')).toBeVisible();
    await expect(page.getByText('Ainda não definido — escolha um orçamento')).toBeVisible();

    // O primeiro "Escolher esta" é o segundo orçamento (o primeiro já é o escolhido).
    await page.getByText('Escolher esta ›').first().click();

    await expect(page.getByText('Confirmar orçamento · R$ 3.200')).toBeVisible();
  });

  test('o detalhe mostra o investimento vinculado', async ({ page }) => {
    await abrirMetas(page);
    await page.getByText('Viagem Japão').click();

    await expect(page.getByText('Vinculada a Tesouro Selic')).toBeVisible();
    await expect(page.getByText('Saldo atual R$ 8.640')).toBeVisible();
  });
});

test.describe('Financiamento', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Mais');
    await page.getByText('Financiamento').click();
    await expect(page.getByText('30,6% quitado')).toBeVisible();
  });

  test('mostra saldo devedor e rateio da entrada', async ({ page }) => {
    await expect(page.getByText('R$ 312.400')).toBeVisible();
    await expect(page.getByText('Entrada — R$ 70.000')).toBeVisible();
    await expect(page.getByText('Ana · R$ 40.000 (57%)')).toBeVisible();
    await expect(page.getByText('Marcelo · R$ 30.000 (43%)')).toBeVisible();
  });

  test('a amortização rateia os valores por pessoa', async ({ page }) => {
    await page.getByText('Ver amortização detalhada').click();

    await expect(page.getByText('R$ 61.200')).toBeVisible();

    await page.getByText('Ana', { exact: true }).click();
    await expect(page.getByText(/Valores proporcionais à participação de Ana/)).toBeVisible();
    await expect(page.getByText('R$ 34.971')).toBeVisible();

    await page.getByText('Casal', { exact: true }).click();
    await expect(page.getByText('R$ 61.200')).toBeVisible();
  });
});

test.describe('Cartões e investimentos', () => {
  test('trocar de cartão troca limite e lançamentos', async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Cartões');

    await expect(page.getByText('R$ 5.170 disponíveis')).toBeVisible();
    await expect(page.getByText('Ônibus Trabalho')).toBeVisible();

    await page.getByText('Inter Gold').click();
    await expect(page.getByText('R$ 3.080 disponíveis')).toBeVisible();
    await expect(page.getByText('Restaurante')).toBeVisible();
  });

  test('a carteira mostra o patrimônio e os ativos por classe', async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Invest.');

    await expect(page.getByText('+R$ 2.840 · +15,4%')).toBeVisible();
    await expect(page.getByText('Tesouro Selic')).toBeVisible();
    await expect(page.getByText('Cripto · aportado R$ 2.000')).toBeVisible();
  });
});
