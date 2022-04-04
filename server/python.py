import io
import picamera
import logging
import socketserver
import random
import string
import os
import sys
from threading import Condition
from http import server, cookies
from urllib.parse import parse_qs
from cgi import parse_header, parse_multipart
import jwt

if not os.environ.get('PASSWORD'):
    print('Please define the `PASSWORD` variable.')
    sys.exit()

url = 'http://localhost:8888'
# url = 'https://big-brother.quentin-bellanger.com'
jwt_secret = ''.join(random.choices(string.ascii_uppercase + string.digits, k=20))
cookie_key = 'userId'

def generate_jwt():
    secret = jwt_secret
    token = jwt.encode(
        payload={},
        key=secret
    )

    return token

class StreamingOutput(object):
    def __init__(self):
        self.frame = None
        self.buffer = io.BytesIO()
        self.condition = Condition()

    def write(self, buf):
        if buf.startswith(b'\xff\xd8'):
            # New frame, copy the existing buffer's content and notify all
            # clients it's available
            self.buffer.truncate()
            with self.condition:
                self.frame = self.buffer.getvalue()
                self.condition.notify_all()
            self.buffer.seek(0)
        return self.buffer.write(buf)

class StreamingHandler(server.BaseHTTPRequestHandler):
    # créer une route post
    def parse_POST(self):
        ctype, pdict = parse_header(self.headers['content-type'])
        if ctype == 'application/x-www-form-urlencoded':
            length = int(self.headers['content-length'])
            postvars = parse_qs(
                    self.rfile.read(length),
                    keep_blank_values=1)
        else:
            postvars = {}
        return postvars

    def do_POST(self):
        postvars = self.parse_POST()
        password = postvars[b'password'][0]

        if password == bytes(os.environ.get('PASSWORD'), 'utf-8'):
            # Redirect
            self.send_response(301)
            self.send_header('Location', url)
            self.send_header('Set-Cookie', f'{cookie_key}={generate_jwt().decode()}')
            self.end_headers()
            self.wfile.write('welcome'.encode('utf-8'))
        else:
            self.send_response(403)
            self.end_headers()
            self.wfile.write('nope'.encode('utf-8'))

    def check_user_id(self):
        if not self.headers['cookie']:
            return False

        cookie_header = self.headers['cookie']
        c = cookies.SimpleCookie()
        c.load(cookie_header)

        if not c[cookie_key]:
            return False

        if not c[cookie_key].value:
            return False

        try:
            token = jwt.decode(c[cookie_key].value, key=jwt_secret)

        except jwt.exceptions.InvalidSignatureError as e:
            return False

        return True

    def do_GET(self):
        if self.path == '/stream.mjpg':
            if not self.check_user_id():
                self.send_error(403)
                self.end_headers()
                return

            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                logging.warning(
                    'Removed streaming client %s: %s',
                    self.client_address, str(e))
        else:
            self.send_error(404)
            self.end_headers()

class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

with picamera.PiCamera(resolution='640x480', framerate=24) as camera:
    output = StreamingOutput()
    camera.start_recording(output, format='mjpeg')
    try:
        address = ('', 2018)
        server = StreamingServer(address, StreamingHandler)
        server.serve_forever()
    finally:
        camera.stop_recording()
