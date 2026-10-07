import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, "..");
const outDir = resolve(project, "assets", "captures");
await mkdir(outDir, { recursive: true });

const sources = [
  {
    id: "amazon",
    url: "https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon",
    file: "amazon-ftc.png"
  },
  {
    id: "uber",
    url: "https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-states-file-amended-complaint-against-uber-deceptive-billing-cancellation-practices",
    file: "uber-ftc.png"
  },
  {
    id: "dark-patterns",
    url: "https://www.ftc.gov/reports/bringing-dark-patterns-light",
    file: "dark-patterns-ftc.png"
  }
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1
});

for (const source of sources) {
  await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);

  await page.addStyleTag({
    content: `
      #block-ftcgov-govdeliveryblock, .usa-banner, footer, .region-footer,
      .region-postscript, .social-share, .addtoany_list { display: none !important; }
      body { background: #fff !important; }
    `
  }).catch(() => {});

  const heading = page.locator("h1").first();
  if (await heading.count()) {
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
  }

  const main = page.locator("main").first();
  const target = (await main.count()) ? main : page.locator("body");
  await target.screenshot({
    path: resolve(outDir, source.file),
    animations: "disabled"
  });
}

await browser.close();

await writeFile(
  resolve(outDir, "capture-manifest.json"),
  JSON.stringify({ sources }, null, 2) + "\n",
  "utf8"
);
