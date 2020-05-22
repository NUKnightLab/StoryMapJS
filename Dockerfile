FROM python:3.7
ENV PYTHONUNBUFFERED 1
WORKDIR /usr/src/apps/
RUN git clone https://github.com/NUKnightLab/fablib.git
WORKDIR /usr/src/apps/StoryMapJS
COPY . .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
