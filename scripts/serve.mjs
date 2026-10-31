import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function contentType(file) {
  return ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream';
}

async function serve(request, response, root) {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentType(file) + '; charset=utf-8', 'Cache-Control': 'no-cache' }).end(bytes);
  } catch {
    response.writeHead(404).end('Not found');
  }
}

function main() {
  const root = fileURLToPath(new URL('../docs', import.meta.url));
  const port = Number(process.env.PORT || 4173);
  http.createServer((request, response) => serve(request, response, root)).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
}

main();
