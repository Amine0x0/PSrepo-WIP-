export interface InstallRequest {
  type: 'direct';
  packages: string[];
}

export interface Ps4Target {
  host: string;
  port: string;
}

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
  const packageUri = new URL(packageUrl);
  if (packageUri.protocol !== 'http:' && packageUri.protocol !== 'https:') {
    throw new Error('The package URL must use HTTP or HTTPS.');
  }
  if (!packageUri.pathname.toLowerCase().endsWith('.pkg')) {
    throw new Error('The selected file is not a PS4 package (.pkg).');
  }

  const response = await fetch(`${getPs4BaseUrl(target)}/api/install`, {
    method: 'POST',
    headers: {
      // Remote Package Installer's API examples use curl's default form
      // content type, even though the request body itself is JSON.
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({
      type: 'direct',
      packages: [packageUrl],
    } satisfies InstallRequest),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`PS4 rejected the install request (${response.status}${responseText ? `: ${responseText}` : ''}).`);
  }
}
