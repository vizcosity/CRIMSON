# Waitress wrapper for flask, suitable for production.
from waitress import serve
from webserver_flask import app
import os

_PORT = os.environ.get('PORT')
_PORT = _PORT if _PORT is not None else '5373'

print("DETECTION API | Running on port " + str(_PORT))

serve(app, host='0.0.0.0', port=_PORT)
