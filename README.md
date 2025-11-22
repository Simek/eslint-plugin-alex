# eslint-plugin-alex

ESLint plugin that integrates [alex](https://github.com/get-alex/alex) to surface potentially insensitive wording found in markdown files, comments and strings.

## 📦 Install

```bash
bun install -D eslint-plugin-alex alex
```

> [!note]
> Supports `eslint` v8.56+ or v9+.

## 🧪 Usage

### Flat config (eslint.config.*)

```js
import eslintPluginAlex from 'eslint-plugin-alex';

export default [...eslintPluginAlex.flatConfigs.recommended];
```

### Legacy config (.eslintrc) ⚠️

```json
{
  "plugins": ["alex"],
  "rules": {
    "alex/no-problematic-language": "warn"
  }
}
```

To reuse preset:

```json
{
  "extends": ["plugin:alex/recommended"]
}
```

## 🔧 Configuration

### alex/no-problematic-language

- `comments` (boolean, default: `true`) - check comments.
- `strings` (boolean, default: `true`) - check string literals.
- `templates` (boolean, default: `true`) - check template literals.
- `ignore` (string[], default: `[]`) - a list of globs to ignore, you can reuse paths from `.alexignore`.
- `alexOptions` (object: [Options](https://github.com/get-alex/alex?tab=readme-ov-file#configuration)) - options forwarded to alex, default alex options are respected.

#### Example rule configuration (not default)

```json
{
  "alex/no-problematic-language": [
    "warn",
    {
      "comments": false,
      "ignore": [
        "LICENSE.md"
      ],
      "alexOptions": {
        "profanitySureness": 1
      }
    }
  ]
}
```

## 📝 Contributing

1. Make sure you have [Bun](https://bun.sh/docs/installation) installed.
1. Checkout the repository locally.
1. Run the following commands to install dependencies and compile source:

   ```sh
   bun install
   bun run build
   ```

1. Before commiting make sure that test are passing, and code is correctly formatted:

   ```sh
   bun run lint
   bun run test
   ```
