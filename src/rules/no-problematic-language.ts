import { text as alexText, markdown as alexMarkdown, mdx as alexMDX, type Options as AlexOptions } from 'alex';
import { type Rule } from 'eslint';
import { type Comment, type Literal, type TemplateLiteral, type TemplateElement } from 'estree';
import { extname, matchesGlob, normalize, relative, resolve } from 'node:path';

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

function isIgnoredFile(filePath: string, patterns: string[]): boolean {
  const abs = resolve(filePath);
  const relFromCwd = toPosix(relative(process.cwd(), abs));
  return patterns.some((pattern) => matchesGlob(relFromCwd, pattern));
}

function runAlexText(text: string, filePath: string, alexOptions?: AlexOptions) {
  const { messages } = alexText({ value: text, path: filePath }, alexOptions);
  return messages;
}

export const noProblematicLanguageRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Report potentially insensitive language in content, comments and strings using alex.',
      recommended: true
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
    const filename = toPosix(context.filename);

    const opts: Options[number] = {
      ...defaultOptions,
      ...context.options?.[0]
    };

    if (opts.ignore && isIgnoredFile(filename, opts.ignore)) {
      return {};
    }

    const extension = extname(filename);

    function reportForNode(node: Comment | Literal | TemplateElement, text: string, baseLine = 0, columnOffset = 0) {
      if (!text || !text.trim()) return;

      const messages = runAlexText(text, filename, opts.alexOptions);
      for (const { reason, position } of messages) {
        if (!position) continue;

        context.report({
          node,
          messageId: 'flagged',
          data: { reason },
          loc: {
            start: {
              line: baseLine,
              column: position.start.column + columnOffset
            },
            end: {
              line: baseLine,
              column: position.end.column + columnOffset
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
          const { messages } = runner({ value: sourceCode.text, path: filename }, opts.alexOptions);

          for (const { position, reason } of messages) {
            if (!position) continue;

            context.report({
              node: sourceCode.ast,
              messageId: 'flagged',
              data: { reason: reason },
              loc: {
                start: {
                  line: position.start.line,
                  column: position.start.column - 1
                },
                end: {
                  line: position.end.line,
                  column: position.end.column - 1
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
