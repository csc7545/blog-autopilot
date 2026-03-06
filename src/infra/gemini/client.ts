import { GoogleGenAI } from '@google/genai';
import { config } from '@/config';
import { PipelineError } from '@/core/errors';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRetryDelayMs(errorMessage: string, attempt: number): number {
  const match = errorMessage.match(/Please retry in\s+([\d.]+)s\.?/i);
  if (match?.[1]) {
    const seconds = Number.parseFloat(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const baseMs = 1500;
  return baseMs * 2 ** attempt;
}

function isRateLimitError(errorMessage: string): boolean {
  return errorMessage.includes('"code":429') || errorMessage.includes('RESOURCE_EXHAUSTED');
}

export class GeminiClient {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateContent<T>({
    prompt,
    schema,
    temperature = config.gemini.temperature,
  }: {
    prompt: string;
    schema?: object;
    temperature?: number;
  }): Promise<T> {
    for (let attempt = 0; attempt <= config.gemini.maxRetries; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: config.gemini.model,
          contents: prompt,
          config: {
            temperature,
            responseMimeType: schema ? 'application/json' : undefined,
            responseSchema: schema,
          },
        });

        const text = response.text;
        if (!text) {
          throw new PipelineError('Empty response from Gemini', 'gemini', 'EMPTY_RESPONSE');
        }

        if (schema) {
          return JSON.parse(text) as T;
        }

        return text as unknown as T;
      } catch (error) {
        if (error instanceof PipelineError) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const shouldRetry = isRateLimitError(errorMessage) && attempt < config.gemini.maxRetries;

        if (shouldRetry) {
          const delayMs = getRetryDelayMs(errorMessage, attempt);
          await sleep(delayMs);
          continue;
        }

        throw new PipelineError(`Gemini API error: ${errorMessage}`, 'gemini', 'API_ERROR');
      }
    }

    throw new PipelineError('Gemini API failed after retries', 'gemini', 'API_ERROR');
  }
}

export function createGeminiClient(apiKey: string): GeminiClient {
  if (!apiKey) {
    throw new PipelineError('GEMINI_API_KEY is required', 'gemini', 'MISSING_API_KEY');
  }

  return new GeminiClient(apiKey);
}
