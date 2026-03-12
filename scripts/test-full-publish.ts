/**
 * Full publish test — keyboard typing approach with popup handling.
 * Run with: npx tsx scripts/test-full-publish.ts
 */
import { chromium } from 'playwright';

const NAVER_ID = 'csc7545';
const NAVER_PW = 'chltjdcks2@';
const LOGIN_URL = 'https://nid.naver.com/nidlogin.login';

async function testFullPublish() {
  console.log('[Test] Starting full publish test...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    // Login
    console.log('[Test] Logging in...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

    await page.click('#id');
    await page.evaluate((id: string) => {
      const el = document.querySelector('#id') as HTMLInputElement;
      el.value = id;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, NAVER_ID);
    await page.waitForTimeout(500);

    await page.click('#pw');
    await page.evaluate((pw: string) => {
      const el = document.querySelector('#pw') as HTMLInputElement;
      el.value = pw;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, NAVER_PW);
    await page.waitForTimeout(500);

    await page.click('.btn_login, #log\\.login');
    await page.waitForTimeout(5000);

    if (page.url().includes('nidlogin.login')) {
      console.log('[Test] LOGIN FAILED');
      await browser.close();
      return;
    }
    console.log('[Test] Login OK');

    // Navigate to editor
    console.log('[Test] Opening editor...');
    await page.goto(`https://blog.naver.com/${NAVER_ID}/postwrite`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    // Dismiss "작성 중인 글이 있습니다" restore popup
    try {
      const restorePopup = await page.$('.se-popup-alert-confirm');
      if (restorePopup) {
        console.log('[Test] Dismiss restore popup...');
        const cancelBtn = await restorePopup.$('button:first-of-type');
        if (cancelBtn) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch { /* ignore */ }

    // Close help panel
    try {
      const closeHelp = await page.$('.se-help-panel-close-button');
      if (closeHelp) {
        await closeHelp.click();
        await page.waitForTimeout(500);
      }
    } catch { /* ignore */ }

    // --- Title via keyboard ---
    console.log('[Test] Setting title...');
    await page.waitForSelector('.se-title-text', { timeout: 15000 });
    await page.click('.se-title-text');
    await page.waitForTimeout(300);
    await page.keyboard.type('[자동발행 테스트] Blog Autopilot', { delay: 20 });
    console.log('[Test] Title set');

    // Enter to move to body
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // --- Body via keyboard ---
    console.log('[Test] Setting body...');
    await page.keyboard.type('Blog Autopilot 자동 발행 테스트 글입니다.', { delay: 10 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.type('이 글은 Playwright 브라우저 자동화를 통해 작성되었습니다.', { delay: 10 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.type('정상적으로 작동하면 이 글이 네이버 블로그에 게시됩니다.', { delay: 10 });
    console.log('[Test] Body set');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scripts/before-publish.png' });

    // Open publish dialog
    console.log('[Test] Opening publish dialog...');
    await page.click('.publish_btn__m9KHH');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scripts/publish-dialog.png' });

    // Click confirm publish
    console.log('[Test] Clicking confirm publish...');
    await page.waitForSelector('.confirm_btn__WEaBq', { timeout: 10000 });
    await page.click('.confirm_btn__WEaBq');

    // Wait for publish
    console.log('[Test] Waiting for publish...');
    await page.waitForTimeout(8000);

    const finalUrl = page.url();
    console.log('[Test] Final URL:', finalUrl);
    await page.screenshot({ path: 'scripts/after-publish.png' });

    // Verify by visiting blog
    console.log('[Test] Checking blog...');
    await page.goto(`https://blog.naver.com/${NAVER_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scripts/blog-home.png' });

    const postExists = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some((a) => a.textContent?.includes('자동발행 테스트'));
    });
    console.log('[Test] Post found on blog:', postExists);

    if (postExists) {
      console.log('[Test] SUCCESS! Post published!');
    } else {
      console.log('[Test] Post not found on blog home page');
    }
  } catch (error) {
    console.error('[Test] Error:', error);
    await page.screenshot({ path: 'scripts/error.png' });
  } finally {
    console.log('[Test] Keeping browser open for 10s...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('[Test] Done.');
  }
}

testFullPublish().catch(console.error);
