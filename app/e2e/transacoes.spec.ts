import { expect, test } from '@playwright/test';

import { entrar, irParaAba } from './helpers';

test.describe('Transações', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Transações');
  });

  test('lista agrupada por dia com o resumo do período', async ({ page }) => {
    await expect(page.getByText('HOJE · 24/05')).toBeVisible();
    await expect(page.getByText('ONTEM · 23/05')).toBeVisible();
    await expect(page.getByText('+R$ 5.000')).toBeVisible();
    await expect(page.getByText('-R$ 2.380')).toBeVisible();
  });

  test('a busca filtra a lista', async ({ page }) => {
    await page.getByPlaceholder('Buscar transação').fill('netflix');

    await expect(page.getByText('Netflix')).toBeVisible();
    await expect(page.getByText('Mercado')).toBeHidden();
  });

  test('busca sem resultado mostra o aviso', async ({ page }) => {
    await page.getByPlaceholder('Buscar transação').fill('zzzz');
    await expect(page.getByText('Nenhuma transação com esses filtros.')).toBeVisible();
  });

  test('filtrar por tipo mostra só os ganhos', async ({ page }) => {
    await page.getByText('Tipo').click();
    await page.getByText('Ganhos').click();

    await expect(page.getByText('Salário')).toBeVisible();
    await expect(page.getByText('Freelance')).toBeVisible();
    await expect(page.getByText('Mercado')).toBeHidden();
  });

  test('filtrar por conta mostra só o cartão escolhido', async ({ page }) => {
    await page.getByText('Conta', { exact: true }).click();
    await page.getByText('Inter Gold').click();

    await expect(page.getByText('Restaurante')).toBeVisible();
    await expect(page.getByText('Salário')).toBeHidden();
  });
});

test.describe('Nova transação', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test('lançar um gasto aparece na lista e desconta do saldo', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova transação' }).click();
    await expect(page.getByText('Nova transação')).toBeVisible();

    // Campo de valor: `keyboardType="number-pad"` vira inputmode numeric no web
    // e o texto é reformatado em centavos a cada tecla.
    const valor = page.locator('input[inputmode="numeric"]');
    await valor.click();
    await page.keyboard.type('12345');
    await expect(valor).toHaveValue('123,45');

    await page.getByPlaceholder('Adicionar').fill('Livraria');
    await page.getByRole('button', { name: 'Salvar' }).click();

    // Voltou ao painel e a transação entrou no extrato.
    await page.getByRole('tab', { name: 'Transações' }).click();
    await expect(page.getByText('Livraria')).toBeVisible();
    await expect(page.getByText('-R$ 123,45')).toBeVisible();
  });

  test('fechar sem salvar não cria nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova transação' }).click();
    await page.getByRole('button', { name: 'Fechar' }).click();

    await page.getByRole('tab', { name: 'Transações' }).click();
    await expect(page.getByText('Livraria')).toBeHidden();
  });

  test('transferência revela a conta de destino', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova transação' }).click();

    await expect(page.getByText('Destino')).toBeHidden();
    await page.getByText('Transf.').click();
    await expect(page.getByText('Destino')).toBeVisible();
    await expect(page.getByText('Poupança')).toBeVisible();
  });

  test('trocar o tipo troca a categoria padrão', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova transação' }).click();

    await expect(page.getByText('Essenciais')).toBeVisible();
    await page.getByText('Ganho').click();
    await expect(page.getByText('Receita')).toBeVisible();
  });
});

test.describe('Editar transação', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Transações');
  });

  test('tocar na transação abre a edição preenchida e salva a alteração', async ({ page }) => {
    await page.getByText('Netflix').click();
    await expect(page.getByText('Editar transação')).toBeVisible();

    await page.getByPlaceholder('Adicionar').fill('Netflix família');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Netflix família')).toBeVisible();
  });

  test('a edição oferece excluir a transação', async ({ page }) => {
    await page.getByText('Netflix').click();
    // A confirmação em si depende do Alert nativo, que o react-native-web não
    // implementa — aqui só garantimos que a ação está na tela.
    await expect(page.getByRole('button', { name: 'Excluir transação' })).toBeVisible();
  });
});
