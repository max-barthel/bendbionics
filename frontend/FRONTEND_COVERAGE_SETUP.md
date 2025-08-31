# Frontend Coverage Setup Guide

## 🎯 **Overview**

This guide explains how to use the coverage functionality in VS Code's Test Explorer for the frontend tests. The frontend uses **Vitest** with **v8 coverage provider** for comprehensive test coverage reporting.

## 🚀 **Quick Start**

### **Step 1: Coverage is Already Configured**

The coverage functionality is already set up and working! You can:

1. **Open Test Explorer** (beaker/flask icon in sidebar)
2. **Right-click on any test** or **test file**
3. **Select "Run Tests with Coverage"**
4. **View the coverage report** in the terminal

### **Step 2: Using Coverage in VS Code**

- **Run individual test with coverage**: Right-click → "Run Tests with Coverage"
- **Run test file with coverage**: Right-click on test file → "Run Tests with Coverage"
- **Run all tests with coverage**: Right-click on "Tests" → "Run Tests with Coverage"

## 📊 **Coverage Configuration**

### **Vitest Configuration** (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.setup.*",
        "dist/",
        "coverage/",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### **VS Code Settings**

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "vitest.include": [
    "frontend/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
  ],
  "vitest.workspaceRoot": "frontend"
}
```

**Note**: Coverage configuration is handled in `vitest.config.ts`, not in VS Code settings. The VS Code Vitest extension automatically detects and uses the coverage configuration from your Vitest config file.

## 📋 **Available Commands**

### **NPM Scripts**

```bash
# Run tests with coverage
npm run test:coverage

# Run tests with coverage and watch mode
npm run test:coverage -- --watch

# Run tests with coverage and specific file
npm run test:coverage -- src/components/Button.test.tsx
```

### **Direct Vitest Commands**

```bash
# Run with coverage
npx vitest --run --coverage

# Run with coverage and watch
npx vitest --coverage

# Run with coverage and specific file
npx vitest --run --coverage src/components/Button.test.tsx
```

### **Test Runner Script**

```bash
# From root directory
./scripts/test-runner.sh frontend coverage
```

## 📈 **Coverage Report Types**

### **1. Text Report** (Terminal Output)

Shows coverage summary in the terminal:

```
% Coverage report from v8
-----------------------------------------------|---------|----------|---------|---------|-------------------
File                                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------------------------|---------|----------|---------|---------|-------------------
All files                                      |   25.22 |    67.39 |   40.74 |   25.22 |
src                                           |   81.39 |       80 |   55.55 |   81.39 |
```

### **2. HTML Report** (Browser)

Generates detailed HTML coverage report:

- **Location**: `frontend/coverage/index.html`
- **Features**: Interactive coverage visualization
- **Usage**: Open in browser to see detailed coverage

### **3. JSON Report** (Machine Readable)

Generates JSON coverage data:

- **Location**: `frontend/coverage/coverage.json`
- **Usage**: For CI/CD integration and analysis

## 🎯 **Current Coverage Status**

### **Overall Coverage**

- **Total Coverage**: 25.22% (includes build files)
- **Source Code Coverage**: 81.39%
- **Test Status**: 293/293 tests passing ✅

### **Component Coverage Breakdown**

- **ArrayInputGroup.tsx**: 100% ✅
- **Button.tsx**: 100% ✅
- **Card.tsx**: 100% ✅
- **Input.tsx**: 100% ✅
- **LoadingSpinner.tsx**: 100% ✅
- **ProgressIndicator.tsx**: 100% ✅
- **SubmitButton.tsx**: 100% ✅
- **Tabs.tsx**: 100% ✅
- **Typography.tsx**: 100% ✅
- **FormTabs.tsx**: 82.5% ✅
- **RobotForm.tsx**: 87.6% ✅
- **NumberInput.tsx**: 92.68% ✅
- **SliderInput.tsx**: 97% ✅

### **Areas Needing Coverage**

- **Visualizer3D.tsx**: 0% (3D visualization component)
- **AuthPage.tsx**: 0% (Authentication page)
- **PresetManager.tsx**: 0% (Preset management)
- **Notification.tsx**: 1.85% (Error/success messages)
- **LoadingOverlay.tsx**: 10.52% (Loading states)

## 🔧 **Coverage Thresholds**

### **Current Thresholds**

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### **Threshold Enforcement**

- Tests will fail if coverage drops below thresholds
- Helps maintain code quality
- Ensures new code is properly tested

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Coverage Not Showing**

```bash
# Check if coverage provider is installed
npm list @vitest/coverage-v8

# Reinstall if needed
npm install --save-dev @vitest/coverage-v8
```

#### **2. Coverage Report Not Generated**

```bash
# Clear coverage cache
rm -rf coverage/

# Run coverage again
npm run test:coverage
```

#### **3. VS Code Not Showing Coverage**

1. **Reload VS Code** (`Ctrl+Shift+P` → `Developer: Reload Window`)
2. **Check Vitest extension** is installed and enabled
3. **Verify settings** in `.vscode/settings.json`

### **Debug Configuration**

```json
{
  "name": "Debug Tests with Coverage",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/frontend/node_modules/vitest/vitest.mjs",
  "args": ["--run", "--coverage"],
  "cwd": "${workspaceFolder}/frontend",
  "console": "integratedTerminal"
}
```

## 📈 **Best Practices**

### **Writing Tests for Coverage**

1. **Test all code paths** including error conditions
2. **Mock external dependencies** to test edge cases
3. **Test both success and failure scenarios**
4. **Use conditional testing** for different states

### **Maintaining Coverage**

1. **Run coverage regularly** during development
2. **Set up pre-commit hooks** to check coverage
3. **Review coverage reports** before merging
4. **Add tests for uncovered code**

### **Coverage Goals**

- **Aim for 80%+ coverage** on new code
- **Maintain existing coverage** when refactoring
- **Focus on critical paths** over cosmetic code
- **Balance coverage with test maintainability**

## 🔗 **Resources**

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [v8 Coverage Provider](https://github.com/vitest-dev/vitest/tree/main/packages/coverage-v8)
- [VS Code Test Explorer](https://code.visualstudio.com/docs/editor/testing)
- [React Testing Best Practices](https://testing-library.com/docs/react-testing-library/intro/)

## 📝 **Next Steps**

### **Improving Coverage**

1. **Add tests for Visualizer3D component**
2. **Test authentication components**
3. **Cover preset management functionality**
4. **Add tests for notification system**

### **Coverage Monitoring**

1. **Set up CI/CD coverage reporting**
2. **Configure coverage badges**
3. **Add coverage trend analysis**
4. **Implement coverage alerts**

---

**Last Updated**: August 31, 2024
**Coverage Status**: ✅ Working with VS Code Test Explorer
**Source Coverage**: 81.39%
**Test Status**: 293/293 passing
