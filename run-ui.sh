#!/bin/sh

echo "building..."
cat <<EOF > ./.env.production
VUE_APP_KAFKAKEWL_API_URL=$KAFKAKEWL_API_URL
VUE_APP_KAFKAKEWL_DOCS_URL=$KAFKAKEWL_DOCS_URL
EOF
npm run build

echo "configuring locale..."
export LC_ALL=en_US.utf-8
export LANG=en_US.utf-8

echo "starting the server..."
export FLASK_APP=./app.py
flask run --port=${KAFKAKEWL_UI_HTTP_PORT:-8080} --host=0.0.0.0
