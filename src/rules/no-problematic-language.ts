import { text as alexText, markdown as alexMarkdown, mdx as alexMDX, Options as AlexOptions } from 'alex';
import type { Rule } from 'eslint';
import type { Comment, Literal, TemplateLiteral, TemplateElement } from 'estree';
import { extname, normalize, relative, resolve } from 'node:path';
import micromatch from 'micromatch';

type Options = [
  {
    comments?: boolean;
    strings?: boolean;
    templates?: boolean;
    ignore?: string[];
    alexOptions?: AlexOptions;
  }
];

const defaultOptions: Options[number] = {
  comments: true,
  strings: true,
  templates: true
};

function toPosix(path: string): string {
  return normalize(path).replaceAll('\\\\', '/').replaceAll('\\', '/');
}

function isIgnoredFile(filePath: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;

  const abs = resolve(filePath);
  const absPosix = toPosix(abs);
  const relFromCwd = toPosix(relative(process.cwd(), abs));
  const candidates = [absPosix, relFromCwd, relFromCwd.replace(/^\.\//, '')];

  return candidates.some((candidate) =>
    micromatch.isMatch(candidate, patterns, {
      dot: true
    })
  );
}

function runAlexText(text: string, filePath: string, alexOptions?: AlexOptions) {
  const result = alexText({ value: text, path: filePath }, alexOptions);
  return result.messages;
}

export const noProblematicLanguageRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Report potentially insensitive language in content, comments and strings using alex.',
      recommended: false
    },
    schema: [
      {
        type: 'object',
        properties: {
          comments: { type: 'boolean' },
          strings: { type: 'boolean' },
          templates: { type: 'boolean' },
          ignore: {
            type: 'array',
            items: { type: 'string' }
          },
          alexOptions: { type: 'object', additionalProperties: true }
        },
        additionalProperties: false
      }
    ],
    messages: {
      flagged: '{{reason}}'
    }
  },

  create(context) {
    const filename = normalize(context.filename).replaceAll('\\\\', '/').replaceAll('\\', '/');
    const extension = extname(filename);

    const opts: Options[0] = {
      ...defaultOptions,
      ...(context.options?.[0] ?? {})
    };

    if (isIgnoredFile(filename, opts.ignore)) {
      return {};
    }

    function reportForNode(node: Comment | Literal | TemplateElement, text: string, baseLine = 0, columnOffset = 0) {
      if (!text || !text.trim()) return;

      const messages = runAlexText(text, filename, opts.alexOptions);
      for (const message of messages) {
        if (!message.position) continue;

        context.report({
          node,
          messageId: 'flagged',
          data: { reason: message.reason },
          loc: {
            start: {
              line: baseLine,
              column: message.position.start.column + columnOffset
            },
            end: {
              line: baseLine,
              column: message.position.end.column + columnOffset
            }
          }
        });
      }
    }

    return {
      Program() {
        if (['.md', '.mdx'].includes(extension)) {
          const sourceCode = context.sourceCode;
          const runner = extension === '.md' ? alexMarkdown : alexMDX;
          const result = runner({ value: sourceCode.text, path: filename }, opts.alexOptions);

          for (const message of result.messages) {
            if (!message.position) continue;

            context.report({
              node: sourceCode.ast,
              messageId: 'flagged',
              data: { reason: message.reason },

              loc: {
                start: {
                  line: message.position.start.line,
                  column: message.position.start.column - 1
                },
                end: {
                  line: message.position.end.line,
                  column: message.position.end.column - 1
                }
              }
            });
          }

          return;
        }

        if (!opts.comments) return;
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (!comment.loc) continue;

          const baseLine = comment.loc.start.line;
          const columnOffset = comment.loc.start.column;

          reportForNode(comment, comment.value, baseLine, columnOffset);
        }
      },

      Literal(node: Literal) {
        if (!opts.strings) return;
        if (!node.loc) return;
        if (typeof node.value !== 'string') return;

        const baseLine = node.loc.start.line;
        const columnOffset = node.loc.start.column;

        reportForNode(node, String(node.value), baseLine, columnOffset);
      },

      TemplateLiteral(node: TemplateLiteral) {
        if (!opts.templates) return;

        for (const quasi of node.quasis) {
          if (!quasi.loc) continue;

          const text = quasi.value.cooked ?? quasi.value.raw;

          if (!text) continue;

          const baseLine = quasi.loc.start.line;
          const columnOffset = quasi.loc.start.column;

          reportForNode(quasi, text, baseLine, columnOffset);
        }
      }
    };
  }
};
