'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { ExportPanel } from '@/components/ExportPanel';
import { HydrationGuard } from '@/components/hydration-guard';
import { useDraftStore } from '@/store/draftStore';
import type { DraftState } from '@/types/pipeline';

function createFallbackImageDataUri(text: string): string {
  const safeText = text.trim().slice(0, 40) || 'Image unavailable';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640"><rect width="1024" height="640" fill="#e2e8f0"/><text x="512" y="300" text-anchor="middle" font-size="36" fill="#334155" font-family="system-ui, -apple-system, Segoe UI, sans-serif">Image unavailable</text><text x="512" y="350" text-anchor="middle" font-size="28" fill="#475569" font-family="system-ui, -apple-system, Segoe UI, sans-serif">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getDraft } = useDraftStore();
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    const id = params.id as string;
    const foundDraft = getDraft(id);
    if (foundDraft) {
      setDraft(foundDraft);
    } else {
      router.push('/drafts');
    }
  }, [params.id, getDraft, router]);

  if (!draft) {
    return (
      <AppShell>
        <div className="text-center py-12">로딩 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <HydrationGuard>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {draft.titlePickResult?.selectedTitle || draft.keyword}
            </h1>
            <p className="text-gray-500">
              생성일: {new Date(draft.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="font-semibold mb-3">생성 단계</h2>
            <div className="flex flex-wrap gap-2">
              {[
                'intent',
                'persona',
                'titles',
                'titlePick',
                'outline',
                'sections',
                'faq',
                'summary',
                'meta',
                'hashtags',
                'imagePlan',
                'images',
                'naverTone',
                'validator',
              ].map((step) => {
                const hasResult = draft[`${step}Result` as keyof DraftState];
                return (
                  <span
                    key={step}
                    className={`px-2 py-1 text-xs rounded ${
                      hasResult ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            {draft.imagesResult && draft.imagesResult.images.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">생성 이미지</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {draft.imagesResult.images.map((image) => (
                    <div key={image.position} className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-2">{image.position}</p>
                      <img
                        src={image.url || createFallbackImageDataUri(image.alt)}
                        alt={image.alt}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = createFallbackImageDataUri(image.alt);
                        }}
                        className="w-full h-48 object-cover rounded border"
                      />
                      <p className="text-sm text-gray-700 mt-2">{image.alt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.naverToneResult && (
              <div>
                <h2 className="font-semibold mb-3">본문</h2>
                <div className="bg-white p-6 rounded-lg border whitespace-pre-wrap">
                  {draft.naverToneResult.adjustedContent}
                </div>
              </div>
            )}

            {draft.faqResult && (
              <div>
                <h2 className="font-semibold mb-3">FAQ</h2>
                <div className="space-y-4">
                  {draft.faqResult.faqs.map((faq, i) => (
                    <div key={i} className="bg-white p-4 rounded border">
                      <p className="font-medium">Q: {faq.question}</p>
                      <p className="text-gray-600 mt-2">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.hashtagsResult && (
              <div>
                <h2 className="font-semibold mb-3">해시태그</h2>
                <div className="flex flex-wrap gap-2">
                  {draft.hashtagsResult.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ExportPanel draft={draft} />
          </div>
        </div>
      </HydrationGuard>
    </AppShell>
  );
}
