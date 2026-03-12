import { GoogleGenAI } from '@google/genai';
import type { ImageGenerationRequest, ImageGenerationResult, ImageProvider } from '../types';
import { saveBase64Image } from '../storage';

const MAX_RETRIES = 3;

export class GeminiNanoBananaProvider implements ImageProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.tryGenerate(request.prompt, attempt);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.info(`[GeminiImage] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    throw lastError!;
  }

  private async tryGenerate(prompt: string, attempt: number): Promise<ImageGenerationResult> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Generate an image. Do not refuse. Output an image. Do not include any text, letters, or words in the image. Numbers are acceptable. No text, no letters, no words, no watermark.\n\n${prompt}`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    // Debug: log full structure of each part
    const partKeys = parts.map((p) => Object.keys(p).filter((k) => (p as Record<string, unknown>)[k] != null));
    console.info(`[GeminiImage] Attempt ${attempt} — parts(${parts.length}): ${JSON.stringify(partKeys)}`);

    // Strategy 1: direct inlineData check
    let imagePart = parts.find(
      (part) =>
        part.inlineData?.data &&
        typeof part.inlineData.data === 'string' &&
        part.inlineData.data.length > 0,
    );

    // Strategy 2: walk the raw object for any base64-looking data
    if (!imagePart) {
      for (const part of parts) {
        const raw = part as Record<string, unknown>;
        for (const key of Object.keys(raw)) {
          const val = raw[key];
          if (val && typeof val === 'object') {
            const obj = val as Record<string, unknown>;
            if (typeof obj.data === 'string' && obj.data.length > 100) {
              console.info(`[GeminiImage] Found image data in part.${key}.data (${obj.data.length} chars)`);
              imagePart = { inlineData: { data: obj.data as string, mimeType: (obj.mimeType as string) ?? 'image/png' } } as typeof parts[0];
              break;
            }
          }
        }
        if (imagePart) break;
      }
    }

    if (!imagePart?.inlineData?.data) {
      const textParts = parts.filter((p) => p.text).map((p) => p.text).join(' ');
      throw new Error(
        `No image in response. Parts keys: ${JSON.stringify(partKeys)}${textParts ? `. Text: "${textParts.slice(0, 150)}"` : ''}`,
      );
    }

    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType ?? 'image/png';

    const savedImage = await saveBase64Image({
      base64Data,
      mimeType,
      prefix: 'gemini',
    });

    return {
      url: savedImage.url,
      filename: savedImage.filename,
      width: 1024,
      height: 1024,
    };
  }
}
