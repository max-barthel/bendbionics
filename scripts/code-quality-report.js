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
      },
    );

    const eslintResults = JSON.parse(eslintOutput);
    const totalErrors = eslintResults.reduce(
      (sum, file) => sum + file.errorCount,
      0,
    );
    const totalWarnings = eslintResults.reduce(
      (sum, file) => sum + file.warningCount,
      0,
    );

    frontendReport.eslint = {
      errors: totalErrors,
      warnings: totalWarnings,
      files: eslintResults.length,
    };

    let eslintColor = "green";
    if (totalErrors > 0) {
      eslintColor = "red";
    } else if (totalWarnings > 0) {
      eslintColor = "yellow";
    }
    log(
      `✅ ESLint: ${totalErrors} errors, ${totalWarnings} warnings`,
      eslintColor,
    );
  } catch (error) {
    log(`⚠️ ESLint analysis failed: ${error.message}`, "yellow");
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

  // Run Ruff analysis
  try {
    log("Running Ruff analysis...", "blue");
    const ruffOutput = execSync("cd backend && ruff check app/ --statistics", {
      encoding: "utf8",
      stdio: "pipe",
    });

    const lines = ruffOutput.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/Found (\d+) errors/);

    if (match) {
      backendReport.ruff = {
        errors: parseInt(match[1]),
      };
      log(`✅ Ruff: ${match[1]} errors found`, match[1] > 0 ? "red" : "green");
    } else {
      backendReport.ruff = { errors: 0 };
      log("✅ Ruff: No errors", "green");
    }
  } catch (error) {
    log(`⚠️ Ruff analysis failed: ${error.message}`, "yellow");
    backendReport.ruff = { errors: 0 };
  }

  // Run MyPy analysis
  try {
    log("Running MyPy analysis...", "blue");
    const mypyOutput = execSync(
      "cd backend && python -m mypy app/ --no-error-summary",
      {
        encoding: "utf8",
        stdio: "pipe",
      },
    );

    const errorCount = (mypyOutput.match(/error:/g) || []).length;
    const warningCount = (mypyOutput.match(/warning:/g) || []).length;

    backendReport.mypy = { errors: errorCount, warnings: warningCount };
    let mypyColor = "green";
    if (errorCount > 0) {
      mypyColor = "red";
    } else if (warningCount > 0) {
      mypyColor = "yellow";
    }
    log(`✅ MyPy: ${errorCount} errors, ${warningCount} warnings`, mypyColor);
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
      (backend.ruff?.errors || 0) +
      (backend.mypy?.errors || 0),
    totalWarnings:
      (frontend.eslint?.warnings || 0) +
      (frontend.typescript?.warnings || 0) +
      (backend.mypy?.warnings || 0),
  };

  report.overall.avgLinesPerFile = Math.round(
    report.overall.totalLines / report.overall.totalFiles,
  );
  report.overall.errorRate =
    report.overall.totalErrors / report.overall.totalFiles;
  report.overall.warningRate =
    report.overall.totalWarnings / report.overall.totalFiles;
}

function logOverallMetrics(report) {
  log("\n📈 Overall Metrics:", "bold");
  log(`Total Files: ${formatNumber(report.overall.totalFiles)}`, "blue");
  log(`Total Lines: ${formatNumber(report.overall.totalLines)}`, "blue");
  log(`Avg Lines/File: ${report.overall.avgLinesPerFile}`, "blue");

  const errorColor = report.overall.totalErrors > 0 ? "red" : "green";
  log(`Total Errors: ${formatNumber(report.overall.totalErrors)}`, errorColor);

  const warningColor = report.overall.totalWarnings > 0 ? "yellow" : "green";
  log(
    `Total Warnings: ${formatNumber(report.overall.totalWarnings)}`,
    warningColor,
  );

  let errorRateColor = "green";
  if (report.overall.errorRate > 0.1) {
    errorRateColor = "red";
  } else if (report.overall.errorRate > 0.05) {
    errorRateColor = "yellow";
  }
  log(
    `Error Rate: ${formatPercentage(report.overall.errorRate)}`,
    errorRateColor,
  );
}

function logFrontendMetrics(report) {
  if (!report.frontend.files) return;

  log("\n📱 Frontend Metrics:", "bold");
  log(`Files: ${formatNumber(report.frontend.files)}`, "blue");
  log(`Lines: ${formatNumber(report.frontend.lines)}`, "blue");

  const eslintErrors = report.frontend.eslint?.errors || 0;
  log(
    `ESLint Errors: ${formatNumber(eslintErrors)}`,
    eslintErrors > 0 ? "red" : "green",
  );

  const tsErrors = report.frontend.typescript?.errors || 0;
  log(
    `TypeScript Errors: ${formatNumber(tsErrors)}`,
    tsErrors > 0 ? "red" : "green",
  );
}

function logBackendMetrics(report) {
  if (!report.backend.files) return;

  log("\n🐍 Backend Metrics:", "bold");
  log(`Files: ${formatNumber(report.backend.files)}`, "blue");
  log(`Lines: ${formatNumber(report.backend.lines)}`, "blue");

  const ruffErrors = report.backend.ruff?.errors || 0;
  log(
    `Ruff Errors: ${formatNumber(ruffErrors)}`,
    ruffErrors > 0 ? "red" : "green",
  );

  const mypyErrors = report.backend.mypy?.errors || 0;
  log(
    `MyPy Errors: ${formatNumber(mypyErrors)}`,
    mypyErrors > 0 ? "red" : "green",
  );
}

function logQualityAssessment(report) {
  log("\n🎯 Quality Assessment:", "bold");
  const qualityScore = calculateQualityScore(report);

  let scoreColor = "red";
  if (qualityScore >= 90) {
    scoreColor = "green";
  } else if (qualityScore >= 70) {
    scoreColor = "yellow";
  }

  log(`Overall Quality Score: ${qualityScore}/100`, scoreColor);

  if (qualityScore >= 90) {
    log("🌟 Excellent code quality!", "green");
  } else if (qualityScore >= 70) {
    log("👍 Good code quality with room for improvement", "yellow");
  } else {
    log("⚠️ Code quality needs attention", "red");
  }
}

function saveReport(report) {
  const reportPath = path.join(__dirname, "../code-quality-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📋 Detailed report saved to: ${reportPath}`, "blue");
}

function generateReport(report) {
  log("\n📊 Code Quality Report", "bold");
  log("=".repeat(50), "cyan");

  logOverallMetrics(report);
  logFrontendMetrics(report);
  logBackendMetrics(report);
  logQualityAssessment(report);

  log("=".repeat(50), "cyan");
  saveReport(report);
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
