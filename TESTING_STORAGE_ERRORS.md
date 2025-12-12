# Testing Storage Error Handling

This document explains how to force storage errors for testing the user experience when S3 operations fail.

## Overview

The storage module (`storymap/storage.py`) includes an error injection system controlled by the `FORCE_STORAGE_ERROR` environment variable. This allows you to selectively fail read operations, write operations, or both, to test how the application handles various failure scenarios.

## Syntax

```
FORCE_STORAGE_ERROR=error_type[:operation]
```

- **error_type** (required): Type of error to simulate
- **operation** (optional): `:read`, `:write`, or omit for all operations

## Available Error Types

| Error Type   | Description                                      | User Message                                          |
|--------------|--------------------------------------------------|-------------------------------------------------------|
| `connection` | Simulates S3 connection failure                  | "Could not connect to document store"                 |
| `timeout`    | Simulates request timeout                        | "Request timeout while accessing document store"      |
| `permission` | Simulates permission denied                      | "Permission denied accessing document store"          |
| `notfound`   | Simulates document not found                     | "Document not found in store"                         |
| `corrupt`    | Simulates corrupted/invalid data                 | "Document data is corrupted or invalid"               |

## Operation Types

### Read Operations
These operations retrieve data from S3:
- `load_json` - Load StoryMap data
- `get_contents` - Get file contents
- `get_contents_as_string` - Get file as string
- `list_keys` - List S3 keys
- `list_key_names` - List key names

### Write Operations
These operations modify data in S3:
- `save_json` - Save StoryMap data
- `save_from_data` - Save file from data
- `save_bytes_from_data` - Save bytes
- `save_from_url` - Download and save from URL
- `copy_key` - Copy S3 object
- `delete_key` - Delete single object
- `delete_keys` - Delete multiple objects

## Quick Start Examples

### Example 1: Test Write Errors Only (Recommended for Testing Saves)

This lets you open/load StoryMaps normally but fails when trying to save:

1. Add to your `.env` file:
   ```bash
   FORCE_STORAGE_ERROR=connection:write
   ```

2. Recreate the app container to pick up the environment variable:
   ```bash
   docker compose up -d app
   ```

3. Test: You can now load StoryMaps normally, but saves/uploads will fail

### Example 2: Test Read Errors Only

This lets you save data but fails when trying to load:

```bash
FORCE_STORAGE_ERROR=timeout:read
```

### Example 3: Test All Operations Failing

This fails both reads and writes:

```bash
FORCE_STORAGE_ERROR=connection
```

### Using the Helper Script

The helper script provides usage information but you'll still need to manually edit `.env` and recreate the container:

```bash
# Show usage and examples
./scripts/test-storage-errors.sh

# To use:
# 1. Edit .env and add: FORCE_STORAGE_ERROR=connection:write
# 2. Run: docker compose up -d app

# To clear:
# 1. Remove FORCE_STORAGE_ERROR from .env
# 2. Run: docker compose up -d app
```

## Configuration Methods

### Method 1: Environment Variable in Docker (Recommended)

1. Add to your `.env` file:
   ```bash
   FORCE_STORAGE_ERROR=connection:write
   ```

2. **IMPORTANT**: Recreate the app container to pick up the new environment variable:
   ```bash
   docker compose up -d app
   ```

   **Note**: `docker compose restart app` will NOT work because it doesn't reload environment variables from `.env`. You must use `docker compose up -d app` to recreate the container.

3. To clear, remove the line from `.env` and recreate again:
   ```bash
   # Remove FORCE_STORAGE_ERROR from .env
   docker compose up -d app
   ```

### Method 2: Temporary Override

Set the environment variable directly in `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      FORCE_STORAGE_ERROR: timeout:write
```

Then recreate the container: `docker compose up -d app`

## Testing Workflow

1. **Choose an error type and operation**:
   - `connection:write` - Test save failures while allowing loads
   - `notfound:read` - Test load failures while allowing saves
   - `connection` - Test complete storage failure

2. **Set the environment variable** using one of the methods above

3. **Recreate the app container** to apply the change:
   ```bash
   docker compose up -d app
   ```

   **Important**: This preserves LocalStack data while picking up the new environment variable.

4. **Perform storage operations** in the application:
   - **Test reads**: Load a StoryMap, list images
   - **Test writes**: Save/update a StoryMap, upload an image, delete a StoryMap

5. **Observe the error handling** in the UI

6. **Check the logs** for detailed error messages:
   ```bash
   docker compose logs -f app
   ```

   Look for lines like:
   ```
   [ERROR INJECTION] Forcing write error 'connection' on save_json()
   ```

## Expected Behavior

When a `StorageException` is raised:

1. **API Response**: JSON with `error` and `error_detail` fields
2. **HTTP Status**: Usually 200 (errors are in JSON body)
3. **Logging**: Error is logged to app container logs
4. **User Experience**: Should see error message in the UI

Example API error response:
```json
{
  "error": "Could not connect to document store: Simulated connection error",
  "error_detail": "FORCE_STORAGE_ERROR=connection:write - Simulated connection failure on write operation"
}
```

## Affected Endpoints

### Read Operations
These endpoints will fail with `read:*` errors:
- `GET /storymap/` - Load StoryMap (calls `load_json`)
- `GET /storymap/images/<id>` - List images (calls `list_key_names`)
- `GET /storymap/export/` - Export StoryMap (calls `get_contents_as_string`, `list_keys`)

### Write Operations
These endpoints will fail with `write:*` errors:
- `POST /storymap/save/` - Save StoryMap (calls `save_json`)
- `POST /storymap/update/<id>` - Update StoryMap (calls `save_json`)
- `POST /storymap/publish/<id>` - Publish StoryMap (calls `save_json`)
- `POST /storymap/image/upload/<id>` - Upload image (calls `save_from_data`)
- `POST /storymap/copy/` - Copy StoryMap (calls `save_json`, `copy_key`)
- `POST /storymap/delete/` - Delete StoryMap (calls `delete_keys`)

### All Operations
These endpoints use both reads and writes, so will fail with any error type:
- `POST /storymap/copy/` - Reads source, writes destination

## Debugging Tips

1. **Check container logs**: `docker compose logs -f app` to see `[ERROR INJECTION]` messages
2. **Browser DevTools**: Network tab to see API responses
3. **Test incrementally**: Test one error type at a time
4. **Clear between tests**: Remove `FORCE_STORAGE_ERROR` and restart to return to normal operation

## Removing Error Injection

To return to normal operation:

1. Remove `FORCE_STORAGE_ERROR` from `.env` or `docker-compose.yml`
2. Recreate the app container: `docker compose up -d app`
3. Verify normal operation

**Note**: LocalStack data will be preserved during this process.

## Notes

- Error injection applies to **all storage operations**, not just specific functions
- The error is raised **before** any actual S3 operation occurs
- This is a **development/testing feature only** - should not be used in production
- Error messages are designed to be user-friendly while providing detail for debugging
