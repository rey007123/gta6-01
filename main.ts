// SOLARIS BAY: GOLDEN HEAT — make.fun gta6-01 deterministic entry builder
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, readGameTree } from './vendor/makefun-game.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const OUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyEntryAssets(rootDir: string, outDir: string): void {
  const gameSrc = join(rootDir, 'game');
  const shotsSrc = join(rootDir, 'screenshots');
  if (!existsSync(join(gameSrc, 'index.html'))) {
    throw new Error('Missing game/index.html');
  }
  if (!existsSync(shotsSrc)) {
    throw new Error('Missing screenshots/ directory');
  }
  mkdirSync(outDir, { recursive: true });
  rmSync(join(outDir, 'game'), { recursive: true, force: true });
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
}

copyEntryAssets(ROOT, OUT_DIR);

const tree = readGameTree(join(OUT_DIR, 'game'), CAPS);
const dossier = buildDossier(OUT_DIR, CAPS);
const dossierPath = join(OUT_DIR, 'dossier.json');
writeFileSync(dossierPath, dossier);

const sha256 = createHash('sha256').update(dossier).digest('hex');
console.log(
  `SOLARIS BAY: GOLDEN HEAT -> ${dossierPath} ` +
  `(${dossier.byteLength} bytes, ${tree.files.length} game files, ${tree.totalBytes} B source, sha256=${sha256})`
);
