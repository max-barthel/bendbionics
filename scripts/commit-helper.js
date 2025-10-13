#!/usr/bin/env node

const readline = require("readline");
const { execSync } = require("child_process");

const COMMIT_TYPES = [
  { key: "1", name: "✨ feat: New feature", value: "feat" },
  { key: "2", name: "🐛 fix: Bug fix", value: "fix" },
  { key: "3", name: "📚 docs: Documentation", value: "docs" },
  { key: "4", name: "💎 style: Code style", value: "style" },
  { key: "5", name: "📦 refactor: Code refactoring", value: "refactor" },
  { key: "6", name: "🚀 perf: Performance", value: "perf" },
  { key: "7", name: "🚨 test: Tests", value: "test" },
  { key: "8", name: "🛠 build: Build system", value: "build" },
  { key: "9", name: "⚙️ ci: CI/CD", value: "ci" },
  { key: "0", name: "♻️ chore: Maintenance", value: "chore" },
  { key: "r", name: "🗑 revert: Revert", value: "revert" },
  { key: "a", name: "🤖 auto: Auto-generated", value: "auto" },
];

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(question) {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createCommit() {
  try {
    console.log("\n🚀 Modern Commit Helper\n");

    // Show commit types
    console.log("Select commit type:");
    COMMIT_TYPES.forEach((type) => {
      console.log(`  ${type.key}. ${type.name}`);
    });

    const typeChoice = await askQuestion("\nEnter choice (1-9, 0, r, a): ");
    const selectedType = COMMIT_TYPES.find((t) => t.key === typeChoice);

    if (!selectedType) {
      console.log("❌ Invalid choice");
      process.exit(1);
    }

    const scope = await askQuestion("Scope (optional): ");
    const subject = await askQuestion("Commit message: ");

    if (!subject) {
      console.log("❌ Commit message is required");
      process.exit(1);
    }

    const body = await askQuestion("Body (optional): ");

    // Build commit message
    let commitMessage = selectedType.value;
    if (scope) {
      commitMessage += `(${scope})`;
    }
    commitMessage += `: ${subject}`;

    if (body) {
      commitMessage += `\n\n${body}`;
    }

    console.log("\n📝 Commit message:");
    console.log(commitMessage);

    const confirm = await askQuestion("\nProceed with commit? (y/N): ");
    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      console.log("❌ Commit cancelled");
      process.exit(0);
    }

    console.log("\n🚀 Committing...");
    execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
    console.log("✅ Commit successful!");
  } catch (error) {
    console.error("❌ Commit failed:", error.message);
    process.exit(1);
  }
}

createCommit();
