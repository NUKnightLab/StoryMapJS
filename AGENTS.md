# Repository Guidelines

## Project Structure & Module Organization
StoryMapJS separates the front-end library and editing stack. Library code lives in `src/js`, grouped into `core`, `map`, `media`, and `ui`; templates and assets live beside it (`src/template`, `src/css`, `src/less`). Built bundles are emitted to `dist/js` while legacy compiled assets live in `compiled`. Python Flask editor code sits in `storymap/`, with configuration helpers under `config.json`, `tasks/`, and `scripts/`. End-to-end specs reside in `robot_tests/`; additional fixtures and sample data live under `tests/` and `static/`.

## Build, Test, and Development Commands
Run `npm install` once to fetch frontend dependencies. Use `npx webpack -c webpack.dev.js` while iterating to rebuild the library with sourcemaps; `npm run build` creates the production bundle and Less styles. `npm run dist` cleans and rebuilds distributable assets, and `npm run stage_latest` pushes to the staging CDN alias. For the editor stack, `docker compose build` then `docker compose up` starts the Flask/LocalStack environment, followed by `scripts/makebuckets.sh` and `scripts/create-tables.sh` for storage and database setup.

## Coding Style & Naming Conventions
JavaScript modules use ES2015 syntax with four-space indentation, semicolons, and descriptive camelCase identifiers; classes and constructor functions remain PascalCase to match existing exports. Favor `const`/`let` over `var` in new code unless a legacy pattern demands otherwise. Keep files within their existing domain folder (e.g., new map helpers in `src/js/map`). Stylesheets are authored in Less; mirror the naming of the companion JS module.

## Testing Guidelines
Automated coverage focuses on Robot Framework suites in `robot_tests/`. Use `robot robot_tests/storymaps.robot` for the full regression, or target `robot robot_tests/qunit.robot` when verifying the embedded QUnit harness. While `npm test` is a placeholder, please exercise new features via `localhost:8000/src/template/arya.html` or relevant templates and document manual checks in the PR. Add fixtures under `tests/` when expanding browser-based assertions.

## Commit & Pull Request Guidelines
Follow the concise, present-tense style seen in `git log` (e.g., `pins werkzeug to 3.0.*`). Group related changes, include issue references in the footer (`Refs #123`), and avoid bundling unrelated fixes. Pull requests should explain the motivation, outline testing (command output or manual steps), and attach UI screenshots or screencasts when the change affects rendering. Request review from @NUKnightLab/storymap maintainers and confirm CDN or docker instructions when deployment steps change.

## Environment & Security Tips
Secrets belong in `.env`; start by copying `dotenv.example` and supply OAuth credentials plus `CDN_URL`. Run `scripts/makecerts.sh` before bringing up localstack so browsers trust the generated certificate. Never commit real keys or the compiled `compiled/` assets; deploy via the staging commands instead.
