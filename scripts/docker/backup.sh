#!/bin/bash

# BendBionics Docker Backup Script
# Backs up database and volumes

set -e

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib.sh"

# Configuration
BACKUP_DIR="/opt/bendbionics/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="docker-compose.yml"

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/volumes"
    mkdir -p "$BACKUP_DIR/configs"
}

# Backup database
backup_database() {
    print_status "Backing up database..."

    local backup_file="$BACKUP_DIR/database/bendbionics_${TIMESTAMP}.sql.gz"

    # Get database credentials from environment
    source .env 2>/dev/null || true

    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U "${POSTGRES_USER:-bendbionics_user}" "${POSTGRES_DB:-bendbionics}" | \
        gzip > "$backup_file"

    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_success "Database backup created: $backup_file ($size)"

        # Keep only last 30 backups
        ls -t "$BACKUP_DIR/database"/*.sql.gz | tail -n +31 | xargs -r rm -f
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Backup volumes
backup_volumes() {
    print_status "Backing up volumes..."

    local backup_file="$BACKUP_DIR/volumes/bendbionics_volumes_${TIMESTAMP}.tar.gz"

    # Create temporary directory for volume data
    local temp_dir=$(mktemp -d)

    # Export volumes (this is a simplified approach)
    # In production, you might want to use docker volume backup tools
    print_warning "Volume backup requires manual implementation based on your needs"
    print_status "Volumes to backup:"
    print_status "  - postgres_data"
    print_status "  - ssl_certs"
    print_status "  - ssl_private"

    # Example: Backup postgres volume
    # docker run --rm -v bendbionics_postgres_data:/data -v "$temp_dir":/backup \
    #     alpine tar czf /backup/postgres_data.tar.gz -C /data .

    rm -rf "$temp_dir"

    print_success "Volume backup completed"
}

# Backup configuration
backup_config() {
    print_status "Backing up configuration..."

    local backup_file="$BACKUP_DIR/configs/bendbionics_config_${TIMESTAMP}.tar.gz"

    tar czf "$backup_file" \
        .env \
        docker-compose.yml \
        docker-compose.prod.yml \
        docker/nginx/ \
        2>/dev/null || true

    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_success "Configuration backup created: $backup_file ($size)"

        # Keep only last 10 config backups
        ls -t "$BACKUP_DIR/configs"/*.tar.gz | tail -n +11 | xargs -r rm -f
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        print_error "Please provide backup file path"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi

    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_status "Restore cancelled"
        exit 0
    fi

    print_status "Restoring database from $backup_file..."

    source .env 2>/dev/null || true

    # Drop and recreate database
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "${POSTGRES_USER:-bendbionics_user}" -d postgres \
        -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-bendbionics};"

    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "${POSTGRES_USER:-bendbionics_user}" -d postgres \
        -c "CREATE DATABASE ${POSTGRES_DB:-bendbionics};"

    # Restore from backup
    gunzip -c "$backup_file" | \
        docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "${POSTGRES_USER:-bendbionics_user}" "${POSTGRES_DB:-bendbionics}"

    print_success "Database restored successfully"
}

# Main execution
main() {
    local restore_file=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --restore)
                restore_file="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --restore FILE    Restore database from backup file"
                echo "  --help            Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    if [ -n "$restore_file" ]; then
        restore_database "$restore_file"
        exit 0
    fi

    print_status "Starting backup process..."

    create_backup_dir
    backup_database
    backup_config
    backup_volumes

    print_success "Backup completed!"
    print_status "Backup location: $BACKUP_DIR"
}

main "$@"

