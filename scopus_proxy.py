#!/usr/bin/env python3
"""
Scopus Proxy Server — RGBrito PhD Tool
Corre localmente para evitar o bloqueio CORS da API do Scopus.

Uso:
pip install requests
python scopus_proxy.py

Depois abre o scopus-phd-explorer.html no browser.
"""

import json
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8765


class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"  → {args[0]} {args[1]}")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._respond(200, {"status": "ok", "message": "Proxy Scopus a funcionar!"})
            return

        if not self.path.startswith("/scopus"):
            self._respond(404, {"error": "Rota não encontrada"})
            return

        # Extract headers
        api_key    = self.headers.get("X-ELS-APIKey", "")
        inst_token = self.headers.get("X-ELS-Insttoken", "")

        if not api_key:
            self._respond(401, {"error": "API Key em falta"})
            return

        # Forward query string to Scopus
        qs = self.path.split("?", 1)[1] if "?" in self.path else ""
        scopus_url = f"https://api.elsevier.com/content/search/scopus?{qs}"

        req = urllib.request.Request(scopus_url)
        req.add_header("X-ELS-APIKey", api_key)
        req.add_header("Accept", "application/json")
        if inst_token:
            req.add_header("X-ELS-Insttoken", inst_token)

        try:
            print(f"  Scopus ← {scopus_url[:120]}...")
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read()
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            self._respond(e.code, {"error": f"Scopus devolveu {e.code}", "detail": body[:300]})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "X-ELS-APIKey, X-ELS-Insttoken, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")

    def _respond(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    print("=" * 50)
    print("  Scopus Proxy — PhD GTM Sustentável")
    print("=" * 50)
    print(f"\n  Servidor a correr em http://localhost:{PORT}")
    print("  Abre agora o scopus-phd-explorer.html no browser.")
    print("\n  Ctrl+C para parar.\n")
    server = HTTPServer(("localhost", PORT), ProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor parado.")
