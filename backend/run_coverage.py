#!/usr/bin/env python3
"""
Coverage reporting script for the Soft Robot API backend.

Usage:
    python run_coverage.py [--html] [--xml] [--term] [--all]
"""

import argparse
import subprocess
import sys
from pathlib import Path


def run_coverage(html=True, xml=True, term=True, fail_under=80):
    """Run coverage tests with specified output formats."""
    cmd = ["python", "-m", "pytest", "--cov=app"]

    if term:
        cmd.extend(["--cov-report=term-missing"])

    if html:
        cmd.extend(["--cov-report=html:htmlcov"])

    if xml:
        cmd.extend(["--cov-report=xml:coverage.xml"])

    cmd.extend([f"--cov-fail-under={fail_under}"])

    print("Running coverage tests...")
    print(f"Command: {' '.join(cmd)}")
    print("-" * 50)

    result = subprocess.run(cmd, cwd=Path(__file__).parent)

    if result.returncode == 0:
        print("\n✅ Coverage tests passed!")
        if html:
            print("📊 HTML report generated in: htmlcov/index.html")
        if xml:
            print("📊 XML report generated in: coverage.xml")
    else:
        print("\n❌ Coverage tests failed!")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Run coverage tests for the backend"
    )
    parser.add_argument(
        "--html", action="store_true", help="Generate HTML report"
    )
    parser.add_argument(
        "--xml", action="store_true", help="Generate XML report"
    )
    parser.add_argument(
        "--term", action="store_true", help="Show terminal report"
    )
    parser.add_argument(
        "--all", action="store_true", help="Generate all report formats"
    )
    parser.add_argument(
        "--fail-under",
        type=int,
        default=80,
        help="Minimum coverage percentage",
    )

    args = parser.parse_args()

    # Default to all formats if none specified
    if not any([args.html, args.xml, args.term, args.all]):
        args.all = True

    if args.all:
        args.html = True
        args.xml = True
        args.term = True

    run_coverage(
        html=args.html,
        xml=args.xml,
        term=args.term,
        fail_under=args.fail_under,
    )


if __name__ == "__main__":
    main()
