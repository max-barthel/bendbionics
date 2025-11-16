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

# Function to retrieve DNS record ID
get_record_id() {
    # For root domain, record_name should be empty; for subdomain, use the subdomain name
    local record_name=""
    if [ -n "${SUBDOMAIN:-}" ] && [ "$SUBDOMAIN" != "@" ]; then
        record_name="$SUBDOMAIN"
    fi
    local display_name="${SUBDOMAIN:+$SUBDOMAIN.}$DOMAIN"

    log_info "Retrieving DNS record ID for $display_name" >&2

    # Retrieve all DNS records
    local response=$(curl -s --max-time 30 \
        -X POST "https://api.porkbun.com/api/json/v3/dns/retrieve/$DOMAIN" \
        -H "Content-Type: application/json" \
        -d "{
            \"apikey\": \"$PORKBUN_API_KEY\",
            \"secretapikey\": \"$PORKBUN_SECRET_KEY\"
        }" 2>/dev/null)

    if [ $? -ne 0 ]; then
        log_error "Failed to retrieve DNS records"
        return 1
    fi

    # Check if response indicates an error
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [ "$status" = "ERROR" ]; then
        local error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
        log_error "Failed to retrieve DNS records: $error_msg"
        return 1
    fi

    # Find the A record for root domain or subdomain
    # Note: Porkbun API returns root domain with name="bendbionics.com" (full domain), not empty
    # Use jq if available, otherwise use grep/sed
    local record_id
    if command -v jq >/dev/null 2>&1; then
        # Use jq for proper JSON parsing
        if [ -z "$record_name" ]; then
            # Root domain: find record where name equals the domain (or empty/null)
            record_id=$(echo "$response" | jq -r ".records[]? | select(.type == \"A\" and (.name == \"$DOMAIN\" or .name == \"\" or .name == null)) | .id" | head -1)
        else
            # Subdomain: find record with matching name (full subdomain name like "www.bendbionics.com")
            local full_subdomain="$record_name.$DOMAIN"
            record_id=$(echo "$response" | jq -r ".records[]? | select(.type == \"A\" and (.name == \"$full_subdomain\" or .name == \"$record_name\")) | .id" | head -1)
        fi
    else
        # Fallback: use grep/sed (less reliable but works)
        # Try multiple patterns to find the record
        if [ -z "$record_name" ]; then
            # Root domain: find record where name equals domain name or is empty
            # Try pattern: "name":"bendbionics.com"..."type":"A"
            record_id=$(echo "$response" | grep -oE "\"id\":\"[0-9]+\"[^}]*\"name\":\"$DOMAIN\"[^}]*\"type\":\"A\"" | grep -oE '"id":"[0-9]+"' | cut -d'"' -f4 | head -1)
            # Try alternative pattern order
            if [ -z "$record_id" ]; then
                record_id=$(echo "$response" | grep -oE "\"id\":\"[0-9]+\"[^}]*\"type\":\"A\"[^}]*\"name\":\"$DOMAIN\"" | grep -oE '"id":"[0-9]+"' | cut -d'"' -f4 | head -1)
            fi
            # Try empty name as fallback
            if [ -z "$record_id" ]; then
                record_id=$(echo "$response" | grep -oE '"id":"[0-9]+"[^}]*"name":""[^}]*"type":"A"' | grep -oE '"id":"[0-9]+"' | cut -d'"' -f4 | head -1)
            fi
        else
            # Subdomain: find record with matching name (full subdomain or just subdomain)
            local full_subdomain="$record_name.$DOMAIN"
            record_id=$(echo "$response" | grep -oE "\"id\":\"[0-9]+\"[^}]*\"name\":\"$full_subdomain\"[^}]*\"type\":\"A\"" | \
                grep -oE '"id":"[0-9]+"' | cut -d'"' -f4 | head -1)
            # Try alternative pattern order for subdomain
            if [ -z "$record_id" ]; then
                record_id=$(echo "$response" | grep -oE "\"id\":\"[0-9]+\"[^}]*\"type\":\"A\"[^}]*\"name\":\"$full_subdomain\"" | \
                    grep -oE '"id":"[0-9]+"' | cut -d'"' -f4 | head -1)
            fi
        fi
    fi

    if [ -z "$record_id" ] || [ "$record_id" = "null" ]; then
        log_error "A record not found for $display_name" >&2
        log_error "API response (first 500 chars): $(echo "$response" | head -c 500)" >&2
        return 1
    fi

    # Output only the record ID to stdout (for capture)
    echo "$record_id"
}

# Function to update DNS via Porkbun API
update_dns() {
    local new_ip=$1

    # For root domain, use "@" in API call
    local record_name="${SUBDOMAIN:-@}"
    local display_name="${SUBDOMAIN:+$SUBDOMAIN.}$DOMAIN"

    log_info "Updating DNS A record for $display_name to $new_ip"

    # First, retrieve the record ID
    local record_id
    record_id=$(get_record_id 2>/dev/null)  # Log messages go to stderr, ID to stdout
    local get_id_status=$?
    if [ $get_id_status -ne 0 ] || [ -z "$record_id" ] || [ "$record_id" = "null" ]; then
        log_error "Failed to retrieve record ID, trying editByNameType as fallback"

        # Fallback to editByNameType
        local json_payload
        if [ "$record_name" = "@" ]; then
            local api_url="https://api.porkbun.com/api/json/v3/dns/editByNameType/$DOMAIN/A"
            json_payload=$(cat <<EOF
{
    "apikey": "$PORKBUN_API_KEY",
    "secretapikey": "$PORKBUN_SECRET_KEY",
    "name": "",
    "content": "$new_ip",
    "ttl": 600
}
EOF
)
        else
            local api_url="https://api.porkbun.com/api/json/v3/dns/editByNameType/$DOMAIN/A/$record_name"
            json_payload=$(cat <<EOF
{
    "apikey": "$PORKBUN_API_KEY",
    "secretapikey": "$PORKBUN_SECRET_KEY",
    "content": "$new_ip",
    "ttl": 600
}
EOF
)
        fi
    else
        # Use edit by ID (more reliable)
        log_info "Found record ID: $record_id"
        local api_url="https://api.porkbun.com/api/json/v3/dns/edit/$DOMAIN/$record_id"
        # For root domain, Porkbun uses full domain name; for subdomain, use full subdomain name
        local name_value="$DOMAIN"
        if [ -n "$SUBDOMAIN" ] && [ "$SUBDOMAIN" != "@" ]; then
            name_value="$SUBDOMAIN.$DOMAIN"
        fi
        # Build JSON payload - ensure proper escaping
        local json_payload
        json_payload=$(cat <<EOF
{
    "apikey": "$PORKBUN_API_KEY",
    "secretapikey": "$PORKBUN_SECRET_KEY",
    "name": "$name_value",
    "type": "A",
    "content": "$new_ip",
    "ttl": 600
}
EOF
)
    fi

    # Make API request
    local response=$(curl -s --max-time 30 \
        -X POST "$api_url" \
        -H "Content-Type: application/json" \
        -d "$json_payload" 2>/dev/null)

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

    # Get current DNS IPs for both root and www
    local root_dns_ip
    root_dns_ip=$(get_dns_ip)
    if [ $? -ne 0 ]; then
        log_warning "Could not resolve root domain DNS, will attempt update anyway"
        root_dns_ip=""
    else
        log_info "Current root domain DNS IP: $root_dns_ip"
    fi

    # Check www subdomain
    local www_dns_ip
    if dig +short "www.$DOMAIN" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' >/dev/null; then
        www_dns_ip=$(dig +short "www.$DOMAIN" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
        log_info "Current www subdomain DNS IP: $www_dns_ip"
    else
        log_warning "Could not resolve www subdomain DNS, will attempt update anyway"
        www_dns_ip=""
    fi

    # Check if updates are needed
    local root_needs_update=false
    local www_needs_update=false

    if [ -z "$root_dns_ip" ] || [ "$current_ip" != "$root_dns_ip" ]; then
        root_needs_update=true
        log_info "Root domain IP mismatch: $root_dns_ip -> $current_ip"
    fi

    if [ -z "$www_dns_ip" ] || [ "$current_ip" != "$www_dns_ip" ]; then
        www_needs_update=true
        log_info "WWW subdomain IP mismatch: $www_dns_ip -> $current_ip"
    fi

    if [ "$root_needs_update" = false ] && [ "$www_needs_update" = false ]; then
        log_info "All DNS records are up to date, no update needed"
        exit 0
    fi

    log_info "IP mismatch detected, updating DNS records"

    # Update root domain if needed
    local root_success=true
    if [ "$root_needs_update" = true ]; then
        SUBDOMAIN=""
        if ! update_dns "$current_ip"; then
            log_error "Failed to update root domain DNS record"
            root_success=false
        fi
    else
        log_info "Root domain already up to date, skipping"
        root_success=true  # Already correct, so success
    fi

    # Update www subdomain if needed
    local www_success=true
    if [ "$www_needs_update" = true ]; then
        SUBDOMAIN="www"
        if ! update_dns "$current_ip"; then
            log_error "Failed to update www subdomain DNS record"
            www_success=false
        fi
    else
        log_info "WWW subdomain already up to date, skipping"
        www_success=true  # Already correct, so success
    fi

    # Report results
    if [ "$root_success" = true ] && [ "$www_success" = true ]; then
        log_info "DNS update completed successfully"
        exit 0
    else
        log_error "DNS update had failures"
        exit 1
    fi
}

# Run main function
main "$@"

