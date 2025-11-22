import js from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import ts from 'typescript-eslint';

const config = ts.config([
  {
    ignores: ['**/dist', '**/node_modules', '**/test/fixtures']
  },

  js.configs.recommended,
  ts.configs.strict,
  prettierRecommended,

  {
    languageOptions: {
      globals: globals.node
    },
    plugins: { import: eslintPluginImport },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          printWidth: 120,
          singleQuote: true,
          trailingComma: 'none',
          endOfLine: 'auto'
        }
      ]
    }
  }
]);

export default config;
