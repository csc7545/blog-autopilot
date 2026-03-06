import type { ImageGenerationRequest, ImageGenerationResult, ImageProvider } from '../types';
import { saveSvgImage } from '../storage';

function createStubSvg(text: string): string {
  const safeText = text.trim().slice(0, 40) || 'Blog Autopilot';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#0ea5e9"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><text x="512" y="500" text-anchor="middle" font-size="48" fill="#ffffff" font-family="system-ui, -apple-system, Segoe UI, sans-serif">Generated Image</text><text x="512" y="570" text-anchor="middle" font-size="32" fill="#e0f2fe" font-family="system-ui, -apple-system, Segoe UI, sans-serif">${safeText}</text></svg>`;
}

export class StubImageProvider implements ImageProvider {
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const savedImage = await saveSvgImage({
      svg: createStubSvg(request.prompt),
      prefix: 'stub',
    });

    return {
      url: savedImage.url,
      filename: savedImage.filename,
      width: 1024,
      height: 1024,
    };
  }
}
