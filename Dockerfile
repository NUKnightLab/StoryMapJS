FROM python:3.8
ENV PYTHONUNBUFFERED 1
COPY ./requirements-dev.txt /usr/src/apps/StoryMapJS/
COPY ./.localstack/localhost.crt /usr/src/apps/StoryMapJS/
COPY ./.localstack/localhost.csr /usr/src/apps/StoryMapJS/
COPY ./.localstack/localhost.key /usr/src/apps/StoryMapJS/
COPY ./.localstack/localhost.pem /usr/src/apps/StoryMapJS/
COPY ./.localstack/server.test.pem.crt /usr/src/apps/StoryMapJS/
COPY ./.localstack/server.test.pem.key /usr/src/apps/StoryMapJS/
WORKDIR /usr/src/apps/StoryMapJS
RUN pip install --upgrade pip
RUN pip install -r requirements-dev.txt
