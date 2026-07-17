# Developing StoryMapJS - the javascript library

When you make changes to the code, you should execute the build command. To
test your changes, run a simple local web server in the project root and
navigate, e.g. to http://localhost:8000/src/template/arya.html.

Install the dependencies and build the javascript:

```
 $ npm install
 $ npx webpack -c webpack.dev.js
```

# StoryMap editor development - the python server

## Questions not yet completely addressed with the new localstack based setup:


## Which StoryMap viewer library the editor loads

The editor renders slide media — and the map preview — using the compiled
StoryMap viewer library (`storymap.js` + `storymap.css`). Two environment
variables control where those assets come from:

- `CDN_URL` — base URL for shared assets (fonts, embed pages, etc.).
- `STORYMAP_LIB_URL` — base URL for the **viewer library** specifically.
  Defaults to `CDN_URL` when unset.

Splitting these lets you keep `CDN_URL` pointed at a deployed CDN for
convenience while independently loading the viewer library from a local build
when you are working on the library itself.

### Development modes

| `STORYMAP_LIB_URL` | Editor loads the viewer from | Use when |
| --- | --- | --- |
| *(unset)* | whatever `CDN_URL` is (e.g. the deployed CDN) | working on the editor/server, not the library |
| `/compiled/` | your local `npm run build` output in `dist/`, served by the `/compiled/` route | testing library changes before they are deployed |

Pointing `CDN_URL` at a deployed CDN remains the easiest default when you have
no need to host the library locally:

```
   CDN_URL=https://cdn.knightlab.com/libs/storymapjs/latest/
```

To load the **local** build instead, set the library override in `.env`:

```
   STORYMAP_LIB_URL=/compiled/
```

Then build the library and recreate the app container so it picks up the env
change (a plain `docker compose restart` does NOT reload env-file values):

```
 $ npm run build                              # writes dist/js/storymap.js + dist/css/storymap.css
 $ docker compose up -d --force-recreate app
```

`dist/` is bind-mounted into the container, so for subsequent library changes
you only need to re-run `npm run build` and hard-reload the browser — no
container recreate required.

### Verifying which library version is loaded

Browser tabs cache the library, so after switching modes or rebuilding you must
hard-reload the editor (Cmd/Ctrl+Shift+R). A tab opened *before* you changed
`STORYMAP_LIB_URL` (or before a rebuild) keeps running the previously loaded
bundle in memory — a common source of "my change isn't showing up" confusion.

To confirm which bundle a page is actually running, open the browser console
and run:

```js
document.querySelector('script[src*="storymap.js"]').src
```

- `.../compiled/js/storymap.js` → the local build (your uncommitted changes).
- `https://cdn.knightlab.com/libs/storymapjs/latest/...` → the deployed CDN build.

If the src is not what you expect, hard-reload the tab.

## Overview / tl;dr

To get started you will need to do the following steps which are described in
more detail below:

 * install docker
 * install the aws cli
 * build and import ssl certs
 * create a .env file
 * docker-compose build and up
 * create the s3 buckets in localstack
 * create the users table in postgres


## Getting started developing StoryMap with docker-compose


### Prerequisite installs

 * [Docker](https://docs.docker.com/) installed.
 * [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

   You will need a local credentials configuration in your ~/.aws/credentials file:

    ```
    [local]
    region=us-east-1
    endpoint-url=http://localhost:4566
    aws_access_key_id=localstack
    aws_secret_access_key=localstack
    ```


### Build ssl certs for localstack

Localstack would automatically create ssl certs, but without authority, thus
making the stack inaccesible via the browser. Instead, we generate a certificate
chain with authority using the server.test filenames that localstack expects.

This should be done before bringing up the stack so that localstack will use the
generated cert.

Execute the following from the repo root:

```
 $ scripts/makecerts.sh
```

#### Import the web cert to your browser

**Note:** If you want to view a share link, ie. a StoryMap directly from the
localstack hosted s3, you can do it via http rather than https. The backend
calls to localstack should still work without this import.

Note: on Mac, hit CMD+SHIFT+. to see dotted files in the finder.

 * For Firefox:
    - Preferences >
    - Certificates >
    - View Certificates >
    - Authorities >
    - Import .localstack/KnightLabRootCA.pem


### Create a .env file

```
 $ cp dotenv.example .env
```

Fill in the missing keys and other secret info. The following are required:

Needed to login to StoryMap:
 * GOOGLE_CLIENT_ID
 * GOOGLE_CLIENT_SECRET



### Run the development docker-compose stack

```
 $ docker compose build
 $ docker compose up
```


### Create the s3 buckets

After the services come up, create the required buckets:

```
 $ scripts/makebuckets.sh
```

### Create the users table

```
 $ scripts/create-tables.sh
```

Note: If prompted for the password of the storymap user, it is `storymap`


### Open application

Navigate to `https://localhost` and accept the self-signed certificate.


## Docker troubleshooting

Some commands to know:

```
 $ docker compose images
 $ docker compose up --remove-orphans
 $ docker ps
 $ docker stop
 $ docker system prune
 $ docker volume ls
 $ docker volume rm
```


## Using LocalStack

See the [LocalStack docs](https://docs.localstack.cloud/integrations/aws-cli/) for details.

One approach: use [awslocal](https://docs.localstack.cloud/integrations/aws-cli/#localstack-aws-cli-awslocal)

Or just use the aws cli with a localized profile


### Using the aws cli

Configure a profile in your ~/.aws/credentials:

```

[local]
aws_access_key_id=test
aws_secret_access_key=test
```

Specify the profile and endpoint for s3 operations. Optionally, specify --debug:

```
aws [--debug] --profile local --endpoint-url=http://localhost:4566 s3 ...
```

E.g.:

```
aws --profile local --endpoint-url=http://localhost:4566 s3 ls uploads.knilab.com/storymapjs/
```

Note that there has not been a lot of interest from the cli dev team in [making
endpoint-url profile configurable](https://github.com/aws/aws-cli/issues/1270), although
this [may be changing](https://github.com/aws/aws-sdk/issues/229).


## Testing

StoryMapJS uses a comprehensive test suite with both unit and integration tests. See [tests/README.md](tests/README.md) for detailed testing documentation.

**Quick start:**

```bash
# Unit tests (no Docker required)
hatch run unit:test

# Integration tests (requires Docker Compose stack running)
docker compose up
hatch run integration:test
```

For more information on test setup, writing tests, and available commands, see the [Testing Guide](tests/README.md).
