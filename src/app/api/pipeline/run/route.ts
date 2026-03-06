import { PipelineError } from '@/core/errors';
import { runPipeline } from '@/core/pipeline/runPipeline';
import type { DraftState } from '@/types/pipeline';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      draft,
      apiKey,
      imageProviderType = 'gemini',
    } = body as {
      draft: DraftState;
      apiKey: string;
      imageProviderType?: 'gemini' | 'stub' | 'dalle' | 'stability';
    };

    if (!draft || !draft.keyword) {
      return NextResponse.json({ error: 'Invalid draft: keyword is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const result = await runPipeline(draft, {
      apiKey,
      imageProviderType,
    });

    return NextResponse.json({ draft: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    const status = error instanceof PipelineError ? 500 : 500;

    return NextResponse.json(
      { error: message, step: error instanceof PipelineError ? error.step : undefined },
      { status }
    );
  }
}
