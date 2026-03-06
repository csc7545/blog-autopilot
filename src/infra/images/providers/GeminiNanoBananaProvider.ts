import { GoogleGenAI } from '@google/genai';
import type { ImageGenerationRequest, ImageGenerationResult, ImageProvider } from '../types';
import { saveBase64Image } from '../storage';

interface InlineData {
  data?: string;
  mimeType?: string;
}

interface Part {
  inlineData?: InlineData;
}

interface Content {
  parts?: Part[];
}

interface Candidate {
  content?: Content;
}

interface GenerateContentImageResponse {
  candidates?: Candidate[];
}

export class GeminiNanoBananaProvider implements ImageProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const response = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: request.prompt,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const parsed = response as unknown as GenerateContentImageResponse;
    const parts = parsed.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => {
      return typeof part.inlineData?.data === 'string' && part.inlineData.data.length > 0;
    });

    const base64Data = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType ?? 'image/png';

    if (!base64Data) {
      throw new Error('Gemini image response does not contain inline image data.');
    }

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
