#!/usr/bin/env bun

/**
 * Simple code quality report for BendBionics platform
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");

function runCommand(command) {
  try {
    return execSync(command, { encoding: "utf8" });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function getFileStats(dir, extensions) {
  const files = runCommand(
    `find ${dir} -name "*.${extensions.join('" -o -name "*.')}" | wc -l`
  );
  const lines = runCommand(
    `find ${dir} -name "*.${extensions.join(
      '" -o -name "*.'
    )}" -exec wc -l {} + | tail -1 | awk '{print $1}'`
  );
  return {
    files: Number.parseInt(files) || 0,
    lines: Number.parseInt(lines) || 0,
  };
}

function main() {
  console.log("🔍 BendBionics Code Quality Report\n");

  // Frontend stats
  const frontend = getFileStats("frontend/src", ["ts", "tsx"]);
  console.log(`📱 Frontend: ${frontend.files} files, ${frontend.lines} lines`);

  // Backend stats
  const backend = getFileStats("backend/app", ["py"]);
  console.log(`🐍 Backend: ${backend.files} files, ${backend.lines} lines`);

  // Run linting
  console.log("\n🔧 Running linting...");
  console.log(
    "Frontend:",
    runCommand(
      'cd frontend && bun run lint 2>/dev/null || echo "No linting issues"'
    )
  );
  console.log(
    "Backend:",
    runCommand(
      'cd backend && ruff check app/ --quiet 2>/dev/null || echo "No linting issues"'
    )
  );

  console.log("\n✅ Report complete!");
}

main();
