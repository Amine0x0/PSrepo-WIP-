# PSrepo

PSrepo is an Android-first Expo/React Native client for browsing a PS4 PKG
repository and sending a selected package URL to a PS4 running Remote PKG
Installer.

## Current behavior

1. On startup, the app requests the 26 Archive.org metadata buckets named
   `ps4-fpkg-collection-english-a` through `...-z`.
2. It keeps files whose names end in `.pkg`, then displays them in a searchable
   two-column list.
3. Each card attempts to resolve a Sony-hosted PlayStation cover from the
   existing public catalog at
   `Ephellon/game-store-catalog`. If no match is found, the card shows
   `NO ARTWORK`.
4. The **PS4 Remote PKG Installer** section accepts a PS4 hostname/IP and port
   (default `12800`).
5. **Check installed title** sends `POST /api/is_exists` with a real JSON
   `title_id` field. The cloned PS4 source confirms this endpoint is a title
   lookup, not a generic connectivity check.
6. Tapping a game sends the Archive.org package URL with
   `POST /api/install`:

   ```json
   {
     "type": "direct",
     "packages": ["https://archive.org/download/.../game.pkg"]
   }
   ```
7. A custom URL can be entered in the PS4 installer section. `.pkg` URLs use
   the `direct` request type; `.json` manifest URLs use `ref_pkg_url`, as
   supported by Remote Package Installer.

8. The PS4 source downloads and inspects the package before returning from
   `/api/install`; a successful response includes a task ID. The response
   still does not mean the package has finished installing.

## Is it fully functional?

The main path is implemented, but it depends on external services and PS4
setup:

- The phone must be able to reach Archive.org and the artwork catalog.
- The phone and PS4 must be on a network where the phone can reach the PS4.
- Remote PKG Installer must be running on the PS4 and listening on the
  configured port.
- The PS4 must be able to download the Archive.org URL itself.
- A package or manifest must be publicly reachable; direct package URLs end in
  `.pkg` and manifest URLs end in `.json`.

The app reports HTTP failures from the PS4 and validates the host, port, URL
scheme, and `.pkg` extension. It does not monitor download/install progress,
persist the PS4 target between launches, or verify that a game has finished
installing. Artwork is best-effort: a missing catalog match does not block
package installation.

## Installing a game from an Android phone

### On the PS4

1. Install and start a compatible **Remote PKG Installer** payload/service.
2. Confirm its listening port. The default expected by PSrepo is `12800`.
3. Connect the PS4 to the same local network as the Android phone.
4. Find the PS4's local IP address, for example `192.168.1.50`.
5. Keep the PS4 awake and make sure the service is still running while sending
   a package.

### On the Android phone

1. Install and open the PSrepo APK.
2. Expand **PS4 Remote PKG Installer**.
3. Enter the PS4 local IP address and port.
4. To check an installed title, enter its real CUSA ID and tap **Check
   installed title**. This is a title lookup, not a generic connection test.
5. Search or sort the package list.
6. Tap the desired package card once.
7. To install another URL, expand **PS4 Remote PKG Installer**, paste a
   public `.pkg` URL or a Remote Package Installer manifest `.json` URL, and
   tap **Install from URL**.
8. Wait for **Install queued**. The PS4 may take time to inspect the package
   before returning this response.
9. Monitor the Remote PKG Installer/PS4 side for download and installation
   progress. Keep both devices connected to the network until it completes.

If the test fails, check the IP address, port, Wi-Fi/VLAN isolation, firewall
settings, and that Remote PKG Installer is running. If the test succeeds but
installation fails, verify that the PS4 can access the Archive.org URL and
that the package is compatible with the console.

## Local development

Requirements:

- Node.js
- Android device/emulator with Expo Go, or an Android development setup

```bash
npm ci
npm start
```

Use the Expo developer menu/QR code to open the app on Android. The available
project scripts also include:

```bash
npm run android
npm run lint
npx tsc --noEmit
```

## Android APK builds

The project uses EAS Build. The `preview` profile in `eas.json` produces an
installable APK for Android. A production Android build normally produces an
Android App Bundle, which is intended for Google Play rather than direct APK
installation.

For a local EAS build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The first build may ask EAS to confirm or create project configuration. The
Expo project is already linked through the `extra.eas.projectId` value in
`app.json`.

## GitHub Release automation

The workflow at `.github/workflows/android-release.yml` builds the `preview`
APK with EAS and uploads it as a workflow artifact (`PSrepo-android-apk`) on
every run. For tag pushes matching `v*`, it also publishes the APK to a GitHub
Release.

Repository setup:

1. Create an Expo access token.
2. Add it in GitHub repository settings as an Actions secret named
   `EXPO_TOKEN`.
3. Create and push a version tag:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. Wait for the **Build Android APK and release it** workflow to finish.
5. Download the APK from:
   - the `PSrepo-android-apk` workflow artifact (all runs), or
   - the generated GitHub Release asset (tag-triggered runs).
   Android may require enabling installation from that source.

The workflow uses the built-in GitHub Actions token to create the release and
does not require a second GitHub token. EAS signing credentials are managed by
EAS; the APK is intended for testing/direct installation, not Play Store
submission.

## Important limitation

The app currently sends public package URLs directly to the PS4. It does not
download or proxy PKG files through the phone. This is intentional: the PS4
Remote PKG Installer fetches the URL itself. The phone only needs network
access to the PS4 while making the initial API request.
