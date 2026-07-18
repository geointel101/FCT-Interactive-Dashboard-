#!/usr/bin/env python3
"""
Local dev server with proper HTTP Range support.

Python's built-in `python3 -m http.server` ignores Range headers and
always returns the full file with a 200 status. The PMTiles vector-tile
format relies on Range requests to fetch small pieces of a large file
efficiently - without Range support, the map's data layers silently fail
to load even though the file is being served.

Usage:
    python3 serve.py [port]

Then open http://localhost:8000 (or your chosen port) in a browser.
"""
import http.server
import socketserver
import sys
import os
import re

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        if not os.path.exists(path):
            self.send_error(404, "File not found")
            return None

        file_size = os.path.getsize(path)
        range_header = self.headers.get("Range")

        if range_header:
            match = re.match(r"bytes=(\d*)-(\d*)", range_header)
            if match:
                start_str, end_str = match.groups()
                start = int(start_str) if start_str else 0
                end = int(end_str) if end_str else file_size - 1
                end = min(end, file_size - 1)
                length = end - start + 1

                f = open(path, "rb")
                f.seek(start)

                self.send_response(206)
                self.send_header("Content-type", self.guess_type(path))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                self.send_header("Content-Length", str(length))
                self.end_headers()

                self._range = (f, length)
                return f

        # No Range header: full file, but still advertise support
        f = open(path, "rb")
        self.send_response(200)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(file_size))
        self.end_headers()
        self._range = (f, file_size)
        return f

    def copyfile(self, source, outputfile):
        if hasattr(self, "_range"):
            f, length = self._range
            remaining = length
            buf_size = 64 * 1024
            while remaining > 0:
                chunk = f.read(min(buf_size, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
            f.close()
        else:
            super().copyfile(source, outputfile)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if __name__ == "__main__":
    with ThreadingHTTPServer(("", PORT), RangeRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}  (Range requests supported)")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
