# PS4 PKG installer test server

This is a small local replacement for the PS4 Remote PKG Installer API. It
prints incoming requests and install payloads to the terminal.

## Run

From the repository root:

```bash
python3 testserver/server.py
```

The server listens on port `12800` on all network interfaces.

In the mobile app, set the PS4 host to the computer's LAN IP address and keep
the port as `12800`. The phone and computer must be connected to the same
network.

## Supported endpoints

- `GET /api/is_exists` returns HTTP 200 so the app's connection test succeeds.
- `POST /api/install` logs and validates the JSON install request, then returns
  HTTP 200.
- `OPTIONS` responds to browser CORS preflight requests.

The server allows requests from any origin and permits `GET`, `POST`, and
`OPTIONS` with the `Content-Type` header.
