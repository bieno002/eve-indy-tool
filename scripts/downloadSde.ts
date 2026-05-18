import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { rename, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fetch } from 'undici';
import unbzip2 from 'unbzip2-stream';
import { getSdePaths, shouldSkipDownload, parseArgs } from './downloadSde.lib.js';

const DATA_DIR = path.join(__dirname, '../data');
const SDE_URL = 'https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2';

function makeProgressTransform(total: number): Transform {
  let received = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length;
      if (total > 0) {
        const pct = ((received / total) * 100).toFixed(1);
        const mb = (received / 1_048_576).toFixed(1);
        const totalMb = (total / 1_048_576).toFixed(1);
        process.stdout.write(`\r  ${pct}%  ${mb} / ${totalMb} MB`);
      }
      callback(null, chunk);
    },
  });
}

async function main(): Promise<void> {
  const { force } = parseArgs(process.argv.slice(2));
  const { sdePath, tmpPath } = getSdePaths(DATA_DIR);

  if (await shouldSkipDownload(sdePath, force)) {
    console.log(`SDE already present at ${sdePath}`);
    console.log('Pass --force to re-download.');
    return;
  }

  await mkdir(DATA_DIR, { recursive: true });
  console.log(`Downloading EVE SDE from Fuzzwork...`);

  const response = await fetch(SDE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const total = Number(response.headers.get('content-length') ?? '0');
  const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);

  try {
    await pipeline(
      nodeStream,
      makeProgressTransform(total),
      unbzip2(),
      createWriteStream(tmpPath),
    );
    process.stdout.write('\n');
    await rename(tmpPath, sdePath);
    console.log(`Done. SDE saved to ${sdePath}`);
  } catch (err) {
    await unlink(tmpPath).catch(() => undefined);
    throw err;
  }
}

main().catch((err: unknown) => {
  console.error('\nError:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
