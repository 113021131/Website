/**
 * Measures the break-ui stress page (dev server must be running on :3000).
 *   node scripts/break-ui-check.mjs [outDir]
 * For each dataset and viewport it reports page-level horizontal overflow and
 * every element whose content is wider than its box or sticks out of the
 * viewport, then saves a screenshot. Also checks the real product page with the
 * longest seeded name.
 */
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "test-results/break-ui";
const targets = [
  { name: "worst-320", url: "/dev/break-ui?data=worst", width: 320 },
  { name: "worst-360", url: "/dev/break-ui?data=worst", width: 360 },
  { name: "worst-360-text200", url: "/dev/break-ui?data=worst", width: 360, rootFont: "200%" },
  { name: "worst-1280", url: "/dev/break-ui?data=worst", width: 1280 },
  { name: "empty-360", url: "/dev/break-ui?data=empty", width: 360 },
  { name: "one-360", url: "/dev/break-ui?data=one", width: 360 },
  { name: "product-long-320", url: "/katalog/demo-set-cincin-kawin", width: 320 },
  { name: "product-long-360-text200", url: "/katalog/demo-set-cincin-kawin", width: 360, rootFont: "200%" },
  { name: "product-126jt-320", url: "/katalog/demo-kalung-rantai-padat-24k", width: 320 },
  { name: "catalog-320", url: "/katalog", width: 320 },
  { name: "home-320-text200", url: "/", width: 320, rootFont: "200%" },
];

const browser = await chromium.launch();
for (const target of targets) {
  const page = await browser.newPage({ viewport: { width: target.width, height: 720 }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:3000${target.url}`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `nextjs-portal{display:none!important}${target.rootFont ? `html{font-size:${target.rootFont}}` : ""}`,
  });
  await page.waitForTimeout(300);

  const report = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const pageOverflow = document.documentElement.scrollWidth - viewport;
    const problems = [];
    for (const element of document.querySelectorAll("main *, footer *, header *")) {
      if (element.closest("nav[aria-label='Dataset']") || element.closest("svg")) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0) continue;
      const scroller = element.closest("[tabindex='0']") || style.overflowX === "auto";
      const label = `${element.tagName.toLowerCase()}.${String(element.className).split(" ").slice(0, 3).join(".")} "${(element.textContent ?? "").trim().slice(0, 40)}"`;
      if (!scroller && rect.right > viewport + 1) problems.push(`out of viewport by ${Math.round(rect.right - viewport)}px: ${label}`);
      const clipped = element.scrollWidth > element.clientWidth + 1 && style.overflowX !== "visible" && !scroller;
      if (clipped && element.children.length === 0) problems.push(`clipped text: ${label}`);
      const brokenImage = element.tagName === "IMG" && element.complete && element.naturalWidth === 0;
      if (brokenImage) problems.push(`broken image: alt="${element.getAttribute("alt")}"`);
    }
    return { pageOverflow, problems: [...new Set(problems)].slice(0, 12) };
  });

  await page.screenshot({ path: `${out}/${target.name}.png`, fullPage: true });
  console.log(`\n${target.name}: page overflow ${report.pageOverflow}px, ${report.problems.length} flagged`);
  for (const problem of report.problems) console.log(`  - ${problem}`);
  await page.close();
}
await browser.close();
