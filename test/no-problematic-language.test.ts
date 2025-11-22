import { RuleTester } from 'eslint';
import * as eslintMdx from 'eslint-mdx';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { rules } from '../src';

function readFixture(filename: string) {
  const fullPath = join(__dirname, 'fixtures', filename);
  return {
    code: readFileSync(fullPath, 'utf8'),
    filename: fullPath
  };
}

describe('alex/no-problematic-language', () => {
  it('flags problematic words in comments and strings in code files', () => {
    const codeTester = new RuleTester({
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      rules: {}
    });

    codeTester.run('no-problematic-language', rules['no-problematic-language'], {
      valid: [readFixture('valid.ts')],
      invalid: [
        {
          ...readFixture('invalid.ts'),
          errors: [
            { messageId: 'flagged', line: 1, column: 3, endColumn: 9 },
            { messageId: 'flagged', line: 2, column: 14, endColumn: 18 },
            { messageId: 'flagged', line: 4, column: 13, endColumn: 19 }
          ]
        }
      ]
    });

    expect(true).toBe(true);
  });

  it('flags problematic words in comments and strings in MD(X) files', () => {
    const mdxTester = new RuleTester({
      files: ['**/*.{md,mdx}'],
      languageOptions: {
        parser: eslintMdx
      }
    });

    mdxTester.run('no-problematic-language', rules['no-problematic-language'], {
      valid: [readFixture('valid.mdx')],
      invalid: [
        {
          ...readFixture('invalid.mdx'),
          errors: [
            { messageId: 'flagged', line: 1, column: 3, endColumn: 9 },
            { messageId: 'flagged', line: 3, column: 1, endColumn: 5 },
            { messageId: 'flagged', line: 5, column: 12, endColumn: 14 }
          ]
        }
      ]
    });

    expect(true).toBe(true);
  });
});
