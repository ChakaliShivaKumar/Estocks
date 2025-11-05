# CI/CD Pipeline Guide

This document describes the Continuous Integration/Continuous Deployment pipeline setup for Estocks.

## 🔄 Pipeline Overview

Our CI/CD pipeline runs automatically on every push and pull request to the `main` and `development` branches. It ensures code quality, type safety, and buildability before code is merged.

## 📋 Pipeline Stages

### 1. **Type Checking**
- Runs TypeScript compiler to check for type errors
- Ensures all code is type-safe
- Command: `npm run check`

### 2. **Linting**
- Runs ESLint to check code quality and style
- Enforces coding standards
- Command: `npm run lint`

### 3. **Build Verification**
- Builds the entire application (frontend + backend)
- Verifies build artifacts are created correctly
- Ensures production build works
- Command: `npm run build`

### 4. **Testing**
- Runs all test suites using Vitest
- Generates coverage reports
- Command: `npm run test`

### 5. **Security Audit**
- Runs npm audit to check for known vulnerabilities
- Reports moderate and high severity issues
- Command: `npm audit`

### 6. **Quality Summary**
- Aggregates results from all stages
- Provides summary of pipeline status
- Fails if any critical stage fails

## 🚀 Local Development

### Run All CI Checks Locally

```bash
npm run ci
```

This runs all checks in sequence:
1. Type checking
2. Linting
3. Build
4. Tests

### Individual Commands

```bash
# Type check only
npm run check

# Lint only
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📁 File Structure

```
.github/
  workflows/
    ci.yml          # GitHub Actions workflow

tests/
  setup.ts          # Test setup and configuration
  example.test.ts   # Example test file

.eslintrc.json      # ESLint configuration
.eslintignore       # Files to ignore for linting
vitest.config.ts    # Vitest test configuration
```

## 🔧 Configuration

### ESLint

ESLint is configured to:
- Use TypeScript parser
- Support React and React Hooks
- Enforce best practices
- Warn on unused variables
- Allow console.warn and console.error

### Vitest

Vitest is configured to:
- Use jsdom environment for React testing
- Support path aliases (@/ and @shared/)
- Generate coverage reports
- Use v8 coverage provider

### GitHub Actions

The workflow:
- Runs on Ubuntu latest
- Uses Node.js 20
- Caches npm dependencies
- Runs in parallel where possible
- Provides detailed status reports

## ✅ Passing CI Checks

### Before Pushing Code

1. **Run local checks:**
   ```bash
   npm run ci
   ```

2. **Fix any issues:**
   - Type errors: Fix TypeScript issues
   - Lint errors: Run `npm run lint:fix` or fix manually
   - Build errors: Check build configuration
   - Test failures: Fix failing tests

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

### Common Issues

#### Type Errors
```bash
# Check specific file
npx tsc --noEmit path/to/file.ts

# Check all files
npm run check
```

#### Lint Errors
```bash
# See all lint errors
npm run lint

# Auto-fix what can be fixed
npm run lint:fix
```

#### Test Failures
```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test tests/your-test.test.ts
```

## 📊 Coverage Reports

Coverage reports are generated when running:
```bash
npm run test:coverage
```

Reports are available in:
- Console output (summary)
- `coverage/` directory (HTML report)

## 🔒 Security

The pipeline automatically:
- Checks for known npm vulnerabilities
- Reports moderate and high severity issues
- Continues on security warnings (doesn't fail the build)

To fix vulnerabilities:
```bash
npm audit
npm audit fix
```

## 🎯 Best Practices

1. **Run CI checks locally before pushing**
   ```bash
   npm run ci
   ```

2. **Fix linting issues early**
   ```bash
   npm run lint:fix
   ```

3. **Write tests for new features**
   - Add tests in `tests/` directory
   - Follow naming convention: `*.test.ts` or `*.test.tsx`

4. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

5. **Check security regularly**
   ```bash
   npm audit
   ```

## 🚨 Pipeline Failure

If the pipeline fails:

1. **Check the GitHub Actions logs**
   - Go to Actions tab in GitHub
   - Click on the failed workflow
   - Review error messages

2. **Run checks locally**
   ```bash
   npm run ci
   ```

3. **Fix issues and push again**
   - Pipeline will automatically re-run

## 📈 Continuous Improvement

### Adding New Checks

1. Add script to `package.json`
2. Add job to `.github/workflows/ci.yml`
3. Update `npm run ci` to include new check

### Adding Tests

1. Create test file in `tests/` directory
2. Follow naming: `*.test.ts` or `*.test.tsx`
3. Use Vitest testing utilities
4. Run `npm run test` to verify

## 🔗 Related Documentation

- [README.md](./README.md) - Project setup
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API docs
- [INVESTOR_READY_CHECKLIST.md](./INVESTOR_READY_CHECKLIST.md) - Production checklist

---

**Status**: ✅ Active  
**Last Updated**: 2024

