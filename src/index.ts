import type { Rule } from 'eslint';
import { noProblematicLanguageRule } from './rules/no-problematic-language';

export const rules: Record<string, Rule.RuleModule> = {
  'no-problematic-language': noProblematicLanguageRule
};

export const configs = {
  recommended: {
    plugins: ['alex'],
    rules: {
      'alex/no-problematic-language': ['warn']
    }
  }
};

export const flatConfigs = {
  recommended: [
    {
      name: 'eslint-plugin-alex/recommended',
      plugins: { alex: { rules } },
      rules: {
        'alex/no-problematic-language': ['warn']
      }
    }
  ]
};
