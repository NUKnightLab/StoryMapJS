# StoryMap development quickstart

## Questions not yet completely addressed:

 * Built static is served directly from the `compiled` directory. What is the process in development for building/reloading this?
 * Related: our overall build management depends on Fabric and fablib. What is the best way to get this working in this context?
 * Which parts of the SSL process below are actually needed? Flask is now using `adhoc` ssl context. Not sure what localstack actually needs here, but share links can be directly accessed via http. The current process requires accepting the self-signed cert every time the stack is restarted, so maybe we will want to revert to a process that actually uses certs with Flask?


## Getting started developing StoryMap with docker-compose

### Install docker-compose

Be sure to have Docker and (docker-compose)[https://docs.docker.com/compose/] installed.


### Build ssl certs for localstack

Localstack would automatically create ssl certs, but without authority, thus making the stack inaccesible via the browser. Instead, we generate a certificate chain with authority using the server.test filenames that localstack expects. This cert is then also used by gunicorn for securing the editor.

```
 $ ./makecerts.sh
```

Import the new cert:

 * Trust cert. E.g.: Apple Keychain > System. File > Import items: .localstack/server.test.pem

this will create a localhost.storymap in your Keychain which you will need to set to trust.

**Note:** It is not clear if this Firefox import works correctly. If you want to view a share link, ie. a StoryMap directly from the localstack hosted s3, you can do it via http rather than https. The backend calls to localstack should still work without this import.

Note: on Mac, hit CMD+SHIFT+. to see dotted files in the finder.

 * For Firefox:
    - Preferences >
    - Certificates >
    - View Certificates >
    - Your Certificates >
    - Import .localstack/KnightLabRootCA.pem


### Create a .env file

```
 $ cp dotenv.example .env
```

Fill in the missing keys and other secret info.


### Run the development docker-compose stack

```
 $ docker-compose build
 $ docker-compose up
```


### Create the s3 buckets

After the services come up, create the required buckets:

```
 $ ./makebuckets.sh
```

### Create the users table

```
 $ ./create-tables.sh
```


### Open application

Navigate to `https://localhost` and accept the self-signed certificate.


## Docker troubleshooting

Some commands to know:

```
 $ docker-compose images
 $ docker-compose up --remove-orphans
 $ docker ps
 $ docker stop
 $ docker system prune
 $ docker volume ls
 $ docker volume rm
```
