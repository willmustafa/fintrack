/**
 * Jest do FinTrack.
 *
 * O preset `jest-expo` já cuida do transform de RN/Expo; aqui só apontamos o
 * alias `@/`, os mocks globais e as metas de cobertura.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Bottom-sheets usam `Modal` com animação real; o primeiro render de cada
  // suíte soma isso ao custo de carregar os módulos do RN.
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/data/seed.ts',
    '!src/types/**',
    '!src/theme/**',
  ],
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
