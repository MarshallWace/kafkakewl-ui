FROM nikolaik/python-nodejs:python3.6-nodejs10-alpine

# the npm_config_registry build environment variable is exposed as build argument
ARG npm_config_registry
ENV npm_config_registry=$npm_config_registry

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN pip install -r requirements.txt && \
    ./build_extras.sh

CMD ["./run-ui.sh"]
