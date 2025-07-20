import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import {globalIgnores} from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config([
  globalIgnores(['dist', 'node_modules', '*.config.js', '*.config.ts', 'vite.config.ts', 'tailwind.config.mjs', 'postcss.config.mjs']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // We use TypeScript for prop validation
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-curly-spacing': ['error', 'never'],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'react/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
      'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
      'react/jsx-no-literals': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-pascal-case': 'error',
      'react/jsx-props-no-multi-spaces': 'error',
      'react/jsx-sort-props': 'off',
      'react/jsx-tag-spacing': ['error', { closingSlash: 'never', beforeSelfClosing: 'always', afterOpening: 'never' }],
      'react/jsx-wrap-multilines': ['error', { declaration: 'parens-new-line', assignment: 'parens-new-line', return: 'parens-new-line', arrow: 'parens-new-line', condition: 'parens-new-line', logical: 'parens-new-line', prop: 'parens-new-line' }],

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // TypeScript rules (override some GTS rules for React)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // Too verbose for React components
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too verbose for React components
      '@typescript-eslint/no-explicit-any': 'warn', // Allow but warn
      '@typescript-eslint/no-non-null-assertion': 'warn', // Allow but warn
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false, // Allow async event handlers
        },
      ],

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
    },
  },
  eslintConfigPrettier
]);
