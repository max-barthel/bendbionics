#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatNumber(num) {
  return num.toLocaleString();
}

function formatPercentage(num) {
  return `${(num * 100).toFixed(1)}%`;
}

function analyzeCodebase() {
  log("🔍 Analyzing codebase quality...", "blue");

  const report = {
    timestamp: new Date().toISOString(),
    frontend: {},
    backend: {},
    overall: {},
  };

  // Analyze frontend
  log("\n📱 Frontend Analysis:", "bold");
  analyzeFrontend(report.frontend);

  // Analyze backend
  log("\n🐍 Backend Analysis:", "bold");
  analyzeBackend(report.backend);

  // Calculate overall metrics
  calculateOverallMetrics(report);

  // Generate report
  generateReport(report);

  return report;
}

function analyzeFrontend(frontendReport) {
  const frontendPath = path.join(__dirname, "../frontend/src");

  if (!fs.existsSync(frontendPath)) {
    log("❌ Frontend source directory not found", "red");
    return;
  }

  // Count files and lines
  const stats = countFilesAndLines(frontendPath, [".ts", ".tsx"]);
  frontendReport.files = stats.files;
  frontendReport.lines = stats.lines;
  frontendReport.avgLinesPerFile = Math.round(stats.lines / stats.files);

  // Run ESLint analysis
  try {
    log("Running ESLint analysis...", "blue");
    const eslintOutput = execSync(
      "cd frontend && npm run lint -- --format=json",
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    const eslintResults = JSON.parse(eslintOutput);
    const totalErrors = eslintResults.reduce(
      (sum, file) => sum + file.errorCount,
      0
    );
    const totalWarnings = eslintResults.reduce(
      (sum, file) => sum + file.warningCount,
      0
    );

    frontendReport.eslint = {
      errors: totalErrors,
      warnings: totalWarnings,
      files: eslintResults.length,
    };

    log(
      `✅ ESLint: ${totalErrors} errors, ${totalWarnings} warnings`,
      totalErrors > 0 ? "red" : totalWarnings > 0 ? "yellow" : "green"
    );
  } catch (error) {
    log("⚠️ ESLint analysis failed", "yellow");
    frontendReport.eslint = { errors: 0, warnings: 0, files: 0 };
  }

  // Run TypeScript analysis
  try {
    log("Running TypeScript analysis...", "blue");
    execSync("cd frontend && npx tsc --noEmit --pretty false", {
      encoding: "utf8",
      stdio: "pipe",
    });
    frontendReport.typescript = { errors: 0, warnings: 0 };
    log("✅ TypeScript: No errors", "green");
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || "";
    const errorCount = (errorOutput.match(/error TS/g) || []).length;
    const warningCount = (errorOutput.match(/warning TS/g) || []).length;

    frontendReport.typescript = { errors: errorCount, warnings: warningCount };
    log(`❌ TypeScript: ${errorCount} errors, ${warningCount} warnings`, "red");
  }

  // Calculate complexity metrics
  frontendReport.complexity = calculateComplexity(frontendPath);
}

function analyzeBackend(backendReport) {
  const backendPath = path.join(__dirname, "../backend/app");

  if (!fs.existsSync(backendPath)) {
    log("❌ Backend source directory not found", "red");
    return;
  }

  // Count files and lines
  const stats = countFilesAndLines(backendPath, [".py"]);
  backendReport.files = stats.files;
  backendReport.lines = stats.lines;
  backendReport.avgLinesPerFile = Math.round(stats.lines / stats.files);

  // Run Flake8 analysis
  try {
    log("Running Flake8 analysis...", "blue");
    const flake8Output = execSync(
      "cd backend && python -m flake8 app/ --count --statistics",
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    const lines = flake8Output.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/(\d+) files checked, (\d+) errors/);

    if (match) {
      backendReport.flake8 = {
        files: parseInt(match[1]),
        errors: parseInt(match[2]),
      };
      log(
        `✅ Flake8: ${match[2]} errors in ${match[1]} files`,
        match[2] > 0 ? "red" : "green"
      );
    } else {
      backendReport.flake8 = { files: 0, errors: 0 };
      log("✅ Flake8: No errors", "green");
    }
  } catch (error) {
    log("⚠️ Flake8 analysis failed", "yellow");
    backendReport.flake8 = { files: 0, errors: 0 };
  }

  // Run MyPy analysis
  try {
    log("Running MyPy analysis...", "blue");
    const mypyOutput = execSync(
      "cd backend && python -m mypy app/ --no-error-summary",
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    const errorCount = (mypyOutput.match(/error:/g) || []).length;
    const warningCount = (mypyOutput.match(/warning:/g) || []).length;

    backendReport.mypy = { errors: errorCount, warnings: warningCount };
    log(
      `✅ MyPy: ${errorCount} errors, ${warningCount} warnings`,
      errorCount > 0 ? "red" : warningCount > 0 ? "yellow" : "green"
    );
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || "";
    const errorCount = (errorOutput.match(/error:/g) || []).length;
    const warningCount = (errorOutput.match(/warning:/g) || []).length;

    backendReport.mypy = { errors: errorCount, warnings: warningCount };
    log(`❌ MyPy: ${errorCount} errors, ${warningCount} warnings`, "red");
  }

  // Calculate complexity metrics
  backendReport.complexity = calculateComplexity(backendPath);
}

function countFilesAndLines(dirPath, extensions) {
  let files = 0;
  let lines = 0;

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        traverse(itemPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files++;
          const content = fs.readFileSync(itemPath, "utf8");
          lines += content.split("\n").length;
        }
      }
    }
  }

  traverse(dirPath);
  return { files, lines };
}

function calculateComplexity(dirPath) {
  // Simplified complexity calculation
  // In a real implementation, you'd use tools like cyclomatic complexity analyzers
  return {
    avgComplexity: 3.2, // Placeholder
    maxComplexity: 8, // Placeholder
    highComplexityFiles: 2, // Placeholder
  };
}

function calculateOverallMetrics(report) {
  const frontend = report.frontend;
  const backend = report.backend;

  report.overall = {
    totalFiles: (frontend.files || 0) + (backend.files || 0),
    totalLines: (frontend.lines || 0) + (backend.lines || 0),
    totalErrors:
      (frontend.eslint?.errors || 0) +
      (frontend.typescript?.errors || 0) +
      (backend.flake8?.errors || 0) +
      (backend.mypy?.errors || 0),
    totalWarnings:
      (frontend.eslint?.warnings || 0) +
      (frontend.typescript?.warnings || 0) +
      (backend.mypy?.warnings || 0),
  };

  report.overall.avgLinesPerFile = Math.round(
    report.overall.totalLines / report.overall.totalFiles
  );
  report.overall.errorRate =
    report.overall.totalErrors / report.overall.totalFiles;
  report.overall.warningRate =
    report.overall.totalWarnings / report.overall.totalFiles;
}

function generateReport(report) {
  log("\n📊 Code Quality Report", "bold");
  log("=".repeat(50), "cyan");

  // Overall metrics
  log("\n📈 Overall Metrics:", "bold");
  log(`Total Files: ${formatNumber(report.overall.totalFiles)}`, "blue");
  log(`Total Lines: ${formatNumber(report.overall.totalLines)}`, "blue");
  log(`Avg Lines/File: ${report.overall.avgLinesPerFile}`, "blue");
  log(
    `Total Errors: ${formatNumber(report.overall.totalErrors)}`,
    report.overall.totalErrors > 0 ? "red" : "green"
  );
  log(
    `Total Warnings: ${formatNumber(report.overall.totalWarnings)}`,
    report.overall.totalWarnings > 0 ? "yellow" : "green"
  );
  log(
    `Error Rate: ${formatPercentage(report.overall.errorRate)}`,
    report.overall.errorRate > 0.1
      ? "red"
      : report.overall.errorRate > 0.05
      ? "yellow"
      : "green"
  );

  // Frontend metrics
  if (report.frontend.files) {
    log("\n📱 Frontend Metrics:", "bold");
    log(`Files: ${formatNumber(report.frontend.files)}`, "blue");
    log(`Lines: ${formatNumber(report.frontend.lines)}`, "blue");
    log(
      `ESLint Errors: ${formatNumber(report.frontend.eslint?.errors || 0)}`,
      (report.frontend.eslint?.errors || 0) > 0 ? "red" : "green"
    );
    log(
      `TypeScript Errors: ${formatNumber(
        report.frontend.typescript?.errors || 0
      )}`,
      (report.frontend.typescript?.errors || 0) > 0 ? "red" : "green"
    );
  }

  // Backend metrics
  if (report.backend.files) {
    log("\n🐍 Backend Metrics:", "bold");
    log(`Files: ${formatNumber(report.backend.files)}`, "blue");
    log(`Lines: ${formatNumber(report.backend.lines)}`, "blue");
    log(
      `Flake8 Errors: ${formatNumber(report.backend.flake8?.errors || 0)}`,
      (report.backend.flake8?.errors || 0) > 0 ? "red" : "green"
    );
    log(
      `MyPy Errors: ${formatNumber(report.backend.mypy?.errors || 0)}`,
      (report.backend.mypy?.errors || 0) > 0 ? "red" : "green"
    );
  }

  // Quality assessment
  log("\n🎯 Quality Assessment:", "bold");
  const qualityScore = calculateQualityScore(report);
  log(
    `Overall Quality Score: ${qualityScore}/100`,
    qualityScore >= 90 ? "green" : qualityScore >= 70 ? "yellow" : "red"
  );

  if (qualityScore >= 90) {
    log("🌟 Excellent code quality!", "green");
  } else if (qualityScore >= 70) {
    log("👍 Good code quality with room for improvement", "yellow");
  } else {
    log("⚠️ Code quality needs attention", "red");
  }

  log("=".repeat(50), "cyan");

  // Save report to file
  const reportPath = path.join(__dirname, "../code-quality-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📋 Detailed report saved to: ${reportPath}`, "blue");
}

function calculateQualityScore(report) {
  let score = 100;

  // Deduct points for errors
  score -= Math.min(report.overall.totalErrors * 5, 50);

  // Deduct points for warnings
  score -= Math.min(report.overall.totalWarnings * 2, 20);

  // Deduct points for high error rate
  if (report.overall.errorRate > 0.1) {
    score -= 20;
  } else if (report.overall.errorRate > 0.05) {
    score -= 10;
  }

  // Deduct points for high warning rate
  if (report.overall.warningRate > 0.2) {
    score -= 10;
  }

  return Math.max(0, Math.round(score));
}

// Run the analysis
if (require.main === module) {
  try {
    analyzeCodebase();
  } catch (error) {
    log(`❌ Analysis failed: ${error.message}`, "red");
    process.exit(1);
  }
}

module.exports = { analyzeCodebase };
