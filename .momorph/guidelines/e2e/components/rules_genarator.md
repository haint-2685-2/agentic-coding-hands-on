# Code Quality Rules Generator

You are a Playwright project expert specializing in setting up comprehensive code quality tools and
standards for TypeScript-based test automation projects.

## Your Mission

Generate and configure a complete code quality ecosystem including ESLint, Prettier, Husky, and
VSCode settings that work seamlessly together for Playwright TypeScript projects using Yarn package
manager.

## Core Configurations to Generate

### 1. TypeScript Configuration (`tsconfig.json`)

**Playwright TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "module": "commonjs",
    "target": "esnext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "outDir": "./dist",
    "rootDir": ".",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["@playwright/test", "node"]
  },
  "include": ["./**/*.ts"],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "playwright-report",
    "test-results",
    "**/*.js"
  ]
}
```

### 2. ESLint Configuration (`.eslintrc.json`)

**Modern TypeScript ESLint Rules:**

```json
{
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "curly": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    "playwright-report/",
    "test-results/",
    "*.config.js",
    "*.config.ts"
  ]
}
```

### 3. Prettier Configuration (`.prettierrc.json`)

**Modern Prettier Standards:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "quoteProps": "as-needed",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "embeddedLanguageFormatting": "auto",
  "proseWrap": "preserve",
  "insertPragma": false,
  "requirePragma": false,
  "overrides": [
    {
      "files": ["*.json", "*.jsonc"],
      "options": {
        "singleQuote": false
      }
    },
    {
      "files": ["*.md"],
      "options": {
        "proseWrap": "always",
        "printWidth": 100
      }
    }
  ]
}
```

### 4. Prettier Ignore (`.prettierignore`)

```
# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Playwright outputs
playwright-report/
test-results/
blob-report/
playwright.cache/

# Environment files
*.env
*.env.local
*.env.*.local

# Logs
*.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Generated files
*.tsbuildinfo

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
```

### 5. Updated package.json Scripts

**Add to existing package.json scripts section:**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --fix",
    "lint:check": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:staged": "lint-staged",
    "type-check": "tsc --noEmit",
    "quality:check": "yarn lint:check && yarn format:check && yarn type-check",
    "quality:fix": "yarn lint && yarn format",
    "prepare": "husky install",
    "pre-commit": "lint-staged"
  }
}
```

### 6. DevDependencies for package.json

**Add these to devDependencies:**

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.57.0",
    "eslint-plugin-playwright": "^0.22.2",
    "prettier": "^3.2.5",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2"
  }
}
```

### 7. Husky Configuration

**Create `.husky/pre-commit` file:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

yarn lint:check && yarn format:staged
```

**Create `.husky/pre-push` file:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

yarn type-check
```

### 8. Lint-staged Configuration

**Add to package.json:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### 9. VSCode Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.workingDirectories": ["."],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true,
    "**/playwright-report": true,
    "**/test-results": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true,
    "**/playwright-report": true,
    "**/test-results": true
  }
}
```

### 10. VSCode Extensions Recommendations (`.vscode/extensions.json`)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Installation and Setup Commands

### Step 1: Install Dependencies

```bash
yarn add -D @typescript-eslint/eslint-plugin@^6.21.0 @typescript-eslint/parser@^6.21.0 eslint@^8.57.0 eslint-plugin-playwright@^0.22.2 prettier@^3.2.5 husky@^9.0.11 lint-staged@^15.2.2
```

### Step 2: Initialize Husky

```bash
yarn husky install
```

### Step 3: Create Husky Hooks

```bash
yarn husky add .husky/pre-commit "yarn lint:check && yarn format:staged"
yarn husky add .husky/pre-push "yarn type-check"
```

### Step 4: Make Hooks Executable

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Step 5: Verify Setup

```bash
yarn quality:check
```

## Quality Validation

### Automated Checks

1. **ESLint Validation**

   ```bash
   yarn lint:check
   ```

2. **Prettier Validation**

   ```bash
   yarn format:check
   ```

3. **TypeScript Validation**

   ```bash
   yarn type-check
   ```

4. **Combined Quality Check**
   ```bash
   yarn quality:check
   ```

### Pre-commit Workflow

1. Developer commits code
2. Husky triggers pre-commit hook
3. Lint-staged runs on staged files:
   - ESLint fixes TypeScript issues
   - Prettier formats code
4. If all checks pass, commit proceeds
5. If checks fail, commit is blocked

### Success Criteria

- ✅ All ESLint rules passing without errors
- ✅ Code formatted according to Prettier standards
- ✅ TypeScript compilation successful
- ✅ Husky hooks working correctly
- ✅ VSCode auto-formatting on save enabled
- ✅ Pre-commit quality gates functioning
- ✅ No manual formatting needed in development

## Integration with Playwright Project

### Playwright-Specific Rules Applied

1. **Test Structure Enforcement**
   - `playwright/max-nested-describe`: Prevents deeply nested test structures
   - `playwright/no-conditional-in-test`: Ensures deterministic tests
   - `playwright/no-focused-test`: Prevents committed focused tests

2. **Best Practices Enforcement**
   - `playwright/prefer-web-first-assertions`: Modern assertion patterns
   - `playwright/no-wait-for-timeout`: Encourages stable waiting strategies
   - `playwright/no-raw-locators`: Promotes page object model usage

3. **Code Quality Standards**
   - Async/await pattern enforcement
   - TypeScript strict mode compliance
   - Consistent naming conventions
   - Import organization and optimization

## File Generation Order

1. Create/Update `tsconfig.json`
2. Create `.eslintrc.json`
3. Create `.prettierrc.json`
4. Create `.prettierignore`
5. Update `package.json` (scripts and dependencies)
6. Create `.vscode/settings.json`
7. Create `.vscode/extensions.json`
8. Install dependencies with Yarn
9. Initialize Husky
10. Create Husky hooks
11. Run initial quality check

## Troubleshooting

### Common Issues and Solutions

1. **ESLint TypeScript Project Errors**
   - Ensure `tsconfig.json` exists and is properly configured
   - Verify `parserOptions.project` path in `.eslintrc.json`

2. **Husky Hooks Not Running**
   - Check file permissions: `chmod +x .husky/*`
   - Verify Git hooks are enabled: `git config core.hooksPath .husky`

3. **Prettier vs ESLint Conflicts**
   - Both tools are configured to work together
   - Prettier handles formatting, ESLint handles code quality
   - Run `yarn format` before `yarn lint` if conflicts arise

4. **VSCode Not Auto-formatting**
   - Install recommended extensions
   - Reload VSCode window
   - Check that `.vscode/settings.json` is properly configured

This configuration provides a battle-tested, production-ready code quality setup for Playwright
TypeScript projects, requiring zero additional configuration after setup.
