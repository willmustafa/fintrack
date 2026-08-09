import { expect, test } from '@playwright/test';

import { abrirApp, entrar } from './helpers';

test.describe('Autenticação', () => {
  test('o app abre no login', async ({ page }) => {
    await abrirApp(page);
    await expect(page.getByText('Contas, cartões, metas e investimentos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('entrar leva ao painel com o saldo consolidado', async ({ page }) => {
    await entrar(page);
    await expect(page.getByText('Ana!')).toBeVisible();
    await expect(page.getByText('R$ 4.050,00')).toBeVisible();
    await expect(page.getByText('Saldo consolidado · 2 contas')).toBeVisible();
  });

  test('o painel só aparece depois do login', async ({ page }) => {
    await abrirApp(page);
    await expect(page.getByText('Bom dia,')).toBeHidden();
  });

  test('criar conta valida senha fraca e e-mail inválido', async ({ page }) => {
    await abrirApp(page);
    await page.getByText('Criar conta').click();

    await expect(page.getByText('Pelo menos 8 caracteres')).toBeVisible();

    await page.getByPlaceholder('Como podemos te chamar?').fill('Joana Silva');
    await page.getByPlaceholder('voce@email.com').fill('nao-e-email');
    await page.getByPlaceholder('Crie uma senha').fill('abc');
    await page.getByPlaceholder('Repita a senha').fill('abc');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.getByText('E-mail inválido.')).toBeVisible();
    // Continua no cadastro — nada foi enviado.
    await expect(page.getByPlaceholder('Crie uma senha')).toBeVisible();
  });

  test('criar conta avisa quando as senhas não conferem', async ({ page }) => {
    await abrirApp(page);
    await page.getByText('Criar conta').click();

    await page.getByPlaceholder('Crie uma senha').fill('senha123');
    await page.getByPlaceholder('Repita a senha').fill('outra456');

    await expect(page.getByText('As senhas não conferem.')).toBeVisible();
  });

  test('cadastro completo entra no app', async ({ page }) => {
    await abrirApp(page);
    await page.getByText('Criar conta').click();

    await page.getByPlaceholder('Como podemos te chamar?').fill('Joana Silva');
    await page.getByPlaceholder('voce@email.com').fill('joana@email.com');
    await page.getByPlaceholder('Crie uma senha').fill('senha123');
    await page.getByPlaceholder('Repita a senha').fill('senha123');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.getByText('Joana!')).toBeVisible();
  });

  test('o olho revela a senha digitada', async ({ page }) => {
    await abrirApp(page);
    await page.getByText('Criar conta').click();

    const senha = page.getByPlaceholder('Crie uma senha');
    await senha.fill('senha123');
    await expect(senha).toHaveAttribute('type', 'password');

    // Há dois campos de senha na tela; o primeiro olho é o do campo "Senha".
    await page.getByRole('button', { name: 'Mostrar senha' }).first().click();
    await expect(senha).not.toHaveAttribute('type', 'password');
  });

  test('sair da conta volta para o login', async ({ page }) => {
    await entrar(page);
    await page.getByRole('tab', { name: 'Mais' }).click();

    // O Alert.alert do RN vira window.confirm no web.
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByText('Sair da conta').click();

    await expect(page.getByText('Controle total')).toBeVisible();
  });
});
