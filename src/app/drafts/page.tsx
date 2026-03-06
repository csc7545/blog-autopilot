'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HydrationGuard } from '@/components/hydration-guard';
import { useDraftStore } from '@/store/draftStore';

export default function DraftsPage() {
  const { drafts, deleteDraft } = useDraftStore();

  return (
    <AppShell>
      <HydrationGuard>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">내 초안</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              새 글 작성
            </Link>
          </div>

          {drafts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>아직 작성된 초안이 없습니다.</p>
              <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                첫 글 작성하기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white p-4 rounded-lg shadow-sm border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{draft.keyword}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(draft.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        상태: {draft.status}
                        {draft.titlePickResult?.selectedTitle &&
                          ` - ${draft.titlePickResult.selectedTitle}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/drafts/${draft.id}`}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft.id)}
                        className="px-3 py-1 text-sm text-red-600 border rounded hover:bg-red-50"
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
