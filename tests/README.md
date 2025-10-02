# StoryMapJS Test Suite

This directory contains the test suite for StoryMapJS, organized into unit tests and integration tests.

## Test Organization

- **`unit_tests.py`** - Unit tests for Flask application logic (no external dependencies required)
- **`integration_tests.py`** - Integration tests that require the full Docker Compose stack

## Prerequisites

**For unit tests:** No special setup required - just run the tests.

**For integration tests:** The Docker Compose stack MUST be running before executing integration tests:

```bash
docker compose up
```

The integration tests connect to:
- **LocalStack S3** at `http://localhost:4566` (exposed from Docker)
- **PostgreSQL** at `localhost:5432` (exposed from Docker)

Make sure you've also run the setup scripts:
```bash
scripts/makebuckets.sh      # Create S3 buckets in LocalStack
scripts/create-tables.sh    # Create database tables
```

## Running Tests

The project uses **hatch** for test environment management with pytest.

### Unit Tests (No Docker Required)

```bash
# Run all unit tests
hatch run unit:test

# Run with coverage report
hatch run unit:test-cov

# Run in watch mode (re-runs on file changes)
hatch run unit:test-watch

# Run specific test
hatch run unit:test tests/unit_tests.py::test_specific_function
```

### Integration Tests ⚠️ Requires Docker Compose Stack Running

**IMPORTANT:** You MUST have the Docker Compose stack running before executing integration tests.

First, ensure the Docker Compose stack is running:

```bash
docker compose up
```

Then run integration tests:

```bash
# Run all integration tests
hatch run integration:test

# Run with detailed output
hatch run integration:test-slow

# Run specific test by name
hatch run integration:test -k test_save_from_data
```

### Development Environment

The dev environment includes all test tools plus linting and formatting:

```bash
# Run unit tests
hatch run dev:unit

# Run integration tests
hatch run dev:integration

# Run all tests
hatch run dev:all

# Lint code
hatch run dev:lint

# Format code
hatch run dev:format
```

## Test Markers

Tests are marked for easy filtering:

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (require Docker)
- `@pytest.mark.slow` - Slow-running tests

Run only unit tests:
```bash
hatch run dev:all -m unit
```

Run only integration tests:
```bash
hatch run dev:all -m integration
```

## Writing Tests

### Unit Tests

Unit tests should be fast and isolated, using mocks for external dependencies:

```python
import pytest
from unittest.mock import Mock, patch

@pytest.mark.unit
def test_my_function():
    # Arrange
    expected = "result"

    # Act
    actual = my_function()

    # Assert
    assert actual == expected
```

### Integration Tests

Integration tests verify the full stack, including database and S3:

```python
import pytest

@pytest.mark.integration
def test_full_workflow():
    # This test runs against the real Docker stack
    # and verifies end-to-end functionality
    pass
```

## Environment Setup

### Unit Test Environment

The unit test environment includes:
- pytest with coverage
- pytest-mock for mocking
- moto for mocking AWS services
- fakeredis for mocking Redis/Huey

### Integration Test Environment

The integration test environment includes:
- pytest with Docker support
- requests for HTTP testing
- selenium for browser testing (if needed)

## Current Status

✅ **Working:**
- Hatch test environment setup with pytest
- Unit test infrastructure (minimal tests currently)
- Integration test infrastructure with LocalStack S3 connectivity
- Proper endpoint configuration for host-based testing

⚠️ **Needs Expansion:** The test suite is currently minimal. Consider adding tests for:

- Flask API endpoints (authentication, CRUD operations)
- S3 storage operations (beyond basic save/retrieve)
- Database operations (user management, storymap persistence)
- Google OAuth authentication flows
- StoryMap editor functionality
- Error handling and edge cases
- End-to-end user workflows

## Configuration

Test configuration is in `pyproject.toml`:
- pytest settings under `[tool.pytest.ini_options]`
- hatch test environments under `[tool.hatch.envs.*]`
- coverage settings under `[tool.coverage.*]`
