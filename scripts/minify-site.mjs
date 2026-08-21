import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';

const SITE = fileURLToPath(new URL('../www/_site/', import.meta.url));

const htmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
    })
  );
  return nested.flat();
};

const files = await htmlFiles(SITE);
let before = 0;
let after = 0;

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const output = await minify(source, {
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    decodeEntities: false,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: false,
    sortAttributes: false,
    sortClassName: false,
    useShortDoctype: true,
  });
  before += Buffer.byteLength(source);
  after += Buffer.byteLength(output);
  await writeFile(file, output);
}

console.log(`[minify-site] ${files.length} pages : ${before} -> ${after} octets`);
