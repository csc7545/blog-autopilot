'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { ExportPanel } from '@/components/ExportPanel';
import { HydrationGuard } from '@/components/hydration-guard';
import { useDraftStore } from '@/store/draftStore';
import type { DraftState } from '@/types/pipeline';

const PERSONA_LABELS: Record<string, string> = {
  'female-20s-student-jobseeker': '20대 여성 대학생/취준생',
  'male-20s-student-junior-worker': '20대 남성 대학생/직장 초년생',
  'female-30s-office-worker': '30대 여성 직장인',
  'female-30s-homemaker': '30대 여성 주부',
  'male-40s-office-worker': '40대 남성 직장인',
  'female-40s-homemaker': '40대 여성 주부',
  'male-50plus-current-affairs': '50대 이상 남성',
};

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
          <div className="mb-6 rounded-2xl border border-secondary/35 bg-white/5 p-6">
            <h1 className="text-2xl font-bold text-white">
              {draft.titlePickResult?.selectedTitle || draft.keyword}
            </h1>
            <p className="text-white/60">
              생성일: {new Date(draft.createdAt).toLocaleDateString('ko-KR')}
            </p>
            {(draft.selectedPersona || draft.modelUsed || draft.imageProviderUsed) && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {draft.selectedPersona && (
                  <span className="rounded border border-secondary/45 bg-secondary/20 px-2 py-1 text-secondary">
                    페르소나: {PERSONA_LABELS[draft.selectedPersona] || draft.selectedPersona}
                  </span>
                )}
                {draft.modelUsed && (
                  <span className="rounded border border-white/15 bg-white/10 px-2 py-1 text-white/80">
                    모델: {draft.modelUsed}
                  </span>
                )}
                {draft.imageProviderUsed && (
                  <span className="rounded border border-accent/45 bg-accent/10 px-2 py-1 text-accent">
                    이미지: {draft.imageProviderUsed}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 font-semibold text-accent">생성 단계</h2>
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
                      hasResult
                        ? 'bg-secondary/25 text-secondary border border-secondary/45'
                        : 'bg-white/10 text-white/60 border border-white/15'
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
                <h2 className="font-semibold mb-3 text-accent">생성 이미지</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {draft.imagesResult.images.map((image) => (
                    <div
                      key={image.position}
                      className="rounded-lg border border-white/15 bg-white/5 p-3"
                    >
                      <p className="mb-2 text-xs text-white/60">{image.position}</p>
                      <img
                        src={image.url || createFallbackImageDataUri(image.alt)}
                        alt={image.alt}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = createFallbackImageDataUri(image.alt);
                        }}
                        className="w-full h-48 object-cover rounded border"
                      />
                      <p className="mt-2 text-sm text-white/80">{image.alt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.naverToneResult && (
              <div>
                <h2 className="font-semibold mb-3 text-accent">본문</h2>
                <div className="whitespace-pre-wrap rounded-lg border border-white/15 bg-white/5 p-6 text-white/90">
                  {draft.naverToneResult.adjustedContent}
                </div>
              </div>
            )}

            {draft.faqResult && (
              <div>
                <h2 className="font-semibold mb-3 text-accent">FAQ</h2>
                <div className="space-y-4">
                  {draft.faqResult.faqs.map((faq, i) => (
                    <div key={i} className="rounded border border-white/15 bg-white/5 p-4">
                      <p className="font-medium text-white">Q: {faq.question}</p>
                      <p className="mt-2 text-white/75">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.hashtagsResult && (
              <div>
                <h2 className="font-semibold mb-3 text-accent">해시태그</h2>
                <div className="flex flex-wrap gap-2">
                  {draft.hashtagsResult.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-secondary/45 bg-secondary/20 px-3 py-1 text-sm text-secondary"
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
