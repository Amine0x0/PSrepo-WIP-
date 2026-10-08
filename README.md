# PSrepo 🎮

> ** Current Status:** *[Remote Package Installer](https://github.com/flatz/ps4_remote_pkg_installer) currently lacks support for parsing HTTPS requests.* A fix is in the works, and local fork updates will follow.

## What is this?
`PSrepo` acts as a lightweight middleware bridge that serves custom paths directly to your PS4 homebrew applications using the native endpoint:
`http://PS4_IP:12800/install`

## Features & Tech Notes
* **Seamless Bridging:** Intercepts and redirects package paths to your console on the fly.
* **Content Source:** Pulls directly from Internet Archive dumps *(yeah, fuck you Sony).*
* **Local Fork in Progress:** Actively patching HTTPS limitations to make remote installations smoother.
