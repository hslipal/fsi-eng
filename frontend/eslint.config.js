// GUARDRAIL: ESLint flat config.
// Rule philosophy: every rule here targets a failure mode we have actually seen
// in AI-generated code. Errors only — warnings are ignored by humans and agents alike.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'],
  },
  {
    linterOptions: {
      // Stale `eslint-disable` comments are a smell — fail on them.
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  comments.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      // ── Type-system escape hatches: closed ───────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true, 'ts-nocheck': true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowString: false, allowNumber: false, allowNullableObject: true },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',

      // ── Async correctness (agents forget `await` constantly) ─────────────
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],

      // ── Suppression discipline ───────────────────────────────────────────
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/no-restricted-disable': [
        'error',
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/consistent-type-assertions',
        '@typescript-eslint/no-non-null-assertion',
        'no-restricted-imports',
        'no-restricted-syntax',
      ],

      // ── Size & complexity: keep generated units reviewable ───────────────
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],

      // ── Hygiene ──────────────────────────────────────────────────────────
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-param-reassign': 'error',
      'prefer-const': 'error',

      // ── Dependency rules: banned libraries / patterns ────────────────────
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: 'Use shared/api/httpClient (fetch + zod) instead.' },
            {
              name: 'lodash',
              message: 'Use native ES APIs or import a single lodash-es function.',
            },
            { name: 'moment', message: 'Use Intl / Temporal / date-fns.' },
            { name: 'react', importNames: ['default'], message: 'Use named imports from react.' },
            {
              name: 'openai',
              message: 'The frontend never calls a model. Call the backend via /api/assessment.',
            },
          ],
          patterns: [
            {
              group: ['@anthropic-ai/*', 'deepseek*', '@deepseek/*'],
              message: 'The frontend never calls a model. Call the backend via /api/assessment.',
            },
            {
              group: ['../../*'],
              message: 'Cross-module imports must use the @/ alias (e.g. @/shared/api/httpClient).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message: 'Raw fetch() is only allowed in src/shared/api/httpClient.ts.',
        },
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a union of string literals or an `as const` object instead of enum.',
        },
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: 'Wrap storage access in a typed module under src/shared/.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is forbidden (XSS).',
        },
      ],
    },
  },
  // ── Scoped exceptions (explicit, reviewed, minimal) ─────────────────────
  {
    files: ['src/shared/api/httpClient.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['*.config.ts', '*.config.js', '.dependency-cruiser.cjs', 'scripts/**'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },
);
