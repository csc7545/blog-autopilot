import { chromium, type Browser, type Page } from 'playwright';
import { marked } from 'marked';
import { config } from '@/config';
import { PipelineError } from '@/core/errors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface NaverCredentials {
  naverId: string;
  naverPw: string;
}

export interface ContentSection {
  heading: string;
  content: string;
  subsections?: {
    subheading: string;
    content: string;
  }[];
}

export interface ContentImage {
  position: string;
  url: string;
}

export interface ContentFaq {
  question: string;
  answer: string;
}

export interface PublishInput {
  title: string;
  sections: ContentSection[];
  images: ContentImage[];
  faqs: ContentFaq[];
  summary: string;
  tags?: string[];
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
}

/**
 * Convert markdown to SmartEditor-friendly HTML.
 *
 * SmartEditor spacing rules:
 * - 문단 사이: 빈 줄 하나 (<p><br></p>)
 * - 리스트 끝난 후: 빈 줄 하나
 * - H3 위: 빈 줄 하나
 * - H3 바로 밑: 빈 줄 없이 본문 바로
 * - single \n in markdown → <br> (줄바꿈만, 빈 줄 아님)
 */
function mdToHtml(md: string): string {
  const raw = marked.parse(md, { async: false, breaks: true }) as string;

  return raw
    // 1) 문단 사이 빈 줄: </p><p> → </p> + 빈줄 + <p>
    .replace(/<\/p>\s*<p>/gi, '</p>\n<p><br></p>\n<p>')
    // 2) 리스트 끝난 후 빈 줄: </ul> or </ol> 다음에 빈줄
    .replace(/<\/(ul|ol)>\s*/gi, '</$1>\n<p><br></p>\n')
    // 3) H3 위에 빈 줄 (but H3 바로 밑에는 빈 줄 없음)
    .replace(/\s*<h3>/gi, '\n<p><br></p>\n<h3>')
    // 4) H3 닫힌 직후에 빈줄이 있으면 제거 (바로 본문 시작)
    .replace(/<\/h3>\s*<p><br><\/p>/gi, '</h3>')
    // 5) 연속 빈줄 방지: <p><br></p> 2개 이상 연속 → 1개로
    .replace(/(<p><br><\/p>\s*){2,}/gi, '<p><br></p>\n')
    // 6) 시작/끝 빈줄 제거
    .replace(/^\s*<p><br><\/p>\s*/i, '')
    .replace(/\s*<p><br><\/p>\s*$/i, '')
    .trim();
}

export class NaverPublisher {
  private credentials: NaverCredentials;
  private tmpDir: string = '';

  constructor(credentials: NaverCredentials) {
    this.credentials = credentials;
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    let browser: Browser | null = null;
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naver-imgs-'));

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
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    }
  }

  private async login(page: Page): Promise<void> {
    await page.goto(config.naver.loginUrl, { waitUntil: 'networkidle' });

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

    await page.click('.btn_login, #log\\.login');
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

  /**
   * Build HTML for a single section (for section-by-section paste).
   * - H2 다음 본문은 바로 시작
   * - H3 위에는 빈 줄 하나 (mdToHtml에서 처리)
   * - H3 바로 밑에는 빈 줄 없이 본문 (mdToHtml에서 처리)
   */
  private buildSectionHtml(section: ContentSection): string {
    const parts: string[] = [];

    parts.push(`<h2>${section.heading}</h2>`);

    if (section.content) {
      parts.push(mdToHtml(section.content));
    }

    if (section.subsections && section.subsections.length > 0) {
      for (const sub of section.subsections) {
        // H3 위에 빈 줄 하나
        parts.push('<p><br></p>');
        parts.push(`<h3>${sub.subheading}</h3>`);
        parts.push(mdToHtml(sub.content));
      }
    }

    return parts.join('\n');
  }

  /**
   * Build HTML for the FAQ + Summary footer.
   */
  private buildFooterHtml(input: PublishInput): string {
    const parts: string[] = [];

    if (input.faqs.length > 0) {
      parts.push('<p><br></p>');
      parts.push('<h2>자주 묻는 질문 (FAQ)</h2>');
      for (let i = 0; i < input.faqs.length; i++) {
        const faq = input.faqs[i];
        // Q와 A를 하나의 <p> 안에서 <br>로 줄바꿈 → 문단 간격 없이 붙어서 출력
        parts.push(`<p><b>Q. ${faq.question}</b><br>A. ${faq.answer}</p>`);
        // FAQ 항목 사이에 빈 줄
        if (i < input.faqs.length - 1) {
          parts.push('<p><br></p>');
        }
      }
    }

    if (input.summary) {
      parts.push('<p><br></p>');
      parts.push('<h3>요약</h3>');
      parts.push(mdToHtml(input.summary));
    }

    return parts.join('\n');
  }

  /**
   * Paste HTML content into SmartEditor via clipboard API.
   * SmartEditor ONE accepts rich HTML from clipboard paste.
   */
  private async pasteHtmlToEditor(page: Page, html: string): Promise<void> {
    // Use the Clipboard API to write HTML, then trigger paste
    await page.evaluate(async (htmlContent: string) => {
      // Create a ClipboardItem with HTML type
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
    }, html);

    // Trigger paste with Cmd+V
    await page.keyboard.down('Meta');
    await page.keyboard.press('v');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(2000);
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

    await page.waitForTimeout(3000);

    // Dismiss restore popup
    try {
      const restorePopup = await page.$('.se-popup-alert-confirm');
      if (restorePopup) {
        const cancelBtn = await restorePopup.$('button:first-of-type');
        if (cancelBtn) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch { /* */ }

    // Close help panel
    try {
      const closeHelp = await page.$('.se-help-panel-close-button');
      if (closeHelp) {
        await closeHelp.click();
        await page.waitForTimeout(500);
      }
    } catch { /* */ }

    // === TITLE ===
    await page.waitForSelector('.se-title-text', { timeout: 15000 });
    await page.click('.se-title-text');
    await page.waitForTimeout(300);
    await page.keyboard.type(input.title, { delay: 15 });
    await page.waitForTimeout(500);

    // Move to body area
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Click on the body text area to ensure focus
    try {
      const bodyArea = await page.$('.se-component-content .se-text-paragraph');
      if (bodyArea) {
        await bodyArea.click();
        await page.waitForTimeout(300);
      }
    } catch { /* continue, Enter should have moved us */ }

    // === COVER IMAGE ===
    const coverImage = input.images.find((img) => img.position === 'cover');
    if (coverImage) {
      await this.uploadImage(page, coverImage.url);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // === SECTIONS: paste each section HTML → upload section image → next ===
    for (let i = 0; i < input.sections.length; i++) {
      const section = input.sections[i];
      const sectionHtml = this.buildSectionHtml(section);

      console.info(`[NaverPublisher] Pasting section ${i + 1}: "${section.heading}" (${sectionHtml.length} chars)`);
      await this.pasteHtmlToEditor(page, sectionHtml);
      await page.waitForTimeout(1000);

      // Upload section image right after this section's content
      const sectionImage = input.images.find(
        (img) => img.position === `section${i + 1}`,
      );
      if (sectionImage) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        await this.uploadImage(page, sectionImage.url);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    }

    // === FAQ + SUMMARY ===
    const footerHtml = this.buildFooterHtml(input);
    if (footerHtml) {
      console.info(`[NaverPublisher] Pasting footer (FAQ + Summary, ${footerHtml.length} chars)`);
      await this.pasteHtmlToEditor(page, footerHtml);
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(1500);

    // === PUBLISH DIALOG ===
    const publishBtn = await page.$('button[class*="publish_btn"]') ||
      await page.$('button:has-text("발행")');
    if (!publishBtn) {
      throw new PipelineError(
        '발행 버튼을 찾을 수 없습니다',
        'naver-publish',
        'PUBLISH_BTN_NOT_FOUND',
      );
    }
    await publishBtn.click();
    await page.waitForTimeout(3000);

    // Tags — find tag input by multiple strategies
    if (input.tags && input.tags.length > 0) {
      try {
        const tagInput = await page.$('textarea[placeholder*="태그"]') ||
          await page.$('input[placeholder*="태그"]') ||
          await page.$('[class*="tag_input"] textarea') ||
          await page.$('[class*="tag_input"] input');

        if (tagInput) {
          await tagInput.click();
          await page.waitForTimeout(300);
          for (const tag of input.tags.slice(0, 30)) {
            const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
            await page.keyboard.type(cleanTag, { delay: 10 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(400);
          }
          console.info(`[NaverPublisher] Tags entered: ${input.tags.length}`);
        } else {
          console.info('[NaverPublisher] Tag input not found, skipping tags');
        }
      } catch (err) {
        console.info(
          `[NaverPublisher] Tag input failed: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }

    await page.waitForTimeout(1000);

    // Confirm publish
    const confirmBtn = await page.$('button[class*="confirm_btn"]') ||
      await page.$('button:has-text("발행하기")');
    if (!confirmBtn) {
      throw new PipelineError(
        '발행 확인 버튼을 찾을 수 없습니다',
        'naver-publish',
        'CONFIRM_BTN_NOT_FOUND',
      );
    }
    await confirmBtn.click();

    await page.waitForTimeout(8000);

    const finalUrl = page.url();

    if (finalUrl.includes('PostView.naver') || finalUrl.includes('/PostView')) {
      return finalUrl;
    }

    if (finalUrl.includes('/postwrite')) {
      console.info('[NaverPublisher] Still on editor — post may have been published');
      return undefined;
    }

    return finalUrl;
  }

  /**
   * Upload a single image to SmartEditor.
   */
  private async uploadImage(page: Page, url: string): Promise<void> {
    if (!url) return;

    try {
      const imgFilePath = await this.resolveImagePath(url);
      if (!imgFilePath) return;

      // SVG not supported by Naver
      if (imgFilePath.endsWith('.svg')) {
        console.info('[NaverPublisher] Skipping SVG (not supported)');
        return;
      }

      const photoBtn = await page.$('.se-image-toolbar-button');
      if (!photoBtn) {
        console.info('[NaverPublisher] Photo button not found');
        return;
      }

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        photoBtn.click(),
      ]);

      await fileChooser.setFiles(imgFilePath);
      await page.waitForTimeout(3000);
      console.info(`[NaverPublisher] Image uploaded: ${url.slice(0, 80)}`);
    } catch (err) {
      console.info(
        `[NaverPublisher] Image upload failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  /**
   * Resolve image URL to a local file path.
   */
  private async resolveImagePath(url: string): Promise<string | null> {
    if (url.startsWith('/generated/') || url.startsWith('generated/')) {
      const localPath = path.join(
        process.cwd(),
        'public',
        url.startsWith('/') ? url.slice(1) : url,
      );
      return fs.existsSync(localPath) ? localPath : null;
    }

    if (url.startsWith('data:')) {
      const match = url.match(/^data:image\/([\w+]+);base64,(.+)$/);
      if (!match) return null;
      const ext = match[1] === 'svg+xml' ? 'svg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const filePath = path.join(this.tmpDir, `img-${Date.now()}.${ext}`);
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }

    if (url.startsWith('http')) {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        const ext = url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1] || 'png';
        const filePath = path.join(this.tmpDir, `img-${Date.now()}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        return filePath;
      } catch {
        return null;
      }
    }

    return null;
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
