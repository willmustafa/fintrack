import { expect, test, type Page } from '@playwright/test';

import { entrar, irParaAba } from './helpers';

/**
 * As telas anteriores continuam montadas atrás da que está no ar (o Stack fica
 * sobre as abas), então os seletores aqui são exatos e, quando o texto se
 * repete, valem pela última ocorrência — a da tela visível.
 */
async function abrirAcertos(page: Page) {
  await entrar(page);
  await irParaAba(page, 'Mais');
  await page.getByText('Acertos', { exact: true }).click();
  await expect(page.getByText('Te devem')).toBeVisible();
}

test.describe('Acertos', () => {
  test('mostra quem deve, quanto e para que lado', async ({ page }) => {
    await abrirAcertos(page);

    await expect(page.getByText('R$ 104,20', { exact: true })).toBeVisible();
    await expect(page.getByText('R$ 145,00', { exact: true })).toBeVisible();
    await expect(page.getByText('João Pedro', { exact: true })).toBeVisible();
    await expect(page.getByText('Camila', { exact: true })).toBeVisible();
    // João deve R$ 52,10 do mercado e tem R$ 45 do Uber a receber: sobram R$ 7,10.
    await expect(page.getByText('R$ 7,10', { exact: true })).toBeVisible();
  });

  test('o detalhe da pessoa lista as divisões e o histórico', async ({ page }) => {
    await abrirAcertos(page);
    await page.getByText('Camila', { exact: true }).click();

    await expect(page.getByText('EM ABERTO', { exact: true })).toBeVisible();
    await expect(page.getByText('Mercado', { exact: true })).toBeVisible();
    await expect(page.getByText('ACERTADOS', { exact: true })).toBeVisible();
    await expect(page.getByText('Rodízio de aniversário', { exact: true })).toBeVisible();
  });

  test('receber de alguém vira lançamento e some das pendências', async ({ page }) => {
    await abrirAcertos(page);
    await page.getByText('Camila', { exact: true }).click();

    await page.getByRole('checkbox', { name: 'Mercado' }).click();
    await page.getByRole('button', { name: 'Registrar acerto de R$ 52,10' }).click();

    await expect(page.getByText('Camila te paga')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar acerto' }).click();

    // Voltou para o detalhe: nada em aberto e o acerto no histórico.
    await expect(page.getByText('Nada em aberto com Camila.')).toBeVisible();

    await expect(page.getByText('ACERTADOS', { exact: true })).toBeVisible();

    // O recebimento entrou no extrato: volta o detalhe e a lista até as abas.
    await page.getByLabel('Voltar').last().click();
    await page.getByLabel('Voltar').last().click();
    await irParaAba(page, 'Transações');
    await expect(page.getByText('Acerto · Camila').last()).toBeVisible();
  });

  test('registrar uma dívida avulsa aparece na lista da pessoa', async ({ page }) => {
    await abrirAcertos(page);
    await page.getByRole('button', { name: 'Nova divisão' }).click();
    await expect(page.getByText('Nova divisão', { exact: true }).last()).toBeVisible();

    await page.getByText('Eu devo', { exact: true }).last().click();
    // `fill` manda o texto de uma vez e a máscara de centavos formata.
    await page.locator('input[inputmode="numeric"]').last().fill('3000');
    await page.getByPlaceholder('Ex.: jantar de sexta').fill('Cerveja');
    await page.getByLabel('Salvar').click();

    // A lista de Acertos é a tela de baixo na pilha; o modal fechado fica atrás.
    await page.getByText('João Pedro', { exact: true }).first().click();
    await expect(page.getByText('Cerveja', { exact: true })).toBeVisible();
  });

  test('cadastrar uma pessoa nova pela lista de pessoas', async ({ page }) => {
    await abrirAcertos(page);
    await page.getByRole('button', { name: 'Pessoas' }).click();

    await page.getByPlaceholder('Nome de quem divide contas com você').fill('Bruna');
    await page.getByRole('button', { name: 'Adicionar' }).click();

    await expect(page.getByText('Bruna', { exact: true })).toBeVisible();
  });
});

test.describe('Dividir um gasto', () => {
  test('rachar a conta cria a dívida de quem entrou', async ({ page }) => {
    await entrar(page);
    await page.getByRole('button', { name: 'Nova transação' }).click();
    await expect(page.getByText('Dividir com alguém')).toBeVisible();

    await page.locator('input[inputmode="numeric"]').fill('9000');
    await page.getByPlaceholder('Adicionar').fill('Churrasco');

    await page.getByLabel('Dividir com alguém').click();
    await page.getByRole('checkbox', { name: 'Camila' }).click();
    await expect(page.getByText('Sua parte: R$ 45,00 · a receber: R$ 45,00')).toBeVisible();

    await page.getByLabel('Salvar').click();

    await irParaAba(page, 'Mais');
    await page.getByText('Acertos', { exact: true }).click();
    await page.getByText('Camila', { exact: true }).click();
    await expect(page.getByText('Churrasco', { exact: true })).toBeVisible();
  });
});
