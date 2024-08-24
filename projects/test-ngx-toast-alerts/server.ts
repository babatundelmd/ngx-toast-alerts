import express from 'express';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function app(): express.Express {
  const server = express();
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = resolve(currentFilePath, '..');
  const browserDistFolder = resolve(currentDirPath, '../browser');

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // Fallback to index.html
  server.use('*', (req, res) => {
    res.sendFile(join(browserDistFolder, 'index.html'));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();