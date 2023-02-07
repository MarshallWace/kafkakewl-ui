from flask import Flask, request, send_from_directory, send_file
from flask_compress import Compress

# static content comes from ./dist/static
app = Flask("app", static_folder="./dist/static", template_folder="./dist")
Compress(app)


# liveness
@app.route('/health')
def health():
    return "up and running!"


# favicon is special
@app.route('/favicon.ico')
def favicon():
    return send_file('./dist/favicon.ico')


# app.js is also special (older npm put it in the static folder but 6.4.1 puts in the the root next to index.html)
@app.route('/app.js')
def appjs():
    return send_file('./dist/app.js')


# for everything else just return index.html
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def home(path):
    return send_file('./dist/index.html')
