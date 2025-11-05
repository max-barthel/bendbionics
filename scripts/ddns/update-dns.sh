#!/bin/bash

# BendBionics - Dynamic DNS Update Script for Porkbun
# Automatically updates DNS A record when router's public IP changes

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/etc/porkbun-dns/.env"
LOG_FILE="/var/log/update-dns.log"
DOMAIN="bendbionics.com"
SUBDOMAIN=""  # Empty for root domain, or "www" for www subdomain
LOCK_FILE="/var/run/update-dns.lock"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$@"
}

log_error() {
    log "ERROR" "$@" >&2
}

log_warning() {
    log "WARNING" "$@"
}

# Function to check if script is already running
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log_warning "Script already running (PID: $pid), exiting"
            exit 0
        else
            log_warning "Stale lock file found, removing"
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# Function to cleanup lock file
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT INT TERM

# Function to load environment variables
load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_error "Please create the file with PORKBUN_API_KEY and PORKBUN_SECRET_KEY"
        exit 1
    fi

    # Source environment file
    set -a
    source "$ENV_FILE"
    set +a

    # Validate required variables
    if [ -z "${PORKBUN_API_KEY:-}" ] || [ -z "${PORKBUN_SECRET_KEY:-}" ]; then
        log_error "PORKBUN_API_KEY or PORKBUN_SECRET_KEY not set in $ENV_FILE"
        exit 1
    fi
}

# Function to get current public IP
get_current_ip() {
    local ip
    # Try multiple services for reliability
    ip=$(curl -4 -s --max-time 10 ifconfig.me 2>/dev/null || \
         curl -4 -s --max-time 10 icanhazip.com 2>/dev/null || \
         curl -4 -s --max-time 10 ipv4.icanhazip.com 2>/dev/null || \
         curl -4 -s --max-time 10 api.ipify.org 2>/dev/null)

    if [ -z "$ip" ]; then
        log_error "Failed to get current public IP"
        return 1
    fi

    # Validate IP format (basic check)
    if ! [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        log_error "Invalid IP format: $ip"
        return 1
    fi

    echo "$ip"
}

# Function to get current DNS A record
get_dns_ip() {
    local dns_ip
    dns_ip=$(dig +short "$DOMAIN" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

    if [ -z "$dns_ip" ]; then
        log_warning "Could not resolve DNS for $DOMAIN"
        return 1
    fi

    echo "$dns_ip"
}

# Function to update DNS via Porkbun API
update_dns() {
    local new_ip=$1

    # For root domain, use "@" in API call
    local record_name="${SUBDOMAIN:-@}"
    local display_name="${SUBDOMAIN:+$SUBDOMAIN.}$DOMAIN"

    log_info "Updating DNS A record for $display_name to $new_ip"

    # Porkbun API endpoint - use editByNameType for root domain
    # For root domain, use "@" or empty string
    if [ "$record_name" = "@" ]; then
        local api_url="https://porkbun.com/api/json/v3/dns/editByNameType/$DOMAIN/A/@"
    else
        local api_url="https://porkbun.com/api/json/v3/dns/editByNameType/$DOMAIN/A/$record_name"
    fi

    # Make API request
    local response=$(curl -s --max-time 30 \
        -X POST "$api_url" \
        -H "Content-Type: application/json" \
        -d "{
            \"apikey\": \"$PORKBUN_API_KEY\",
            \"secretapikey\": \"$PORKBUN_SECRET_KEY\",
            \"content\": \"$new_ip\",
            \"ttl\": 600
        }" 2>/dev/null)

    # Check if curl succeeded
    if [ $? -ne 0 ]; then
        log_error "Failed to contact Porkbun API"
        return 1
    fi

    # Parse response
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")

    if [ "$status" = "SUCCESS" ]; then
        log_info "DNS update successful: $display_name -> $new_ip"
        return 0
    else
        local message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
        log_error "DNS update failed: $message"
        log_error "API response: $response"

        # Try to parse more detailed error
        if echo "$response" | grep -q "record not found"; then
            log_error "DNS record not found. You may need to create it first in Porkbun."
        fi

        return 1
    fi
}

# Main execution
main() {
    check_lock
    load_env

    log_info "Starting DNS update check"

    # Get current public IP
    local current_ip
    current_ip=$(get_current_ip)
    if [ $? -ne 0 ]; then
        exit 1
    fi

    log_info "Current public IP: $current_ip"

    # Get current DNS IP
    local dns_ip
    dns_ip=$(get_dns_ip)
    if [ $? -ne 0 ]; then
        log_warning "Could not resolve current DNS, will attempt update anyway"
        dns_ip=""
    else
        log_info "Current DNS IP: $dns_ip"
    fi

    # Compare IPs
    if [ "$current_ip" = "$dns_ip" ]; then
        log_info "IPs match, no update needed"
        exit 0
    fi

    log_info "IP mismatch detected, updating DNS"

    # Update DNS
    if update_dns "$current_ip"; then
        log_info "DNS update completed successfully"
        exit 0
    else
        log_error "DNS update failed"
        exit 1
    fi
}

# Run main function
main "$@"

