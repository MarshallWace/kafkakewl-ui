# **kafkakewl-ui** Introduction

**kafkakewl-ui** is a web-app that shows [**kafkakewl**](https://github.com/MarshallWace/kafkakewl/tree/legacy-main) topologies, deployments, metrics, statuses.

# License

It's licensed under [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html#licenseText).

# Building, local development

## Installing dependencies
```
npm install
```

## Configuring

The `VUE_APP_KAFKAKEWL_API_URL` environment variable holds the url to the **kafkakewl-api** server. It defaults to `http://localhost:8080` and it can be changed in the `.env` file.

## Running with hot-reloading for development
```
npm run serve
```
# Deployment

## Dockerfile

It uses python/flask to serve those few static files after the build. Building the docker image is simple:
```bash
# the npm_config_registry build argument can point to your local npm registry too
docker build -t kafkakewl-ui --build-arg npm_config_registry=https://registry.npmjs.org .
```

When you run the built docker image, you need to set two environment variables:

`KAFKAKEWL_API_URL`: must point to the **kafkakewl-api** server

`KAFKAKEWL_DOCS_URL`: should point to some documentation site about about **kafkakewl**, this will appear in the web-site.

## Manual

It's possible to deploy it manually, without the Dockerfile. To do so you just need to make sure to run
`npm install` and then run `./run-ui.sh`. The building is done in the actual `run-ui.sh` script, but it doesn't take long.

The `KAFKAKEWL_API_URL` and `KAFKAKEWL_DOCS_URL` environment variables need to be set before running `run-ui.sh`.

