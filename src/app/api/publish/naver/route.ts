import { PipelineError } from '@/core/errors';
import { createNaverPublisher } from '@/infra/naver/publisher';
import type {
  ContentFaq,
  ContentImage,
  ContentSection,
} from '@/infra/naver/publisher';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      title,
      sections,
      images,
      faqs,
      summary,
      tags,
      naverId,
      naverPw,
    } = body as {
      title: string;
      sections: ContentSection[];
      images: ContentImage[];
      faqs: ContentFaq[];
      summary: string;
      tags?: string[];
      naverId: string;
      naverPw: string;
    };

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      );
    }
    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: 'Sections are required' },
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
    const result = await publisher.publish({
      title,
      sections,
      images: images || [],
      faqs: faqs || [],
      summary: summary || '',
      tags,
    });

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
