# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryMapJS is a tool for telling stories through the context of places on a map. The project consists of:
- **JavaScript library** (`src/js/`) - the client-side StoryMap viewer built with Leaflet
- **Python Flask backend** (`storymap/`) - web server for the StoryMap editor with Google OAuth authentication
- **Build system** - Webpack for JS bundling and LESS compilation

## Development Setup

### JavaScript Library Development

Build the JavaScript library:
```bash
npm install
npx webpack -c webpack.dev.js
```

For production builds:
```bash
npm run build        # Build for production
npm run dist         # Clean, build, and copy to dist/
npm run stage        # Build and stage to a specific version
npm run stage_latest # Build and stage to 'latest'
npm run stage_dev    # Build and stage to 'dev'
```

Test changes by running a local web server and navigating to templates, e.g., http://localhost:8000/src/template/arya.html

### Python Server Development

The Python Flask application requires Docker and LocalStack for S3 emulation.

**Prerequisites:**
- Docker installed
- AWS CLI installed with local profile configured in ~/.aws/credentials:
  ```
  [local]
  region=us-east-1
  endpoint-url=http://localhost:4566
  aws_access_key_id=localstack
  aws_secret_access_key=localstack
  ```

**Initial setup:**
```bash
# 1. Generate SSL certificates
scripts/makecerts.sh

# 2. Create .env file from template
cp dotenv.example .env
# Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (required for login)

# 3. Build and start services
docker compose build
docker compose up

# 4. In separate terminals, create S3 buckets and database tables
scripts/makebuckets.sh
scripts/create-tables.sh  # Password: storymap
```

Access the application at https://localhost (accept self-signed certificate).

### Testing

The project uses **hatch** for test environment management with pytest.

**Available test environments:**

1. **Unit Tests** (no Docker required):
```bash
hatch run unit:test              # Run unit tests
hatch run unit:test-cov          # Run with coverage report
hatch run unit:test-watch        # Run in watch mode
```

2. **Integration Tests** (requires Docker Compose running):
```bash
# First, ensure Docker stack is running:
docker compose up

# Then run integration tests:
hatch run integration:test       # Run integration tests
hatch run integration:test-slow  # Run with detailed output
```

3. **Development Environment** (all tools):
```bash
hatch run dev:unit               # Run unit tests
hatch run dev:integration        # Run integration tests
hatch run dev:all                # Run all tests
hatch run dev:lint               # Lint code with ruff
hatch run dev:format             # Format code with ruff
```

**Test markers:**
- `@pytest.mark.unit` - Unit tests (fast, no external dependencies)
- `@pytest.mark.integration` - Integration tests (require Docker stack)
- `@pytest.mark.slow` - Slow-running tests

**Running specific tests:**
```bash
hatch run unit:test tests/unit_tests.py::test_specific_function
hatch run integration:test -k test_save_from_data
```

Note: Current test suite is minimal and needs expansion.

## Architecture

### JavaScript Library (src/)

The library is organized into modular components:

- **src/js/core/** - Core StoryMap logic and data structures
- **src/js/map/** - Map rendering (primarily Leaflet-based)
- **src/js/slider/** - Slide navigation UI components
- **src/js/media/** - Media handling (images, video, etc.)
- **src/js/ui/** - UI components (navigation, controls)
- **src/js/language/** - Internationalization (i18n) with locale JSON files
- **src/js/animation/** - Animation utilities
- **src/less/** - LESS stylesheets

Entry point: `src/js/index.js`

Build output: `dist/js/storymap.js` (exposed as `KLStoryMap` global)

### Python Application (storymap/)

Flask-based web application with the following key modules:

- **storymap/api.py** - Main Flask application with all API routes and editor endpoints
- **storymap/storage.py** - S3 storage abstraction layer using boto3
- **storymap/connection.py** - PostgreSQL database connection and user management
- **storymap/googleauth.py** - Google OAuth authentication
- **storymap/tasks.py** - Huey task queue for async operations (e.g., cleanup)
- **storymap/core/settings.py** - Configuration loaded from environment variables
- **storymap/core/wsgi.py** - WSGI application entry point

The application uses:
- **PostgreSQL** (port 5432) - User data and StoryMap metadata stored as JSONB
- **LocalStack** (port 4566) - Local S3 emulation for development
- **Huey** - Task queue (separate container in docker-compose)
- **Gunicorn** - WSGI server with SSL (port 443 → 5000)

### Data Flow

1. Users authenticate via Google OAuth (storymap/googleauth.py)
2. User data stored in PostgreSQL `users` table with JSONB `storymaps` field
3. StoryMap content (JSON, images) stored in S3 buckets:
   - `uploads.knilab.com` - User uploads
   - `cdn.knilab.com` - Published storymaps
4. Editor UI loads from storymap/templates/ and compiled static from compiled/
5. Published storymaps load the library from CDN_URL (configured in .env)

### Environment Configuration

Critical environment variables (see dotenv.example):
- `FLASK_SECRET_KEY` - Flask session security
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `AWS_STORAGE_BUCKET_NAME`, `AWS_STORAGE_BUCKET_KEY` - S3 buckets
- `AWS_ENDPOINT_URL` - Set to http://localstack:4566 for local dev
- `CDN_URL` - URL for served static assets (can point to deployed CDN)
- `STATIC_URL` - URL for application static files
- `FLASK_SETTINGS_MODULE` - Settings module path (storymap.core.settings)
- `ADMINS` - Space-separated list of admin user IDs

### Docker Compose Services

- **app** - Flask application (gunicorn with SSL on port 443)
- **pg** - PostgreSQL 12.17 database
- **localstack** - S3 emulation for local development
- **huey** - Background task worker

Volumes are mounted for live code reloading: storymap/, dist/, compiled/

## Key Technical Details

### Static Asset Serving

The Flask app serves static JS/CSS from the `compiled/` directory. For local development, it's easiest to set `CDN_URL` environment variable to a deployed CDN rather than building and serving locally:
```
CDN_URL=https://cdn.knightlab.com/libs/storymapjs/latest/
```

### Webpack Configuration

Multiple webpack configs for different environments:
- `webpack.common.js` - Shared base configuration
- `webpack.dev.js` - Development build
- `webpack.prd.js` - Production build (used by npm run build)
- `webpack.stg.js` - Staging build

### Important Constraints

- **Werkzeug version pinned to 3.0.1** - Versions >= 3.1 break image uploads in the editor
- Python 3.12 is the target version
- Node version specified in .nvmrc

### Database Schema

The `users` table structure:
```sql
CREATE TABLE users (
  id serial PRIMARY KEY,
  uid varchar(32),
  uname varchar(100),
  migrated smallint,
  storymaps jsonb,
  CONSTRAINT unique_uid UNIQUE (uid)
);
```

### AWS/S3 Operations

Use AWS CLI with LocalStack for local development:
```bash
aws --profile local --endpoint-url=http://localhost:4566 s3 ls uploads.knilab.com/storymapjs/
```

### Language Translations

To add a new language translation, create a file like `src/js/language/locale/xx.json` where `xx` is the ISO 639-1 two-letter language code. Copy an existing translation file and translate the values (not the keys).

## Map Features

StoryMapJS supports various map modes and customization:
- **map_as_image** - Display image with markers (vs cartography mode with connecting lines)
- **GigaPixel** - Support for high-resolution images
- **Custom markers** - Use custom images/icons via `use_custom_markers` option
- Line customization options: `line_follows_path`, `line_color`, `line_weight`, `line_dash`, etc.
- `calculate_zoom` - Set to false to manually control zoom levels

## Userinfo Endpoint

The `/userinfo/` endpoint (https://storymap.knightlab.com/userinfo/) provides account and storymap information for troubleshooting user issues.
