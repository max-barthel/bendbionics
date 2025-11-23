#!/bin/bash

# Bun Helper Functions
# Source this file in scripts to ensure bun is available

# Function to ensure bun is available in PATH
ensure_bun_in_path() {
    # Check if bun is already in PATH
    if command -v bun &> /dev/null; then
        return 0
    fi

    # Simple fallback: add ~/.bun/bin to PATH if bun binary exists there
    if [ -f "$HOME/.bun/bin/bun" ]; then
        export PATH="$HOME/.bun/bin:$PATH"
        if command -v bun &> /dev/null; then
            return 0
        fi
    fi

    # If we get here, bun is not found
    return 1
}

# Function to get bun path (useful for scripts that need the full path)
get_bun_path() {
    if ensure_bun_in_path; then
        command -v bun
    else
        if [ -f "$HOME/.bun/bin/bun" ]; then
            echo "$HOME/.bun/bin/bun"
        else
            return 1
        fi
    fi
}

