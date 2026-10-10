export type InstallRequest =
  | {
      type: 'direct';
      packages: string[];
    }
  | {
      type: 'ref_pkg_url';
      url: string;
    };

export interface Ps4Target {
  host: string;
  port: string;
}

export interface Ps4InstallResponse {
  status: number;
  statusText: string;
  body: string;
}

const INSTALL_REQUEST_TIMEOUT_MS = 30_000;
const RESPONSE_BODY_TIMEOUT_MS = 5_000;
const PROXY_BASE_URL = 'http://20.79.187.102';

export function getPs4BaseUrl(target: Ps4Target): string {
  const host = target.host.trim();
  const port = Number.parseInt(target.port.trim(), 10);

  if (!host || /[^a-zA-Z0-9.:[\]-]/.test(host)) {
    throw new Error('Enter a valid PS4 IP address or hostname.');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Enter a port between 1 and 65535.');
  }

  return `http://${host}:${port}`;
}

export async function sendPackageToPs4(target: Ps4Target, packageUrl: string): Promise<Ps4InstallResponse> {
  const installUrl = packageUrl.trim();
  const packageUri = parseInstallUrl(installUrl);
  const normalizedUrl = packageUri.toString();
  const isManifest = packageUri.pathname.toLowerCase().endsWith('.json');
  const proxiedUrl = getDownloadProxyUrl(normalizedUrl, isManifest ? 'manifest.json' : 'package.pkg');
  const request: InstallRequest = isManifest
    ? { type: 'ref_pkg_url', url: proxiedUrl }
    : { type: 'direct', packages: [proxiedUrl] };

  const response = await fetchWithTimeout(
    `${getPs4BaseUrl(target)}/api/install`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(request),
    },
    INSTALL_REQUEST_TIMEOUT_MS,
    `The PS4 did not respond within 30 seconds at ${getPs4BaseUrl(target)}. Keep Remote Package Installer focused on the PS4 and verify that it is listening on port ${target.port.trim()}.`,
  );

  const responseText = await readResponseBody(response);
  const result = {
    status: response.status,
    statusText: response.statusText,
    body: responseText,
  };

  if (!response.ok) {
    throw new Error(`PS4 rejected the install request (${response.status}${responseText ? `: ${responseText}` : ''}).`);
  }

  return result;
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    return await Promise.race([
      response.text(),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('[response body did not finish within 5 seconds]'), RESPONSE_BODY_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return '[unable to read response body]';
  }
}

/**
 * The PS4 installer appears to percent-decode the request body (it is sent as
 * application/x-www-form-urlencoded), which turns %20 into a raw space and
 * breaks any URL carrying an encoded URL inside its query string.
 *
 * So the real package URL travels as a base64url token inside the path. That
 * alphabet (A-Z a-z 0-9 - _) is unchanged by percent-decoding. The proxy
 * decodes the token and rebuilds the archive.org URL. The trailing file name
 * is ignored by the proxy; it only keeps the URL ending in .pkg / .json.
 */
export function getDownloadProxyUrl(packageUrl: string, fileName = 'package.pkg'): string {
  return `${PROXY_BASE_URL}/dl/${toBase64Url(packageUrl)}/${fileName}`;
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Input must be ASCII. A string from new URL(...).toString() always is.
// Pure JS on purpose: btoa is not available on every React Native build.
function toBase64Url(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i += 3) {
    const has1 = i + 1 < input.length;
    const has2 = i + 2 < input.length;
    const b0 = input.charCodeAt(i);
    const b1 = has1 ? input.charCodeAt(i + 1) : 0;
    const b2 = has2 ? input.charCodeAt(i + 2) : 0;

    if (b0 > 127 || b1 > 127 || b2 > 127) {
      throw new Error('The package URL contains non-ASCII characters.');
    }

    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 3) << 4) | (b1 >> 4)];
    if (has1) out += BASE64URL_ALPHABET[((b1 & 15) << 2) | (b2 >> 6)];
    if (has2) out += BASE64URL_ALPHABET[b2 & 63];
  }
  return out;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseInstallUrl(value: string): URL {
  let installUri: URL;
  try {
    installUri = new URL(value);
  } catch {
    throw new Error('Enter a valid HTTP or HTTPS package or manifest URL.');
  }

  if (installUri.origin === new URL(PROXY_BASE_URL).origin) {
    // Old-style proxy link (/download?url=...): unwrap it to the source URL.
    if (installUri.pathname === '/download') {
      const sourceUrl = installUri.searchParams.get('url');
      if (!sourceUrl) {
        throw new Error('The download proxy URL must include a source package URL.');
      }

      try {
        installUri = new URL(sourceUrl);
      } catch {
        throw new Error('The download proxy URL contains an invalid source URL.');
      }
    } else {
      throw new Error('Paste the original package URL, not a link to the download proxy.');
    }
  }

  if (installUri.protocol !== 'http:' && installUri.protocol !== 'https:') {
    throw new Error('The install URL must use HTTP or HTTPS.');
  }

  const path = installUri.pathname.toLowerCase();
  if (!path.endsWith('.pkg') && !path.endsWith('.json')) {
    throw new Error('The URL must point to a PS4 package (.pkg) or manifest (.json).');
  }

  return installUri;
}