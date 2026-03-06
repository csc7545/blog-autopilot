import { GeminiNanoBananaProvider } from './providers/GeminiNanoBananaProvider';
import { StubImageProvider } from './providers/StubProvider';
import type { ImageProvider, ImageProviderOptions } from './types';

export type ImageProviderType = 'gemini' | 'stub' | 'dalle' | 'stability';

export function createImageProvider(
  type: ImageProviderType = 'gemini',
  options: ImageProviderOptions = {}
): ImageProvider {
  switch (type) {
    case 'gemini':
      if (!options.apiKey) {
        throw new Error('Gemini image provider requires apiKey.');
      }
      return new GeminiNanoBananaProvider(options.apiKey);
    case 'stub':
      return new StubImageProvider();
    default:
      return new StubImageProvider();
  }
}

export * from './types';
