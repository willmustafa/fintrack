import { expect, type Page } from '@playwright/test';

/**
 * O bundle web é o mesmo do app: `react-native-web` traduz `accessibilityRole`
 * e `accessibilityLabel` para `role`/`aria-label`, então os seletores aqui são
 * os mesmos conceitos usados nos testes de unidade.
 */

/** Abre o app e espera o login pintar. */
export async function abrirApp(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Controle total')).toBeVisible();
}

/** Login com a conta de exemplo (o formulário já vem preenchido). */
export async function entrar(page: Page) {
  await abrirApp(page);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Bom dia,')).toBeVisible();
}

/** Navega por uma aba da barra inferior. */
export async function irParaAba(page: Page, label: string) {
  await page.getByRole('tab', { name: label }).click();
}
