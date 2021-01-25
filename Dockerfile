FROM python:3.7
ENV PYTHONUNBUFFERED 1
COPY ./requirements-docker.txt /usr/src/apps/StoryMapJS/
COPY ./.localstack/server.test.pem.crt /usr/src/apps/StoryMapJS/
COPY ./.localstack/server.test.pem.key /usr/src/apps/StoryMapJS/
WORKDIR /usr/src/apps/StoryMapJS
RUN pip install --upgrade pip
RUN pip install -r requirements-docker.txt
