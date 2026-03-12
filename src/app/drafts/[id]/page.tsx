'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';

import { AppShell } from '@/components/AppShell';
import { ExportPanel } from '@/components/ExportPanel';
import { HydrationGuard } from '@/components/hydration-guard';
import { useDraftStore } from '@/store/draftStore';
import type { DraftState } from '@/types/pipeline';

function renderMd(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

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
            {/* 통합 글 미리보기 */}
            {draft.sectionsResult && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="mb-6 font-semibold text-accent">글 미리보기</h2>

                <article className="prose-naver space-y-6 text-white/90">
                  {/* 커버 이미지 */}
                  {draft.imagesResult?.images.find((img) => img.position === 'cover') && (
                    <img
                      src={draft.imagesResult.images.find((img) => img.position === 'cover')!.url}
                      alt={draft.imagesResult.images.find((img) => img.position === 'cover')!.alt}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = createFallbackImageDataUri(
                          draft.imagesResult!.images.find((img) => img.position === 'cover')!.alt,
                        );
                      }}
                      className="w-full rounded-lg object-cover"
                    />
                  )}

                  {/* 섹션별 본문 + 이미지 인터리브 */}
                  {draft.sectionsResult.sections.map((section, i) => {
                    const sectionImage = draft.imagesResult?.images.find(
                      (img) => img.position === `section${i + 1}`,
                    );

                    return (
                      <div key={i} className="space-y-4">
                        <h3 className="text-xl font-bold text-white">{section.heading}</h3>
                        <div
                          className="prose-content leading-relaxed text-white/85"
                          dangerouslySetInnerHTML={{ __html: renderMd(section.content) }}
                        />

                        {section.subsections && section.subsections.length > 0 && (
                          <div className="space-y-3 pl-1">
                            {section.subsections.map((sub, j) => (
                              <div key={j}>
                                <h4 className="text-lg font-semibold text-white/95">{sub.subheading}</h4>
                                <div
                                  className="prose-content mt-1 leading-relaxed text-white/80"
                                  dangerouslySetInnerHTML={{ __html: renderMd(sub.content) }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {sectionImage && (
                          <img
                            src={sectionImage.url}
                            alt={sectionImage.alt}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = createFallbackImageDataUri(sectionImage.alt);
                            }}
                            className="w-full rounded-lg object-cover"
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* FAQ */}
                  {draft.faqResult && draft.faqResult.faqs.length > 0 && (
                    <div className="space-y-3 border-t border-white/10 pt-6">
                      <h3 className="text-xl font-bold text-white">자주 묻는 질문 (FAQ)</h3>
                      {draft.faqResult.faqs.map((faq, i) => (
                        <div key={i} className="space-y-1">
                          <p className="font-semibold text-white">Q. {faq.question}</p>
                          <div
                            className="prose-content text-white/75"
                            dangerouslySetInnerHTML={{ __html: renderMd(`A. ${faq.answer}`) }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 요약 */}
                  {draft.summaryResult && (
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="text-lg font-semibold text-white/95">요약</h3>
                      <div
                        className="prose-content mt-2 leading-relaxed text-white/80"
                        dangerouslySetInnerHTML={{ __html: renderMd(draft.summaryResult.summary) }}
                      />
                    </div>
                  )}

                  {/* 해시태그 */}
                  {draft.hashtagsResult && draft.hashtagsResult.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      {draft.hashtagsResult.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-secondary/45 bg-secondary/20 px-3 py-1 text-sm text-secondary"
                        >
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            )}

            <ExportPanel draft={draft} />
          </div>
        </div>
      </HydrationGuard>
    </AppShell>
  );
}
