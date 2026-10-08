#!/usr/bin/env python3
"""Small local stand-in for the PS4 Remote PKG Installer server."""

from __future__ import annotations

import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import unquote


HOST = "0.0.0.0"
PORT = 12800

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("testserver")


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "PS4PkgInstallerTestServer/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        logger.info("%s - %s", self.address_string(), format % args)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        self._log_request()

        if self.path == "/api/is_exists":
            self._send_json(
                200,
                {
                    "exists": True,
                    "message": "Test PS4 Remote PKG Installer is reachable.",
                },
            )
            return

        self._send_json(404, {"error": "Not found"})

    def validate_install(payload):
        t = payload.get("type")
        if t == "direct":
            pk = payload.get("packages")
            if pk is None:
                return "No 'packages' parameter specified."
            if not isinstance(pk, list):
                return "Invalid type for parameter 'packages'."
            for p in pk:
                if not isinstance(p, str):
                    return "Invalid type for element of parameter 'packages'."
                if not p:
                    return "Empty element value of parameter 'packages'."
                if not unquote(p).startswith(("http://", "https://")):
                    return "Unexpected element value of parameter 'packages'."
            if not pk:
                return "No packages."
        elif t == "ref_pkg_url":
            u = payload.get("url")
            if not isinstance(u, str) or not unquote(u).startswith(("http://", "https://")):
                return "Unexpected element value of parameter 'url'."
        else:
            return f"Invalid type '{t}'."
        return None

    def do_POST(self) -> None:
        self._log_request()

        content_length = self.headers.get("Content-Length")
        try:
            body = self.rfile.read(int(content_length or 0))
            payload = json.loads(body) if body else {}
        except (ValueError, json.JSONDecodeError) as error:
            logger.warning("Invalid JSON request: %s", error)
            self._send_json(400, {"error": "Request body must be valid JSON."})
            return

        if self.path == "/api/is_exists":
            if not isinstance(payload.get("title_id"), str):
                self._send_json(400, {"error": "title_id is required."})
                return
            self._send_json(
                200,
                {
                    "status": "success",
                    "exists": False,
                },
            )
            return

        if self.path != "/api/install":
            self._send_json(404, {"error": "Not found"})
            return

        logger.info("Install payload: %s", json.dumps(payload, indent=2))
        packages = payload.get("packages")
        is_direct = payload.get("type") == "direct" and isinstance(packages, list)
        is_manifest = payload.get("type") == "ref_pkg_url" and isinstance(payload.get("url"), str)
        if not (is_direct or is_manifest):
            self._send_json(
                400,
                {"error": "Expected a direct packages array or ref_pkg_url manifest."},
            )
            return

        self._send_json(
            200,
            {
                "status": "success",
                "task_id": 1,
                "packages": len(packages) if is_direct else 1,
                "title": "Test package",
            },
        )

    def _log_request(self) -> None:
        logger.info(
            "%s %s from %s",
            self.command,
            self.path,
            self.client_address[0],
        )
        for name, value in self.headers.items():
            logger.info("  header %s: %s", name, value)

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(response)

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), RequestHandler)
    logger.info("Listening on http://%s:%d", HOST, PORT)
    logger.info("Set the mobile app target to this computer's LAN IP and port %d.", PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping test server.")
    finally:
        server.server_close()
