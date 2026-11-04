// Screenshots of the demo person, for checking the pages and for the README.
// Run the app with the demo only, so a real orders file can never appear:
//   MUNCH_DEMO_ONLY=1 bunx vite --port 5199
//   bun scripts/screenshots.ts [base url] [out dir]
// WIDTHS, THEMES, SCALE and SHOTS (a comma-separated list of names) narrow it down.
import { chromium, type Page } from 'playwright';

const base = Bun.argv[2] ?? 'http://127.0.0.1:5199';
const out = Bun.argv[3] ?? 'docs/screenshots';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wanted = process.env.SHOTS?.split(',');
const want = (name: string) => !wanted || wanted.includes(name);

async function open(page: Page, path: string, theme: string) {
  await page.addInitScript((t) => localStorage.setItem('munch-theme', t), theme);
  await page.goto(`${base}${path}${path.includes('?') ? '&' : '?'}demo=1`);
  await page.waitForSelector('.home, .explorer, .start', { timeout: 15000 });
  await wait(1200);
}
async function scrollTo(page: Page, selector: string) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), selector);
  await page.evaluate(() => window.scrollBy(0, -90));
  await wait(1200);
}

const browser = await chromium.launch();
const errors: string[] = [];
const widths = (process.env.WIDTHS ?? '1440,375').split(',').map(Number);
const themes = (process.env.THEMES ?? 'dark,light').split(',');
for (const width of widths)
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width, height: width > 800 ? 900 : 812 },
      deviceScaleFactor: Number(process.env.SCALE ?? 2),
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(`${width} ${theme}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${width} ${theme}: ${m.text()}`));
    const shot = async (name: string, full = false) => {
      if (want(name)) await page.screenshot({ path: `${out}/${name}-${width}-${theme}.png`, fullPage: full });
    };
    if (['home', 'home-full', 'cards', 'calendar', 'rail', 'persona', 'story', 'story-places'].some(want)) {
      await open(page, '/', theme);
      await shot('home');
      if (want('home-full')) {
        // Scroll through once so everything that grows on sight has grown.
        for (let y = 0; y < 9000; y += 600) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await wait(120);
        }
        await wait(900);
        await shot('home-full', true);
      }
      for (const [name, selector] of [
        ['cards', '.bento'],
        ['calendar', '.cal'],
        ['rail', '.rail'],
        ['persona', '.persona'],
      ] as const) {
        if (!want(name)) continue;
        await scrollTo(page, selector);
        await shot(name);
      }
      if (want('story') || want('story-places')) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('.story-ring').first().click();
        await wait(1300);
        await shot('story');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await wait(1400);
        await shot('story-places');
        await page.keyboard.press('Escape');
      }
    }
    if (want('orders') || want('order')) {
      await open(page, '/orders', theme);
      await shot('orders');
      if (want('order')) {
        await page.locator('.order-row').nth(2).click();
        await wait(900);
        await shot('order');
      }
    }
    if (want('search')) {
      await open(page, '/orders?q=maki', theme);
      await shot('search');
    }
    if (want('places') || want('place')) {
      await open(page, '/places', theme);
      await shot('places');
      if (want('place')) {
        await page.locator('.place-row').first().click();
        await wait(1100);
        await shot('place');
      }
    }
    if (want('start')) {
      await page.addInitScript(() => localStorage.removeItem('munch-demo'));
      await page.goto(`${base}/start`);
      await wait(1500);
      await shot('start');
    }
    await context.close();
  }
await browser.close();
if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write('No page errors.\n');
