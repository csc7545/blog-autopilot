import { chromium, type Browser, type Page } from 'playwright';
import { config } from '@/config';
import { PipelineError } from '@/core/errors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface NaverCredentials {
  naverId: string;
  naverPw: string;
}

export interface PublishInput {
  title: string;
  htmlContent: string;
  tags?: string[];
  imageUrls?: string[];
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
}

export class NaverPublisher {
  private credentials: NaverCredentials;

  constructor(credentials: NaverCredentials) {
    this.credentials = credentials;
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
      });

      const page = await context.newPage();

      // Remove webdriver flag
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      await this.login(page);
      const postUrl = await this.writePost(page, input);

      return { success: true, postUrl };
    } catch (error) {
      if (error instanceof PipelineError) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new PipelineError(
        `Naver publish failed: ${msg}`,
        'naver-publish',
        'PUBLISH_ERROR',
      );
    } finally {
      if (browser) await browser.close();
    }
  }

  private async login(page: Page): Promise<void> {
    await page.goto(config.naver.loginUrl, { waitUntil: 'networkidle' });

    // Use page.evaluate to set input values directly — bypasses keystroke bot detection
    await page.click('#id');
    await page.evaluate((id: string) => {
      const el = document.querySelector('#id') as HTMLInputElement;
      el.value = id;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, this.credentials.naverId);

    await page.waitForTimeout(500);

    await page.click('#pw');
    await page.evaluate((pw: string) => {
      const el = document.querySelector('#pw') as HTMLInputElement;
      el.value = pw;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, this.credentials.naverPw);

    await page.waitForTimeout(500);

    // Click login button
    await page.click('.btn_login, #log\\.login');

    // Wait for redirect away from login page
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('nidlogin.login')) {
      throw new PipelineError(
        '네이버 로그인 실패 — 계정 정보를 확인하거나 CAPTCHA가 필요할 수 있습니다',
        'naver-publish',
        'LOGIN_FAILED',
      );
    }
  }

  private async writePost(
    page: Page,
    input: PublishInput,
  ): Promise<string | undefined> {
    const editorUrl = config.naver.editorUrlTemplate.replace(
      '{username}',
      this.credentials.naverId,
    );
    await page.goto(editorUrl, {
      waitUntil: 'networkidle',
      timeout: config.naver.editorTimeout,
    });

    // Wait for SmartEditor to load
    await page.waitForTimeout(3000);

    // Dismiss "작성 중인 글이 있습니다" restore popup if present
    try {
      const restorePopup = await page.$('.se-popup-alert-confirm');
      if (restorePopup) {
        // Click "취소" to start fresh
        const cancelBtn = await restorePopup.$('button:first-of-type');
        if (cancelBtn) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch {
      // No restore popup
    }

    // Close help panel if visible
    try {
      const closeHelp = await page.$('.se-help-panel-close-button');
      if (closeHelp) {
        await closeHelp.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No help panel
    }

    // --- Title (keyboard typing for SmartEditor compatibility) ---
    const titleSelector = '.se-title-text';
    await page.waitForSelector(titleSelector, { timeout: 15000 });
    await page.click(titleSelector);
    await page.waitForTimeout(300);
    await page.keyboard.type(input.title, { delay: 10 });

    // Press Enter to move cursor from title to body area
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // --- Body Content (decode entities, strip HTML, type as plain text) ---
    const decoded = input.htmlContent
      // Decode HTML entities first
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const plainLines = decoded
      // Block-level tags → newlines
      .replace(/<\/?(p|br|div|h[1-6]|ul|ol|li|blockquote)[^>]*>/gi, '\n')
      // Remove remaining tags (bold, italic, span, a, etc.)
      .replace(/<[^>]*>/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = 0; i < plainLines.length; i++) {
      await page.keyboard.type(plainLines[i], { delay: 5 });
      if (i < plainLines.length - 1) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
      }
    }

    await page.waitForTimeout(1000);

    // --- Images (upload via SmartEditor photo button) ---
    if (input.imageUrls && input.imageUrls.length > 0) {
      await this.uploadImages(page, input.imageUrls);
    }

    // --- Open Publish Dialog ---
    await page.click('.publish_btn__m9KHH');
    await page.waitForTimeout(2000);

    // --- Tags (in publish dialog) ---
    if (input.tags && input.tags.length > 0) {
      try {
        const tagInputSelector = '.tag_input_area__MlOuw textarea, textarea[placeholder*="태그"]';
        await page.waitForSelector(tagInputSelector, { timeout: 5000 });
        // Enter tags separated by Enter key
        for (const tag of input.tags.slice(0, 30)) {
          const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
          await page.fill(tagInputSelector, cleanTag);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
        }
      } catch {
        console.info('[NaverPublisher] Tag input not found, skipping tags');
      }
    }

    await page.waitForTimeout(500);

    // --- Click Confirm Publish ---
    const confirmSelector = '.confirm_btn__WEaBq';
    await page.waitForSelector(confirmSelector, { timeout: 10000 });
    await page.click(confirmSelector);

    // Wait for publish to complete — Naver redirects to PostView on success
    await page.waitForTimeout(8000);

    const finalUrl = page.url();

    // Success pattern: PostView.naver?blogId=...&logNo=...
    if (finalUrl.includes('PostView.naver') || finalUrl.includes('/PostView')) {
      return finalUrl;
    }

    // If still on postwrite, it may have succeeded (new editor opens) or failed
    if (finalUrl.includes('/postwrite')) {
      // Check if the page is a fresh editor (publish succeeded, redirected to new post)
      // vs still the same post (publish failed)
      console.info(
        '[NaverPublisher] Still on editor page after publish — post may have been published',
      );
      return undefined;
    }

    return finalUrl;
  }

  private async uploadImages(
    page: Page,
    imageUrls: string[],
  ): Promise<void> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naver-imgs-'));

    try {
      for (const url of imageUrls) {
        if (!url || url.startsWith('data:')) continue;

        try {
          // Download image to temp file
          const response = await fetch(url);
          if (!response.ok) continue;

          const buffer = Buffer.from(await response.arrayBuffer());
          const ext = url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1] || 'png';
          const tmpFile = path.join(tmpDir, `img-${Date.now()}.${ext}`);
          fs.writeFileSync(tmpFile, buffer);

          // Click the photo button in SmartEditor toolbar
          const photoBtn = await page.$(
            '.se-image-toolbar-button',
          );
          if (!photoBtn) {
            console.info('[NaverPublisher] Photo button not found, skipping images');
            break;
          }

          // Set up file chooser listener before clicking
          const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 10000 }),
            photoBtn.click(),
          ]);

          await fileChooser.setFiles(tmpFile);
          await page.waitForTimeout(3000);

          console.info(`[NaverPublisher] Image uploaded: ${url.slice(0, 60)}...`);
        } catch (imgError) {
          console.info(
            `[NaverPublisher] Failed to upload image: ${imgError instanceof Error ? imgError.message : 'unknown'}`,
          );
        }
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

export function createNaverPublisher(
  credentials: NaverCredentials,
): NaverPublisher {
  if (!credentials.naverId) {
    throw new PipelineError(
      'Naver ID is required',
      'naver-publish',
      'MISSING_NAVER_ID',
    );
  }
  if (!credentials.naverPw) {
    throw new PipelineError(
      'Naver password is required',
      'naver-publish',
      'MISSING_NAVER_PW',
    );
  }
  return new NaverPublisher(credentials);
}
