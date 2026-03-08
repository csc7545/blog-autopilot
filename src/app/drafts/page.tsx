'use client';

import Link from 'next/link';

import { AppShell } from '@/components/AppShell';
import { HydrationGuard } from '@/components/hydration-guard';
import { useDraftStore } from '@/store/draftStore';

export default function DraftsPage() {
  const { drafts, deleteDraft } = useDraftStore();

  const sortedDrafts = [...drafts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <AppShell>
      <HydrationGuard>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">내 초안</h1>
            <Link
              href="/"
              className="rounded-lg bg-secondary px-4 py-2 font-semibold text-white shadow-[0_8px_20px_rgba(82,139,230,0.35)] transition-colors hover:bg-[#3f78d3]"
            >
              새 글 작성
            </Link>
          </div>

          {sortedDrafts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-white/70">
              <p>아직 작성된 초안이 없습니다.</p>
              <Link href="/" className="mt-2 inline-block text-accent hover:underline">
                첫 글 작성하기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-secondary/35 bg-gradient-to-r from-white/10 to-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{draft.keyword}</h3>
                      <p className="text-sm text-white/60">
                        {new Date(draft.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="mt-1 text-sm text-white/75">
                        상태: {draft.status}
                        {draft.titlePickResult?.selectedTitle &&
                          ` - ${draft.titlePickResult.selectedTitle}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/drafts/${draft.id}`}
                        className="rounded-md border border-secondary/45 px-3 py-1 text-sm text-white transition-colors hover:bg-secondary/20"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft.id)}
                        className="rounded-md border border-accent/50 px-3 py-1 text-sm text-accent transition-colors hover:bg-accent/10"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </HydrationGuard>
    </AppShell>
  );
}
