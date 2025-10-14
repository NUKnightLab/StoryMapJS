# Repository Guidelines

## Project Structure & Module Organization
StoryMapJS splits the front-end library and editor. JavaScript modules live under `src/js` in domain folders (`core`, `map`, `media`, `ui`); templates and styles sit in `src/template`, `src/css`, and `src/less`. Compiled bundles land in `dist/js`, while legacy assets remain in `compiled/`. Flask editor services reside in `storymap/`, and supporting config lives in `config.json`, `tasks/`, and `scripts/`. End-to-end Robot specs live in `robot_tests/`, with additional fixtures in `tests/` and `static/`.

## Build, Test, and Development Commands
Run `npm install` once to hydrate dependencies. Use `npx webpack -c webpack.dev.js` during development for live rebuilds with sourcemaps. `npm run build` generates production bundles and Less output, and `npm run dist` performs a clean rebuild of distributable assets. For the editor stack, execute `docker compose build` then `docker compose up`, followed by `scripts/makebuckets.sh` and `scripts/create-tables.sh` to prepare storage and tables. Targeted e2e checks run via `robot robot_tests/qunit.robot`.

## Coding Style & Naming Conventions
Write ES2015 JavaScript with four-space indentation, semicolons, and descriptive camelCase identifiers; constructors and classes stay PascalCase. Prefer `const`/`let` unless legacy `var` usage is required. Keep modules in their domain folders (e.g., new map helpers in `src/js/map`). Styles belong in Less files that mirror their JS counterparts.

## Testing Guidelines
Robot Framework drives automated coverage. Execute `robot robot_tests/storymaps.robot` for the full suite or use the QUnit-focused subset noted above. Add browser fixtures under `tests/` when expanding assertions, and document any manual template checks (e.g., `localhost:8000/src/template/arya.html`).

## Commit & Pull Request Guidelines
Use concise, present-tense commit messages (`pins werkzeug to 3.0.*`) and group related changes. Reference issues in the footer (`Refs #123`). Pull requests should summarize motivation, list test results or manual verification, and include UI screenshots or screencasts when rendering changes. Request review from `@NUKnightLab/storymap` maintainers and note CDN or Docker follow-up steps if workflows change.

## Security & Configuration Tips
Store secrets in `.env` (copy from `dotenv.example`) and keep OAuth credentials plus `CDN_URL` current. Run `scripts/makecerts.sh` before starting LocalStack so browsers trust generated certificates. Never commit real keys or rebuilt `compiled/` assets; rely on `npm run stage_latest` for deployments.
