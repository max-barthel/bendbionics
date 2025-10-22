#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parseSize(sizeStr) {
  const units = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = match[2] || 'bytes';
  return value * (units[unit] || 1);
}

function checkTotalSize(totalSize, totalBudget) {
  if (!totalBudget) return { hasErrors: false, hasWarnings: false };

  const maxWarning = parseSize(totalBudget.maximumWarning);
  const maxError = parseSize(totalBudget.maximumError);

  log(`\n📊 Total Bundle Size: ${formatBytes(totalSize)}`, 'bold');

  if (totalSize > maxError) {
    log(
      `❌ ERROR: Bundle size exceeds maximum error threshold (${totalBudget.maximumError})`,
      'red'
    );
    return { hasErrors: true, hasWarnings: false };
  } else if (totalSize > maxWarning) {
    log(
      `⚠️  WARNING: Bundle size exceeds warning threshold (${totalBudget.maximumWarning})`,
      'yellow'
    );
    return { hasErrors: false, hasWarnings: true };
  } else {
    log(`✅ Bundle size is within acceptable limits`, 'green');
    return { hasErrors: false, hasWarnings: false };
  }
}

function checkChunkSize(file, budget) {
  if (!budget) {
    log(`📄 ${file.name}: ${formatBytes(file.size)}`, 'blue');
    return { hasErrors: false, hasWarnings: false };
  }

  const maxWarning = parseSize(budget.maximumWarning);
  const maxError = parseSize(budget.maximumError);

  if (file.size > maxError) {
    log(
      `❌ ${file.name}: ${formatBytes(file.size)} (exceeds ${budget.maximumError})`,
      'red'
    );
    return { hasErrors: true, hasWarnings: false };
  } else if (file.size > maxWarning) {
    log(
      `⚠️  ${file.name}: ${formatBytes(file.size)} (exceeds ${budget.maximumWarning})`,
      'yellow'
    );
    return { hasErrors: false, hasWarnings: true };
  } else {
    log(`✅ ${file.name}: ${formatBytes(file.size)}`, 'green');
    return { hasErrors: false, hasWarnings: false };
  }
}

function checkBundleSize() {
  log('🔍 Checking bundle sizes...', 'blue');

  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Dist folder not found. Run "npm run build" first.', 'red');
    process.exit(1);
  }

  const budgetPath = path.join(__dirname, '../performance-budget.json');
  if (!fs.existsSync(budgetPath)) {
    log('❌ Performance budget file not found.', 'red');
    process.exit(1);
  }

  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
  let hasErrors = false;
  let hasWarnings = false;

  // Check total bundle size
  const totalSize = getTotalSize(distPath);
  const totalBudget = budget.budgets.find(b => b.type === 'total');
  const totalResult = checkTotalSize(totalSize, totalBudget);
  hasErrors = hasErrors || totalResult.hasErrors;
  hasWarnings = hasWarnings || totalResult.hasWarnings;

  // Check individual chunks
  log('\n📦 Individual Chunk Analysis:', 'bold');
  const jsFiles = fs
    .readdirSync(distPath)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
      name: file,
      size: fs.statSync(path.join(distPath, file)).size,
      path: path.join(distPath, file),
    }))
    .sort((a, b) => b.size - a.size);

  for (const file of jsFiles) {
    const chunkName = file.name.replace(/\.(js|css)$/, '').split('-')[0];
    const chunkBudget = budget.chunks[chunkName];
    const chunkResult = checkChunkSize(file, chunkBudget);
    hasErrors = hasErrors || chunkResult.hasErrors;
    hasWarnings = hasWarnings || chunkResult.hasWarnings;
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    chunks: jsFiles.map(file => ({
      name: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
    })),
    hasErrors,
    hasWarnings,
  };

  const reportPath = path.join(__dirname, '../bundle-size-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📋 Bundle size report saved to: ${reportPath}`, 'blue');

  // Exit with appropriate code
  if (hasErrors) {
    log('\n❌ Bundle size check failed with errors!', 'red');
    process.exit(1);
  } else if (hasWarnings) {
    log('\n⚠️  Bundle size check completed with warnings.', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ Bundle size check passed!', 'green');
    process.exit(0);
  }
}

function getTotalSize(dirPath) {
  let totalSize = 0;

  function calculateSize(itemPath) {
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      for (const file of fs.readdirSync(itemPath)) {
        calculateSize(path.join(itemPath, file));
      }
    } else {
      totalSize += stat.size;
    }
  }

  calculateSize(dirPath);
  return totalSize;
}

// Run the check
checkBundleSize();
