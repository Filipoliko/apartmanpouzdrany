import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'docs', 'photos');

const browser = await chromium.launch();
const page = await browser.newPage();

console.log('Opening page...');
await page.goto('https://www.e-chalupy.cz/apartman-pouzdrany-o14688', {
  waitUntil: 'networkidle',
});

const imageUrls = await page.evaluate(() => {
  const anchors = document.querySelectorAll('.pop-items a.item[href^="/foto/"]');
  return Array.from(anchors).map((a) => {
    const img = a.querySelector('img');
    return img ? img.src : null;
  }).filter(Boolean);
});

console.log(`Found ${imageUrls.length} images.`);

if (!existsSync(OUTPUT_DIR)) {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

for (let i = 0; i < imageUrls.length; i++) {
  const url = imageUrls[i];
  console.log(`Downloading image ${i}: ${url}`);
  const response = await page.request.get(url);
  const buffer = await response.body();
  await writeFile(join(OUTPUT_DIR, `${i}.jpg`), buffer);
}

await browser.close();
console.log(`Done. ${imageUrls.length} images saved to docs/photos/`);
