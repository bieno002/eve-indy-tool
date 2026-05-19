import { Readable, Transform } from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { rename as fsRename, mkdir as fsMkdir, unlink as fsUnlink } from 'node:fs/promises';
import path from 'node:path';
import { fetch as udFetch } from 'undici';
import unbzip2 from 'unbzip2-stream';
import type { SdeProgressData } from '../../shared/types.js';

const SDE_URL = 'https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2';

export type DownloadDeps = {
  fetchFn?: typeof udFetch;
  mkdirFn?: typeof fsMkdir;
  renameFn?: typeof fsRename;
  unlinkFn?: typeof fsUnlink;
  pipelineFn?: typeof streamPipeline;
};

export async function downloadSde(
  dataDir: string,
  onProgress: (data: SdeProgressData) => void,
  deps: DownloadDeps = {},
): Promise<void> {
  const {
    fetchFn = udFetch,
    mkdirFn = fsMkdir,
    renameFn = fsRename,
    unlinkFn = fsUnlink,
    pipelineFn = streamPipeline,
  } = deps;

  const sdePath = path.join(dataDir, 'sde.sqlite');
  const tmpPath = path.join(dataDir, 'sde.sqlite.tmp');

  await mkdirFn(dataDir, { recursive: true });

  const response = await fetchFn(SDE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const total = Number(response.headers.get('content-length') ?? '0');
  let received = 0;

  const progressTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length;
      if (total > 0) {
        onProgress({ percent: Math.round((received / total) * 100), done: false });
      }
      callback(null, chunk);
    },
  });

  const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);

  try {
    await pipelineFn(nodeStream, progressTransform, unbzip2(), createWriteStream(tmpPath));
    await renameFn(tmpPath, sdePath);
    onProgress({ percent: 100, done: true });
  } catch (err) {
    await unlinkFn(tmpPath).catch(() => undefined);
    throw err;
  }
}
