import http.server
import socketserver
import os

os.chdir('/Users/losculis/Documents/Carito/portfolio')

PORT = 3333
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
