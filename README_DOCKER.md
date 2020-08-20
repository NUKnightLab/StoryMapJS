

## Development


### Additional repositories

[fablib](https://github.com/NUKnightLab/fablib) and the
[knightlab cdn](https://github.com/NUKnightLab/cdn.knightlab.com) should be
co-resident with this repository:

```
$ cd ..
$ git clone git@github.com:NUKnightLab/fablib.git
$ git clone git@github.com:NUKnightLab/cdn.knightlab.com.git
```

### Install less

```
$ npm install -g npm
$ npm install less -g
$ npm install uglify-js -g 
```

### Build the static media

Build static to the build directory:

```
$ fab build
```

- **or** -

Build static and copy files to the dev location in the cdn repository:

```
$ fab stage_dev
```

Static files are hosted via an Nginx container from the build directory. See
the compose file for details.

### Setup ssl

```
$ ./makecerts.sh
```

Set SSL cert trust:

#### Firefox:

 * Preferences > Certificates
 * View certificates
 * Import: .localstack/KnightLabRoot.pem

#### Chrome (Mac):

Add the cert to keychain:

 * File > Import items ...
 * .localstack/server.test.pem
 * set trust SSL


For building static media, you will need a Python2 virtualenvironment with the
dependencies in `requirements.p2.txt` installed. See the fablib repo for static
build details.

### Run the stack

```
$ docker-compose up
```

### Connecting to postgres

```
 $ docker-compose run pg psql -h pg -U storymap
```
