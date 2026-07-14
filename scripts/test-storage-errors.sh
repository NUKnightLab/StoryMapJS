#!/usr/bin/env bash
#
# Helper script to test storage error handling in the StoryMapJS application
#
# Usage: ./scripts/test-storage-errors.sh error_type[:operation]
#
# Error types (required):
#   connection - Simulates S3 connection failure
#   timeout    - Simulates request timeout
#   permission - Simulates permission denied
#   notfound   - Simulates document not found
#   corrupt    - Simulates corrupted data
#   clear      - Clears the error injection (normal operation)
#
# Operation types (optional):
#   :read   - Only fail on read operations (load, list)
#   :write  - Only fail on write operations (save, upload, delete)
#   (none)  - Fail on all operations
#
# Examples:
#   ./scripts/test-storage-errors.sh connection:write  # Only fail writes
#   ./scripts/test-storage-errors.sh timeout:read      # Only fail reads
#   ./scripts/test-storage-errors.sh connection        # Fail all operations
#

set -e

ERROR_SPEC="${1:-}"

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

if [ "$ERROR_SPEC" = "clear" ]; then
    echo "Clearing storage error injection..."
    docker compose exec app sh -c 'unset FORCE_STORAGE_ERROR && echo "Error injection cleared. Restart the app container to apply."'
    echo ""
    echo "To apply this change, restart the app:"
    echo "  docker compose restart app"
else
    echo "Setting FORCE_STORAGE_ERROR=$ERROR_SPEC"
    echo ""

    # Parse and explain the error spec
    if [[ "$ERROR_SPEC" == *:read ]]; then
        echo "This will cause READ operations (load, list) to fail."
        echo "WRITE operations (save, upload, delete) will work normally."
    elif [[ "$ERROR_SPEC" == *:write ]]; then
        echo "This will cause WRITE operations (save, upload, delete) to fail."
        echo "READ operations (load, list) will work normally."
    else
        echo "This will cause ALL storage operations to fail."
    fi

    echo ""
    echo "To apply this setting, you need to:"
    echo "  1. Add 'FORCE_STORAGE_ERROR=$ERROR_SPEC' to your .env file, or"
    echo "  2. Set it in docker-compose.yml under app.environment, then"
    echo "  3. Run: docker compose restart app"
    echo ""
    echo "To clear the error injection, run: $0 clear"
    echo ""
    echo "Monitor with: docker compose logs -f app"
fi
