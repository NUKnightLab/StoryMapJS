FROM nginx:latest
RUN rm /etc/nginx/conf.d/default.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY ./localhost/cert.pem /etc/letsencrypt/live/knightlab.com/fullchain.pem
COPY ./localhost/key.pem /etc/letsencrypt/live/knightlab.com/privkey.pem
COPY ./minica.pem /etc/letsencrypt/live/knightlab.com/chain.pem
RUN ln -sf /dev/stdout /var/log/nginx/storymap.log \
	&& ln -sf /dev/stderr /var/log/nginx/storymap.err.log
