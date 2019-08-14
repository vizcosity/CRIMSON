# Waitress wrapper for flask, suitable for production.
from waitress import serve
from webserver_flask import app
serve(app, host='0.0.0.0', port='5373')
