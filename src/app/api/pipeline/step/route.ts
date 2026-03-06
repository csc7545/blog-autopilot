import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ImageProviderType } from '@/infra/images';
import type { DraftState, StepId } from '@/types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      draft,
      stepId,
      apiKey,
      imageProviderType = 'gemini',
    } = body as {
      draft: DraftState;
      stepId: StepId;
      apiKey: string;
      imageProviderType?: ImageProviderType;
    };

    if (!draft || !stepId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: draft, stepId, apiKey' },
        { status: 400 }
      );
    }

    const stepModule = await import(`@/core/steps/${stepId}.ts`);
    const step = stepModule.default;

    const result = await step.execute({ draft, apiKey, imageProviderType });

    if (!result.success) {
      return NextResponse.json({ error: result.error, step: stepId }, { status: 500 });
    }

    const updatedDraft = {
      ...draft,
      [`${stepId}Result`]: result.data,
      currentStep: stepId,
      updatedAt: new Date(),
    };

    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Step failed';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
