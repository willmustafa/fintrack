import { defineConfig, devices } from '@playwright/test';

/**
 * E2E do FinTrack sobre o build web (react-native-web).
 *
 * `npm run test:e2e` exporta o app para `dist/` e sobe o servidor de produção
 * do Expo — é o mesmo bundle que iria para o ar, sem emulador no caminho.
 */
const PORT = 8099;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'mobile-web',
      // O app é feito para telefone; o viewport acompanha.
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    command: `npx expo export --platform web --output-dir dist --clear && npx expo serve dist --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
