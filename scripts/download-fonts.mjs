/**
 * One-off helper: downloads the latin-subset woff2 files that
 * next/font/google would fetch at build time, so fonts can be
 * self-hosted via next/font/local instead. Run with `node scripts/download-fonts.mjs`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";

const FAMILIES = [
  {
    url: "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap",
    prefix: "newsreader",
  },
  {
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap",
    prefix: "ibm-plex-sans",
  },
  {
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap",
    prefix: "ibm-plex-mono",
  },
];

const OUT_DIR = path.join(process.cwd(), "app", "fonts");

const download = async (family) => {
  const res = await fetch(family.url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`CSS fetch failed for ${family.prefix}: ${res.status}`);
  const css = await res.text();

  const blockRegex = /\/\* ([\w-]+) \*\/\s*@font-face\s*{([^}]*)}/g;
  const saved = [];
  for (const [, subset, body] of css.matchAll(blockRegex)) {
    if (subset !== "latin") continue;
    const style = /font-style:\s*(\w+)/.exec(body)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const fileUrl = /src:\s*url\((.+?)\)/.exec(body)?.[1];
    if (!style || !weight || !fileUrl) {
      throw new Error(`Unparseable latin @font-face for ${family.prefix}`);
    }
    const fileName = `${family.prefix}-${weight}-${style}.woff2`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Font fetch failed: ${fileName}: ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    if (buffer.subarray(0, 4).toString() !== "wOF2") {
      throw new Error(`${fileName} is not a woff2 file`);
    }
    await writeFile(path.join(OUT_DIR, fileName), buffer);
    saved.push(`${fileName} (${(buffer.length / 1024).toFixed(1)} kB)`);
  }
  return saved;
};

await mkdir(OUT_DIR, { recursive: true });
for (const family of FAMILIES) {
  const saved = await download(family);
  if (saved.length === 0) throw new Error(`No latin blocks found for ${family.prefix}`);
  console.log(`${family.prefix}:`);
  saved.forEach((line) => console.log(`  ${line}`));
}