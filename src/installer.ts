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
  titleId: string;
}

const INSTALL_REQUEST_TIMEOUT_MS = 90_000;
const DOWNLOAD_PROXY_URL = 'http://20.79.187.102/download';

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

export async function sendPackageToPs4(target: Ps4Target, packageUrl: string): Promise<void> {
  const installUrl = packageUrl.trim();
  const packageUri = parseInstallUrl(installUrl);
  const normalizedUrl = packageUri.toString();
  const proxiedUrl = getDownloadProxyUrl(normalizedUrl);
  const isManifest = packageUri.pathname.toLowerCase().endsWith('.json');
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
    'The PS4 did not respond within 90 seconds. It may be busy inspecting the package.',
  );

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`PS4 rejected the install request (${response.status}${responseText ? `: ${responseText}` : ''}).`);
  }

  if (responseText) {
    try {
      const result = JSON.parse(responseText) as { status?: string; error?: string; error_code?: string };
      if (result.status === 'fail') {
        throw new Error(result.error ?? `PS4 rejected the install request${result.error_code ? ` (${result.error_code})` : ''}.`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('PS4 rejected')) {
        throw error;
      }
    }
  }
}

export function getDownloadProxyUrl(packageUrl: string): string {
  return `${DOWNLOAD_PROXY_URL}?url=${encodeURIComponent(decodeURI(packageUrl))}`;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
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

  if (installUri.protocol !== 'http:' && installUri.protocol !== 'https:') {
    throw new Error('The install URL must use HTTP or HTTPS.');
  }

  const path = installUri.pathname.toLowerCase();
  if (!path.endsWith('.pkg') && !path.endsWith('.json')) {
    throw new Error('The URL must point to a PS4 package (.pkg) or manifest (.json).');
  }

  return installUri;
}
