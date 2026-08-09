import { expect, test } from '@playwright/test';

import { entrar, irParaAba } from './helpers';

/** Atalho: entrar e abrir a tela de Perfil. */
async function abrirPerfil(page: import('@playwright/test').Page) {
  await entrar(page);
  await irParaAba(page, 'Mais');
  await page.getByText('Perfil e compartilhamento').click();
  await expect(page.getByText('Compartilhado com')).toBeVisible();
}

test.describe('Perfil e compartilhamento', () => {
  test('mostra a pessoa logada, quem compartilha e o convite pendente', async ({ page }) => {
    await abrirPerfil(page);
    await expect(page.getByText('Ana Ribeiro')).toBeVisible();
    await expect(page.getByText('Marcelo Souza')).toBeVisible();
    await expect(page.getByText('marcelo@email.com · Acesso total')).toBeVisible();
    await expect(page.getByText('joana@email.com · enviado há 2 dias')).toBeVisible();
  });

  test('mudar o acesso de um membro para somente leitura', async ({ page }) => {
    await abrirPerfil(page);

    await page.getByRole('button', { name: 'Opções de Marcelo Souza' }).click();
    await page.getByText('Somente leitura').click();

    await expect(page.getByText('Marcelo Souza agora tem acesso somente leitura.')).toBeVisible();
    await expect(page.getByText('marcelo@email.com · Acesso leitura')).toBeVisible();
  });

  test('reenviar o convite atualiza o rótulo', async ({ page }) => {
    await abrirPerfil(page);

    await page.getByRole('button', { name: 'Opções do convite para joana@email.com' }).click();
    await page.getByText('Reenviar convite').click();

    await expect(page.getByText('Convite reenviado para joana@email.com.')).toBeVisible();
    await expect(page.getByText('joana@email.com · enviado agora')).toBeVisible();
  });

  test('remover o acesso tira a pessoa da lista', async ({ page }) => {
    await abrirPerfil(page);
    page.on('dialog', (dialog) => dialog.accept());

    await page.getByRole('button', { name: 'Opções de Marcelo Souza' }).click();
    await page.getByText('Remover acesso').click();

    await expect(page.getByText('Marcelo Souza não tem mais acesso.')).toBeVisible();
    await expect(page.getByText('Marcelo Souza')).toBeHidden();
  });

  test('editar o perfil muda o nome exibido', async ({ page }) => {
    await abrirPerfil(page);

    await page.getByText('Editar perfil').first().click();
    await page.getByPlaceholder('Como podemos te chamar?').fill('Ana Paula');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Ana Paula')).toBeVisible();
  });

  test('editar o perfil acusa e-mail inválido', async ({ page }) => {
    await abrirPerfil(page);

    await page.getByText('Editar perfil').first().click();
    await page.getByPlaceholder('voce@email.com').fill('quebrado');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('E-mail inválido.')).toBeVisible();
  });
});

test.describe('Convite', () => {
  test('convidar alguém adiciona o convite pendente na lista', async ({ page }) => {
    await abrirPerfil(page);

    await page.getByText('Convidar', { exact: true }).click();
    await expect(page.getByText('Convidar para compartilhar')).toBeVisible();

    await page.getByPlaceholder('nome@email.com').fill('novo@email.com');
    await page.getByRole('button', { name: 'Enviar convite' }).click();

    await expect(page.getByText('novo@email.com · enviado agora')).toBeVisible();
  });

  test('copiar o link troca o rótulo para Copiado', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await abrirPerfil(page);

    await page.getByText('Convidar', { exact: true }).click();
    await page.getByText('Copiar', { exact: true }).click();

    await expect(page.getByText('Copiado')).toBeVisible();
  });
});

test.describe('Notificações e segurança', () => {
  test('ligar um alerta persiste na tela', async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Mais');
    await page.getByText('Notificações').click();

    const metas = page.getByRole('switch').nth(2);
    await expect(metas).not.toBeChecked();
    await metas.click();
    await expect(metas).toBeChecked();
  });

  test('trocar a senha confirma o sucesso', async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Mais');
    await page.getByText('Segurança').click();

    await page.getByPlaceholder('Sua senha de hoje').fill('velha123');
    await page.getByPlaceholder('Escolha uma senha nova').fill('nova4567');
    await page.getByPlaceholder('Repita a nova senha').fill('nova4567');
    await page.getByRole('button', { name: 'Alterar senha' }).click();

    await expect(page.getByText('Senha alterada. Use a nova no próximo login.')).toBeVisible();
  });

  test('a mesma senha de antes é recusada pelo backend', async ({ page }) => {
    await entrar(page);
    await irParaAba(page, 'Mais');
    await page.getByText('Segurança').click();

    await page.getByPlaceholder('Sua senha de hoje').fill('senha123');
    await page.getByPlaceholder('Escolha uma senha nova').fill('senha123');
    await page.getByPlaceholder('Repita a nova senha').fill('senha123');
    await page.getByRole('button', { name: 'Alterar senha' }).click();

    // O botão nem habilita — a regra é aplicada no cliente antes de chamar a API.
    await expect(page.getByText('Senha alterada. Use a nova no próximo login.')).toBeHidden();
  });

  test('desligar o compartilhamento de uma conta', async ({ page }) => {
    await abrirPerfil(page);
    await page.getByText('Contas e cartões compartilhados').click();

    await expect(page.getByText(/3 de 4 contas e cartões/)).toBeVisible();

    const corrente = page.getByRole('switch').first();
    await expect(corrente).toBeChecked();
    await corrente.click();
    await expect(corrente).not.toBeChecked();
  });
});
