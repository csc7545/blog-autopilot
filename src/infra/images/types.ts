export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '512x512' | '1536x1024';
  quality?: 'standard' | 'high';
}

export interface ImageGenerationResult {
  url: string;
  filename: string;
  width: number;
  height: number;
}

export interface ImageProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export interface ImageProviderOptions {
  apiKey?: string;
}
