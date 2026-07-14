#!/usr/bin/env bash
#
# Set storage error injection and restart only the app container
# This preserves LocalStack data while changing the error condition
#
# Usage: ./scripts/set-error-injection.sh error_type[:operation]
#        ./scripts/set-error-injection.sh clear
#

set -e

ERROR_SPEC="${1:-}"
ENV_FILE=".env"
ENV_FILE_BACKUP=".env.bak"

if [ -z "$ERROR_SPEC" ]; then
    echo "Usage: $0 error_type[:operation]"
    echo ""
    echo "Error types (required):"
    echo "  connection - Simulates S3 connection failure"
    echo "  timeout    - Simulates request timeout"
    echo "  permission - Simulates permission denied"
    echo "  notfound   - Simulates document not found"
    echo "  corrupt    - Simulates corrupted data"
    echo "  clear      - Clears the error injection (normal operation)"
    echo ""
    echo "Operation types (optional suffix):"
    echo "  :read   - Only fail on read operations (load, list)"
    echo "  :write  - Only fail on write operations (save, upload, delete)"
    echo "  (none)  - Fail on all operations"
    echo ""
    echo "Examples:"
    echo "  $0 connection:write  # Saves/uploads will fail, loads will work"
    echo "  $0 timeout:read      # Loads will fail, saves will work"
    echo "  $0 connection        # Everything fails"
    echo "  $0 clear             # Return to normal"
    echo ""
    exit 1
fi

# Backup .env
cp "$ENV_FILE" "$ENV_FILE_BACKUP"

if [ "$ERROR_SPEC" = "clear" ]; then
    echo "Clearing storage error injection from .env..."
    # Remove FORCE_STORAGE_ERROR line from .env
    grep -v "^FORCE_STORAGE_ERROR=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "✓ Removed FORCE_STORAGE_ERROR from .env"
else
    echo "Setting FORCE_STORAGE_ERROR=$ERROR_SPEC in .env..."

    # Remove existing FORCE_STORAGE_ERROR line if present
    grep -v "^FORCE_STORAGE_ERROR=" "$ENV_FILE" > "$ENV_FILE.tmp" || touch "$ENV_FILE.tmp"

    # Add new FORCE_STORAGE_ERROR line
    echo "FORCE_STORAGE_ERROR=$ERROR_SPEC" >> "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"

    echo "✓ Set FORCE_STORAGE_ERROR=$ERROR_SPEC"
    echo ""

    # Explain what will happen
    if [[ "$ERROR_SPEC" == *:read ]]; then
        echo "This will cause READ operations (load, list) to fail."
        echo "WRITE operations (save, upload, delete) will work normally."
    elif [[ "$ERROR_SPEC" == *:write ]]; then
        echo "This will cause WRITE operations (save, upload, delete) to fail."
        echo "READ operations (load, list) will work normally."
    else
        echo "This will cause ALL storage operations to fail."
    fi
fi

echo ""
echo "Restarting app container (LocalStack will stay running)..."
docker compose restart app

echo ""
echo "✓ Done! The app is now running with the new error injection setting."
echo "  LocalStack data has been preserved."
echo ""
echo "To monitor errors: docker compose logs -f app"
echo "Backup saved to: $ENV_FILE_BACKUP"
