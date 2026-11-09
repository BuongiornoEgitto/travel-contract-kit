import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/** ESLint 9 flat config. `eslint-config-next` ships the flat arrays directly. */
const config = [
  { ignores: ['.next/**', 'coverage/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // A leading underscore marks a binding kept only to omit it from a rest
      // spread, which is how the contract snapshot drops `generatedAt`.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
];

export default config;
