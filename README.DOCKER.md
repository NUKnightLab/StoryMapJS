## Alternative localized "deployment"


This configuration looks more like deployment, but is slightly more awkward for
development, particularly for making changes to static files:

`docker-compose.local.yml` will:

 * start a postgres container
 * start an Nginx container
 * start an application container and run the application via gunicorn

The application is served internally on socket file which is proxied to port 80 on the localhost.

If running the local deployment on https, you will need to create ssl certs. Be sure
to have [minica](https://github.com/jsha/minica) installed, then:

```
$ cd nginx
$ minica --domains localhost 
```

This will create the following gitignored files that will be copied into the nginx build
(see the nginx Dockerfile for details):

 * nginx/localhost/cert.pem
 * nginx/localhost/key.pem
 * minica.pem


```
$ docker-compose -f docker-compose.local.yml build
$ docker-compose -f docker-compose.local.yml up
```
Go to: http://localhost or https://localhost

