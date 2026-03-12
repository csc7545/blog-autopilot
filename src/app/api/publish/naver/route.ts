import { PipelineError } from '@/core/errors';
import { createNaverPublisher } from '@/infra/naver/publisher';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { title, htmlContent, tags, imageUrls, naverId, naverPw } = body as {
      title: string;
      htmlContent: string;
      tags?: string[];
      imageUrls?: string[];
      naverId: string;
      naverPw: string;
    };

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      );
    }
    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 },
      );
    }
    if (!naverId || !naverPw) {
      return NextResponse.json(
        { error: 'Naver credentials are required' },
        { status: 400 },
      );
    }

    const publisher = createNaverPublisher({ naverId, naverPw });
    const result = await publisher.publish({ title, htmlContent, tags, imageUrls });

    return NextResponse.json({
      success: result.success,
      postUrl: result.postUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json(
      {
        error: message,
        step: error instanceof PipelineError ? error.step : undefined,
        code: error instanceof PipelineError ? error.code : undefined,
      },
      { status: 500 },
    );
  }
}
