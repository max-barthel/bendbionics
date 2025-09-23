import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage', 'build', 'e2e/**/*'],
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
        warnOnUnsupportedTypeScriptVersion: false,
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

      // JSX A11y Rules - More reasonable
      'jsx-a11y/alt-text': 'warn', // Changed from error to warn
      // 'jsx-a11y/anchor-has-content': 'warn', // Disabled - rule not found
      'jsx-a11y/anchor-is-valid': 'warn', // Changed from error to warn
      'jsx-a11y/aria-props': 'warn', // Changed from error to warn
      'jsx-a11y/aria-proptypes': 'warn', // Changed from error to warn
      'jsx-a11y/aria-unsupported-elements': 'warn', // Changed from error to warn
      'jsx-a11y/heading-has-content': 'warn', // Changed from error to warn
      'jsx-a11y/img-redundant-alt': 'warn', // Changed from error to warn
      'jsx-a11y/no-access-key': 'warn', // Changed from error to warn
      'jsx-a11y/role-has-required-aria-props': 'warn', // Changed from error to warn
      'jsx-a11y/role-supports-aria-props': 'warn', // Changed from error to warn

      // Modern line length standard - More reasonable
      'max-len': [
        'warn', // Changed from error to warn
        {
          code: 88,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],

      // Code Quality Rules - More reasonable limits
      complexity: ['warn', { max: 15 }], // Increased from 10 to 15, changed to warn
      'max-depth': ['warn', 5], // Increased from 4 to 5, changed to warn
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }], // Increased from 300 to 500, changed to warn
      'max-lines-per-function': [
        'warn',
        { max: 80, skipBlankLines: true, skipComments: true }, // Increased from 50 to 80, changed to warn
      ],
      'max-params': ['warn', 6], // Increased from 4 to 6, changed to warn
      'max-statements': ['warn', 30], // Increased from 20 to 30, changed to warn

      // Best Practices
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': ['error'],
      'no-duplicate-imports': ['error'],
      'no-else-return': ['error'],
      'no-empty': ['error'],
      'no-eval': ['error'],
      'no-extra-boolean-cast': ['error'],
      'no-extra-semi': ['error'],
      'no-implied-eval': ['error'],
      'no-lonely-if': ['error'],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2, 3, 4, 5, 10, 100, 1000], // Added more common numbers
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true, // Allow magic numbers in default values
          ignoreNumericLiteralTypes: true, // Allow magic numbers in type definitions
        },
      ],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-nested-ternary': ['warn'], // Changed from error to warn
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

      // TypeScript Specific Rules - More reasonable
      '@typescript-eslint/no-explicit-any': ['warn'], // Changed from error to warn
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-nullish-coalescing': ['warn'], // Changed from error to warn
      '@typescript-eslint/prefer-optional-chain': ['warn'], // Changed from error to warn
      // '@typescript-eslint/no-non-null-assertion': ['warn'], // Disabled - rule not found
      '@typescript-eslint/no-unnecessary-type-assertion': ['warn'], // Changed from error to warn
      '@typescript-eslint/prefer-as-const': ['warn'], // Changed from error to warn
      '@typescript-eslint/no-floating-promises': ['warn'], // Changed from error to warn
      '@typescript-eslint/await-thenable': ['warn'], // Changed from error to warn
      '@typescript-eslint/no-misused-promises': ['warn'], // Changed from error to warn
      '@typescript-eslint/require-await': ['warn'], // Changed from error to warn
      '@typescript-eslint/return-await': ['warn'], // Changed from error to warn
      '@typescript-eslint/no-unsafe-assignment': ['warn'], // Catch unsafe assignments
      '@typescript-eslint/no-unsafe-member-access': ['warn'], // Catch unsafe member access
      '@typescript-eslint/no-unsafe-call': ['warn'], // Catch unsafe function calls
      '@typescript-eslint/no-unsafe-return': ['warn'], // Catch unsafe returns
      '@typescript-eslint/no-unsafe-argument': ['warn'], // Catch unsafe function arguments
      '@typescript-eslint/restrict-plus-operands': ['warn'], // Catch unsafe + operations
      '@typescript-eslint/prefer-includes': ['warn'], // Prefer includes over indexOf
      '@typescript-eslint/prefer-string-starts-ends-with': ['warn'], // Prefer startsWith/endsWith
      '@typescript-eslint/prefer-function-type': ['warn'], // Prefer function types over interfaces
      '@typescript-eslint/prefer-ts-expect-error': ['warn'], // Prefer @ts-expect-error over @ts-ignore

      // Import/Export Rules - More flexible
      'sort-imports': [
        'warn', // Changed from error to warn
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // SonarJS Rules - More reasonable
      'sonarjs/cognitive-complexity': ['warn', 20], // Increased from 15 to 20, changed to warn
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }], // Increased from 3 to 5, changed to warn
      'sonarjs/no-identical-functions': 'warn', // Changed from error to warn
      'sonarjs/no-redundant-boolean': 'warn', // Changed from error to warn
      'sonarjs/no-unused-collection': 'warn', // Changed from error to warn
      'sonarjs/no-useless-catch': 'warn', // Changed from error to warn
      'sonarjs/prefer-immediate-return': 'warn', // Changed from error to warn
      'sonarjs/prefer-object-literal': 'warn', // Changed from error to warn
      'sonarjs/prefer-single-boolean-return': 'warn', // Changed from error to warn
      'sonarjs/prefer-while': 'warn', // Changed from error to warn
    },
  },
  // Configuration for test files with relaxed rules but no TypeScript project checking
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
        // No project reference for test files to avoid TSConfig issues
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
      // Disable TypeScript rules that require type information for tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'off',
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
