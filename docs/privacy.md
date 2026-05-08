# Privacy

`mastering-studio-wasm` is private by design.

## What Is Collected

Nothing by default. There is no analytics script, no runtime backend, no account system, and no upload endpoint.

## Audio Handling

Audio files are decoded, analyzed, mastered, previewed, and exported in your browser. They are not sent to the project maintainer, GitHub, or a mastering server by this app.

## Local Storage

The app stores small session metadata in IndexedDB, such as the last selected target and analysis summary. It does not persist raw audio in v1.

## Third-Party Requests

The app is served from GitHub Pages:

https://baditaflorin.github.io/mastering-studio-wasm/

FFmpeg WASM core assets are published as static files inside this repository's GitHub Pages output.
