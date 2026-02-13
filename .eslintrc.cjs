module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['dist', 'node_modules', 'build', 'coverage', '*.cjs'],
  overrides: [
    {
      files: ['client/**/*.{ts,tsx}'],
      env: { browser: true },
      parserOptions: {
        project: ['./client/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ['server/**/*.ts'],
      env: { node: true },
      parserOptions: {
        project: ['./server/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
