import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage', 'build'],
  },
  // Configuration for source files with type checking
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/__tests__/**/*',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      sonarjs,
    },
    rules: {
      // React Hooks Rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh Rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // JSX A11y Rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Modern line length standard
      'max-len': [
        'error',
        {
          code: 88,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],

      // Code Quality Rules
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],

      // Best Practices
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn'],
      'no-debugger': ['error'],
      'no-duplicate-imports': ['error'],
      'no-else-return': ['error'],
      'no-empty': ['error'],
      'no-eval': ['error'],
      'no-extra-boolean-cast': ['error'],
      'no-extra-semi': ['error'],
      'no-implied-eval': ['error'],
      'no-lonely-if': ['error'],
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1], ignoreArrayIndexes: true }],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-nested-ternary': ['error'],
      'no-return-assign': ['error'],
      'no-self-compare': ['error'],
      'no-sequences': ['error'],
      'no-throw-literal': ['error'],
      'no-unmodified-loop-condition': ['error'],
      'no-unused-expressions': ['error'],
      'no-useless-call': ['error'],
      'no-useless-concat': ['error'],
      'no-useless-return': ['error'],
      'no-var': ['error'],
      'prefer-const': ['error'],
      'prefer-template': ['error'],
      radix: ['error'],

      // TypeScript Specific Rules
      '@typescript-eslint/no-explicit-any': ['error'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-nullish-coalescing': ['error'],
      '@typescript-eslint/prefer-optional-chain': ['error'],
      '@typescript-eslint/no-non-null-assertion': ['error'],
      '@typescript-eslint/no-unnecessary-type-assertion': ['error'],
      '@typescript-eslint/prefer-as-const': ['error'],
      '@typescript-eslint/no-floating-promises': ['error'],
      '@typescript-eslint/await-thenable': ['error'],
      '@typescript-eslint/no-misused-promises': ['error'],
      '@typescript-eslint/require-await': ['error'],
      '@typescript-eslint/return-await': ['error'],

      // Import/Export Rules
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // SonarJS Rules
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/prefer-while': 'error',
    },
  },
  // Configuration for test files with relaxed rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  // Configuration for config files and other non-source files without type checking
  {
    files: [
      '*.config.{ts,js}',
      '*.config.*.{ts,js}',
      '.storybook/**/*.{ts,js}',
      'e2e/**/*.{ts,js}',
      'vitest.shims.d.ts',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-magic-numbers': 'off',
    },
  },
];
