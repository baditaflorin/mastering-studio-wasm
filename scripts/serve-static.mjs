import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const port = Number(process.argv[3] ?? '4173');
const host = process.argv[4] ?? '127.0.0.1';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8'
};

const server = createServer((request, response) => {
  const requestPath = new URL(request.url ?? '/', `http://${host}:${port}`).pathname;
  const safePath = normalize(decodeURIComponent(requestPath)).replace(
    /^(\.\.[/\\])+/,
    ''
  );
  let filePath = resolve(root, `.${safePath}`);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    const fallback404 = resolve(root, './404.html');
    const fallbackIndex = resolve(root, './index.html');
    const fallbackPath = existsSync(fallback404) ? fallback404 : fallbackIndex;

    if (existsSync(fallbackPath)) {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      createReadStream(fallbackPath).pipe(response);
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const type = mimeTypes[extname(filePath).toLowerCase()];
  response.writeHead(200, {
    'Content-Type': type ?? 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
