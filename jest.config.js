/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: '<rootDir>/jest.environment.cjs',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Redirect AuthContext to the mock to avoid import.meta.env issues in tests
    '^(.*/)contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      diagnostics: {
        ignoreCodes: ['TS1343', 'TS2339', 'TS2305'],
      },
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'esnext',
        moduleResolution: 'node',
        target: 'es2020',
        types: ['jest', '@testing-library/jest-dom', 'node', 'vite/client'],
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
      },
    }],
  },
  injectGlobals: true,
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|recharts|react-router-dom|react-router)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}
